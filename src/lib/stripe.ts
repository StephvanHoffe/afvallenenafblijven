import "server-only";
import Stripe from "stripe";
import {
  durations,
  isSubscription,
  monthlyPrice,
  products,
  type DurationId,
  type ProductId,
} from "@/config/pricing";
import { isLaunchOfferActive, site } from "@/config/site";
import { addMonthsClamped } from "@/lib/dates";

/**
 * Stripe-koppeling. Producten, prijzen en de lanceringskorting worden
 * automatisch (en idempotent) in Stripe aangemaakt op basis van
 * src/config/pricing.ts. Je hoeft in het Stripe-dashboard dus geen producten
 * te maken; alleen de betaalmethoden aanzetten (iDEAL | Wero, Bancontact,
 * SEPA-incasso en voor losse aankopen ook kaart).
 *
 * Abonnementen worden altijd per maand afgeschreven. De eerste betaling gaat
 * via iDEAL, Bancontact of SEPA; Stripe zet iDEAL en Bancontact daarna
 * automatisch om in een SEPA-incassomachtiging voor de maandelijkse termijnen.
 */

let client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is niet ingesteld");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2 });
  return client;
}

function isMissing(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "resource_missing";
}

const productIdFor = (product: ProductId) => `afb_${product}`;

async function ensureProduct(product: ProductId): Promise<string> {
  const id = productIdFor(product);
  try {
    await stripe().products.retrieve(id);
  } catch (err) {
    if (!isMissing(err)) throw err;
    await stripe().products.create({
      id,
      name: products[product].name,
      description: products[product].tagline,
      metadata: { product },
    });
  }
  return id;
}

const priceCache = new Map<string, string>();

/**
 * Geeft de Stripe-prijs voor een product en looptijd: een maandprijs voor
 * abonnementen, of een eenmalige prijs voor een los schema.
 */
export async function ensurePrice(product: ProductId, duration: DurationId): Promise<string> {
  const amount = monthlyPrice(product, duration);
  const lookupKey = `afb_${product}_${duration}_maand_${amount}`;
  const cached = priceCache.get(lookupKey);
  if (cached) return cached;

  const existing = await stripe().prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  let priceId = existing.data[0]?.id;
  if (!priceId) {
    const price = await stripe().prices.create({
      product: await ensureProduct(product),
      currency: "eur",
      unit_amount: amount,
      tax_behavior: "inclusive",
      lookup_key: lookupKey,
      nickname: `${products[product].name} – ${durations[duration].label}`,
      recurring: isSubscription(duration) ? { interval: "month", interval_count: 1 } : undefined,
      metadata: { product, duration },
    });
    priceId = price.id;
  }
  priceCache.set(lookupKey, priceId);
  return priceId;
}

async function ensureLaunchCoupon(): Promise<string> {
  const o = site.launchOffer;
  try {
    const coupon = await stripe().coupons.retrieve(o.couponId);
    return coupon.id;
  } catch (err) {
    if (!isMissing(err)) throw err;
    const coupon = await stripe().coupons.create({
      id: o.couponId,
      name: `${o.label} ${o.percentOff}%`,
      percent_off: o.percentOff,
      duration: "once",
    });
    return coupon.id;
  }
}

export interface CheckoutInput {
  intakeId: string;
  product: ProductId;
  duration: DurationId;
  email: string;
  name: string;
}

export async function createCheckoutSession(input: CheckoutInput): Promise<string> {
  const price = await ensurePrice(input.product, input.duration);
  const subscription = isSubscription(input.duration);
  const metadata = {
    intake_id: input.intakeId,
    product: input.product,
    duration: input.duration,
  };
  const discounts = isLaunchOfferActive(new Date()) ? [{ coupon: await ensureLaunchCoupon() }] : undefined;

  const session = await stripe().checkout.sessions.create({
    mode: subscription ? "subscription" : "payment",
    line_items: [{ price, quantity: 1 }],
    customer_email: input.email,
    locale: "nl",
    billing_address_collection: "auto",
    ...(discounts ? { discounts } : { allow_promotion_codes: true }),
    success_url: `${site.url}/bedankt?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site.url}/start?stap=plan&geannuleerd=1`,
    client_reference_id: input.intakeId,
    metadata,
    ...(subscription
      ? {
          // Maandelijkse afschrijving via SEPA-incasso; iDEAL en Bancontact
          // leveren bij de eerste betaling automatisch een incassomachtiging op.
          payment_method_types: ["ideal", "bancontact", "sepa_debit"],
          subscription_data: { metadata },
        }
      : {
          customer_creation: "always" as const,
          invoice_creation: { enabled: true, invoice_data: { metadata } },
          payment_intent_data: { metadata },
        }),
    custom_text: {
      submit: {
        message: subscription
          ? `Je betaalt nu de eerste maand. Daarna schrijven we elke maand automatisch af via SEPA-incasso.${durations[input.duration].months > 1 ? ` De minimale looptijd is ${durations[input.duration].months} maanden, daarna is je abonnement maandelijks opzegbaar.` : " Je abonnement is maandelijks opzegbaar."} Je schema wordt direct gemaakt.`
          : "Je schema wordt direct na betaling gemaakt. Dit is een eenmalige aankoop, geen abonnement.",
      },
    },
  });
  if (!session.url) throw new Error("Stripe gaf geen checkout-URL terug");
  return session.url;
}

/**
 * Einde van de minimale looptijd: het aantal maanden na de start van de
 * afschrijvingen, op dezelfde manier geteld als Stripe de maanden telt.
 */
export function commitmentEnd(subscription: Stripe.Subscription, months: number): Date {
  return addMonthsClamped(new Date(subscription.billing_cycle_anchor * 1000), months);
}

/**
 * Zegt een abonnement op. Binnen de minimale looptijd stopt het aan het eind
 * van die looptijd; daarna aan het eind van de lopende maand.
 */
export async function cancelSubscription(subscriptionId: string, duration: DurationId): Promise<Stripe.Subscription> {
  const subscription = await stripe().subscriptions.retrieve(subscriptionId);
  const months = durations[duration].months;
  const periodEnd = subscription.items.data[0]?.current_period_end ?? 0;
  if (months > 1) {
    // Een uur marge, zodat er nooit een extra maand wordt aangemaakt.
    const end = Math.floor(commitmentEnd(subscription, months).getTime() / 1000) - 3600;
    if (end > periodEnd) {
      return stripe().subscriptions.update(subscriptionId, { cancel_at: end, proration_behavior: "none" });
    }
  }
  return stripe().subscriptions.update(subscriptionId, { cancel_at_period_end: true });
}

/** Trekt een opzegging in. */
export async function resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const subscription = await stripe().subscriptions.retrieve(subscriptionId);
  if (subscription.cancel_at_period_end) {
    return stripe().subscriptions.update(subscriptionId, { cancel_at_period_end: false });
  }
  return stripe().subscriptions.update(subscriptionId, { cancel_at: "" });
}

export async function retrieveCheckoutSession(sessionId: string) {
  return stripe().checkout.sessions.retrieve(sessionId);
}

/** Link naar het Stripe-klantportaal: betaalgegevens en facturen. Opzeggen regelen we zelf. */
export async function billingPortalUrl(stripeCustomerId: string, returnPath = "/account/abonnement"): Promise<string> {
  const session = await stripe().billingPortal.sessions.create({
    customer: stripeCustomerId,
    locale: "nl",
    return_url: `${site.url}${returnPath}`,
  });
  return session.url;
}

export function constructWebhookEvent(body: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is niet ingesteld");
  return stripe().webhooks.constructEvent(body, signature, secret);
}

export type { Stripe };

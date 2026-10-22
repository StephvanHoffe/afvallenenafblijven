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
import { activePromotion, promotionPercent, site, type Promotion } from "@/config/site";
import { addMonthsClamped } from "@/lib/dates";
import { localeUrl, type Locale } from "@/i18n/config";
import { saveStripeCoupon, type DiscountCodeRow } from "@/lib/discounts-server";

/**
 * Stripe-koppeling. Producten, prijzen en de actiekortingen worden
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
  // STRIPE_API_BASE alleen voor tests tegen een nagebootste Stripe (bijv. http://127.0.0.1:4242).
  const base = process.env.STRIPE_API_BASE ? new URL(process.env.STRIPE_API_BASE) : null;
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY, {
    maxNetworkRetries: 2,
    ...(base ? { host: base.hostname, port: base.port, protocol: base.protocol.replace(":", "") as "http" | "https" } : {}),
  });
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

/** De Stripe-coupon voor een actie en kortingspercentage (één per percentage, alleen op de eerste betaling). */
async function ensurePromotionCoupon(promo: Promotion, percent: number): Promise<string> {
  const id = `afb_actie_${promo.id}_${percent}`;
  try {
    const coupon = await stripe().coupons.retrieve(id);
    return coupon.id;
  } catch (err) {
    if (!isMissing(err)) throw err;
    const coupon = await stripe().coupons.create({
      id,
      name: `${promo.label} ${percent}%`,
      percent_off: percent,
      duration: "once",
      metadata: { promotion: promo.id },
    });
    return coupon.id;
  }
}

/** De Stripe-coupon bij een kortingscode (aangemaakt bij het eerste gebruik). */
async function ensureCodeCoupon(row: DiscountCodeRow): Promise<string> {
  if (row.stripe_coupon_id) return row.stripe_coupon_id;
  const id = `afb_code_${row.code}_${row.id.slice(0, 8)}`;
  try {
    await stripe().coupons.retrieve(id);
  } catch (err) {
    if (!isMissing(err)) throw err;
    await stripe().coupons.create({
      id,
      name: row.code,
      ...(row.percent_off ? { percent_off: row.percent_off } : { amount_off: row.amount_off_cents ?? 0, currency: "eur" }),
      duration: row.duration,
      ...(row.duration === "repeating" ? { duration_in_months: Math.max(1, row.duration_months ?? 1) } : {}),
      metadata: { code: row.code },
    });
  }
  await saveStripeCoupon(row.id, id);
  return id;
}

export interface CheckoutInput {
  intakeId: string;
  product: ProductId;
  duration: DurationId;
  email: string;
  name: string;
  locale?: Locale;
  /** Een geldige kortingscode; vervangt de actiekorting. */
  discount?: DiscountCodeRow | null;
}

export async function createCheckoutSession(input: CheckoutInput): Promise<string> {
  const price = await ensurePrice(input.product, input.duration);
  const subscription = isSubscription(input.duration);
  // Een kortingscode van de klant vervangt de actiekorting.
  const promo = input.discount ? null : activePromotion(new Date());
  const promoPercent = promo ? promotionPercent(promo, input.duration) : 0;
  const metadata = {
    intake_id: input.intakeId,
    product: input.product,
    duration: input.duration,
    ...(input.discount ? { discount_code: input.discount.code } : {}),
    ...(promo && promoPercent > 0 ? { promotion: promo.id } : {}),
  };
  const discounts = input.discount
    ? [{ coupon: await ensureCodeCoupon(input.discount) }]
    : promo && promoPercent > 0
      ? [{ coupon: await ensurePromotionCoupon(promo, promoPercent) }]
      : undefined;
  const l = input.locale ?? "nl";
  const months = durations[input.duration].months;

  const session = await stripe().checkout.sessions.create({
    mode: subscription ? "subscription" : "payment",
    line_items: [{ price, quantity: 1 }],
    customer_email: input.email,
    locale: l,
    billing_address_collection: "auto",
    ...(discounts ? { discounts } : { allow_promotion_codes: true }),
    success_url: localeUrl(site.url, l, "/bedankt?session_id={CHECKOUT_SESSION_ID}"),
    cancel_url: localeUrl(site.url, l, "/start?stap=plan&geannuleerd=1"),
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
        message:
          l === "en"
            ? subscription
              ? `You pay for the first month now. After that we collect the amount automatically every month by SEPA Direct Debit.${months > 1 ? ` The minimum term is ${months} months; after that you can cancel your subscription monthly.` : " You can cancel your subscription monthly."} Your plan will be ready within 2 hours.`
              : "We start on your plan straight after payment; it will be ready within 2 hours. This is a one-off purchase, not a subscription."
            : subscription
              ? `Je betaalt nu de eerste maand. Daarna schrijven we elke maand automatisch af via SEPA-incasso.${months > 1 ? ` De minimale looptijd is ${months} maanden, daarna is je abonnement maandelijks opzegbaar.` : " Je abonnement is maandelijks opzegbaar."} Binnen 2 uur staat je schema klaar.`
              : "We beginnen direct na betaling aan je schema; binnen 2 uur staat het klaar. Dit is een eenmalige aankoop, geen abonnement.",
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

/**
 * Betaalt de eerste betaling van een bestelling volledig terug (garantie of
 * herroeping) en beëindigt een abonnement desgewenst direct. Geeft het
 * terugbetaalde bedrag in centen terug.
 */
export async function refundFirstPayment(
  order: { stripe_session_id: string; stripe_subscription_id: string | null },
  { cancel }: { cancel: boolean },
): Promise<{ refundedCents: number; refundId: string }> {
  let paymentIntent: string | null = null;
  if (order.stripe_subscription_id) {
    const invoices = await stripe().invoices.list({ subscription: order.stripe_subscription_id, status: "paid", limit: 100 });
    const first = [...invoices.data].sort((a, b) => a.created - b.created)[0];
    if (first?.id) {
      const payments = await stripe().invoicePayments.list({ invoice: first.id, status: "paid", limit: 1 });
      const pi = payments.data[0]?.payment.payment_intent;
      paymentIntent = typeof pi === "string" ? pi : (pi?.id ?? null);
    }
  } else {
    const session = await stripe().checkout.sessions.retrieve(order.stripe_session_id);
    paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);
  }
  if (!paymentIntent) throw new Error("Geen betaling gevonden om terug te betalen");
  const refund = await stripe().refunds.create({ payment_intent: paymentIntent, reason: "requested_by_customer" });
  if (cancel && order.stripe_subscription_id) {
    await stripe().subscriptions.cancel(order.stripe_subscription_id);
  }
  return { refundedCents: refund.amount, refundId: refund.id };
}

export async function retrieveCheckoutSession(sessionId: string) {
  return stripe().checkout.sessions.retrieve(sessionId);
}

/**
 * Link naar het Stripe-klantportaal: betaalgegevens en facturen. Opzeggen regelen we zelf.
 * Het portaal en de terugkeerlink volgen de taal van de klant.
 */
export async function billingPortalUrl(stripeCustomerId: string, returnPath = "/account/abonnement", l: Locale = "nl"): Promise<string> {
  const session = await stripe().billingPortal.sessions.create({
    customer: stripeCustomerId,
    locale: l === "en" ? "en-GB" : "nl",
    return_url: localeUrl(site.url, l, returnPath),
  });
  return session.url;
}

export function constructWebhookEvent(body: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is niet ingesteld");
  return stripe().webhooks.constructEvent(body, signature, secret);
}

export type { Stripe };

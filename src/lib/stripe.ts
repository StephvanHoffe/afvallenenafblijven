import "server-only";
import Stripe from "stripe";
import {
  durations,
  isSubscription,
  monthlyPrice,
  periodTotal,
  products,
  type DurationId,
  type ProductId,
} from "@/config/pricing";
import { isLaunchOfferActive, site } from "@/config/site";

/**
 * Stripe-koppeling. Producten, prijzen en de lanceringskorting worden
 * automatisch (en idempotent) in Stripe aangemaakt op basis van
 * src/config/pricing.ts. Je hoeft in het Stripe-dashboard dus geen producten
 * te maken; alleen betaalmethoden (iDEAL, Bancontact, kaart) aanzetten.
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

export type PriceKind = "initial" | "continuation";

const priceCache = new Map<string, string>();

/**
 * Geeft de Stripe-prijs voor een product en looptijd. "initial" is de eerste
 * periode (bijv. 3 maanden vooruit), "continuation" de maandprijs waarmee een
 * abonnement na de eerste periode doorloopt (maandelijks opzegbaar).
 */
export async function ensurePrice(product: ProductId, duration: DurationId, kind: PriceKind): Promise<string> {
  const amount = kind === "initial" ? periodTotal(product, duration) : monthlyPrice(product, duration);
  const lookupKey = `afb_${product}_${duration}_${kind}_${amount}`;
  const cached = priceCache.get(lookupKey);
  if (cached) return cached;

  const existing = await stripe().prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  let priceId = existing.data[0]?.id;
  if (!priceId) {
    const months = durations[duration].months;
    const recurring =
      !isSubscription(duration)
        ? undefined
        : kind === "continuation"
          ? { interval: "month" as const, interval_count: 1 }
          : months === 12
            ? { interval: "year" as const, interval_count: 1 }
            : { interval: "month" as const, interval_count: months };
    const price = await stripe().prices.create({
      product: await ensureProduct(product),
      currency: "eur",
      unit_amount: amount,
      tax_behavior: "inclusive",
      lookup_key: lookupKey,
      nickname: `${products[product].name} – ${durations[duration].label}${kind === "continuation" ? " (doorloop per maand)" : ""}`,
      recurring,
      metadata: { product, duration, kind },
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
  const price = await ensurePrice(input.product, input.duration, "initial");
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
      ? { subscription_data: { metadata } }
      : {
          customer_creation: "always" as const,
          invoice_creation: { enabled: true, invoice_data: { metadata } },
          payment_intent_data: { metadata },
        }),
    custom_text: {
      submit: {
        message: subscription
          ? "Je schema wordt direct na betaling gemaakt. Na de eerste periode loopt je abonnement per maand door en is het maandelijks opzegbaar."
          : "Je schema wordt direct na betaling gemaakt. Dit is een eenmalige aankoop, geen abonnement.",
      },
    },
  });
  if (!session.url) throw new Error("Stripe gaf geen checkout-URL terug");
  return session.url;
}

/**
 * Nederlandse regels: na de eerste looptijd mag een abonnement alleen
 * stilzwijgend doorlopen voor onbepaalde tijd met maximaal een maand
 * opzegtermijn. Daarom zetten we abonnementen van 3, 6 of 12 maanden om naar
 * een schema: eerst de vooruitbetaalde periode, daarna per maand.
 */
export async function scheduleMonthlyContinuation(
  subscriptionId: string,
  product: ProductId,
  duration: DurationId,
): Promise<void> {
  if (!isSubscription(duration) || duration === "1m") return;
  const continuationPrice = await ensurePrice(product, duration, "continuation");
  const subscription = await stripe().subscriptions.retrieve(subscriptionId);
  if (subscription.schedule) return; // al omgezet

  const schedule = await stripe().subscriptionSchedules.create({ from_subscription: subscriptionId });
  const current = schedule.phases[0];
  await stripe().subscriptionSchedules.update(schedule.id, {
    end_behavior: "release",
    proration_behavior: "none",
    phases: [
      {
        items: current.items.map((item) => ({
          price: typeof item.price === "string" ? item.price : item.price.id,
          quantity: item.quantity ?? 1,
        })),
        start_date: current.start_date,
        end_date: current.end_date,
        metadata: { product, duration, phase: "initial" },
      },
      {
        items: [{ price: continuationPrice, quantity: 1 }],
        duration: { interval: "month", interval_count: 1 },
        metadata: { product, duration, phase: "monthly" },
      },
    ],
  });
}

/**
 * Zegt een abonnement op tegen het einde van de lopende (betaalde) periode.
 * Een eventueel schema voor de maandelijkse doorloop wordt eerst losgekoppeld,
 * zodat het abonnement na deze periode echt stopt.
 */
export async function cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<Stripe.Subscription> {
  const current = await stripe().subscriptions.retrieve(subscriptionId);
  if (current.schedule) {
    const scheduleId = typeof current.schedule === "string" ? current.schedule : current.schedule.id;
    await stripe().subscriptionSchedules.release(scheduleId);
  }
  return stripe().subscriptions.update(subscriptionId, { cancel_at_period_end: true });
}

/** Trekt een opzegging in en zet de maandelijkse doorloop (indien nodig) opnieuw klaar. */
export async function resumeSubscription(
  subscriptionId: string,
  product: ProductId,
  duration: DurationId,
): Promise<Stripe.Subscription> {
  const updated = await stripe().subscriptions.update(subscriptionId, { cancel_at_period_end: false });
  await scheduleMonthlyContinuation(subscriptionId, product, duration);
  return updated;
}

export async function retrieveCheckoutSession(sessionId: string) {
  return stripe().checkout.sessions.retrieve(sessionId);
}

/** Link naar het Stripe-klantportaal: betaalgegevens en facturen. Opzeggen regelen we zelf. */
export async function billingPortalUrl(stripeCustomerId: string, returnPath = "/account"): Promise<string> {
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

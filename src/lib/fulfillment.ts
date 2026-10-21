import "server-only";
import {
  durationFor,
  isDurationId,
  isProductId,
  isSubscription,
  monthlyPrice,
  productFor,
  products,
} from "@/config/pricing";
import { scheduledDelivery } from "@/lib/settings";
import { recordFunnelEvent } from "@/lib/funnel";
import { recordPayment } from "@/lib/payments";
import { orderConfirmationEmail, sendMail } from "@/lib/email";
import { euro } from "@/lib/format";
import {
  createOrder,
  createPlans,
  getIntake,
  getOrderBySession,
  updateOrderBySubscription,
  upsertCustomer,
  type Order,
  type OrderStatus,
} from "@/lib/repo";
import { retrieveCheckoutSession, type Stripe } from "@/lib/stripe";
import { defineCopy, toLocale } from "@/i18n/config";

/** Teksten voor de orderbevestiging, in de taal van de klant. */
const orderCopy = defineCopy({
  nl: {
    oneOff: "Los schema (4 weken)",
    monthly: "Per maand",
    minimum: (label: string) => `Minimaal ${label}`,
    noRenewal: "Geen, eenmalige aankoop",
    renewalMonthly: (amount: string) => `${amount} per maand via SEPA-incasso, maandelijks opzegbaar`,
    renewalAfter: (amount: string, label: string) => `${amount} per maand via SEPA-incasso; na ${label} maandelijks opzegbaar`,
    incasso: (amount: string) =>
      `We schrijven elke maand ${amount} af via SEPA-incasso, rond dezelfde datum als je eerste betaling. Deze e-mail geldt als vooraankondiging van die afschrijvingen. Op je bankafschrift staat de afschrijving van onze betaalpartner Stripe.`,
  },
  en: {
    oneOff: "Single plan (4 weeks)",
    monthly: "Monthly",
    minimum: (label: string) => `Minimum ${label}`,
    noRenewal: "None, one-off purchase",
    renewalMonthly: (amount: string) => `${amount} a month by SEPA Direct Debit, cancel monthly`,
    renewalAfter: (amount: string, label: string) => `${amount} a month by SEPA Direct Debit; cancel monthly after ${label}`,
    incasso: (amount: string) =>
      `We'll collect ${amount} every month by SEPA Direct Debit, around the same date as your first payment. This email serves as advance notice of these collections. The payments will appear on your bank statement under our payment partner Stripe.`,
  },
});

/**
 * Verwerkt een afgeronde Stripe-checkout: klant en bestelling vastleggen en
 * de eerste schema's klaarzetten voor generatie. Idempotent: een tweede
 * aanroep voor dezelfde checkout doet niets.
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<Order | null> {
  const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
  // Een abonnement met SEPA-incasso is rond zodra de machtiging is afgegeven; de
  // afschrijving zelf duurt een paar werkdagen. De klant krijgt het schema dan
  // direct. Mislukt de incasso, dan stopt het abonnement vanzelf (via de
  // subscription-webhooks). Een losse aankoop leveren we pas na betaling.
  const mandateGiven = session.mode === "subscription" && session.status === "complete";
  if (!paid && !mandateGiven) return null;

  const existing = await getOrderBySession(session.id);
  if (existing) return existing;

  const { intake_id: intakeId, product, duration, discount_code: discountCode } = session.metadata ?? {};
  if (!intakeId || !isProductId(product) || !isDurationId(duration)) {
    throw new Error(`Checkout ${session.id} mist geldige metadata`);
  }
  const intake = await getIntake(intakeId);
  if (!intake) throw new Error(`Intake ${intakeId} niet gevonden voor checkout ${session.id}`);

  const stripeCustomerId = typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null);
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : (session.subscription?.id ?? null);

  const customer = await upsertCustomer({
    email: (session.customer_details?.email ?? intake.email).toLowerCase(),
    name: intake.name,
    stripeCustomerId,
    marketingConsent: intake.consents.marketing === true,
    locale: toLocale(intake.locale),
  });

  const order = await createOrder({
    customerId: customer.id,
    intakeId,
    product,
    duration,
    stripeSessionId: session.id,
    stripeSubscriptionId: subscriptionId,
    status: isSubscription(duration) ? "active" : "completed",
    amountCents: session.amount_total ?? 0,
    monthlyCents: isSubscription(duration) ? monthlyPrice(product, duration) : 0,
    discountCode: discountCode ?? intake.discount_code ?? null,
  });
  if (!order) return getOrderBySession(session.id);

  // Funnel: de stap "betaald", gekoppeld aan het bezoek waarin de vragenlijst is ingevuld.
  await recordFunnelEvent({
    visitId: intake.visit_id,
    event: "purchase",
    product,
    duration,
    locale: intake.locale,
    device: intake.device,
    source: intake.campaign?.source ?? null,
    campaign: intake.campaign?.campaign ?? null,
    landing: intake.campaign?.landing ?? null,
  });
  // Een los schema is één betaling; abonnementen leggen we vast via de betaalde facturen (webhook invoice.paid).
  if (!isSubscription(duration) && (session.amount_total ?? 0) > 0) {
    const pi = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? session.id);
    await recordPayment({ id: pi, orderId: order.id, customerId: customer.id, amountCents: session.amount_total ?? 0, kind: "payment", description: "eenmalig" }).catch(
      (err) => console.error("Betaling vastleggen mislukt", err),
    );
  }

  // Het schema wordt direct gemaakt en staat op een willekeurig moment binnen 2 uur voor de klant klaar.
  await createPlans(order.id, customer.id, products[product].includes, 1, new Date(), await scheduledDelivery("purchase"));

  const l = toLocale(customer.locale);
  const c = orderCopy[l];
  const d = durationFor(duration, l);
  const monthly = euro(monthlyPrice(product, duration), l);
  await sendMail(
    orderConfirmationEmail({
      to: customer.email,
      name: customer.name,
      orderNumber: order.id.slice(0, 8).toUpperCase(),
      productName: productFor(product, l).name,
      durationLabel: !isSubscription(duration) ? c.oneOff : d.months === 1 ? c.monthly : c.minimum(d.label),
      amountPaid: euro(order.amount_cents, l),
      renewal: !isSubscription(duration) ? c.noRenewal : d.months === 1 ? c.renewalMonthly(monthly) : c.renewalAfter(monthly, d.label),
      incassoNote: isSubscription(duration) ? c.incasso(monthly) : undefined,
      locale: l,
    }),
  ).catch((err) => console.error("Orderbevestiging versturen mislukt", err));

  return order;
}

/**
 * Zorgt dat er een bestelling bestaat voor een checkout. Wordt gebruikt door de
 * bedankpagina, zodat een klant ook direct geholpen wordt als de webhook
 * vertraagd is.
 */
export async function ensureOrderForSession(sessionId: string): Promise<Order | null> {
  const existing = await getOrderBySession(sessionId);
  if (existing) return existing;
  const session = await retrieveCheckoutSession(sessionId);
  return fulfillCheckoutSession(session);
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status): OrderStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
    case "incomplete":
    case "paused":
      return "past_due";
    default:
      return "canceled";
  }
}

export async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  const cancelAt = subscription.cancel_at ?? (subscription.cancel_at_period_end && periodEnd ? periodEnd : null);
  await updateOrderBySubscription(subscription.id, {
    status: mapSubscriptionStatus(subscription.status),
    cancelAt: cancelAt ? new Date(cancelAt * 1000) : null,
  });
}

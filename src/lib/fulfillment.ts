import "server-only";
import {
  durations,
  isDurationId,
  isProductId,
  isSubscription,
  monthlyPrice,
  products,
} from "@/config/pricing";
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

  const { intake_id: intakeId, product, duration } = session.metadata ?? {};
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
  });
  if (!order) return getOrderBySession(session.id);

  await createPlans(order.id, customer.id, products[product].includes, 1);

  const d = durations[duration];
  const monthly = euro(monthlyPrice(product, duration));
  await sendMail(
    orderConfirmationEmail({
      to: customer.email,
      name: customer.name,
      orderNumber: order.id.slice(0, 8).toUpperCase(),
      productName: products[product].name,
      durationLabel: !isSubscription(duration) ? "Los schema (4 weken)" : d.months === 1 ? "Per maand" : `Minimaal ${d.label}`,
      amountPaid: euro(order.amount_cents),
      renewal: !isSubscription(duration)
        ? "Geen, eenmalige aankoop"
        : d.months === 1
          ? `${monthly} per maand via SEPA-incasso, maandelijks opzegbaar`
          : `${monthly} per maand via SEPA-incasso; na ${d.label} maandelijks opzegbaar`,
      incassoNote: isSubscription(duration)
        ? `We schrijven elke maand ${monthly} af via SEPA-incasso, rond dezelfde datum als je eerste betaling. Deze e-mail geldt als vooraankondiging van die afschrijvingen. Op je bankafschrift staat de afschrijving van onze betaalpartner Stripe.`
        : undefined,
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

import "server-only";
import { durationFor, isDurationId, isProductId, isSubscription, monthlyPrice, productFor, products } from "@/config/pricing";
import { site } from "@/config/site";
import { chargeDay } from "@/lib/billing";
import { addDaysToDay, amsterdamStartOfDay } from "@/lib/dates";
import { scheduledDelivery } from "@/lib/settings";
import { recordFunnelEvent } from "@/lib/funnel";
import { createInvoice } from "@/lib/invoices";
import { isPaymentRecorded, paidPaymentCount, recordPayment } from "@/lib/payments";
import { adminNotificationEmail, orderConfirmationEmail, paymentFailedEmail, sendMail } from "@/lib/email";
import { euro } from "@/lib/format";
import { createRefund, getPayment, toCents, type MolliePayment } from "@/lib/mollie";
import {
  createOrder,
  createPlans,
  getCustomer,
  getIntake,
  getOrder,
  getOrderByCheckout,
  getOrderBySubscription,
  updateOrderStatus,
  upsertCustomer,
  type Order,
} from "@/lib/repo";
import { applyNewMandate, ensureSubscriptions, firstDayOf } from "@/lib/subscriptions";
import { db } from "@/lib/db";
import { defineCopy, toLocale, type Locale } from "@/i18n/config";

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
      `We schrijven elke maand ${amount} af via SEPA-incasso, op dezelfde dag van de maand als je eerste betaling. Deze e-mail geldt als vooraankondiging van die afschrijvingen. Op je bankafschrift staat de afschrijving van onze betaalpartner Mollie.`,
    introRenewal: (months: number, amount: string) => (months === 2 ? ` (je 2e maand: ${amount})` : ` (maand 2 t/m ${months}: ${amount} per maand)`),
    introIncasso: (label: string | null, months: number, amount: string) => {
      const reason = label ? `de ${label}-korting` : "je kortingscode";
      return months === 2 ? ` Door ${reason} schrijven we je 2e maand ${amount} af.` : ` Door ${reason} schrijven we maand 2 t/m ${months} ${amount} per maand af.`;
    },
    firstMonth: "maand 1",
    month: (n: number) => `maand ${n}`,
    subscription: (label: string) => `abonnement ${label}`,
  },
  en: {
    oneOff: "Single plan (4 weeks)",
    monthly: "Monthly",
    minimum: (label: string) => `Minimum ${label}`,
    noRenewal: "None, one-off purchase",
    renewalMonthly: (amount: string) => `${amount} a month by SEPA Direct Debit, cancel monthly`,
    renewalAfter: (amount: string, label: string) => `${amount} a month by SEPA Direct Debit; cancel monthly after ${label}`,
    incasso: (amount: string) =>
      `We'll collect ${amount} every month by SEPA Direct Debit, on the same day of the month as your first payment. This email serves as advance notice of these collections. The payments will appear on your bank statement under our payment partner Mollie.`,
    introRenewal: (months: number, amount: string) => (months === 2 ? ` (your 2nd month: ${amount})` : ` (months 2 to ${months}: ${amount} a month)`),
    introIncasso: (label: string | null, months: number, amount: string) => {
      const reason = label ? `the ${label} discount` : "your discount code";
      return months === 2
        ? ` Thanks to ${reason}, we'll collect ${amount} for your 2nd month.`
        : ` Thanks to ${reason}, we'll collect ${amount} a month for months 2 to ${months}.`;
    },
    firstMonth: "month 1",
    month: (n: number) => `month ${n}`,
    subscription: (label: string) => `${label} subscription`,
  },
});

const metaString = (payment: MolliePayment, key: string): string | undefined => {
  const v = payment.metadata?.[key];
  return v === null || v === undefined ? undefined : String(v);
};
const metaNumber = (payment: MolliePayment, key: string): number | null => {
  const v = payment.metadata?.[key];
  return v === null || v === undefined || v === "" ? null : Number(v);
};

/** Omschrijving en periode voor de factuur van betaling nummer `n`. */
function invoiceLine(order: Order, n: number, l: Locale): { description: string; periodStart: Date | null; periodEnd: Date | null } {
  const c = orderCopy[l];
  const product = productFor(order.product, l).name;
  if (!isSubscription(order.duration)) return { description: `${product} · ${c.oneOff}`, periodStart: null, periodEnd: null };
  const first = firstDayOf(order);
  return {
    description: `${product} · ${c.subscription(durationFor(order.duration, l).label)} · ${n === 1 ? c.firstMonth : c.month(n)}`,
    periodStart: amsterdamStartOfDay(chargeDay(first, n)),
    periodEnd: amsterdamStartOfDay(addDaysToDay(chargeDay(first, n + 1), -1)),
  };
}

/** Legt een ontvangen betaling vast met de factuur erbij (één keer per betaling). */
async function recordPaidPayment(order: Order, payment: MolliePayment, n: number): Promise<void> {
  if (await isPaymentRecorded(payment.id)) return;
  const customer = await getCustomer(order.customer_id);
  const l = toLocale(customer?.locale);
  const amountCents = toCents(payment.amount);
  const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date();
  const line = invoiceLine(order, n, l);
  const invoice = await createInvoice({
    paymentId: payment.id,
    orderId: order.id,
    customerId: order.customer_id,
    customerName: customer?.name ?? "",
    customerEmail: customer?.email ?? "",
    description: line.description,
    periodStart: line.periodStart,
    periodEnd: line.periodEnd,
    amountCents,
    method: payment.method,
    issuedAt: paidAt,
  });
  await recordPayment({
    id: payment.id,
    orderId: order.id,
    customerId: order.customer_id,
    amountCents,
    kind: "payment",
    description: isSubscription(order.duration) ? `maand ${n}` : "eenmalig",
    paidAt,
    invoiceId: invoice.id,
  });
}

/**
 * Verwerkt een betaalde eerste betaling: klant en bestelling vastleggen, de
 * factuur maken, het abonnement bij Mollie aanmaken en de eerste schema's
 * klaarzetten. Idempotent: een tweede aanroep voor dezelfde betaling doet
 * niets. Geeft `created: true` als de bestelling nu pas is aangemaakt.
 */
export async function fulfillCheckoutPayment(payment: MolliePayment): Promise<{ order: Order | null; created: boolean }> {
  if (payment.status !== "paid") return { order: null, created: false };
  const existing = await getOrderByCheckout(payment.id);
  if (existing) return { order: existing, created: false };

  const intakeId = metaString(payment, "intake_id");
  const product = metaString(payment, "product");
  const duration = metaString(payment, "duration");
  if (!intakeId || !isProductId(product) || !isDurationId(duration)) {
    throw new Error(`Betaling ${payment.id} mist geldige metadata`);
  }
  const intake = await getIntake(intakeId);
  if (!intake) throw new Error(`Intake ${intakeId} niet gevonden voor betaling ${payment.id}`);
  const promotionId = metaString(payment, "promotion") ?? null;
  const discountCode = metaString(payment, "discount_code") ?? intake.discount_code ?? null;

  const customer = await upsertCustomer({
    email: intake.email.toLowerCase(),
    name: intake.name,
    mollieCustomerId: payment.customerId ?? intake.mollie_customer_id ?? null,
    marketingConsent: intake.consents.marketing === true,
    locale: toLocale(intake.locale),
  });

  const subscription = isSubscription(duration);
  const order = await createOrder({
    customerId: customer.id,
    intakeId,
    product,
    duration,
    checkoutId: payment.id,
    status: subscription ? "active" : "completed",
    amountCents: toCents(payment.amount),
    // Zonder bedrag in de gegevens (zou niet moeten voorkomen): de gewone prijs.
    monthlyCents: subscription ? metaNumber(payment, "monthly_cents") || monthlyPrice(product, duration) : 0,
    introCents: subscription ? metaNumber(payment, "intro_cents") : null,
    introMonths: subscription ? (metaNumber(payment, "intro_months") ?? 1) : 1,
    discountCode,
    promotion: promotionId,
  });
  // Tegelijk door de webhook en de bedankpagina verwerkt: de ander heeft het al gedaan.
  if (!order) return { order: await getOrderByCheckout(payment.id), created: false };

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
  await recordPaidPayment(order, payment, 1).catch((err) => console.error("Betaling en factuur vastleggen mislukt", err));

  // Het schema wordt direct gemaakt en staat op een willekeurig moment binnen 2 uur voor de klant klaar.
  await createPlans(order.id, customer.id, products[product].includes, 1, new Date(), await scheduledDelivery("purchase"));

  if (subscription) {
    // Lukt dit nu niet, dan maakt de geplande taak het abonnement alsnog aan.
    await ensureSubscriptions(order, { mandateId: payment.mandateId }).catch((err) =>
      console.error(`Abonnement voor bestelling ${order.id} aanmaken mislukt`, err),
    );
  }

  const l = toLocale(customer.locale);
  const c = orderCopy[l];
  const d = durationFor(duration, l);
  const monthly = euro(order.monthly_cents, l);
  const intro = order.intro_cents !== null && order.intro_months > 1;
  const introAmount = intro ? euro(order.intro_cents!, l) : "";
  const promo = promotionId ? site.promotions.find((p) => p.id === promotionId) : undefined;
  const promoLabel = promo ? (l === "en" ? promo.labelEn : promo.label) : null;
  await sendMail(
    orderConfirmationEmail({
      to: customer.email,
      name: customer.name,
      orderNumber: order.id.slice(0, 8).toUpperCase(),
      productName: productFor(product, l).name,
      durationLabel: !subscription ? c.oneOff : d.months === 1 ? c.monthly : c.minimum(d.label),
      amountPaid: euro(order.amount_cents, l),
      renewal: !subscription
        ? c.noRenewal
        : (d.months === 1 ? c.renewalMonthly(monthly) : c.renewalAfter(monthly, d.label)) + (intro ? c.introRenewal(order.intro_months, introAmount) : ""),
      incassoNote: subscription ? c.incasso(monthly) + (intro ? c.introIncasso(promoLabel, order.intro_months, introAmount) : "") : undefined,
      paidAt: payment.paidAt ? new Date(payment.paidAt) : new Date(),
      locale: l,
    }),
  ).catch((err) => console.error("Orderbevestiging versturen mislukt", err));

  return { order, created: true };
}

/** Een maandelijkse afschrijving van een abonnement: betaald of mislukt. */
async function handleRecurringPayment(payment: MolliePayment): Promise<void> {
  const orderId = metaString(payment, "order_id");
  const order = (await getOrderBySubscription(payment.subscriptionId!)) ?? (orderId ? await getOrder(orderId) : null);
  if (!order) {
    console.warn(`Geen bestelling bij abonnementsbetaling ${payment.id} (${payment.subscriptionId})`);
    return;
  }
  if (payment.status === "paid") {
    if (await isPaymentRecorded(payment.id)) return;
    await recordPaidPayment(order, payment, (await paidPaymentCount(order.id)) + 1);
    if (order.status === "past_due") {
      await updateOrderStatus(order.id, { status: "active" });
      const sql = await db();
      await sql`update orders set failed_payment_id = null where id = ${order.id}`;
    }
    return;
  }
  if (payment.status === "failed" || payment.status === "expired" || payment.status === "canceled") {
    if (order.failed_payment_id === payment.id || order.status === "canceled") return;
    const sql = await db();
    await sql`update orders set status = 'past_due', failed_payment_id = ${payment.id}, updated_at = now() where id = ${order.id}`;
    // Eén mail per mislukte periode; Mollie probeert het daarna zelf opnieuw.
    if (order.status === "past_due") return;
    const customer = await getCustomer(order.customer_id);
    if (!customer) return;
    const l = toLocale(customer.locale);
    await sendMail(
      paymentFailedEmail({ to: customer.email, name: customer.name, productName: productFor(order.product, l).name, amountCents: toCents(payment.amount), locale: l }),
    ).catch((err) => console.error("Mail over mislukte betaling versturen mislukt", err));
  }
}

/** De bevestiging van een nieuwe betaalmethode (€ 0,01): machtiging overzetten en de cent terugstorten. */
async function handleMandatePayment(payment: MolliePayment): Promise<void> {
  const customerId = metaString(payment, "customer_id");
  if (payment.status !== "paid" || !customerId || !payment.mandateId) return;
  await applyNewMandate(customerId, payment.mandateId);
  if (!payment.amountRefunded || toCents(payment.amountRefunded) === 0) {
    await createRefund(payment.id, toCents(payment.amount), "Bevestiging betaalmethode", `bevestiging-${payment.id}`).catch((err) =>
      console.error(`Bevestigingsbedrag ${payment.id} terugstorten mislukt`, err),
    );
  }
}

/** Een terugboeking door de bank (chargeback) vastleggen en de beheerder waarschuwen. */
async function handleChargeback(payment: MolliePayment): Promise<void> {
  const cents = toCents(payment.amountChargedBack);
  if (cents <= 0) return;
  const order =
    (await getOrderByCheckout(payment.id)) ??
    (payment.subscriptionId ? await getOrderBySubscription(payment.subscriptionId) : null) ??
    (metaString(payment, "order_id") ? await getOrder(metaString(payment, "order_id")!) : null);
  const inserted = await recordPayment({
    id: `${payment.id}-terugboeking`,
    orderId: order?.id ?? null,
    customerId: order?.customer_id ?? null,
    amountCents: -cents,
    kind: "refund",
    description: "terugboeking door de bank",
  });
  if (!inserted) return;
  if (order && isSubscription(order.duration) && order.status === "active") await updateOrderStatus(order.id, { status: "past_due" });
  await sendMail(
    adminNotificationEmail("Terugboeking door de bank", {
      Betaling: payment.id,
      Bedrag: euro(cents),
      Bestelling: order ? order.id.slice(0, 8).toUpperCase() : "onbekend",
      Actie: "De klant heeft een betaling laten terugboeken. Bekijk de betaling in het Mollie-dashboard.",
    }),
  ).catch(() => {});
}

/**
 * Verwerkt een melding van Mollie: haalt de betaling op (de webhook bevat
 * alleen het ID) en handelt hem af. Geeft de bestelling terug als die nu pas
 * is aangemaakt, zodat de schema's daarna gemaakt kunnen worden.
 */
export async function handleMolliePayment(paymentId: string): Promise<Order | null> {
  const payment = await getPayment(paymentId);
  if (payment.amountChargedBack) await handleChargeback(payment);
  if (payment.subscriptionId) {
    await handleRecurringPayment(payment);
    return null;
  }
  switch (metaString(payment, "kind")) {
    case "checkout": {
      const { order, created } = await fulfillCheckoutPayment(payment);
      return created ? order : null;
    }
    case "mandate":
      await handleMandatePayment(payment);
      return null;
    default:
      return null;
  }
}

/**
 * De bestelling bij een vragenlijst, voor de bedankpagina. Vangt ook een
 * vertraagde of gemiste webhook op: is er nog geen bestelling, dan halen we de
 * betaling zelf op bij Mollie.
 */
export async function orderForIntake(intake: { id: string; payment_id: string | null }): Promise<{
  order: Order | null;
  paymentStatus: MolliePayment["status"] | null;
}> {
  const sql = await db();
  const [existing] = await sql<Order[]>`select * from orders where intake_id = ${intake.id} order by created_at desc limit 1`;
  if (existing) return { order: existing, paymentStatus: "paid" };
  if (!intake.payment_id) return { order: null, paymentStatus: null };
  const payment = await getPayment(intake.payment_id);
  const { order } = await fulfillCheckoutPayment(payment);
  return { order, paymentStatus: payment.status };
}

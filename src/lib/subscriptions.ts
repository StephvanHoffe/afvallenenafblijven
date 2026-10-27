import "server-only";
import { durations, isSubscription, productFor } from "@/config/pricing";
import { site } from "@/config/site";
import { localeUrl, toLocale, type Locale } from "@/i18n/config";
import { chargeDay } from "@/lib/billing";
import { amsterdamDay, amsterdamStartOfDay } from "@/lib/dates";
import { db } from "@/lib/db";
import { adminNotificationEmail, sendMail, subscriptionEndedEmail } from "@/lib/email";
import { createInvoice, invoiceForPayment } from "@/lib/invoices";
import {
  cancelMollieSubscription,
  createPayment,
  createRefund,
  createSubscription,
  getSubscription,
  listSubscriptions,
  updateSubscription,
  type MollieSubscription,
} from "@/lib/mollie";
import { getCustomer, type Customer, type Order } from "@/lib/repo";

/**
 * Abonnementen bij Mollie. Na de eerste betaling maakt de website het
 * abonnement aan; Mollie schrijft daarna elke maand automatisch af via de
 * SEPA-machtiging uit die eerste betaling.
 *
 * Korting op meer dan één maand (een actie of kortingscode) is een kort
 * abonnement voor maand 2 t/m intro_months tegen het lagere bedrag, gevolgd
 * door het gewone abonnement. Zo staat elk bedrag vooraf vast.
 *
 * De minimale looptijd bewaakt de website: bij opzeggen stopt het abonnement
 * bij Mollie pas na de laatste afschrijving vóór de einddatum.
 */

/** Kalenderdag van de eerste betaling (Nederlandse tijd). */
export function firstDayOf(order: Pick<Order, "created_at">): string {
  return amsterdamDay(new Date(order.created_at));
}

/** Het nummer van de eerste afschrijving op of na `day` (2 = de eerste maandelijkse). */
function paymentNumberFrom(firstDay: string, day: string): number {
  let n = 2;
  while (chargeDay(firstDay, n) < day) n++;
  return n;
}

interface Phase {
  phase: "intro" | "main";
  /** Nummer van de eerste betaling in deze fase. */
  from: number;
  times?: number;
  amountCents: number;
  startDate: string;
}

/** De abonnementen die een bestelling bij Mollie nodig heeft, vanaf betaling nummer `fromN`. */
export function subscriptionPhases(
  order: Pick<Order, "created_at" | "intro_cents" | "intro_months" | "monthly_cents">,
  fromN = 2,
): Phase[] {
  const first = firstDayOf(order);
  const phases: Phase[] = [];
  if (order.intro_cents !== null && order.intro_months >= fromN) {
    phases.push({
      phase: "intro",
      from: fromN,
      times: order.intro_months - fromN + 1,
      amountCents: order.intro_cents,
      startDate: chargeDay(first, fromN),
    });
  }
  const mainFrom = Math.max(fromN, order.intro_months + 1);
  phases.push({ phase: "main", from: mainFrom, amountCents: order.monthly_cents, startDate: chargeDay(first, mainFrom) });
  return phases;
}

/** Omschrijving bij Mollie en op het bankafschrift; uniek per klant (bestelnummer erin). */
function phaseDescription(order: Order, phase: Phase["phase"], l: Locale): string {
  const ref = order.id.slice(0, 8).toUpperCase();
  const name = productFor(order.product, l).shortName;
  if (l === "en") return phase === "intro" ? `${name} subscription, offer price ${ref}` : `${name} subscription ${ref}`;
  return phase === "intro" ? `${name} abonnement actieprijs ${ref}` : `${name} abonnement ${ref}`;
}

async function customerOf(order: Order): Promise<Customer & { mollie_customer_id: string }> {
  const customer = await getCustomer(order.customer_id);
  if (!customer?.mollie_customer_id) throw new Error(`Bestelling ${order.id} heeft geen Mollie-klant`);
  return customer as Customer & { mollie_customer_id: string };
}

/**
 * Zorgt dat de abonnementen van een bestelling bij Mollie bestaan, vanaf
 * betaling nummer `fromN` (2 = direct na de eerste betaling). Kijkt eerst of
 * ze al bestaan, zodat er na een onderbreking nooit dubbele ontstaan.
 */
export async function ensureSubscriptions(order: Order, { mandateId, fromN = 2 }: { mandateId?: string; fromN?: number } = {}): Promise<void> {
  if (!isSubscription(order.duration)) return;
  if (fromN === 2 && order.subscription_id && !order.subscription_canceled_at) return;
  const customer = await customerOf(order);
  const l = toLocale(customer.locale);
  const existing = (await listSubscriptions(customer.mollie_customer_id)).filter(
    (s) => s.status !== "canceled" && s.metadata?.order_id === order.id,
  );
  const ids: Record<Phase["phase"], string | null> = { intro: null, main: null };
  for (const p of subscriptionPhases(order, fromN)) {
    const found = existing.find((s) => s.metadata?.phase === p.phase && Number(s.metadata?.from) === p.from);
    const sub =
      found ??
      (await createSubscription(
        customer.mollie_customer_id,
        {
          amountCents: p.amountCents,
          startDate: p.startDate,
          times: p.times,
          description: phaseDescription(order, p.phase, l),
          mandateId,
          metadata: { order_id: order.id, phase: p.phase, from: p.from },
        },
        // Na een stopzetting (opzegging ingetrokken) een nieuwe sleutel: Mollie onthoudt sleutels een uur.
        `abonnement-${order.id}-${p.phase}-${p.from}-${order.subscription_canceled_at ? new Date(order.subscription_canceled_at).getTime() : 0}`,
      ));
    ids[p.phase] = sub.id;
  }
  const sql = await db();
  await sql`
    update orders set subscription_id = ${ids.main}, intro_subscription_id = ${ids.intro}, subscription_canceled_at = null, updated_at = now()
    where id = ${order.id}`;
}

/** De abonnementen bij Mollie die nog kunnen afschrijven. */
function liveSubscriptionIds(order: Order): string[] {
  return [order.intro_subscription_id, order.subscription_id].filter((id): id is string => Boolean(id));
}

/**
 * De dag waarop een opgezegd abonnement eindigt: het einde van de minimale
 * looptijd, of daarna het einde van de lopende (betaalde) maand.
 */
export function endDayFor(order: Order, now: Date = new Date()): string {
  const first = firstDayOf(order);
  const today = amsterdamDay(now);
  const months = durations[order.duration].months;
  const commitmentEnd = chargeDay(first, months + 1);
  if (months > 1 && today < commitmentEnd) return commitmentEnd;
  let n = 2;
  while (chargeDay(first, n) <= today) n++;
  return chargeDay(first, n);
}

async function markSubscriptionsStopped(orderId: string): Promise<void> {
  const sql = await db();
  await sql`update orders set subscription_canceled_at = now(), updated_at = now() where id = ${orderId}`;
}

/**
 * Stopt de abonnementen bij Mollie zodra er vóór `endDay` niets meer hoeft te
 * worden afgeschreven. Geeft true als ze (nu of eerder) gestopt zijn.
 */
async function stopIfDue(order: Order, endDay: string): Promise<boolean> {
  if (order.subscription_canceled_at) return true;
  const customer = await customerOf(order);
  let allStopped = true;
  for (const id of liveSubscriptionIds(order)) {
    const sub = await getSubscription(customer.mollie_customer_id, id);
    if (sub.status === "canceled" || sub.status === "completed") continue;
    if (!sub.nextPaymentDate || sub.nextPaymentDate >= endDay) await cancelMollieSubscription(customer.mollie_customer_id, id);
    else allStopped = false;
  }
  if (allStopped) await markSubscriptionsStopped(order.id);
  return allStopped;
}

/** Stopt alle abonnementen van een bestelling bij Mollie direct (terugbetaling of herroeping). */
export async function stopSubscriptionsNow(order: Order): Promise<void> {
  if (order.subscription_canceled_at) return;
  const customer = await customerOf(order);
  for (const id of liveSubscriptionIds(order)) await cancelMollieSubscription(customer.mollie_customer_id, id);
  await markSubscriptionsStopped(order.id);
}

/**
 * Zegt een abonnement op. Binnen de minimale looptijd loopt het door tot het
 * einde daarvan, daarna tot het einde van de lopende maand. Geeft de einddatum.
 */
export async function cancelOrder(order: Order, now: Date = new Date()): Promise<Date> {
  const endDay = endDayFor(order, now);
  const cancelAt = amsterdamStartOfDay(endDay);
  const sql = await db();
  const [updated] = await sql<Order[]>`update orders set cancel_at = ${cancelAt}, updated_at = now() where id = ${order.id} returning *`;
  // Lukt het stoppen bij Mollie nu niet, dan doet de dagelijkse taak het.
  await stopIfDue(updated, endDay).catch((err) => console.error(`Abonnement ${order.id} stoppen bij Mollie mislukt`, err));
  return cancelAt;
}

/** Trekt een opzegging in (alleen vóór de einddatum). Maakt het abonnement zo nodig opnieuw aan bij Mollie. */
export async function resumeOrder(order: Order, now: Date = new Date()): Promise<boolean> {
  if (!order.cancel_at || order.cancel_at.getTime() <= now.getTime() || order.status === "canceled") return false;
  if (order.subscription_canceled_at) {
    const fromN = paymentNumberFrom(firstDayOf(order), amsterdamDay(order.cancel_at));
    await ensureSubscriptions(order, { fromN });
  }
  const sql = await db();
  await sql`update orders set cancel_at = null, updated_at = now() where id = ${order.id}`;
  return true;
}

/**
 * Betaalt de eerste betaling van een bestelling volledig terug (garantie of
 * herroeping), met een creditnota, en stopt het abonnement desgewenst direct.
 */
export async function refundFirstPayment(
  order: Order,
  { cancel }: { cancel: boolean },
): Promise<{ refundedCents: number; refundId: string; invoiceId: string }> {
  const ref = order.id.slice(0, 8).toUpperCase();
  const refund = await createRefund(order.checkout_id, order.amount_cents, `Terugbetaling bestelling ${ref}`, `terugbetaling-${order.id}`);
  const refundedCents = Math.round(Number(refund.amount.value) * 100);
  if (cancel && isSubscription(order.duration)) await stopSubscriptionsNow(order);
  const original = await invoiceForPayment(order.checkout_id);
  const customer = await getCustomer(order.customer_id);
  const l = toLocale(customer?.locale);
  const credit = await createInvoice({
    paymentId: refund.id,
    kind: "credit",
    creditFor: original?.id ?? null,
    orderId: order.id,
    customerId: order.customer_id,
    customerName: original?.customer_name ?? customer?.name ?? "",
    customerEmail: original?.customer_email ?? customer?.email ?? "",
    description: `${l === "en" ? "Refund" : "Terugbetaling"}: ${original?.description ?? productFor(order.product, l).name}`,
    amountCents: -refundedCents,
    method: original?.method ?? null,
  });
  return { refundedCents, refundId: refund.id, invoiceId: credit.id };
}

/**
 * Start een kleine betaling (€ 0,01, die de klant direct terugkrijgt) om een
 * nieuwe rekening of betaalmethode vast te leggen. Geeft de betaallink.
 */
export async function startPaymentMethodChange(customer: Customer, l: Locale, returnPath: string): Promise<string> {
  if (!customer.mollie_customer_id) throw new Error("Klant heeft geen Mollie-klant");
  const payment = await createPayment({
    amountCents: 1,
    description: l === "en" ? `${site.name}: confirm new payment method` : `${site.name}: nieuwe betaalmethode bevestigen`,
    redirectUrl: localeUrl(site.url, l, `${returnPath}?betaalmethode=1`),
    locale: l,
    methods: ["ideal", "bancontact"],
    sequenceType: "first",
    customerId: customer.mollie_customer_id,
    metadata: { kind: "mandate", customer_id: customer.id },
  });
  if (!payment._links.checkout?.href) throw new Error("Mollie gaf geen betaallink terug");
  return payment._links.checkout.href;
}

/** Na de bevestiging: de lopende abonnementen van de klant schrijven voortaan af via de nieuwe machtiging. */
export async function applyNewMandate(customerId: string, mandateId: string): Promise<void> {
  const customer = await getCustomer(customerId);
  if (!customer?.mollie_customer_id) return;
  const sql = await db();
  const orders = await sql<Order[]>`
    select * from orders where customer_id = ${customerId} and status in ('active', 'past_due') and subscription_canceled_at is null`;
  for (const order of orders) {
    for (const id of liveSubscriptionIds(order)) {
      await updateSubscription(customer.mollie_customer_id, id, { mandateId }).catch((err) =>
        console.error(`Nieuwe machtiging voor abonnement ${id} instellen mislukt`, err),
      );
    }
  }
}

/** Is een abonnement door Mollie zelf gestopt (bijv. na herhaald mislukte incasso's)? */
const stoppedByMollie = (sub: MollieSubscription) => sub.status === "canceled" || sub.status === "suspended";

/**
 * Onderhoud, vanuit de geplande taak: opgezegde abonnementen beëindigen op hun
 * einddatum, ontbrekende abonnementen alsnog aanmaken, en (dagelijks)
 * opgezegde abonnementen bij Mollie stoppen en controleren of Mollie zelf een
 * abonnement heeft gestopt.
 */
export async function runSubscriptionMaintenance({ daily }: { daily: boolean }): Promise<{ ended: number; repaired: number; stopped: number }> {
  const sql = await db();
  const ended = await sql<Order[]>`
    update orders set status = 'canceled', ended_at = coalesce(ended_at, now()), updated_at = now()
    where status in ('active', 'past_due') and cancel_at is not null and cancel_at <= now()
    returning *`;
  for (const order of ended) {
    await stopSubscriptionsNow(order).catch((err) => console.error(`Abonnement ${order.id} stoppen bij Mollie mislukt`, err));
  }

  // Na een storing tussen de eerste betaling en het aanmaken van het abonnement.
  let repaired = 0;
  const missing = await sql<Order[]>`
    select * from orders
    where duration <> 'eenmalig' and status in ('active', 'past_due') and subscription_id is null
      and subscription_canceled_at is null and cancel_at is null and created_at < now() - interval '10 minutes'
    order by created_at limit 20`;
  for (const order of missing) {
    try {
      await ensureSubscriptions(order);
      repaired++;
    } catch (err) {
      console.error(`Abonnement voor bestelling ${order.id} aanmaken mislukt`, err);
    }
  }
  if (!daily) return { ended: ended.length, repaired, stopped: 0 };

  let stopped = 0;
  const cancelling = await sql<Order[]>`
    select * from orders
    where status in ('active', 'past_due') and cancel_at > now() and subscription_canceled_at is null
    order by cancel_at limit 200`;
  for (const order of cancelling) {
    try {
      if (await stopIfDue(order, amsterdamDay(order.cancel_at!))) stopped++;
    } catch (err) {
      console.error(`Opgezegd abonnement ${order.id} controleren mislukt`, err);
    }
  }

  const live = await sql<Order[]>`
    select * from orders
    where status in ('active', 'past_due') and cancel_at is null and subscription_id is not null and subscription_canceled_at is null
    order by created_at limit 500`;
  for (const order of live) {
    try {
      const customer = await customerOf(order);
      let gone = false;
      for (const id of liveSubscriptionIds(order)) {
        if (stoppedByMollie(await getSubscription(customer.mollie_customer_id, id))) gone = true;
      }
      if (!gone) continue;
      await stopSubscriptionsNow(order);
      await sql`
        update orders set status = 'canceled', ended_at = coalesce(ended_at, now()), updated_at = now() where id = ${order.id}`;
      const l = toLocale(customer.locale);
      await sendMail(subscriptionEndedEmail({ to: customer.email, name: customer.name, productName: productFor(order.product, l).name, locale: l }));
      await sendMail(
        adminNotificationEmail(
          "abonnement-gestopt",
          "Abonnement gestopt door Mollie",
          {
            Klant: `${customer.name} (${customer.email})`,
            Bestelling: order.id.slice(0, 8).toUpperCase(),
            Reden: "Mollie heeft het abonnement gestopt, meestal na herhaald mislukte incasso's of een ingetrokken machtiging.",
          },
          { about: customer.email },
        ),
      );
      stopped++;
    } catch (err) {
      console.error(`Abonnement ${order.id} controleren bij Mollie mislukt`, err);
    }
  }
  return { ended: ended.length, repaired, stopped };
}

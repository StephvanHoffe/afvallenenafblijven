import "server-only";
import { db } from "@/lib/db";
import type { DurationId, PlanType, ProductId } from "@/config/pricing";
import type { Locale } from "@/i18n/config";
import type { Campaign } from "@/lib/campaign";
import type { Intake } from "@/lib/intake";
import type { PlanContent } from "@/lib/ai/schemas";
import type { NutritionTargets } from "@/lib/calculations";
import type { CheckinData } from "@/lib/checkin";
import type { WeeklyAdjustment, WeeklyData } from "@/lib/weekly";

export type { CheckinData };

export type OrderStatus = "active" | "past_due" | "canceled" | "completed";
export type PlanStatus = "pending" | "generating" | "ready" | "failed";

export interface Customer {
  id: string;
  email: string;
  name: string;
  stripe_customer_id: string | null;
  marketing_consent: boolean;
  weekly_reminders: boolean;
  /** "nl" of "en": de taal van e-mails, schema's en PDF's. */
  locale: string;
  created_at: Date;
}

export interface IntakeRow {
  id: string;
  customer_id: string | null;
  email: string;
  name: string;
  data: Intake;
  consents: Record<string, unknown>;
  locale: string;
  campaign: Campaign | null;
  created_at: Date;
}

export interface Order {
  id: string;
  customer_id: string;
  intake_id: string;
  product: ProductId;
  duration: DurationId;
  stripe_session_id: string;
  stripe_subscription_id: string | null;
  status: OrderStatus;
  cancel_at: Date | null;
  amount_cents: number;
  monthly_cents: number;
  checkin_reminded_seq: number | null;
  checkin_reminders: number;
  weekly_reminded_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Plan {
  id: string;
  order_id: string;
  customer_id: string;
  type: PlanType;
  seq: number;
  status: PlanStatus;
  content: PlanContent | null;
  error: string | null;
  attempts: number;
  generated_at: Date | null;
  emailed_at: Date | null;
  created_at: Date;
}

export const MAX_PLAN_ATTEMPTS = 5;

// ---------- Intakes ----------

export async function createIntake(input: {
  email: string;
  name: string;
  data: Intake;
  consents: Record<string, unknown>;
  locale: Locale;
  campaign?: Campaign | null;
}): Promise<string> {
  const sql = await db();
  const [row] = await sql<{ id: string }[]>`
    insert into intakes (email, name, data, consents, locale, campaign)
    values (${input.email}, ${input.name}, ${sql.json(input.data as never)}, ${sql.json(input.consents as never)}, ${input.locale},
            ${input.campaign ? sql.json(input.campaign as never) : null})
    returning id`;
  return row.id;
}

export async function getIntake(id: string): Promise<IntakeRow | null> {
  const sql = await db();
  const [row] = await sql<IntakeRow[]>`select * from intakes where id = ${id}`;
  return row ?? null;
}

/** De meest recente vragenlijst van een klant (de basis van het eerste schema). */
export async function latestIntakeForCustomer(customerId: string): Promise<IntakeRow | null> {
  const sql = await db();
  const [row] = await sql<IntakeRow[]>`
    select * from intakes where customer_id = ${customerId} order by created_at desc limit 1`;
  return row ?? null;
}

export async function updateIntakeData(id: string, data: Intake): Promise<void> {
  const sql = await db();
  await sql`update intakes set data = ${sql.json(data as never)} where id = ${id}`;
}

// ---------- Klanten ----------

export async function upsertCustomer(input: {
  email: string;
  name: string;
  stripeCustomerId: string | null;
  marketingConsent: boolean;
  locale: Locale;
}): Promise<Customer> {
  const sql = await db();
  const [row] = await sql<Customer[]>`
    insert into customers (email, name, stripe_customer_id, marketing_consent, locale)
    values (${input.email}, ${input.name}, ${input.stripeCustomerId}, ${input.marketingConsent}, ${input.locale})
    on conflict (email) do update set
      name = excluded.name,
      locale = excluded.locale,
      stripe_customer_id = coalesce(excluded.stripe_customer_id, customers.stripe_customer_id),
      marketing_consent = customers.marketing_consent or excluded.marketing_consent
    returning *`;
  return row;
}

/** Onthoudt de taal waarin de klant de site gebruikt (voor e-mails en nieuwe schema's). */
export async function setCustomerLocale(id: string, locale: Locale): Promise<void> {
  const sql = await db();
  await sql`update customers set locale = ${locale} where id = ${id} and locale <> ${locale}`;
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const sql = await db();
  const [row] = await sql<Customer[]>`select * from customers where id = ${id}`;
  return row ?? null;
}

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const sql = await db();
  const [row] = await sql<Customer[]>`select * from customers where email = ${email.toLowerCase()}`;
  return row ?? null;
}

// ---------- Bestellingen ----------

/**
 * Legt een bestelling vast. Geeft null terug als deze checkout al eerder is
 * verwerkt (Stripe kan webhooks meerdere keren versturen).
 */
export async function createOrder(input: {
  customerId: string;
  intakeId: string;
  product: ProductId;
  duration: DurationId;
  stripeSessionId: string;
  stripeSubscriptionId: string | null;
  status: OrderStatus;
  amountCents: number;
  monthlyCents: number;
}): Promise<Order | null> {
  const sql = await db();
  const [row] = await sql<Order[]>`
    insert into orders (customer_id, intake_id, product, duration, stripe_session_id, stripe_subscription_id, status, amount_cents, monthly_cents)
    values (${input.customerId}, ${input.intakeId}, ${input.product}, ${input.duration}, ${input.stripeSessionId},
            ${input.stripeSubscriptionId}, ${input.status}, ${input.amountCents}, ${input.monthlyCents})
    on conflict (stripe_session_id) do nothing
    returning *`;
  if (row) {
    await sql`update intakes set customer_id = ${input.customerId} where id = ${input.intakeId}`;
  }
  return row ?? null;
}

export async function getOrderBySession(sessionId: string): Promise<Order | null> {
  const sql = await db();
  const [row] = await sql<Order[]>`select * from orders where stripe_session_id = ${sessionId}`;
  return row ?? null;
}

export async function getOrder(id: string): Promise<Order | null> {
  const sql = await db();
  const [row] = await sql<Order[]>`select * from orders where id = ${id}`;
  return row ?? null;
}

export async function ordersForCustomer(customerId: string): Promise<Order[]> {
  const sql = await db();
  return sql<Order[]>`select * from orders where customer_id = ${customerId} order by created_at desc`;
}

export async function updateOrderBySubscription(
  subscriptionId: string,
  update: { status: OrderStatus; cancelAt: Date | null },
): Promise<void> {
  const sql = await db();
  await sql`
    update orders set status = ${update.status}, cancel_at = ${update.cancelAt}, updated_at = now()
    where stripe_subscription_id = ${subscriptionId}`;
}

// ---------- Schema's ----------

export async function createPlans(orderId: string, customerId: string, types: PlanType[], seq: number): Promise<string[]> {
  const sql = await db();
  const ids: string[] = [];
  for (const type of types) {
    const [row] = await sql<{ id: string }[]>`
      insert into plans (order_id, customer_id, type, seq)
      values (${orderId}, ${customerId}, ${type}, ${seq})
      on conflict (order_id, type, seq) do nothing
      returning id`;
    if (row) ids.push(row.id);
  }
  return ids;
}

/**
 * Claimt een schema voor generatie. Voorkomt dat twee processen (webhook,
 * bedankpagina en cron) hetzelfde schema tegelijk maken. Een generatie die
 * langer dan 15 minuten "bezig" is, geldt als vastgelopen en mag opnieuw.
 */
export async function claimPlan(planId: string): Promise<Plan | null> {
  const sql = await db();
  const [row] = await sql<Plan[]>`
    update plans set status = 'generating', attempts = attempts + 1, started_at = now(), error = null
    where id = ${planId}
      and attempts < ${MAX_PLAN_ATTEMPTS}
      and (status in ('pending', 'failed') or (status = 'generating' and started_at < now() - interval '15 minutes'))
    returning *`;
  return row ?? null;
}

export async function completePlan(planId: string, content: PlanContent): Promise<void> {
  const sql = await db();
  await sql`
    update plans set status = 'ready', content = ${sql.json(content as never)}, generated_at = now(), error = null
    where id = ${planId}`;
}

export async function failPlan(planId: string, error: string): Promise<Plan | null> {
  const sql = await db();
  const [row] = await sql<Plan[]>`
    update plans set status = 'failed', error = ${error.slice(0, 2000)} where id = ${planId} returning *`;
  return row ?? null;
}

export async function getPlan(planId: string): Promise<Plan | null> {
  const sql = await db();
  const [row] = await sql<Plan[]>`select * from plans where id = ${planId}`;
  return row ?? null;
}

export async function plansForOrder(orderId: string): Promise<Plan[]> {
  const sql = await db();
  return sql<Plan[]>`select * from plans where order_id = ${orderId} order by seq desc, type`;
}

export async function plansForCustomer(customerId: string): Promise<Plan[]> {
  const sql = await db();
  return sql<Plan[]>`
    select id, order_id, customer_id, type, seq, status, null as content, error, attempts, generated_at, emailed_at, created_at
    from plans where customer_id = ${customerId} order by created_at desc, type`;
}

/** Klare schema's (met inhoud) van een klant voor één periode; zonder periode de laatste. */
export async function readyPlansForPeriod(customerId: string, seq?: number): Promise<Plan[]> {
  const sql = await db();
  return sql<Plan[]>`
    select * from plans
    where customer_id = ${customerId} and status = 'ready'
      and seq = ${seq ?? sql`(select max(seq) from plans where customer_id = ${customerId} and status = 'ready')`}
    order by type`;
}

/** De dagdoelen van alle klare voedingsschema's van een klant, oudste eerst. */
export async function nutritionTargetHistory(
  customerId: string,
): Promise<{ seq: number; generated_at: Date | null; targets: NutritionTargets | null }[]> {
  const sql = await db();
  return sql<{ seq: number; generated_at: Date | null; targets: NutritionTargets | null }[]>`
    select seq, generated_at, content -> 'targets' as targets from plans
    where customer_id = ${customerId} and type = 'voeding' and status = 'ready'
    order by seq asc, generated_at asc`;
}

export async function previousReadyPlan(orderId: string, type: PlanType, seq: number): Promise<Plan | null> {
  const sql = await db();
  const [row] = await sql<Plan[]>`
    select * from plans where order_id = ${orderId} and type = ${type} and seq < ${seq} and status = 'ready'
    order by seq desc limit 1`;
  return row ?? null;
}

export async function pendingPlanIds(limit: number): Promise<string[]> {
  const sql = await db();
  const rows = await sql<{ id: string }[]>`
    select id from plans
    where attempts < ${MAX_PLAN_ATTEMPTS}
      and (status in ('pending', 'failed') or (status = 'generating' and started_at < now() - interval '15 minutes'))
    order by created_at asc
    limit ${limit}`;
  return rows.map((r) => r.id);
}

/** Markeert schema's als gemaild; geeft alleen de schema's terug die nog niet gemaild waren. */
export async function markPlansEmailed(planIds: string[]): Promise<string[]> {
  if (planIds.length === 0) return [];
  const sql = await db();
  const rows = await sql<{ id: string }[]>`
    update plans set emailed_at = now() where id = any(${planIds}::uuid[]) and emailed_at is null returning id`;
  return rows.map((r) => r.id);
}

/**
 * Lopende abonnementen met hun laatste periode, voor de check-in: wanneer
 * begon de laatste periode en is de check-in voor de volgende al ingevuld?
 */
export async function subscriptionCheckinOrders(): Promise<
  (Order & { last_seq: number; last_start: Date; next_checkin: boolean })[]
> {
  const sql = await db();
  return sql<(Order & { last_seq: number; last_start: Date; next_checkin: boolean })[]>`
    select o.*, p.last_seq, p.last_start,
      exists (select 1 from checkins ci where ci.order_id = o.id and ci.for_seq = p.last_seq + 1) as next_checkin
    from orders o
    join lateral (
      select seq as last_seq, min(created_at) as last_start from plans
      where order_id = o.id group by seq order by seq desc limit 1
    ) p on true
    where o.duration <> 'eenmalig' and o.status = 'active'`;
}

export async function markCheckinReminder(orderId: string, seq: number, count: number): Promise<void> {
  const sql = await db();
  await sql`update orders set checkin_reminded_seq = ${seq}, checkin_reminders = ${count} where id = ${orderId}`;
}

// ---------- Check-ins ----------

export interface CheckinRow {
  data: CheckinData;
  order_id: string | null;
  for_seq: number | null;
  created_at: Date;
}

/**
 * Slaat de check-in voor een periode op. Geeft false als er voor die periode
 * al een check-in was (bijv. dubbel verstuurd formulier).
 */
export async function addCheckin(customerId: string, orderId: string, forSeq: number, data: CheckinData): Promise<boolean> {
  const sql = await db();
  const rows = await sql`
    insert into checkins (customer_id, order_id, for_seq, data)
    values (${customerId}, ${orderId}, ${forSeq}, ${sql.json(data as never)})
    on conflict (order_id, for_seq) do nothing
    returning id`;
  return rows.length > 0;
}

/** Alle check-ins van een abonnement, oudste eerst. */
export async function checkinsForOrder(orderId: string): Promise<CheckinRow[]> {
  const sql = await db();
  return sql<CheckinRow[]>`
    select data, order_id, for_seq, created_at from checkins
    where order_id = ${orderId} order by for_seq asc, created_at asc`;
}

export async function checkinsForCustomer(customerId: string): Promise<CheckinRow[]> {
  const sql = await db();
  return sql<CheckinRow[]>`
    select data, order_id, for_seq, created_at from checkins
    where customer_id = ${customerId} order by created_at desc`;
}

// ---------- Weegmomenten ----------

export interface WeeklyLogRow {
  id: string;
  customer_id: string;
  order_id: string;
  seq: number;
  week: number;
  data: WeeklyData;
  adjustment: WeeklyAdjustment | null;
  status: string;
  created_at: Date;
}

/** Slaat een weegmoment op; geeft null als dit weegmoment al was ingevuld. */
export async function addWeeklyLog(input: {
  customerId: string;
  orderId: string;
  seq: number;
  week: number;
  data: WeeklyData;
  adjustment: WeeklyAdjustment;
  status: "ready" | "pending";
}): Promise<string | null> {
  const sql = await db();
  const [row] = await sql<{ id: string }[]>`
    insert into weekly_logs (customer_id, order_id, seq, week, data, adjustment, status)
    values (${input.customerId}, ${input.orderId}, ${input.seq}, ${input.week}, ${sql.json(input.data as never)},
            ${sql.json(input.adjustment as never)}, ${input.status})
    on conflict (order_id, seq, week) do nothing
    returning id`;
  return row?.id ?? null;
}

export async function weeklyLogsForOrder(orderId: string): Promise<WeeklyLogRow[]> {
  const sql = await db();
  return sql<WeeklyLogRow[]>`select * from weekly_logs where order_id = ${orderId} order by seq, week`;
}

export async function weeklyLogsForCustomer(customerId: string): Promise<WeeklyLogRow[]> {
  const sql = await db();
  return sql<WeeklyLogRow[]>`select * from weekly_logs where customer_id = ${customerId} order by created_at`;
}

/** Claimt een weegmoment waarvan de aanwijzingen nog gemaakt moeten worden. */
export async function claimWeeklyLog(id: string): Promise<WeeklyLogRow | null> {
  const sql = await db();
  const [row] = await sql<WeeklyLogRow[]>`
    update weekly_logs set status = 'generating', started_at = now()
    where id = ${id} and (status = 'pending' or (status = 'generating' and started_at < now() - interval '5 minutes'))
    returning *`;
  return row ?? null;
}

export async function completeWeeklyLog(id: string, adjustment: WeeklyAdjustment): Promise<void> {
  const sql = await db();
  await sql`update weekly_logs set adjustment = ${sql.json(adjustment as never)}, status = 'ready' where id = ${id}`;
}

export async function pendingWeeklyLogIds(limit: number): Promise<string[]> {
  const sql = await db();
  const rows = await sql<{ id: string }[]>`
    select id from weekly_logs
    where status = 'pending' or (status = 'generating' and started_at < now() - interval '5 minutes')
    order by created_at limit ${limit}`;
  return rows.map((r) => r.id);
}

export async function setWeeklyReminders(customerId: string, on: boolean): Promise<void> {
  const sql = await db();
  await sql`update customers set weekly_reminders = ${on} where id = ${customerId}`;
}

/**
 * Bestellingen met een lopende periode, voor de wekelijkse herinnering: met
 * het begin van de laatste periode en de weegmomenten die al zijn ingevuld.
 */
export async function weeklyReminderOrders(): Promise<
  (Order & { last_seq: number; last_start: Date; logged_weeks: number[]; email: string; name: string; locale: string })[]
> {
  const sql = await db();
  return sql<(Order & { last_seq: number; last_start: Date; logged_weeks: number[]; email: string; name: string; locale: string })[]>`
    select o.*, p.last_seq, p.last_start, c.email, c.name, c.locale,
      coalesce((select array_agg(w.week) from weekly_logs w where w.order_id = o.id and w.seq = p.last_seq), '{}') as logged_weeks
    from orders o
    join customers c on c.id = o.customer_id and c.weekly_reminders
    join lateral (
      select seq as last_seq, min(created_at) as last_start from plans
      where order_id = o.id group by seq order by seq desc limit 1
    ) p on true
    where o.status in ('active', 'completed')
      and p.last_start > now() - interval '28 days'
      and (o.weekly_reminded_at is null or o.weekly_reminded_at < now() - interval '5 days')`;
}

export async function markWeeklyReminded(orderId: string): Promise<void> {
  const sql = await db();
  await sql`update orders set weekly_reminded_at = now() where id = ${orderId}`;
}

// ---------- Herroepingen ----------

export async function createWithdrawal(input: {
  name: string;
  email: string;
  orderReference: string;
  message?: string;
}): Promise<{ id: string; created_at: Date }> {
  const sql = await db();
  const [row] = await sql<{ id: string; created_at: Date }[]>`
    insert into withdrawals (name, email, order_reference, message)
    values (${input.name}, ${input.email}, ${input.orderReference}, ${input.message ?? null})
    returning id, created_at`;
  return row;
}

// ---------- Tevredenheidsgarantie ----------

export interface GuaranteeRequestRow {
  id: string;
  customer_id: string;
  order_id: string;
  reason: string | null;
  created_at: Date;
  handled_at: Date | null;
}

export async function guaranteeRequestForCustomer(customerId: string): Promise<GuaranteeRequestRow | null> {
  const sql = await db();
  const [row] = await sql<GuaranteeRequestRow[]>`select * from guarantee_requests where customer_id = ${customerId}`;
  return row ?? null;
}

/** Legt de aanvraag vast; null als deze klant de garantie al eerder heeft aangevraagd. */
export async function createGuaranteeRequest(input: {
  customerId: string;
  orderId: string;
  reason?: string;
}): Promise<GuaranteeRequestRow | null> {
  const sql = await db();
  const [row] = await sql<GuaranteeRequestRow[]>`
    insert into guarantee_requests (customer_id, order_id, reason)
    values (${input.customerId}, ${input.orderId}, ${input.reason ?? null})
    on conflict (customer_id) do nothing
    returning *`;
  return row ?? null;
}

// ---------- Bewaartermijnen (zie privacybeleid) ----------

/**
 * Verwijdert gegevens waarvan de bewaartermijn is verstreken: vragenlijsten
 * zonder bestelling na 30 dagen, en klanten zonder lopend abonnement 12
 * maanden na hun laatste bestelling (factuurgegevens blijven bij Stripe).
 */
export async function cleanupExpiredData(): Promise<{ intakes: number; customers: number; junctionUserIds: string[] }> {
  const sql = await db();
  const intakes = await sql`
    delete from intakes i
    where i.customer_id is null
      and i.created_at < now() - interval '30 days'
      and not exists (select 1 from orders o where o.intake_id = i.id)`;
  const doomed = await sql<{ id: string }[]>`
    select c.id from customers c
    where not exists (
      select 1 from orders o
      where o.customer_id = c.id
        and (o.status in ('active', 'past_due') or o.updated_at > now() - interval '12 months')
    )
    and c.created_at < now() - interval '12 months'`;
  const ids = doomed.map((r) => r.id);
  // Gekoppelde gezondheidsapps: de gebruiker bij Junction moet ook weg (dat doet de aanroeper).
  const junction = ids.length
    ? await sql<{ external_user_id: string }[]>`
        select external_user_id from health_connections
        where provider = 'junction' and external_user_id is not null and customer_id = any(${ids})`
    : [];
  const customers = ids.length ? await sql`delete from customers where id = any(${ids})` : { count: 0 };
  await sql`delete from withdrawals where created_at < now() - interval '24 months'`;
  return { intakes: intakes.count, customers: customers.count, junctionUserIds: junction.map((r) => r.external_user_id) };
}


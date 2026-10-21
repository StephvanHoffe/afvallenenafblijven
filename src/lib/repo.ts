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
  /** Anoniem bezoeknummer uit de funnelmeting (koppelt de vragenlijst aan de bestelling). */
  visit_id: string | null;
  device: string | null;
  discount_code: string | null;
  /** Gekozen looptijd bij het starten van de betaling. */
  duration: string | null;
  /** Herinnering verstuurd voor een niet-afgeronde betaling. */
  reminded_at: Date | null;
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
  discount_code: string | null;
  /** Opzegreden uit het opzegformulier (vaste keuze) en eventuele toelichting. */
  cancel_reason: string | null;
  cancel_comment: string | null;
  /** Wanneer het abonnement echt is beëindigd. */
  ended_at: Date | null;
  refunded_cents: number;
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
  /** Begin van de periode; kan in de toekomst liggen als het schema al klaarstaat. */
  starts_at: Date;
  /** Vroegste moment waarop de klant het schema te zien krijgt (willekeurig, binnen 2 uur). */
  release_after: Date;
  /** Wanneer het schema aan de klant is vrijgegeven; tot die tijd ziet de klant "wordt gemaakt". */
  released_at: Date | null;
  /** Goedgekeurd door de beheerder (alleen nodig als goedkeuring aanstaat). */
  approved_at: Date | null;
  /** Wanneer de beheerder om goedkeuring is gevraagd. */
  review_requested_at: Date | null;
  /** Aanwijzing van de beheerder voor het (opnieuw) maken van dit schema. */
  admin_instruction: string | null;
  /** Beoordeling door de beheerder (1-5) met toelichting. */
  rating: number | null;
  rating_note: string | null;
  created_at: Date;
}

/** Een periode van een bestelling: de schema's met hetzelfde volgnummer. */
export interface PeriodRef {
  order_id: string;
  seq: number;
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
  visitId?: string | null;
  device?: string | null;
  discountCode?: string | null;
  duration?: string | null;
}): Promise<string> {
  const sql = await db();
  const [row] = await sql<{ id: string }[]>`
    insert into intakes (email, name, data, consents, locale, campaign, visit_id, device, discount_code, duration)
    values (${input.email}, ${input.name}, ${sql.json(input.data as never)}, ${sql.json(input.consents as never)}, ${input.locale},
            ${input.campaign ? sql.json(input.campaign as never) : null}, ${input.visitId ?? null}, ${input.device ?? null},
            ${input.discountCode ?? null}, ${input.duration ?? null})
    returning id`;
  return row.id;
}

/**
 * Een begonnen maar niet afgeronde bestelling (maximaal 7 dagen oud), voor de
 * link "verder waar je gebleven was" in de herinneringsmail.
 */
export async function resumableIntake(id: string): Promise<IntakeRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const sql = await db();
  const [row] = await sql<IntakeRow[]>`
    select * from intakes i where i.id = ${id} and i.created_at > now() - interval '7 days'
      and not exists (select 1 from orders o where o.intake_id = i.id)`;
  return row ?? null;
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
  discountCode?: string | null;
}): Promise<Order | null> {
  const sql = await db();
  const [row] = await sql<Order[]>`
    insert into orders (customer_id, intake_id, product, duration, stripe_session_id, stripe_subscription_id, status, amount_cents, monthly_cents, discount_code)
    values (${input.customerId}, ${input.intakeId}, ${input.product}, ${input.duration}, ${input.stripeSessionId},
            ${input.stripeSubscriptionId}, ${input.status}, ${input.amountCents}, ${input.monthlyCents}, ${input.discountCode ?? null})
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
    update orders set status = ${update.status}, cancel_at = ${update.cancelAt}, updated_at = now(),
      ended_at = case when ${update.status} = 'canceled' then coalesce(ended_at, now()) else null end
    where stripe_subscription_id = ${subscriptionId}`;
}

// ---------- Schema's ----------

/** Maakt de schema's van een periode aan; `startsAt` is het begin van de periode (standaard nu). */
export async function createPlans(
  orderId: string,
  customerId: string,
  types: PlanType[],
  seq: number,
  startsAt: Date = new Date(),
  /** Vanaf wanneer de klant de schema's te zien krijgt (één moment voor de hele periode). */
  releaseAfter: Date = new Date(),
): Promise<string[]> {
  const sql = await db();
  const ids: string[] = [];
  for (const type of types) {
    const [row] = await sql<{ id: string }[]>`
      insert into plans (order_id, customer_id, type, seq, starts_at, release_after)
      values (${orderId}, ${customerId}, ${type}, ${seq}, ${startsAt}, ${releaseAfter})
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
 * Een mislukt schema wacht steeds langer voor de volgende poging (5, 10, 20
 * en 40 minuten), zodat een korte storing niet alle pogingen opmaakt.
 */
export async function claimPlan(planId: string): Promise<Plan | null> {
  const sql = await db();
  const [row] = await sql<Plan[]>`
    update plans set status = 'generating', attempts = attempts + 1, started_at = now(), error = null
    where id = ${planId}
      and attempts < ${MAX_PLAN_ATTEMPTS}
      and (status = 'pending'
        or (status = 'failed' and (started_at is null or started_at < now() - interval '5 minutes' * power(2, greatest(attempts - 1, 0))))
        or (status = 'generating' and started_at < now() - interval '15 minutes'))
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
    select id, order_id, customer_id, type, seq, status, null as content, error, attempts, generated_at, emailed_at, starts_at,
           release_after, released_at, approved_at, review_requested_at, admin_instruction, rating, rating_note, created_at
    from plans where customer_id = ${customerId} order by created_at desc, type`;
}

/** Klare schema's (met inhoud) van een klant voor één periode; zonder periode de laatste. */
export async function readyPlansForPeriod(customerId: string, seq?: number): Promise<Plan[]> {
  const sql = await db();
  return sql<Plan[]>`
    select * from plans
    where customer_id = ${customerId} and status = 'ready' and released_at is not null
      and seq = ${seq ?? sql`(select max(seq) from plans where customer_id = ${customerId} and status = 'ready' and released_at is not null)`}
    order by type`;
}

/** De dagdoelen van alle klare voedingsschema's van een klant, oudste eerst. */
export async function nutritionTargetHistory(
  customerId: string,
): Promise<{ seq: number; generated_at: Date | null; targets: NutritionTargets | null }[]> {
  const sql = await db();
  return sql<{ seq: number; generated_at: Date | null; targets: NutritionTargets | null }[]>`
    select seq, coalesce(released_at, generated_at) as generated_at, content -> 'targets' as targets from plans
    where customer_id = ${customerId} and type = 'voeding' and status = 'ready' and released_at is not null
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
      and (status = 'pending'
        or (status = 'failed' and (started_at is null or started_at < now() - interval '5 minutes' * power(2, greatest(attempts - 1, 0))))
        or (status = 'generating' and started_at < now() - interval '15 minutes'))
    order by created_at asc
    limit ${limit}`;
  return rows.map((r) => r.id);
}

/**
 * Geeft periodes vrij waarvan alle schema's klaar zijn en het geplande moment
 * is aangebroken; staat goedkeuring aan, dan moeten ze ook zijn goedgekeurd.
 * Veilig om tegelijk vaker aan te roepen: elke periode wordt één keer vrijgegeven.
 */
export async function releaseDuePeriods(opts: { approval: boolean; customerId?: string; orderId?: string }): Promise<PeriodRef[]> {
  const sql = await db();
  const rows = await sql<PeriodRef[]>`
    with due as (
      select order_id, seq from plans
      where released_at is null
        ${opts.customerId ? sql`and customer_id = ${opts.customerId}` : sql``}
        ${opts.orderId ? sql`and order_id = ${opts.orderId}` : sql``}
      group by order_id, seq
      having bool_and(status = 'ready') and max(release_after) <= now()
        ${opts.approval ? sql`and bool_and(approved_at is not null)` : sql``}
    )
    update plans p set released_at = now()
    from due where p.order_id = due.order_id and p.seq = due.seq and p.released_at is null
    returning p.order_id, p.seq`;
  return uniquePeriods(rows);
}

function uniquePeriods(rows: PeriodRef[]): PeriodRef[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const key = `${r.order_id}:${r.seq}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Vrijgegeven periodes waarvoor de klant nog geen "je schema staat klaar"-mail heeft gehad. */
export async function releasedUnmailedPeriods(limit: number): Promise<PeriodRef[]> {
  const sql = await db();
  return sql<PeriodRef[]>`
    select order_id, seq from plans
    where released_at is not null and emailed_at is null and status = 'ready'
    group by order_id, seq order by min(released_at) limit ${limit}`;
}

/**
 * Vraagt de beheerder om goedkeuring zodra alle schema's van een periode klaar
 * zijn. Geeft de schema's terug als dat nu voor het eerst gebeurt (anders leeg).
 */
export async function requestReview(orderId: string, seq: number): Promise<Plan[]> {
  const sql = await db();
  return sql<Plan[]>`
    update plans set review_requested_at = now()
    where order_id = ${orderId} and seq = ${seq} and review_requested_at is null and released_at is null
      and not exists (select 1 from plans q where q.order_id = ${orderId} and q.seq = ${seq} and q.status <> 'ready')
    returning *`;
}

/** Keurt een schema goed; met `now` gaat de hele periode ook direct naar de klant (niet pas op het geplande moment). */
export async function approvePlan(planId: string, now: boolean): Promise<PeriodRef | null> {
  const sql = await db();
  const [row] = await sql<PeriodRef[]>`
    update plans set approved_at = coalesce(approved_at, now())
    where id = ${planId} and status = 'ready' and released_at is null
    returning order_id, seq`;
  if (!row) return null;
  if (now) await sql`update plans set release_after = now() where order_id = ${row.order_id} and seq = ${row.seq} and released_at is null`;
  return row;
}

// ---------- Instellingen ----------

export async function getSetting<T>(key: string): Promise<T | null> {
  const sql = await db();
  const [row] = await sql<{ value: T }[]>`select value from settings where key = ${key}`;
  return row?.value ?? null;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const sql = await db();
  await sql`
    insert into settings (key, value) values (${key}, ${sql.json(value as never)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
}

/** Claimt de dagelijkse run voor deze dag; geeft false als die vandaag al is gedaan. */
export async function claimDailyRun(day: string): Promise<boolean> {
  const sql = await db();
  const rows = await sql`
    insert into settings (key, value) values ('daily_run', ${sql.json(day)})
    on conflict (key) do update set value = excluded.value, updated_at = now()
      where settings.value is distinct from excluded.value
    returning key`;
  return rows.length > 0;
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
 * begint de laatste periode en is de check-in voor de volgende al ingevuld?
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
      select seq as last_seq, min(starts_at) as last_start from plans
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

/** Bewaart waarom een klant opzegt (optioneel in het opzegformulier). */
export async function setCancelReason(orderId: string, reason: string | null, comment: string | null): Promise<void> {
  if (!reason && !comment) return;
  const sql = await db();
  await sql`update orders set cancel_reason = ${reason}, cancel_comment = ${comment} where id = ${orderId}`;
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
      select seq as last_seq, min(starts_at) as last_start from plans
      where order_id = o.id and starts_at <= now() group by seq order by seq desc limit 1
    ) p on true
    where o.status in ('active', 'completed')
      and p.last_start > now() - interval '32 days'
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
  // Anonieme funnelmeting 13 maanden, e-maillog 12 maanden, logboek 24 maanden.
  await sql`delete from funnel_events where created_at < now() - interval '13 months'`;
  await sql`delete from email_log where created_at < now() - interval '12 months'`;
  await sql`delete from admin_log where created_at < now() - interval '24 months'`;
  return { intakes: intakes.count, customers: customers.count, junctionUserIds: junction.map((r) => r.external_user_id) };
}


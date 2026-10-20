import "server-only";
import { db } from "@/lib/db";
import type { DurationId, PlanType, ProductId } from "@/config/pricing";
import type { Intake } from "@/lib/intake";
import type { PlanContent } from "@/lib/ai/schemas";

export type OrderStatus = "active" | "past_due" | "canceled" | "completed";
export type PlanStatus = "pending" | "generating" | "ready" | "failed";

export interface Customer {
  id: string;
  email: string;
  name: string;
  stripe_customer_id: string | null;
  marketing_consent: boolean;
  created_at: Date;
}

export interface IntakeRow {
  id: string;
  customer_id: string | null;
  email: string;
  name: string;
  data: Intake;
  consents: Record<string, unknown>;
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
}): Promise<string> {
  const sql = await db();
  const [row] = await sql<{ id: string }[]>`
    insert into intakes (email, name, data, consents)
    values (${input.email}, ${input.name}, ${sql.json(input.data as never)}, ${sql.json(input.consents as never)})
    returning id`;
  return row.id;
}

export async function getIntake(id: string): Promise<IntakeRow | null> {
  const sql = await db();
  const [row] = await sql<IntakeRow[]>`select * from intakes where id = ${id}`;
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
}): Promise<Customer> {
  const sql = await db();
  const [row] = await sql<Customer[]>`
    insert into customers (email, name, stripe_customer_id, marketing_consent)
    values (${input.email}, ${input.name}, ${input.stripeCustomerId}, ${input.marketingConsent})
    on conflict (email) do update set
      name = excluded.name,
      stripe_customer_id = coalesce(excluded.stripe_customer_id, customers.stripe_customer_id),
      marketing_consent = customers.marketing_consent or excluded.marketing_consent
    returning *`;
  return row;
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
 * Abonnementen die toe zijn aan een nieuw schema: actief (of opgezegd maar
 * nog binnen de betaalde periode) en het laatste schema is ouder dan het
 * interval.
 */
export async function dueSubscriptionOrders(intervalDays: number): Promise<(Order & { last_seq: number })[]> {
  const sql = await db();
  return sql<(Order & { last_seq: number })[]>`
    select o.*, p.last_seq from orders o
    join lateral (
      select max(seq) as last_seq, max(created_at) as last_created from plans where order_id = o.id
    ) p on true
    where o.duration <> 'eenmalig'
      and o.status = 'active'
      and (o.cancel_at is null or o.cancel_at > now() + interval '3 days')
      and p.last_created < now() - make_interval(days => ${intervalDays})`;
}

// ---------- Check-ins ----------

export interface CheckinData {
  goal?: Intake["goal"];
  weightKg?: number;
  energy?: string;
  hunger?: string;
  difficulty?: string;
  comments?: string;
}

export async function addCheckin(customerId: string, data: CheckinData): Promise<void> {
  const sql = await db();
  await sql`insert into checkins (customer_id, data) values (${customerId}, ${sql.json(data as never)})`;
}

export async function latestCheckin(customerId: string, since?: Date): Promise<CheckinData | null> {
  const sql = await db();
  const [row] = await sql<{ data: CheckinData }[]>`
    select data from checkins where customer_id = ${customerId}
    ${since ? sql`and created_at > ${since}` : sql``}
    order by created_at desc limit 1`;
  return row?.data ?? null;
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

// ---------- Bewaartermijnen (zie privacybeleid) ----------

/**
 * Verwijdert gegevens waarvan de bewaartermijn is verstreken: vragenlijsten
 * zonder bestelling na 30 dagen, en klanten zonder lopend abonnement 12
 * maanden na hun laatste bestelling (factuurgegevens blijven bij Stripe).
 */
export async function cleanupExpiredData(): Promise<{ intakes: number; customers: number }> {
  const sql = await db();
  const intakes = await sql`
    delete from intakes i
    where i.customer_id is null
      and i.created_at < now() - interval '30 days'
      and not exists (select 1 from orders o where o.intake_id = i.id)`;
  const customers = await sql`
    delete from customers c
    where not exists (
      select 1 from orders o
      where o.customer_id = c.id
        and (o.status in ('active', 'past_due') or o.updated_at > now() - interval '12 months')
    )
    and c.created_at < now() - interval '12 months'`;
  await sql`delete from withdrawals where created_at < now() - interval '24 months'`;
  return { intakes: intakes.count, customers: customers.count };
}


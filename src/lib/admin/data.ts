import "server-only";
import { db, isDatabaseConfigured } from "@/lib/db";
import { isDemoMode } from "@/lib/admin/auth";
import { demoAdminData } from "@/lib/admin/demo-data";
import type { DurationId, PlanType, ProductId } from "@/config/pricing";
import type { Intake } from "@/lib/intake";
import type { PlanContent } from "@/lib/ai/schemas";
import type { CheckinData, OrderStatus, PlanStatus } from "@/lib/repo";

export interface AdminOrderRow {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  product: ProductId;
  duration: DurationId;
  status: OrderStatus;
  cancelAt: Date | null;
  amountCents: number;
  monthlyCents: number;
  createdAt: Date;
  stripeSubscriptionId: string | null;
}

export interface AdminCustomerRow {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  marketing: boolean;
  stripeCustomerId: string | null;
  activeSubscriptions: number;
  orders: number;
  plans: number;
}

export interface AdminPlanRow {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  type: PlanType;
  seq: number;
  status: PlanStatus;
  attempts: number;
  error: string | null;
  createdAt: Date;
  generatedAt: Date | null;
  emailedAt: Date | null;
}

export interface AdminPlanDetail extends AdminPlanRow {
  content: PlanContent | null;
}

export interface AdminCustomerDetail {
  customer: AdminCustomerRow;
  orders: AdminOrderRow[];
  plans: AdminPlanRow[];
  intake: { data: Intake; consents: Record<string, unknown>; createdAt: Date } | null;
  checkins: { data: CheckinData; createdAt: Date }[];
}

export interface AdminWithdrawalRow {
  id: string;
  name: string;
  email: string;
  orderReference: string;
  message: string | null;
  createdAt: Date;
  handledAt: Date | null;
}

export interface AdminOverview {
  activeSubscriptions: number;
  mrrCents: number;
  pendingCancellations: number;
  newOrders30: number;
  firstPayments30Cents: number;
  checkoutStarts30: number;
  plansReady30: number;
  plansFailed: number;
  plansInProgress: number;
  openWithdrawals: number;
  ordersPerDay: { date: string; count: number }[];
  productMix: { product: ProductId; duration: DurationId; count: number }[];
  recentOrders: AdminOrderRow[];
}

export interface AdminData {
  demo: boolean;
  overview(): Promise<AdminOverview>;
  customers(query?: string): Promise<AdminCustomerRow[]>;
  customer(id: string): Promise<AdminCustomerDetail | null>;
  orders(status?: OrderStatus): Promise<AdminOrderRow[]>;
  plans(status?: PlanStatus): Promise<AdminPlanRow[]>;
  plan(id: string): Promise<AdminPlanDetail | null>;
  withdrawals(): Promise<AdminWithdrawalRow[]>;
}

const ref = (id: string) => id.slice(0, 8).toUpperCase();

type OrderSql = {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  product: ProductId;
  duration: DurationId;
  status: OrderStatus;
  cancel_at: Date | null;
  amount_cents: number;
  monthly_cents: number;
  created_at: Date;
  stripe_subscription_id: string | null;
};

const toOrder = (r: OrderSql): AdminOrderRow => ({
  id: r.id,
  reference: ref(r.id),
  customerId: r.customer_id,
  customerName: r.customer_name,
  customerEmail: r.customer_email,
  product: r.product,
  duration: r.duration,
  status: r.status,
  cancelAt: r.cancel_at,
  amountCents: r.amount_cents,
  monthlyCents: r.monthly_cents,
  createdAt: r.created_at,
  stripeSubscriptionId: r.stripe_subscription_id,
});

type PlanSql = {
  id: string;
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  type: PlanType;
  seq: number;
  status: PlanStatus;
  attempts: number;
  error: string | null;
  created_at: Date;
  generated_at: Date | null;
  emailed_at: Date | null;
  content?: PlanContent | null;
};

const toPlan = (r: PlanSql): AdminPlanRow => ({
  id: r.id,
  orderId: r.order_id,
  customerId: r.customer_id,
  customerName: r.customer_name,
  customerEmail: r.customer_email,
  type: r.type,
  seq: r.seq,
  status: r.status,
  attempts: r.attempts,
  error: r.error,
  createdAt: r.created_at,
  generatedAt: r.generated_at,
  emailedAt: r.emailed_at,
});

type CustomerSql = {
  id: string;
  name: string;
  email: string;
  created_at: Date;
  marketing_consent: boolean;
  stripe_customer_id: string | null;
  active_subscriptions: number;
  orders: number;
  plans: number;
};

const toCustomer = (r: CustomerSql): AdminCustomerRow => ({
  id: r.id,
  name: r.name,
  email: r.email,
  createdAt: r.created_at,
  marketing: r.marketing_consent,
  stripeCustomerId: r.stripe_customer_id,
  activeSubscriptions: r.active_subscriptions,
  orders: r.orders,
  plans: r.plans,
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const dbAdminData: AdminData = {
  demo: false,

  async overview() {
    const sql = await db();
    const [subs] = await sql<{ active: number; mrr: number; pending_cancel: number }[]>`
      select count(*)::int as active,
             coalesce(sum(monthly_cents), 0)::int as mrr,
             count(*) filter (where cancel_at is not null)::int as pending_cancel
      from orders where status = 'active' and duration <> 'eenmalig'`;
    const [orders30] = await sql<{ count: number; amount: number }[]>`
      select count(*)::int as count, coalesce(sum(amount_cents), 0)::int as amount
      from orders where created_at > now() - interval '30 days'`;
    const [intakes30] = await sql<{ count: number }[]>`
      select count(*)::int as count from intakes where created_at > now() - interval '30 days'`;
    const [plans] = await sql<{ ready30: number; failed: number; in_progress: number }[]>`
      select count(*) filter (where status = 'ready' and generated_at > now() - interval '30 days')::int as ready30,
             count(*) filter (where status = 'failed' and attempts >= 5)::int as failed,
             count(*) filter (where status in ('pending', 'generating') or (status = 'failed' and attempts < 5))::int as in_progress
      from plans`;
    const [withdrawals] = await sql<{ open: number }[]>`
      select count(*)::int as open from withdrawals where handled_at is null`;
    const perDay = await sql<{ date: string; count: number }[]>`
      select to_char(d, 'YYYY-MM-DD') as date, count(o.id)::int as count
      from generate_series((now() at time zone 'Europe/Amsterdam')::date - 29,
                           (now() at time zone 'Europe/Amsterdam')::date, interval '1 day') as d
      left join orders o on (o.created_at at time zone 'Europe/Amsterdam')::date = d::date
      group by d order by d`;
    const mix = await sql<{ product: ProductId; duration: DurationId; count: number }[]>`
      select product, duration, count(*)::int as count from orders
      where status = 'active' and duration <> 'eenmalig'
      group by product, duration order by count desc`;
    const recent = await sql<OrderSql[]>`
      select o.*, c.name as customer_name, c.email as customer_email
      from orders o join customers c on c.id = o.customer_id
      order by o.created_at desc limit 8`;
    return {
      activeSubscriptions: subs.active,
      mrrCents: subs.mrr,
      pendingCancellations: subs.pending_cancel,
      newOrders30: orders30.count,
      firstPayments30Cents: orders30.amount,
      checkoutStarts30: intakes30.count,
      plansReady30: plans.ready30,
      plansFailed: plans.failed,
      plansInProgress: plans.in_progress,
      openWithdrawals: withdrawals.open,
      ordersPerDay: perDay,
      productMix: mix,
      recentOrders: recent.map(toOrder),
    };
  },

  async customers(query) {
    const sql = await db();
    const q = query?.trim() ? `%${query.trim().toLowerCase()}%` : null;
    const rows = await sql<CustomerSql[]>`
      select c.*,
        (select count(*)::int from orders o where o.customer_id = c.id and o.status in ('active', 'past_due') and o.duration <> 'eenmalig') as active_subscriptions,
        (select count(*)::int from orders o where o.customer_id = c.id) as orders,
        (select count(*)::int from plans p where p.customer_id = c.id) as plans
      from customers c
      ${q ? sql`where lower(c.email) like ${q} or lower(c.name) like ${q}` : sql``}
      order by c.created_at desc limit 200`;
    return rows.map(toCustomer);
  },

  async customer(id) {
    if (!UUID.test(id)) return null;
    const sql = await db();
    const [c] = await sql<CustomerSql[]>`
      select c.*,
        (select count(*)::int from orders o where o.customer_id = c.id and o.status in ('active', 'past_due') and o.duration <> 'eenmalig') as active_subscriptions,
        (select count(*)::int from orders o where o.customer_id = c.id) as orders,
        (select count(*)::int from plans p where p.customer_id = c.id) as plans
      from customers c where c.id = ${id}`;
    if (!c) return null;
    const orders = await sql<OrderSql[]>`
      select o.*, c.name as customer_name, c.email as customer_email
      from orders o join customers c on c.id = o.customer_id
      where o.customer_id = ${id} order by o.created_at desc`;
    const plans = await sql<PlanSql[]>`
      select p.id, p.order_id, p.customer_id, p.type, p.seq, p.status, p.attempts, p.error, p.created_at,
             p.generated_at, p.emailed_at, c.name as customer_name, c.email as customer_email
      from plans p join customers c on c.id = p.customer_id
      where p.customer_id = ${id} order by p.created_at desc, p.type`;
    const [intake] = await sql<{ data: Intake; consents: Record<string, unknown>; created_at: Date }[]>`
      select data, consents, created_at from intakes where customer_id = ${id} order by created_at desc limit 1`;
    const checkins = await sql<{ data: CheckinData; created_at: Date }[]>`
      select data, created_at from checkins where customer_id = ${id} order by created_at desc`;
    return {
      customer: toCustomer(c),
      orders: orders.map(toOrder),
      plans: plans.map(toPlan),
      intake: intake ? { data: intake.data, consents: intake.consents, createdAt: intake.created_at } : null,
      checkins: checkins.map((r) => ({ data: r.data, createdAt: r.created_at })),
    };
  },

  async orders(status) {
    const sql = await db();
    const rows = await sql<OrderSql[]>`
      select o.*, c.name as customer_name, c.email as customer_email
      from orders o join customers c on c.id = o.customer_id
      ${status ? sql`where o.status = ${status}` : sql``}
      order by o.created_at desc limit 300`;
    return rows.map(toOrder);
  },

  async plans(status) {
    const sql = await db();
    const rows = await sql<PlanSql[]>`
      select p.id, p.order_id, p.customer_id, p.type, p.seq, p.status, p.attempts, p.error, p.created_at,
             p.generated_at, p.emailed_at, c.name as customer_name, c.email as customer_email
      from plans p join customers c on c.id = p.customer_id
      ${status ? sql`where p.status = ${status}` : sql``}
      order by p.created_at desc limit 300`;
    return rows.map(toPlan);
  },

  async plan(id) {
    if (!UUID.test(id)) return null;
    const sql = await db();
    const [r] = await sql<PlanSql[]>`
      select p.*, c.name as customer_name, c.email as customer_email
      from plans p join customers c on c.id = p.customer_id where p.id = ${id}`;
    return r ? { ...toPlan(r), content: r.content ?? null } : null;
  },

  async withdrawals() {
    const sql = await db();
    const rows = await sql<
      { id: string; name: string; email: string; order_reference: string; message: string | null; created_at: Date; handled_at: Date | null }[]
    >`select * from withdrawals order by created_at desc limit 200`;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      orderReference: r.order_reference,
      message: r.message,
      createdAt: r.created_at,
      handledAt: r.handled_at,
    }));
  },
};

/** De databron voor /beheer: de echte database, of voorbeelddata in demo-modus. */
export function adminData(): AdminData {
  return isDemoMode() ? demoAdminData : dbAdminData;
}

/** Is er data om te tonen? (Zonder database werkt alleen de demo-modus.) */
export function adminDataAvailable(): boolean {
  return isDemoMode() || isDatabaseConfigured();
}

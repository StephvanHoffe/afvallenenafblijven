import "server-only";
import { db, isDatabaseConfigured } from "@/lib/db";
import { isDemoMode } from "@/lib/admin/auth";
import { demoAdminData } from "@/lib/admin/demo-data";
import type { DurationId, PlanType, ProductId } from "@/config/pricing";
import type { Campaign } from "@/lib/campaign";
import type { Intake } from "@/lib/intake";
import type { PlanContent } from "@/lib/ai/schemas";
import { checkinWindow, type CheckinWindow } from "@/lib/checkin";
import { subscriptionCheckinOrders, weeklyLogsForCustomer, type CheckinData, type OrderStatus, type PlanStatus } from "@/lib/repo";
import { planApprovalRequired } from "@/lib/settings";
import type { WeeklyAdjustment, WeeklyData } from "@/lib/weekly";

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
  /** De eerste betaling bij Mollie (tr_…). */
  checkoutId: string;
  /** Het abonnement bij Mollie (sub_…), als dat er is. */
  subscriptionId: string | null;
  /** Via welke campagne (utm) en landingspagina de bestelling binnenkwam. */
  campaign: Campaign | null;
  /** Alleen gevuld in de klantdetails: de check-in voor de volgende periode. */
  checkin?: CheckinWindow | null;
  discountCode: string | null;
  refundedCents: number;
  cancelReason: string | null;
  cancelComment: string | null;
}

export interface AdminCustomerRow {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  marketing: boolean;
  mollieCustomerId: string | null;
  activeSubscriptions: number;
  orders: number;
  plans: number;
  locale: string;
  weeklyReminders: boolean;
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
  /** Begin van de periode (kan in de toekomst liggen als het schema al klaarstaat). */
  startsAt: Date;
  generatedAt: Date | null;
  emailedAt: Date | null;
  /** Gepland moment waarop de klant het schema krijgt (willekeurig binnen 2 uur). */
  releaseAfter: Date;
  /** Wanneer de klant het schema kreeg; null = nog niet. */
  releasedAt: Date | null;
  approvedAt: Date | null;
  /** Je eigen beoordeling (1-5), null = nog niet beoordeeld. */
  rating: number | null;
}

export interface AdminPlanDetail extends AdminPlanRow {
  content: PlanContent | null;
  /** Aanwijzing bij het laatst opnieuw maken, en de toelichting bij je beoordeling. */
  adminInstruction: string | null;
  ratingNote: string | null;
  /** Uit de vragenlijst, om het schema te controleren. */
  allergies: Intake["allergies"];
  otherAllergies: string | null;
  dislikes: string | null;
  diet: Intake["diet"] | null;
}

/** Filter in het schema-overzicht: een status, of nog niet bij de klant (gepland / wacht op goedkeuring). */
export type AdminPlanFilter = PlanStatus | "gepland" | "goedkeuren";

/** Een betaling of terugbetaling van een klant (uit de Mollie-webhook en het beheer). */
export interface AdminPaymentRow {
  id: string;
  date: Date;
  kind: "payment" | "refund";
  /** In centen; negatief bij een terugbetaling. */
  amountCents: number;
  /** "maand 2", "eenmalig" of de reden van de terugbetaling. */
  description: string | null;
  orderReference: string | null;
  invoiceId: string | null;
}

export interface AdminCustomerDetail {
  customer: AdminCustomerRow;
  orders: AdminOrderRow[];
  payments: AdminPaymentRow[];
  plans: AdminPlanRow[];
  intake: { data: Intake; consents: Record<string, unknown>; createdAt: Date } | null;
  checkins: { data: CheckinData; forSeq: number | null; createdAt: Date }[];
  weekly: { seq: number; week: number; data: WeeklyData; adjustment: WeeklyAdjustment | null; status: string; createdAt: Date }[];
}

export interface AdminWithdrawalRow {
  id: string;
  name: string;
  email: string;
  orderReference: string;
  message: string | null;
  createdAt: Date;
  handledAt: Date | null;
  /** De bestelling die bij het kenmerk of e-mailadres hoort (null als die niet te vinden is). */
  orderPaidAt: Date | null;
  customerId: string | null;
}

/** Een aanvraag onder de tevredenheidsgarantie (eerste betaling terug). */
export interface AdminGuaranteeRow {
  id: string;
  createdAt: Date;
  handledAt: Date | null;
  reason: string | null;
  order: AdminOrderRow;
  mollieCustomerId: string | null;
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
  /** Klaar, maar nog niet goedgekeurd (alleen relevant als goedkeuring aanstaat). */
  plansAwaitingApproval: number;
  openWithdrawals: number;
  openGuaranteeRequests: number;
  /** Abonnees bij wie de check-in openstaat, en daarvan de verlopen. */
  checkinsOpen: number;
  checkinsOverdue: number;
  ordersPerDay: { date: string; count: number }[];
  productMix: { product: ProductId; duration: DurationId; count: number }[];
  /** Gestarte betalingen en bestellingen per campagne in de laatste 30 dagen. */
  campaigns: AdminCampaignRow[];
  recentOrders: AdminOrderRow[];
}

export interface AdminCampaignRow {
  /** utm_source; null = geen campagne (direct, zoekmachine, ...). */
  source: string | null;
  campaign: string | null;
  started: number;
  orders: number;
  firstPaymentsCents: number;
}

export interface AdminData {
  demo: boolean;
  overview(): Promise<AdminOverview>;
  customers(query?: string, limit?: number): Promise<AdminCustomerRow[]>;
  customer(id: string): Promise<AdminCustomerDetail | null>;
  orders(status?: OrderStatus, limit?: number): Promise<AdminOrderRow[]>;
  plans(filter?: AdminPlanFilter): Promise<AdminPlanRow[]>;
  plan(id: string): Promise<AdminPlanDetail | null>;
  withdrawals(): Promise<AdminWithdrawalRow[]>;
  guaranteeRequests(): Promise<AdminGuaranteeRow[]>;
  /** Staat "schema's eerst goedkeuren" aan? */
  approvalRequired(): Promise<boolean>;
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
  checkout_id: string;
  subscription_id: string | null;
  campaign: Campaign | null;
  discount_code: string | null;
  refunded_cents: number;
  cancel_reason: string | null;
  cancel_comment: string | null;
};

const toOrder = (r: OrderSql): AdminOrderRow => ({
  id: r.id,
  reference: ref(r.id),
  customerId: r.customer_id,
  customerName: r.customer_name,
  customerEmail: r.customer_email,
  product: r.product,
  duration: r.duration,
  campaign: r.campaign ?? null,
  status: r.status,
  cancelAt: r.cancel_at,
  amountCents: r.amount_cents,
  monthlyCents: r.monthly_cents,
  createdAt: r.created_at,
  checkoutId: r.checkout_id,
  subscriptionId: r.subscription_id,
  discountCode: r.discount_code,
  refundedCents: r.refunded_cents ?? 0,
  cancelReason: r.cancel_reason,
  cancelComment: r.cancel_comment,
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
  starts_at: Date;
  generated_at: Date | null;
  emailed_at: Date | null;
  release_after: Date;
  released_at: Date | null;
  approved_at: Date | null;
  rating: number | null;
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
  startsAt: r.starts_at,
  generatedAt: r.generated_at,
  emailedAt: r.emailed_at,
  releaseAfter: r.release_after,
  releasedAt: r.released_at,
  approvedAt: r.approved_at,
  rating: r.rating,
});

type CustomerSql = {
  id: string;
  name: string;
  email: string;
  created_at: Date;
  marketing_consent: boolean;
  mollie_customer_id: string | null;
  active_subscriptions: number;
  orders: number;
  plans: number;
  locale: string;
  weekly_reminders: boolean;
};

const toCustomer = (r: CustomerSql): AdminCustomerRow => ({
  id: r.id,
  name: r.name,
  email: r.email,
  createdAt: r.created_at,
  marketing: r.marketing_consent,
  mollieCustomerId: r.mollie_customer_id,
  activeSubscriptions: r.active_subscriptions,
  orders: r.orders,
  plans: r.plans,
  locale: r.locale ?? "nl",
  weeklyReminders: r.weekly_reminders ?? true,
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
    const [plans] = await sql<{ ready30: number; failed: number; in_progress: number; awaiting: number }[]>`
      select count(*) filter (where status = 'ready' and generated_at > now() - interval '30 days')::int as ready30,
             count(*) filter (where status = 'failed' and attempts >= 5)::int as failed,
             count(*) filter (where status in ('pending', 'generating') or (status = 'failed' and attempts < 5))::int as in_progress,
             count(*) filter (where status = 'ready' and released_at is null and approved_at is null)::int as awaiting
      from plans`;
    const [withdrawals] = await sql<{ open: number; guarantees: number }[]>`
      select (select count(*)::int from withdrawals where handled_at is null) as open,
             (select count(*)::int from guarantee_requests where handled_at is null) as guarantees`;
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
    const campaigns = await sql<{ source: string | null; campaign: string | null; started: number; orders: number; amount: number }[]>`
      select i.campaign->>'source' as source, i.campaign->>'campaign' as campaign,
             count(distinct i.id)::int as started, count(o.id)::int as orders, coalesce(sum(o.amount_cents), 0)::int as amount
      from intakes i left join orders o on o.intake_id = i.id
      where i.created_at > now() - interval '30 days'
      group by 1, 2 order by orders desc, started desc limit 12`;
    const recent = await sql<OrderSql[]>`
      select o.*, c.name as customer_name, c.email as customer_email, i.campaign
      from orders o join customers c on c.id = o.customer_id left join intakes i on i.id = o.intake_id
      order by o.created_at desc limit 8`;
    const now = Date.now();
    const windows = (await subscriptionCheckinOrders()).map((o) =>
      checkinWindow({
        duration: o.duration,
        status: o.status,
        cancelAt: o.cancel_at,
        lastSeq: o.last_seq,
        lastPeriodStart: o.last_start,
        submittedForNext: o.next_checkin,
        now,
      }),
    );
    return {
      checkinsOpen: windows.filter((w) => w?.status === "open" || w?.status === "overdue").length,
      checkinsOverdue: windows.filter((w) => w?.status === "overdue").length,
      activeSubscriptions: subs.active,
      mrrCents: subs.mrr,
      pendingCancellations: subs.pending_cancel,
      newOrders30: orders30.count,
      firstPayments30Cents: orders30.amount,
      checkoutStarts30: intakes30.count,
      plansReady30: plans.ready30,
      plansFailed: plans.failed,
      plansInProgress: plans.in_progress,
      plansAwaitingApproval: plans.awaiting,
      openWithdrawals: withdrawals.open,
      openGuaranteeRequests: withdrawals.guarantees,
      ordersPerDay: perDay,
      productMix: mix,
      campaigns: campaigns.map((r) => ({ source: r.source, campaign: r.campaign, started: r.started, orders: r.orders, firstPaymentsCents: r.amount })),
      recentOrders: recent.map(toOrder),
    };
  },

  async customers(query, limit = 200) {
    const sql = await db();
    const q = query?.trim() ? `%${query.trim().toLowerCase()}%` : null;
    const rows = await sql<CustomerSql[]>`
      select c.*,
        (select count(*)::int from orders o where o.customer_id = c.id and o.status in ('active', 'past_due') and o.duration <> 'eenmalig') as active_subscriptions,
        (select count(*)::int from orders o where o.customer_id = c.id) as orders,
        (select count(*)::int from plans p where p.customer_id = c.id) as plans
      from customers c
      ${q ? sql`where lower(c.email) like ${q} or lower(c.name) like ${q}` : sql``}
      order by c.created_at desc limit ${limit}`;
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
      select o.*, c.name as customer_name, c.email as customer_email, i.campaign
      from orders o join customers c on c.id = o.customer_id left join intakes i on i.id = o.intake_id
      where o.customer_id = ${id} order by o.created_at desc`;
    const plans = await sql<PlanSql[]>`
      select p.id, p.order_id, p.customer_id, p.type, p.seq, p.status, p.attempts, p.error, p.created_at, p.starts_at,
             p.generated_at, p.emailed_at, p.release_after, p.released_at, p.approved_at, p.rating,
             c.name as customer_name, c.email as customer_email
      from plans p join customers c on c.id = p.customer_id
      where p.customer_id = ${id} order by p.created_at desc, p.type`;
    const [intake] = await sql<{ data: Intake; consents: Record<string, unknown>; created_at: Date }[]>`
      select data, consents, created_at from intakes where customer_id = ${id} order by created_at desc limit 1`;
    const checkins = await sql<{ data: CheckinData; order_id: string | null; for_seq: number | null; created_at: Date }[]>`
      select data, order_id, for_seq, created_at from checkins where customer_id = ${id} order by created_at desc`;
    const payments = await sql<
      { id: string; paid_at: Date; kind: "payment" | "refund"; amount_cents: number; description: string | null; invoice_id: string | null; order_id: string | null }[]
    >`
      select id, paid_at, kind, amount_cents, description, invoice_id, order_id
      from payments where customer_id = ${id} order by paid_at desc, id`;
    const now = Date.now();
    return {
      customer: toCustomer(c),
      payments: payments.map((p) => ({
        id: p.id,
        date: p.paid_at,
        kind: p.kind,
        amountCents: p.amount_cents,
        description: p.description,
        orderReference: p.order_id ? p.order_id.slice(0, 8).toUpperCase() : null,
        invoiceId: p.invoice_id,
      })),
      orders: orders.map((o) => {
        const own = plans.filter((p) => p.order_id === o.id);
        const lastSeq = own.reduce((m, p) => Math.max(m, p.seq), 0);
        const lastStart = own
          .filter((p) => p.seq === lastSeq)
          .reduce<Date | null>((min, p) => (!min || p.starts_at < min ? p.starts_at : min), null);
        return {
          ...toOrder(o),
          checkin: checkinWindow({
            duration: o.duration,
            status: o.status,
            cancelAt: o.cancel_at,
            lastSeq,
            lastPeriodStart: lastStart,
            submittedForNext: checkins.some((ci) => ci.order_id === o.id && ci.for_seq === lastSeq + 1),
            now,
          }),
        };
      }),
      plans: plans.map(toPlan),
      intake: intake ? { data: intake.data, consents: intake.consents, createdAt: intake.created_at } : null,
      checkins: checkins.map((r) => ({ data: r.data, forSeq: r.for_seq, createdAt: r.created_at })),
      weekly: (await weeklyLogsForCustomer(id))
        .reverse()
        .map((w) => ({ seq: w.seq, week: w.week, data: w.data, adjustment: w.adjustment, status: w.status, createdAt: w.created_at })),
    };
  },

  async orders(status, limit = 300) {
    const sql = await db();
    const rows = await sql<OrderSql[]>`
      select o.*, c.name as customer_name, c.email as customer_email, i.campaign
      from orders o join customers c on c.id = o.customer_id left join intakes i on i.id = o.intake_id
      ${status ? sql`where o.status = ${status}` : sql``}
      order by o.created_at desc limit ${limit}`;
    return rows.map(toOrder);
  },

  async plans(filter) {
    const sql = await db();
    const where =
      filter === "gepland"
        ? sql`where p.status = 'ready' and p.released_at is null`
        : filter === "goedkeuren"
          ? sql`where p.status = 'ready' and p.released_at is null and p.approved_at is null`
          : filter
            ? sql`where p.status = ${filter}`
            : sql``;
    const rows = await sql<PlanSql[]>`
      select p.id, p.order_id, p.customer_id, p.type, p.seq, p.status, p.attempts, p.error, p.created_at, p.starts_at,
             p.generated_at, p.emailed_at, p.release_after, p.released_at, p.approved_at, p.rating,
             c.name as customer_name, c.email as customer_email
      from plans p join customers c on c.id = p.customer_id
      ${where}
      order by p.created_at desc limit 300`;
    return rows.map(toPlan);
  },

  async plan(id) {
    if (!UUID.test(id)) return null;
    const sql = await db();
    const [r] = await sql<(PlanSql & { intake: Intake | null; admin_instruction: string | null; rating_note: string | null })[]>`
      select p.*, c.name as customer_name, c.email as customer_email, i.data as intake
      from plans p join customers c on c.id = p.customer_id
      join orders o on o.id = p.order_id left join intakes i on i.id = o.intake_id
      where p.id = ${id}`;
    if (!r) return null;
    return {
      ...toPlan(r),
      content: r.content ?? null,
      adminInstruction: r.admin_instruction,
      ratingNote: r.rating_note,
      allergies: r.intake?.allergies ?? [],
      otherAllergies: r.intake?.otherAllergies ?? null,
      dislikes: r.intake?.dislikes ?? null,
      diet: r.intake?.diet ?? null,
    };
  },

  approvalRequired: planApprovalRequired,

  async withdrawals() {
    const sql = await db();
    const rows = await sql<
      {
        id: string;
        name: string;
        email: string;
        order_reference: string;
        message: string | null;
        created_at: Date;
        handled_at: Date | null;
        order_paid_at: Date | null;
        customer_id: string | null;
      }[]
    >`
      select w.*, o.created_at as order_paid_at, o.customer_id
      from withdrawals w
      -- Het bestelnummer (eerste 8 tekens) gaat voor; anders de laatste bestelling met hetzelfde e-mailadres.
      left join lateral (
        select o.created_at, o.customer_id, upper(left(o.id::text, 8)) = upper(trim(w.order_reference)) as exact
        from orders o join customers c on c.id = o.customer_id
        where upper(left(o.id::text, 8)) = upper(trim(w.order_reference)) or lower(c.email) = lower(trim(w.email))
        order by exact desc, o.created_at desc
        limit 1
      ) o on true
      order by w.created_at desc limit 200`;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      orderReference: r.order_reference,
      message: r.message,
      createdAt: r.created_at,
      handledAt: r.handled_at,
      orderPaidAt: r.order_paid_at,
      customerId: r.customer_id,
    }));
  },

  async guaranteeRequests() {
    const sql = await db();
    const rows = await sql<
      (OrderSql & { request_id: string; reason: string | null; requested_at: Date; handled_at: Date | null; mollie_customer_id: string | null })[]
    >`
      select o.*, c.name as customer_name, c.email as customer_email, c.mollie_customer_id, i.campaign,
             g.id as request_id, g.reason, g.created_at as requested_at, g.handled_at
      from guarantee_requests g
      join orders o on o.id = g.order_id
      join customers c on c.id = g.customer_id
      left join intakes i on i.id = o.intake_id
      order by g.created_at desc limit 200`;
    return rows.map((r) => ({
      id: r.request_id,
      createdAt: r.requested_at,
      handledAt: r.handled_at,
      reason: r.reason,
      order: toOrder(r),
      mollieCustomerId: r.mollie_customer_id,
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

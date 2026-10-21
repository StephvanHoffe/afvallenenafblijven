import "server-only";
import type { DurationId, ProductId } from "@/config/pricing";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/admin/auth";
import { demoAnalyticsReport } from "@/lib/admin/demo-reports";
import { checkinWindow } from "@/lib/checkin";
import { subscriptionCheckinOrders } from "@/lib/repo";

/**
 * Cijfers voor /beheer/analyse: omzet, abonnementen, behoud, betrokkenheid en
 * resultaten. Omzet komt uit de vastgelegde betalingen (Stripe-webhook
 * invoice.paid); zonder die betalingen schatten we de omzet uit de abonnementen.
 */

export interface MonthRow {
  month: string;
  revenueCents: number;
  refundsCents: number;
  estimated: boolean;
  mrrCents: number;
  newSubs: number;
  endedSubs: number;
  activeEnd: number;
  oneOffs: number;
}

export interface CohortRow {
  month: string;
  size: number;
  /** Aandeel nog actief na 0, 1, 2, … maanden (null = nog niet zo ver). */
  retention: (number | null)[];
}

export interface AnalyticsReport {
  months: MonthRow[];
  kpis: {
    mrrCents: number;
    activeSubs: number;
    arpuCents: number | null;
    churn30: number | null;
    avgLifetimeMonths: number | null;
    ltvCents: number | null;
    revenue30Cents: number;
    refunds30Cents: number;
    guaranteeRequests30: number;
    newCustomers30: number;
    conversion30: number | null;
    visits30: number;
  };
  cohorts: CohortRow[];
  mix: { product: ProductId; duration: DurationId; count: number }[];
  cancelReasons: { reason: string; count: number }[];
  engagement: {
    checkins90: number;
    checkinsOnTime90: number;
    checkinsOpen: number;
    checkinsOverdue: number;
    weekly30: number;
    weeklyOptOut: number;
    healthConnections: { provider: string; count: number }[];
  };
  results: { customers: number; avgChangeKg: number | null; lostShare: number | null; reachedTarget: number; avgWeeks: number | null };
  plans: {
    generated30: number;
    avgGenerateMinutes: number | null;
    avgAttempts: number | null;
    failed: number;
    avgDeliveryMinutes: number | null;
    avgRating: number | null;
    rated: number;
  };
  emails: { kind: string; sent: number; failed: number; skipped: number }[];
  discounts: { code: string; orders: number; revenueCents: number }[];
  paymentsTracked: boolean;
}

const DAY = 24 * 60 * 60 * 1000;

/** "2026-10" voor een datum, in Nederlandse tijd. */
function monthKey(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" }).slice(0, 7);
}

/** Begin van een maand ("2026-10") als datum (middernacht Nederlandse tijd, ongeveer). */
function monthStart(key: string): Date {
  return new Date(`${key}-01T00:00:00+01:00`);
}

function addMonths(key: string, n: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

type OrderLite = {
  id: string;
  customer_id: string;
  product: ProductId;
  duration: DurationId;
  status: string;
  monthly_cents: number;
  amount_cents: number;
  created_at: Date;
  updated_at: Date;
  ended_at: Date | null;
  refunded_cents: number;
};

/** Einde van een abonnement (of null als het nog loopt). */
function endOf(o: OrderLite): Date | null {
  return o.ended_at ?? (o.status === "canceled" ? o.updated_at : null);
}

function activeAt(o: OrderLite, t: Date): boolean {
  if (o.duration === "eenmalig" || o.created_at > t) return false;
  const end = endOf(o);
  return !end || end > t;
}

export async function analyticsReport(): Promise<AnalyticsReport> {
  if (isDemoMode()) return demoAnalyticsReport();
  const sql = await db();
  const now = new Date();
  const orders = await sql<OrderLite[]>`
    select id, customer_id, product, duration, status, monthly_cents, amount_cents, created_at, updated_at, ended_at, refunded_cents
    from orders order by created_at`;
  const payments = await sql<{ month: string; kind: string; cents: number }[]>`
    select to_char(paid_at at time zone 'Europe/Amsterdam', 'YYYY-MM') as month, kind, sum(amount_cents)::int as cents
    from payments where paid_at > now() - interval '13 months' group by 1, 2`;
  const paymentsTracked = payments.length > 0;

  const current = monthKey(now);
  const keys = Array.from({ length: 12 }, (_, i) => addMonths(current, i - 11));
  const subs = orders.filter((o) => o.duration !== "eenmalig");
  const months: MonthRow[] = keys.map((key) => {
    const start = monthStart(key);
    const end = key === current ? now : monthStart(addMonths(key, 1));
    const created = orders.filter((o) => monthKey(o.created_at) === key);
    let revenue = 0;
    let refunds = 0;
    if (paymentsTracked) {
      revenue = payments.filter((p) => p.month === key && p.kind === "payment").reduce((s, p) => s + p.cents, 0);
      refunds = -payments.filter((p) => p.month === key && p.kind === "refund").reduce((s, p) => s + p.cents, 0);
    } else {
      // Schatting: eerste betalingen plus een maandbedrag voor elk abonnement dat al langer liep.
      revenue =
        created.reduce((s, o) => s + o.amount_cents, 0) +
        subs.filter((o) => o.created_at < start && activeAt(o, start)).reduce((s, o) => s + o.monthly_cents, 0);
      refunds = created.reduce((s, o) => s + o.refunded_cents, 0);
    }
    return {
      month: key,
      revenueCents: revenue,
      refundsCents: refunds,
      estimated: !paymentsTracked,
      mrrCents: subs.filter((o) => activeAt(o, end)).reduce((s, o) => s + o.monthly_cents, 0),
      newSubs: created.filter((o) => o.duration !== "eenmalig").length,
      endedSubs: subs.filter((o) => {
        const e = endOf(o);
        return e !== null && monthKey(e) === key;
      }).length,
      activeEnd: subs.filter((o) => activeAt(o, end)).length,
      oneOffs: created.filter((o) => o.duration === "eenmalig").length,
    };
  });

  const active = subs.filter((o) => activeAt(o, now));
  const mrr = active.reduce((s, o) => s + o.monthly_cents, 0);
  const ago30 = new Date(now.getTime() - 30 * DAY);
  const activeThen = subs.filter((o) => activeAt(o, ago30)).length;
  const ended30 = subs.filter((o) => {
    const e = endOf(o);
    return e !== null && e > ago30 && e <= now && o.created_at <= ago30;
  }).length;
  const churn30 = activeThen > 0 ? ended30 / activeThen : null;
  // Gemiddelde maandelijkse churn over de afgelopen 3 volledige maanden.
  const recent = months.slice(-4, -1);
  const churns = recent.map((m, i) => {
    const prevActive = i === 0 ? months[months.length - 5]?.activeEnd : recent[i - 1].activeEnd;
    return prevActive ? m.endedSubs / prevActive : null;
  });
  const valid = churns.filter((c): c is number => c !== null);
  const avgChurn = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
  const avgLifetimeMonths = avgChurn && avgChurn > 0 ? Math.min(36, 1 / avgChurn) : null;
  const arpu = active.length ? Math.round(mrr / active.length) : null;

  // Cohorten: per maand van de eerste bestelling (abonnementen), het aandeel dat nog actief is.
  const firstByCustomer = new Map<string, OrderLite>();
  for (const o of subs) if (!firstByCustomer.has(o.customer_id)) firstByCustomer.set(o.customer_id, o);
  const cohorts: CohortRow[] = keys.map((key) => {
    const members = [...firstByCustomer.values()].filter((o) => monthKey(o.created_at) === key);
    // Per klant gerekend vanaf de eigen startdatum; alleen klanten die al lang genoeg klant zijn tellen mee.
    const retention = Array.from({ length: 12 }, (_, k) => {
      const at = (o: OrderLite) => new Date(o.created_at.getTime() + k * 30 * DAY + 60_000);
      const eligible = members.filter((o) => at(o) <= now);
      if (eligible.length === 0) return null;
      const alive = eligible.filter((o) => subs.some((s) => s.customer_id === o.customer_id && activeAt(s, at(o)))).length;
      return alive / eligible.length;
    });
    return { month: key, size: members.length, retention };
  });

  const [extra] = await sql<
    { revenue30: number; refunds30: number; guarantees30: number; customers30: number; visits30: number; orders30: number }[]
  >`
    select
      (select coalesce(sum(amount_cents), 0)::int from payments where kind = 'payment' and paid_at > now() - interval '30 days') as revenue30,
      (select coalesce(-sum(amount_cents), 0)::int from payments where kind = 'refund' and paid_at > now() - interval '30 days') as refunds30,
      (select count(*)::int from guarantee_requests where created_at > now() - interval '30 days') as guarantees30,
      (select count(*)::int from customers where created_at > now() - interval '30 days') as customers30,
      (select count(distinct visit_id)::int from funnel_events where created_at > now() - interval '30 days') as visits30,
      (select count(*)::int from orders where created_at > now() - interval '30 days') as orders30`;
  const revenue30 = paymentsTracked
    ? extra.revenue30
    : orders.filter((o) => o.created_at > ago30).reduce((s, o) => s + o.amount_cents, 0) +
      subs.filter((o) => o.created_at <= ago30 && activeAt(o, now)).reduce((s, o) => s + o.monthly_cents, 0);

  const mixMap = new Map<string, { product: ProductId; duration: DurationId; count: number }>();
  for (const o of orders.filter((o) => o.created_at > new Date(now.getTime() - 365 * DAY))) {
    const k = `${o.product}|${o.duration}`;
    const m = mixMap.get(k) ?? { product: o.product, duration: o.duration, count: 0 };
    m.count++;
    mixMap.set(k, m);
  }

  const cancelReasons = await sql<{ reason: string; count: number }[]>`
    select cancel_reason as reason, count(*)::int as count from orders where cancel_reason is not null group by 1 order by 2 desc`;

  const [eng] = await sql<{ checkins90: number; ontime90: number; weekly30: number; optout: number }[]>`
    select
      (select count(*)::int from checkins where created_at > now() - interval '90 days') as checkins90,
      (select count(*)::int from checkins c where c.created_at > now() - interval '90 days' and exists (
        select 1 from plans p where p.order_id = c.order_id and p.seq = c.for_seq and p.starts_at > c.created_at + interval '1 hour')) as ontime90,
      (select count(*)::int from weekly_logs where created_at > now() - interval '30 days') as weekly30,
      (select count(*)::int from customers where weekly_reminders = false) as optout`;
  const health = await sql<{ provider: string; count: number }[]>`
    select provider, count(*)::int as count from health_connections where status = 'active' group by 1 order by 2 desc`;
  const windows = (await subscriptionCheckinOrders()).map((o) =>
    checkinWindow({
      duration: o.duration,
      status: o.status,
      cancelAt: o.cancel_at,
      lastSeq: o.last_seq,
      lastPeriodStart: o.last_start,
      submittedForNext: o.next_checkin,
      now: now.getTime(),
    }),
  );

  const weights = await sql<{ goal: string; start_kg: number; target: number | null; now_kg: number; weeks: number }[]>`
    with w as (
      select customer_id, (data->>'weightKg')::float as kg, created_at from checkins where data ? 'weightKg'
      union all
      select customer_id, (data->>'weightKg')::float, created_at from weekly_logs
    ), latest as (
      select distinct on (customer_id) customer_id, kg, created_at from w order by customer_id, created_at desc
    ), start as (
      select distinct on (customer_id) customer_id, (data->>'weightKg')::float as kg, (data->>'targetWeightKg')::float as target,
        data->>'goal' as goal, created_at
      from intakes where customer_id is not null order by customer_id, created_at asc
    )
    select s.goal, s.kg as start_kg, s.target, l.kg as now_kg, extract(epoch from l.created_at - s.created_at) / 604800 as weeks
    from start s join latest l using (customer_id)`;
  const losing = weights.filter((w) => w.goal === "afvallen" || w.goal === "afvallen_strakker");
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

  const [planStats] = await sql<
    { generated30: number; gen_min: number | null; attempts: number | null; failed: number; delivery_min: number | null; rating: number | null; rated: number }[]
  >`
    select
      count(*) filter (where generated_at > now() - interval '30 days')::int as generated30,
      (avg(extract(epoch from generated_at - started_at) / 60) filter (where generated_at > now() - interval '30 days'))::float as gen_min,
      (avg(attempts) filter (where generated_at > now() - interval '30 days'))::float as attempts,
      count(*) filter (where status = 'failed' and attempts >= 5)::int as failed,
      (avg(extract(epoch from released_at - created_at) / 60) filter (where released_at > now() - interval '30 days'))::float as delivery_min,
      avg(rating)::float as rating, count(rating)::int as rated
    from plans`;

  const emails = await sql<{ kind: string; sent: number; failed: number; skipped: number }[]>`
    select coalesce(kind, 'overig') as kind,
      count(*) filter (where status = 'sent')::int as sent,
      count(*) filter (where status = 'failed')::int as failed,
      count(*) filter (where status = 'skipped')::int as skipped
    from email_log where created_at > now() - interval '30 days' group by 1 order by 2 desc`;
  const discounts = await sql<{ code: string; orders: number; revenue_cents: number }[]>`
    select discount_code as code, count(*)::int as orders, coalesce(sum(amount_cents), 0)::int as revenue_cents
    from orders where discount_code is not null group by 1 order by 2 desc limit 20`;

  return {
    months,
    kpis: {
      mrrCents: mrr,
      activeSubs: active.length,
      arpuCents: arpu,
      churn30,
      avgLifetimeMonths,
      ltvCents: arpu !== null && avgLifetimeMonths !== null ? Math.round(arpu * avgLifetimeMonths) : null,
      revenue30Cents: revenue30,
      refunds30Cents: paymentsTracked ? extra.refunds30 : orders.filter((o) => o.updated_at > ago30).reduce((s, o) => s + o.refunded_cents, 0),
      guaranteeRequests30: extra.guarantees30,
      newCustomers30: extra.customers30,
      conversion30: extra.visits30 > 0 ? extra.orders30 / extra.visits30 : null,
      visits30: extra.visits30,
    },
    cohorts,
    mix: [...mixMap.values()].sort((a, b) => b.count - a.count),
    cancelReasons,
    engagement: {
      checkins90: eng.checkins90,
      checkinsOnTime90: eng.ontime90,
      checkinsOpen: windows.filter((w) => w?.status === "open" || w?.status === "overdue").length,
      checkinsOverdue: windows.filter((w) => w?.status === "overdue").length,
      weekly30: eng.weekly30,
      weeklyOptOut: eng.optout,
      healthConnections: health,
    },
    results: {
      customers: losing.length,
      avgChangeKg: avg(losing.map((w) => w.now_kg - w.start_kg)),
      lostShare: losing.length ? losing.filter((w) => w.now_kg < w.start_kg).length / losing.length : null,
      reachedTarget: losing.filter((w) => w.target !== null && w.now_kg <= w.target).length,
      avgWeeks: avg(losing.map((w) => w.weeks)),
    },
    plans: {
      generated30: planStats.generated30,
      avgGenerateMinutes: planStats.gen_min,
      avgAttempts: planStats.attempts,
      failed: planStats.failed,
      avgDeliveryMinutes: planStats.delivery_min,
      avgRating: planStats.rating,
      rated: planStats.rated,
    },
    emails,
    discounts: discounts.map((d) => ({ code: d.code, orders: d.orders, revenueCents: d.revenue_cents })),
    paymentsTracked,
  };
}

import "server-only";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/admin/auth";
import { demoFunnelReport } from "@/lib/admin/demo-reports";
import type { Campaign } from "@/lib/campaign";
import { QUIZ_STEPS, STAGE_DEFS } from "@/lib/admin/funnel-steps";

export { QUIZ_STEPS, STAGE_DEFS };

/**
 * Funnel voor het beheer, op basis van de anonieme meting (src/lib/track.ts)
 * plus de begonnen betalingen en bestellingen uit de database.
 */

export interface FunnelFilters {
  days: number;
  source?: string | null;
  device?: string | null;
}

export interface FunnelStage {
  key: string;
  label: string;
  hint: string;
  count: number;
}

export interface FunnelBreakdownRow {
  key: string;
  visits: number;
  quiz: number;
  checkout: number;
  orders: number;
}

export interface FunnelStepRow {
  step: string;
  label: string;
  /** Bezoeken die deze vraag te zien kregen. */
  reached: number;
  /** Bezoeken waarvoor dit de laatste vraag was (en die niet hebben betaald). */
  leftHere: number;
}

export interface AbandonedCheckout {
  id: string;
  name: string;
  email: string;
  product: string | null;
  duration: string | null;
  createdAt: Date;
  marketing: boolean;
  remindedAt: Date | null;
  discountCode: string | null;
  campaign: Campaign | null;
}

export interface FunnelReport {
  filters: FunnelFilters;
  stages: FunnelStage[];
  steps: FunnelStepRow[];
  bySource: FunnelBreakdownRow[];
  byDevice: FunnelBreakdownRow[];
  byLanding: FunnelBreakdownRow[];
  byPlan: { product: string; duration: string; checkouts: number; orders: number }[];
  perDay: { date: string; visits: number; orders: number }[];
  /** Weekdag (0 = zondag) en uur in Nederlandse tijd. */
  heatmap: { weekday: number; hour: number; visits: number; orders: number }[];
  medianMinutesToOrder: number | null;
  /** Alle bestellingen in de periode, ook die zonder meting (bijv. met Do Not Track). */
  ordersTotal: number;
  abandoned: AbandonedCheckout[];
  sources: string[];
}

export async function funnelReport(filters: FunnelFilters): Promise<FunnelReport> {
  if (isDemoMode()) return demoFunnelReport(filters);
  const sql = await db();
  const from = new Date(Date.now() - filters.days * 24 * 60 * 60 * 1000);
  const order = QUIZ_STEPS.map((s) => s.step);
  const source = filters.source ?? null;
  const device = filters.device ?? null;

  const raw = sql`
    select visit_id,
      min(created_at) as first_at,
      coalesce((array_agg(path order by created_at) filter (where event = 'page_view'))[1], '(onbekend)') as landing,
      coalesce((array_agg(source order by created_at) filter (where source is not null))[1], '') as source,
      coalesce((array_agg(device order by created_at) filter (where device is not null))[1], 'onbekend') as device,
      bool_or(event = 'quiz_step') as quiz,
      bool_or(event = 'quiz_step' and step <> 'doel') as started,
      bool_or(event = 'quiz_step' and step = 'resultaat') as result,
      bool_or(event = 'quiz_step' and step = 'plan') as plan,
      bool_or(event = 'plan_select') as selected,
      bool_or(event = 'checkout_submit') as submitted,
      bool_or(event = 'checkout_start') as checkout,
      bool_or(event = 'purchase') as purchase,
      min(created_at) filter (where event = 'purchase') as purchase_at,
      max(array_position(${order}::text[], step)) filter (where event = 'quiz_step') as last_step
    from funnel_events
    where created_at >= ${from} and visit_id is not null
    group by visit_id`;
  // Wie een latere stap haalde, telt ook mee bij de eerdere (bijv. een vooraf gekozen plan zonder klik op "kies").
  const visits = sql`
    select visit_id, first_at, landing, source, device, purchase_at, last_step, purchase,
      checkout or purchase as checkout,
      submitted or checkout or purchase as submitted,
      selected or submitted or checkout or purchase as selected,
      plan or selected or submitted or checkout or purchase as plan,
      result or plan or selected or submitted or checkout or purchase as result,
      started or result or plan or selected or submitted or checkout or purchase as started,
      quiz or started or result or plan or selected or submitted or checkout or purchase as quiz
    from (${raw}) r`;
  const where = sql`where (${source}::text is null or source = ${source}) and (${device}::text is null or device = ${device})`;

  const [totals] = await sql<Record<string, number>[]>`
    with v as (${visits}) select
      count(*)::int as visits,
      count(*) filter (where quiz)::int as quiz,
      count(*) filter (where started)::int as started,
      count(*) filter (where result)::int as result,
      count(*) filter (where plan)::int as plan,
      count(*) filter (where selected)::int as selected,
      count(*) filter (where submitted)::int as submitted,
      count(*) filter (where checkout)::int as checkout,
      count(*) filter (where purchase)::int as purchase,
      (percentile_cont(0.5) within group (order by extract(epoch from purchase_at - first_at) / 60)
        filter (where purchase))::float as median_minutes
    from v ${where}`;

  const breakdown = (column: "source" | "device" | "landing") => sql<FunnelBreakdownRow[]>`
    with v as (${visits}) select ${sql(column)} as key,
      count(*)::int as visits, count(*) filter (where quiz)::int as quiz,
      count(*) filter (where checkout)::int as checkout, count(*) filter (where purchase)::int as orders
    from v ${where} group by 1 order by visits desc limit 15`;

  const [bySource, byDevice, byLanding] = await Promise.all([breakdown("source"), breakdown("device"), breakdown("landing")]);

  const stepRows = await sql<{ step: string; reached: number }[]>`
    with v as (${visits}), e as (
      select distinct f.visit_id, f.step from funnel_events f join v on v.visit_id = f.visit_id
      where f.created_at >= ${from} and f.event = 'quiz_step' ${source || device ? sql`and v.visit_id in (select visit_id from v ${where})` : sql``}
    ) select step, count(*)::int as reached from e group by step`;
  const leftRows = await sql<{ last_step: number; n: number }[]>`
    with v as (${visits}) select last_step, count(*)::int as n from v ${where} and quiz and not purchase group by last_step`;
  const steps: FunnelStepRow[] = QUIZ_STEPS.map((s, i) => ({
    step: s.step,
    label: s.label,
    reached: stepRows.find((r) => r.step === s.step)?.reached ?? 0,
    leftHere: leftRows.find((r) => r.last_step === i + 1)?.n ?? 0,
  }));

  const perDayVisits = await sql<{ date: string; n: number }[]>`
    with v as (${visits}) select to_char((first_at at time zone 'Europe/Amsterdam')::date, 'YYYY-MM-DD') as date, count(*)::int as n
    from v ${where} group by 1`;
  const perDayOrders = await sql<{ date: string; n: number }[]>`
    select to_char((created_at at time zone 'Europe/Amsterdam')::date, 'YYYY-MM-DD') as date, count(*)::int as n
    from orders where created_at >= ${from} group by 1`;
  const perDay: FunnelReport["perDay"] = [];
  for (let d = filters.days - 1; d >= 0; d--) {
    const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000).toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
    perDay.push({
      date,
      visits: perDayVisits.find((r) => r.date === date)?.n ?? 0,
      orders: perDayOrders.find((r) => r.date === date)?.n ?? 0,
    });
  }

  const heatVisits = await sql<{ weekday: number; hour: number; n: number }[]>`
    with v as (${visits}) select extract(dow from first_at at time zone 'Europe/Amsterdam')::int as weekday,
      extract(hour from first_at at time zone 'Europe/Amsterdam')::int as hour, count(*)::int as n
    from v ${where} group by 1, 2`;
  const heatOrders = await sql<{ weekday: number; hour: number; n: number }[]>`
    select extract(dow from created_at at time zone 'Europe/Amsterdam')::int as weekday,
      extract(hour from created_at at time zone 'Europe/Amsterdam')::int as hour, count(*)::int as n
    from orders where created_at >= ${from} group by 1, 2`;
  const heatmap: FunnelReport["heatmap"] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    for (let hour = 0; hour < 24; hour++) {
      heatmap.push({
        weekday,
        hour,
        visits: heatVisits.find((r) => r.weekday === weekday && r.hour === hour)?.n ?? 0,
        orders: heatOrders.find((r) => r.weekday === weekday && r.hour === hour)?.n ?? 0,
      });
    }
  }

  const byPlan = await sql<{ product: string; duration: string; checkouts: number; orders: number }[]>`
    with s as (
      select i.data->>'product' as product, coalesce(i.duration, '?') as duration,
        exists (select 1 from orders o where o.intake_id = i.id) as paid
      from intakes i where i.created_at >= ${from}
    ) select product, duration, count(*)::int as checkouts, count(*) filter (where paid)::int as orders
    from s group by 1, 2 order by checkouts desc`;

  const [ordersTotal] = await sql<{ n: number }[]>`select count(*)::int as n from orders where created_at >= ${from}`;

  const abandoned = await sql<
    { id: string; name: string; email: string; product: string | null; duration: string | null; created_at: Date; marketing: boolean | null; reminded_at: Date | null; discount_code: string | null; campaign: Campaign | null }[]
  >`
    select i.id, i.name, i.email, i.data->>'product' as product, i.duration, i.created_at,
      (i.consents->>'marketing')::boolean as marketing, i.reminded_at, i.discount_code, i.campaign
    from intakes i
    where i.created_at >= ${from} and not exists (select 1 from orders o where o.intake_id = i.id)
      and not exists (select 1 from orders o join customers c on c.id = o.customer_id where lower(c.email) = lower(i.email) and o.created_at > i.created_at)
    order by i.created_at desc limit 100`;

  const sources = await sql<{ source: string }[]>`
    select distinct source from funnel_events where created_at >= ${from} and source is not null order by 1 limit 30`;

  return {
    filters,
    stages: STAGE_DEFS.map((s) => ({ ...s, count: Number(totals?.[s.key] ?? 0) })),
    steps,
    bySource,
    byDevice,
    byLanding,
    byPlan,
    perDay,
    heatmap,
    medianMinutesToOrder: totals?.median_minutes ? Math.round(Number(totals.median_minutes)) : null,
    ordersTotal: ordersTotal?.n ?? 0,
    abandoned: abandoned.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      product: r.product,
      duration: r.duration,
      createdAt: r.created_at,
      marketing: r.marketing === true,
      remindedAt: r.reminded_at,
      discountCode: r.discount_code,
      campaign: r.campaign,
    })),
    sources: sources.map((r) => r.source),
  };
}

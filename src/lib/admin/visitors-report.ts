import "server-only";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/admin/auth";
import { CHANNELS, channelFor, type Channel } from "@/lib/admin/channels";
import { demoVisitorsReport } from "@/lib/admin/demo-reports";
import { amsterdamDay, amsterdamHour, amsterdamWeekday } from "@/lib/dates";

/**
 * Cijfers voor /beheer/bezoekers: hoeveel mensen de website bezoeken, wat ze
 * bekijken, hoe lang, waar ze vandaan komen en waar ze de site verlaten. Uit de
 * eigen anonieme meting (zie src/lib/track.ts); zonder cookies, bots tellen niet mee.
 */

export interface VisitorKpis {
  visits: number;
  pageviews: number;
  pagesPerVisit: number | null;
  /** Aandeel bezoeken met één pagina en verder niets (0-1). */
  bounceRate: number | null;
  /** Gemiddelde tijd dat de site zichtbaar openstond, in seconden (alleen bezoeken met een meting). */
  avgSeconds: number | null;
  /** Aandeel bezoeken dat de vragenlijst opende. */
  startShare: number | null;
  /** Aandeel bezoeken dat betaalde. */
  conversion: number | null;
  mobileShare: number | null;
}

export interface VisitorSegmentRow {
  key: string;
  visits: number;
  bounces: number;
  toStart: number;
  purchases: number;
  avgSeconds: number | null;
}

export interface VisitorPageRow {
  path: string;
  views: number;
  visits: number;
  /** Gemiddelde tijd op deze pagina per bezoek, in seconden. */
  avgSeconds: number | null;
  entries: number;
  exits: number;
}

export interface VisitorsReport {
  days: number;
  kpis: VisitorKpis;
  previous: VisitorKpis;
  perDay: { date: string; visits: number; pageviews: number }[];
  pages: VisitorPageRow[];
  entries: VisitorSegmentRow[];
  channels: (VisitorSegmentRow & { key: Channel })[];
  referrers: { host: string; visits: number; purchases: number }[];
  campaigns: { campaign: string; source: string | null; visits: number; purchases: number }[];
  devices: VisitorSegmentRow[];
  languages: VisitorSegmentRow[];
  /** Weekdag (0 = zondag) × uur in Nederlandse tijd; "orders" = bezoeken die betaalden. */
  heatmap: { weekday: number; hour: number; visits: number; orders: number }[];
  live: { visitors: number; pages: { path: string; visitors: number }[] };
}

interface VisitRow {
  visit_id: string;
  first_at: Date;
  pageviews: number;
  interacted: boolean;
  purchase: boolean;
  reached_start: boolean;
  engaged: number;
  timed: boolean;
  landing: string | null;
  exit_page: string | null;
  utm: string | null;
  referrer: string | null;
  campaign: string | null;
  device: string | null;
  locale: string | null;
}

const DAY = 24 * 60 * 60 * 1000;
const ratio = (n: number, d: number) => (d > 0 ? n / d : null);

/** Eén pagina bekeken en verder niets gedaan. */
function isBounce(v: VisitRow): boolean {
  return v.pageviews <= 1 && !v.interacted;
}

function kpisOf(rows: VisitRow[]): VisitorKpis {
  const visits = rows.length;
  const pageviews = rows.reduce((s, v) => s + v.pageviews, 0);
  const timed = rows.filter((v) => v.timed);
  return {
    visits,
    pageviews,
    pagesPerVisit: ratio(pageviews, visits),
    bounceRate: ratio(rows.filter(isBounce).length, visits),
    avgSeconds: timed.length ? timed.reduce((s, v) => s + v.engaged, 0) / timed.length : null,
    startShare: ratio(rows.filter((v) => v.reached_start).length, visits),
    conversion: ratio(rows.filter((v) => v.purchase).length, visits),
    mobileShare: ratio(rows.filter((v) => v.device === "mobiel").length, visits),
  };
}

function segment(rows: VisitRow[], keyOf: (v: VisitRow) => string, limit = 20): VisitorSegmentRow[] {
  const map = new Map<string, VisitRow[]>();
  for (const v of rows) {
    const k = keyOf(v);
    map.set(k, [...(map.get(k) ?? []), v]);
  }
  return [...map.entries()]
    .map(([key, list]) => {
      const timed = list.filter((v) => v.timed);
      return {
        key,
        visits: list.length,
        bounces: list.filter(isBounce).length,
        toStart: list.filter((v) => v.reached_start).length,
        purchases: list.filter((v) => v.purchase).length,
        avgSeconds: timed.length ? timed.reduce((s, v) => s + v.engaged, 0) / timed.length : null,
      };
    })
    .sort((a, b) => b.visits - a.visits)
    .slice(0, limit);
}

export async function visitorsReport({ days }: { days: number }): Promise<VisitorsReport> {
  if (isDemoMode()) return demoVisitorsReport(days);
  const sql = await db();
  const now = new Date();
  const from = new Date(now.getTime() - days * DAY);
  const prevFrom = new Date(from.getTime() - days * DAY);

  const visitRows = (start: Date, end: Date) => sql<VisitRow[]>`
    select visit_id,
      min(created_at) as first_at,
      count(*) filter (where event = 'page_view')::int as pageviews,
      bool_or(event in ('quiz_step', 'plan_select', 'discount_applied', 'checkout_submit', 'checkout_start', 'purchase')) as interacted,
      bool_or(event = 'purchase') as purchase,
      bool_or(event = 'quiz_step' or (event = 'page_view' and path ~ '^/(en/)?start')) as reached_start,
      coalesce(sum(seconds) filter (where event = 'page_leave'), 0)::int as engaged,
      bool_or(event = 'page_leave') as timed,
      (array_agg(path order by created_at) filter (where event = 'page_view'))[1] as landing,
      (array_agg(path order by created_at desc) filter (where event = 'page_view'))[1] as exit_page,
      (array_agg(source order by created_at) filter (where source is not null))[1] as utm,
      (array_agg(referrer order by created_at) filter (where referrer is not null))[1] as referrer,
      (array_agg(campaign order by created_at) filter (where campaign is not null))[1] as campaign,
      (array_agg(device order by created_at) filter (where device is not null))[1] as device,
      (array_agg(locale order by created_at) filter (where locale is not null))[1] as locale
    from funnel_events
    where created_at >= ${start} and created_at < ${end} and visit_id is not null
    group by visit_id
    having count(*) filter (where event = 'page_view') > 0`;

  const [rows, prevRows, pageRows, live, livePages] = await Promise.all([
    visitRows(from, now),
    visitRows(prevFrom, from),
    sql<{ path: string; views: number; visits: number; seconds: number | null; timed: number }[]>`
      select path,
        count(*) filter (where event = 'page_view')::int as views,
        count(distinct visit_id) filter (where event = 'page_view')::int as visits,
        sum(seconds) filter (where event = 'page_leave')::int as seconds,
        count(distinct visit_id) filter (where event = 'page_leave')::int as timed
      from funnel_events
      where created_at >= ${from} and event in ('page_view', 'page_leave') and path is not null
      group by path order by views desc limit 40`,
    sql<{ n: number }[]>`select count(distinct visit_id)::int as n from funnel_events where created_at > now() - interval '30 minutes'`,
    sql<{ path: string; n: number }[]>`
      select path, count(*)::int as n from (
        select distinct on (visit_id) visit_id, path from funnel_events
        where created_at > now() - interval '30 minutes' and event = 'page_view' and visit_id is not null
        order by visit_id, created_at desc
      ) t group by path order by n desc limit 5`,
  ]);

  const entries = new Map<string, number>();
  const exits = new Map<string, number>();
  for (const v of rows) {
    if (v.landing) entries.set(v.landing, (entries.get(v.landing) ?? 0) + 1);
    if (v.exit_page) exits.set(v.exit_page, (exits.get(v.exit_page) ?? 0) + 1);
  }

  const byDay = new Map<string, { visits: number; pageviews: number }>();
  for (const v of rows) {
    const day = amsterdamDay(v.first_at);
    const cur = byDay.get(day) ?? { visits: 0, pageviews: 0 };
    byDay.set(day, { visits: cur.visits + 1, pageviews: cur.pageviews + v.pageviews });
  }
  const perDay: VisitorsReport["perDay"] = [];
  for (let d = days - 1; d >= 0; d--) {
    const date = amsterdamDay(new Date(now.getTime() - d * DAY));
    perDay.push({ date, ...(byDay.get(date) ?? { visits: 0, pageviews: 0 }) });
  }

  const heatmap: VisitorsReport["heatmap"] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    for (let hour = 0; hour < 24; hour++) heatmap.push({ weekday, hour, visits: 0, orders: 0 });
  }
  for (const v of rows) {
    const cell = heatmap[amsterdamWeekday(v.first_at) * 24 + amsterdamHour(v.first_at)];
    cell.visits++;
    if (v.purchase) cell.orders++;
  }

  const channelRows = segment(rows, (v) => channelFor(v.utm, v.referrer));
  const referrers = new Map<string, { visits: number; purchases: number }>();
  for (const v of rows.filter((r) => r.referrer)) {
    const cur = referrers.get(v.referrer!) ?? { visits: 0, purchases: 0 };
    referrers.set(v.referrer!, { visits: cur.visits + 1, purchases: cur.purchases + (v.purchase ? 1 : 0) });
  }
  const campaigns = new Map<string, { source: string | null; visits: number; purchases: number }>();
  for (const v of rows.filter((r) => r.campaign || r.utm)) {
    const key = v.campaign ?? "(zonder naam)";
    const cur = campaigns.get(key) ?? { source: v.utm, visits: 0, purchases: 0 };
    campaigns.set(key, { source: cur.source ?? v.utm, visits: cur.visits + 1, purchases: cur.purchases + (v.purchase ? 1 : 0) });
  }

  return {
    days,
    kpis: kpisOf(rows),
    previous: kpisOf(prevRows),
    perDay,
    pages: pageRows.map((p) => ({
      path: p.path,
      views: p.views,
      visits: p.visits,
      avgSeconds: p.timed > 0 && p.seconds !== null ? p.seconds / p.timed : null,
      entries: entries.get(p.path) ?? 0,
      exits: exits.get(p.path) ?? 0,
    })),
    entries: segment(rows, (v) => v.landing ?? "(onbekend)", 15),
    channels: CHANNELS.map(
      (key) => channelRows.find((c) => c.key === key) ?? { key, visits: 0, bounces: 0, toStart: 0, purchases: 0, avgSeconds: null },
    ).map((c) => ({ ...c, key: c.key as Channel })),
    referrers: [...referrers.entries()].map(([host, v]) => ({ host, ...v })).sort((a, b) => b.visits - a.visits).slice(0, 15),
    campaigns: [...campaigns.entries()].map(([campaign, v]) => ({ campaign, ...v })).sort((a, b) => b.visits - a.visits).slice(0, 15),
    devices: segment(rows, (v) => v.device ?? "onbekend"),
    languages: segment(rows, (v) => (v.locale === "en" ? "en" : "nl")),
    heatmap,
    live: { visitors: live[0]?.n ?? 0, pages: livePages.map((p) => ({ path: p.path, visitors: p.n })) },
  };
}

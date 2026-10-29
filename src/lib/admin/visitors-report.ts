import "server-only";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/admin/auth";
import { CHANNELS, channelFor, type Channel } from "@/lib/admin/channels";
import { demoVisitorsReport } from "@/lib/admin/demo-reports";
import { amsterdamDay, amsterdamHour, amsterdamWeekday } from "@/lib/dates";

/**
 * Cijfers voor /beheer/bezoekers: hoeveel mensen de website bezoeken, wat ze
 * bekijken, hoe lang en hoe ver ze scrollen, welke route ze nemen, waar ze
 * vandaan komen (kanaal, website, campagne, plaats) en waar ze de site verlaten.
 * Uit de eigen anonieme meting (zie src/lib/track.ts); zonder cookies, bots tellen niet mee.
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
  /** Gemiddeld hoe ver bezoekers op deze pagina scrolden (0-100%). */
  scroll: number | null;
  /** Aandeel bezoeken met een scrollmeting dat (bijna) onderaan kwam (90% of meer). */
  bottomShare: number | null;
  entries: number;
  exits: number;
}

export interface VisitorPathRow {
  /** De eerste pagina's van het bezoek, zonder herhalingen direct na elkaar. */
  steps: string[];
  /** Het bezoek ging daarna nog verder. */
  more: boolean;
  visits: number;
  toStart: number;
  purchases: number;
}

export interface VisitorDurationRow {
  label: string;
  visits: number;
  toStart: number;
  purchases: number;
}

export interface VisitorCampaignRow {
  campaign: string;
  source: string | null;
  medium: string | null;
  /** utm_content: meestal de advertentie of variant. */
  content: string | null;
  visits: number;
  toStart: number;
  purchases: number;
  avgSeconds: number | null;
}

export interface RecentVisit {
  startedAt: Date;
  channel: Channel;
  referrer: string | null;
  source: string | null;
  campaign: string | null;
  device: string | null;
  locale: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  /** Totale tijd dat de site zichtbaar openstond (null zonder meting). */
  seconds: number | null;
  reachedStart: boolean;
  purchase: boolean;
  pages: { path: string; seconds: number | null; scroll: number | null }[];
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
  campaigns: VisitorCampaignRow[];
  /** Per land (ISO-code, "" = onbekend), per regio ("NL-NH") en per stad ("Amsterdam|NL"). */
  countries: VisitorSegmentRow[];
  regions: VisitorSegmentRow[];
  cities: VisitorSegmentRow[];
  /** Hoe lang bezoeken duurden (alleen bezoeken met een tijdmeting). */
  durations: VisitorDurationRow[];
  paths: VisitorPathRow[];
  recent: RecentVisit[];
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
  medium: string | null;
  content: string | null;
  device: string | null;
  locale: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  page_seq: string[] | null;
}

const DURATION_BUCKETS: { label: string; below: number }[] = [
  { label: "Minder dan 10 seconden", below: 10 },
  { label: "10 tot 30 seconden", below: 30 },
  { label: "30 seconden tot 1 minuut", below: 60 },
  { label: "1 tot 3 minuten", below: 180 },
  { label: "3 tot 10 minuten", below: 600 },
  { label: "Langer dan 10 minuten", below: Infinity },
];

/** Zoveel pagina's van een route tonen we; daarna "…". */
const PATH_STEPS = 4;

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
      (array_agg(medium order by created_at) filter (where medium is not null))[1] as medium,
      (array_agg(content order by created_at) filter (where content is not null))[1] as content,
      (array_agg(device order by created_at) filter (where device is not null))[1] as device,
      (array_agg(locale order by created_at) filter (where locale is not null))[1] as locale,
      (array_agg(country order by created_at) filter (where country is not null))[1] as country,
      (array_agg(region order by created_at) filter (where region is not null))[1] as region,
      (array_agg(city order by created_at) filter (where city is not null))[1] as city,
      array_agg(path order by created_at) filter (where event = 'page_view') as page_seq
    from funnel_events
    where created_at >= ${start} and created_at < ${end} and visit_id is not null
    group by visit_id
    having count(*) filter (where event = 'page_view') > 0`;

  const [rows, prevRows, pageRows, scrollRows, recentEvents, live, livePages] = await Promise.all([
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
    // Per bezoek en pagina de verste scrollpositie, daarna het gemiddelde per pagina.
    sql<{ path: string; scroll: number; measured: number; bottom: number }[]>`
      select path, avg(s)::float as scroll, count(*)::int as measured, count(*) filter (where s >= 90)::int as bottom
      from (
        select visit_id, path, max(scroll) as s from funnel_events
        where created_at >= ${from} and event = 'page_leave' and scroll is not null and path is not null
        group by visit_id, path
      ) t group by path`,
    // De pagina's (met tijd en scroll) van de 30 laatste bezoeken.
    sql<{ visit_id: string; event: string; path: string | null; seconds: number | null; scroll: number | null }[]>`
      with latest as (
        select visit_id, min(created_at) as first_at from funnel_events
        where created_at >= ${from} and visit_id is not null
        group by visit_id having count(*) filter (where event = 'page_view') > 0
        order by first_at desc limit 30
      )
      select e.visit_id, e.event, e.path, e.seconds, e.scroll from funnel_events e join latest l on l.visit_id = e.visit_id
      where e.event in ('page_view', 'page_leave') and e.created_at >= ${from}
      order by e.created_at, e.id`,
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
  const campaigns = new Map<string, VisitRow[]>();
  for (const v of rows.filter((r) => r.campaign || r.utm)) {
    const key = JSON.stringify([v.campaign, v.utm, v.medium, v.content]);
    campaigns.set(key, [...(campaigns.get(key) ?? []), v]);
  }
  const campaignRows: VisitorCampaignRow[] = [...campaigns.values()]
    .map((list) => {
      const timed = list.filter((v) => v.timed);
      return {
        campaign: list[0].campaign ?? "(zonder naam)",
        source: list[0].utm,
        medium: list[0].medium,
        content: list[0].content,
        visits: list.length,
        toStart: list.filter((v) => v.reached_start).length,
        purchases: list.filter((v) => v.purchase).length,
        avgSeconds: timed.length ? timed.reduce((s, v) => s + v.engaged, 0) / timed.length : null,
      };
    })
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 20);

  const timedRows = rows.filter((v) => v.timed);
  const durations: VisitorDurationRow[] = DURATION_BUCKETS.map((b, i) => {
    const list = timedRows.filter((v) => v.engaged < b.below && (i === 0 || v.engaged >= DURATION_BUCKETS[i - 1].below));
    return { label: b.label, visits: list.length, toStart: list.filter((v) => v.reached_start).length, purchases: list.filter((v) => v.purchase).length };
  });

  const pathMap = new Map<string, VisitorPathRow>();
  for (const v of rows) {
    const steps = (v.page_seq ?? []).filter((p, i, all) => p !== all[i - 1]);
    if (!steps.length) continue;
    const row = { steps: steps.slice(0, PATH_STEPS), more: steps.length > PATH_STEPS };
    const key = JSON.stringify(row);
    const cur = pathMap.get(key) ?? { ...row, visits: 0, toStart: 0, purchases: 0 };
    pathMap.set(key, { ...cur, visits: cur.visits + 1, toStart: cur.toStart + (v.reached_start ? 1 : 0), purchases: cur.purchases + (v.purchase ? 1 : 0) });
  }

  const scrollBy = new Map(scrollRows.map((s) => [s.path, s]));
  const visitBy = new Map(rows.map((v) => [v.visit_id, v]));
  const recentPages = new Map<string, RecentVisit["pages"]>();
  for (const e of recentEvents) {
    const pages = recentPages.get(e.visit_id) ?? [];
    if (e.event === "page_view" && e.path) pages.push({ path: e.path, seconds: null, scroll: null });
    else if (e.event === "page_leave") {
      // Bij de laatste weergave van dezelfde pagina (een tabblad kan meer keren verborgen worden).
      const view = [...pages].reverse().find((p) => p.path === e.path);
      if (view) {
        view.seconds = (view.seconds ?? 0) + (e.seconds ?? 0);
        view.scroll = e.scroll === null ? view.scroll : Math.max(view.scroll ?? 0, e.scroll);
      }
    }
    recentPages.set(e.visit_id, pages);
  }
  const recent: RecentVisit[] = [...recentPages.entries()]
    .flatMap(([id, pages]) => {
      const v = visitBy.get(id);
      return v
        ? [
            {
              startedAt: v.first_at,
              channel: channelFor(v.utm, v.referrer),
              referrer: v.referrer,
              source: v.utm,
              campaign: v.campaign,
              device: v.device,
              locale: v.locale,
              country: v.country,
              region: v.region,
              city: v.city,
              seconds: v.timed ? v.engaged : null,
              reachedStart: v.reached_start,
              purchase: v.purchase,
              pages,
            },
          ]
        : [];
    })
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

  return {
    days,
    kpis: kpisOf(rows),
    previous: kpisOf(prevRows),
    perDay,
    pages: pageRows.map((p) => {
      const s = scrollBy.get(p.path);
      return {
        path: p.path,
        views: p.views,
        visits: p.visits,
        avgSeconds: p.timed > 0 && p.seconds !== null ? p.seconds / p.timed : null,
        scroll: s ? s.scroll : null,
        bottomShare: s && s.measured > 0 ? s.bottom / s.measured : null,
        entries: entries.get(p.path) ?? 0,
        exits: exits.get(p.path) ?? 0,
      };
    }),
    entries: segment(rows, (v) => v.landing ?? "(onbekend)", 15),
    channels: CHANNELS.map(
      (key) => channelRows.find((c) => c.key === key) ?? { key, visits: 0, bounces: 0, toStart: 0, purchases: 0, avgSeconds: null },
    ).map((c) => ({ ...c, key: c.key as Channel })),
    referrers: [...referrers.entries()].map(([host, v]) => ({ host, ...v })).sort((a, b) => b.visits - a.visits).slice(0, 15),
    campaigns: campaignRows,
    countries: segment(rows, (v) => v.country ?? ""),
    regions: segment(
      rows.filter((v) => v.country && v.region),
      (v) => `${v.country}-${v.region}`,
    ),
    cities: segment(
      rows.filter((v) => v.city),
      (v) => `${v.city}|${v.country ?? ""}`,
    ),
    durations,
    paths: [...pathMap.values()].sort((a, b) => b.visits - a.visits).slice(0, 12),
    recent,
    devices: segment(rows, (v) => v.device ?? "onbekend"),
    languages: segment(rows, (v) => (v.locale === "en" ? "en" : "nl")),
    heatmap,
    live: { visitors: live[0]?.n ?? 0, pages: livePages.map((p) => ({ path: p.path, visitors: p.n })) },
  };
}

import "server-only";
import type { DurationId, ProductId } from "@/config/pricing";
import { demoAdminData } from "@/lib/admin/demo-data";
import { QUIZ_STEPS, STAGE_DEFS } from "@/lib/admin/funnel-steps";
import type { AbandonedCheckout, FunnelBreakdownRow, FunnelFilters, FunnelReport } from "@/lib/admin/funnel-report";
import type { AnalyticsReport, CohortRow, MonthRow } from "@/lib/admin/analytics-report";
import type { AdminLogRow, CustomerJourney, EmailLogRow, FeedbackReport, NoteRow } from "@/lib/admin/insights";
import type { DiscountCodeRow } from "@/lib/discounts-server";
import type { CheckinData } from "@/lib/checkin";

/**
 * Voorbeeldcijfers voor de demo van het beheer (BEHEER_DEMO=1): funnel,
 * analyse, feedback, e-mails, logboek en kortingscodes. Vast gegenereerd, zodat
 * de demo er steeds hetzelfde uitziet; alle personen zijn fictief.
 */

const TODAY = new Date("2027-02-15T10:00:00+01:00").getTime();
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

/** Eenvoudige, vaste pseudo-willekeur. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Funnel ----------

const STAGES_30 = { visits: 2150, quiz: 742, started: 611, result: 402, plan: 371, selected: 214, submitted: 92, checkout: 81, purchase: 34 };
const SOURCES: FunnelBreakdownRow[] = [
  { key: "meta", visits: 980, quiz: 380, checkout: 41, orders: 17 },
  { key: "google", visits: 560, quiz: 190, checkout: 22, orders: 9 },
  { key: "", visits: 300, quiz: 80, checkout: 10, orders: 5 },
  { key: "tiktok", visits: 310, quiz: 92, checkout: 8, orders: 3 },
];
const DEVICES: FunnelBreakdownRow[] = [
  { key: "mobiel", visits: 1520, quiz: 520, checkout: 52, orders: 20 },
  { key: "desktop", visits: 510, quiz: 190, checkout: 25, orders: 12 },
  { key: "tablet", visits: 120, quiz: 32, checkout: 4, orders: 2 },
];
const LANDINGS: FunnelBreakdownRow[] = [
  { key: "/lp", visits: 760, quiz: 318, checkout: 33, orders: 15 },
  { key: "/lp/voeding", visits: 420, quiz: 162, checkout: 17, orders: 7 },
  { key: "/", visits: 390, quiz: 98, checkout: 12, orders: 6 },
  { key: "/lp/training", visits: 230, quiz: 71, checkout: 7, orders: 2 },
  { key: "/voedingsschema", visits: 140, quiz: 39, checkout: 5, orders: 2 },
  { key: "/prijzen", visits: 105, quiz: 37, checkout: 5, orders: 2 },
  { key: "/bundel", visits: 60, quiz: 13, checkout: 2, orders: 0 },
  { key: "/en/lp", visits: 45, quiz: 4, checkout: 0, orders: 0 },
];
const STEP_REACHED = [742, 611, 598, 571, 402 + 120, 548, 470, 455, 268, 262, 431, 402, 371];
const STEP_LEFT = [131, 13, 27, 23, 26, 23, 15, 14, 6, 7, 29, 31, 342];

export function demoFunnelReport(filters: FunnelFilters): FunnelReport {
  const scale = filters.days / 30;
  const pick = filters.source !== undefined && filters.source !== null ? SOURCES.find((s) => s.key === filters.source) : null;
  const dev = filters.device ? DEVICES.find((d) => d.key === filters.device) : null;
  const share = (pick ? pick.visits / STAGES_30.visits : 1) * (dev ? dev.visits / STAGES_30.visits : 1);
  const n = (v: number) => Math.round(v * scale * share);
  const r = rng(7 + filters.days);
  const perDay: FunnelReport["perDay"] = [];
  for (let d = filters.days - 1; d >= 0; d--) {
    const date = new Date(TODAY - d * DAY);
    const weekend = [0, 6].includes(date.getDay()) ? 1.25 : 1;
    perDay.push({
      date: date.toISOString().slice(0, 10),
      visits: Math.round((55 + r() * 35) * weekend * share),
      orders: Math.round((r() * 2.4 * weekend) * share),
    });
  }
  const heatmap: FunnelReport["heatmap"] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    for (let hour = 0; hour < 24; hour++) {
      const evening = hour >= 19 && hour <= 22 ? 2.6 : hour >= 12 && hour <= 13 ? 1.6 : hour >= 7 && hour <= 23 ? 1 : 0.15;
      const day = weekday === 0 ? 1.4 : weekday === 1 ? 1.25 : weekday === 6 ? 0.8 : 1;
      heatmap.push({
        weekday,
        hour,
        visits: Math.round(evening * day * (8 + r() * 6) * scale * share),
        orders: r() < 0.08 * evening * day ? Math.max(1, Math.round(r() * 2 * scale)) : 0,
      });
    }
  }
  const abandoned: AbandonedCheckout[] = [
    ["Merel", "merel.visser@voorbeeld.nl", "bundel", "3m", 3, true, null, "meta"],
    ["Jesse", "jesse.b@voorbeeld.nl", "voeding", "1m", 9, false, null, "google"],
    ["Hanna", "hanna@voorbeeld.nl", "bundel", "6m", 22, true, 19, "meta"],
    ["Pieter", "pieter.dk@voorbeeld.nl", "training", "3m", 30, false, null, null],
    ["Yara", "yara.s@voorbeeld.nl", "voeding", "3m", 52, true, 49, "tiktok"],
    ["Kees", "kees@voorbeeld.nl", "bundel", "12m", 75, true, 72, "meta"],
    ["Lieke", "lieke.m@voorbeeld.nl", "voeding", "eenmalig", 101, false, null, "google"],
  ].map(([name, email, product, duration, hoursAgo, marketing, remindedAgo, source], i) => ({
    id: `0000000${i}-0000-4000-8000-00000000abcd`,
    name: name as string,
    email: email as string,
    product: product as string,
    duration: duration as string,
    createdAt: new Date(TODAY - (hoursAgo as number) * HOUR),
    marketing: marketing as boolean,
    remindedAt: remindedAgo ? new Date(TODAY - (remindedAgo as number) * HOUR) : null,
    discountCode: i === 2 ? "WELKOM10" : null,
    campaign: source ? { source: source as string, campaign: "lancering-januari" } : null,
  }));
  return {
    filters,
    stages: STAGE_DEFS.map((s) => ({ ...s, count: n(STAGES_30[s.key as keyof typeof STAGES_30]) })),
    steps: QUIZ_STEPS.map((s, i) => ({ step: s.step, label: s.label, reached: n(STEP_REACHED[i]), leftHere: n(STEP_LEFT[i]) })),
    bySource: (pick ? [pick] : SOURCES).map((row) => ({ ...row, visits: Math.round(row.visits * scale), quiz: Math.round(row.quiz * scale), checkout: Math.round(row.checkout * scale), orders: Math.round(row.orders * scale) })),
    byDevice: (dev ? [dev] : DEVICES).map((row) => ({ ...row, visits: n(row.visits) / (dev ? share : 1), quiz: Math.round(row.quiz * scale), checkout: Math.round(row.checkout * scale), orders: Math.round(row.orders * scale) })),
    byLanding: LANDINGS.map((row) => ({ ...row, visits: n(row.visits), quiz: n(row.quiz), checkout: n(row.checkout), orders: n(row.orders) })),
    byPlan: [
      { product: "bundel", duration: "3m", checkouts: n(28), orders: n(13) },
      { product: "voeding", duration: "3m", checkouts: n(16), orders: n(7) },
      { product: "bundel", duration: "6m", checkouts: n(11), orders: n(5) },
      { product: "voeding", duration: "1m", checkouts: n(10), orders: n(3) },
      { product: "training", duration: "3m", checkouts: n(7), orders: n(3) },
      { product: "bundel", duration: "12m", checkouts: n(5), orders: n(2) },
      { product: "voeding", duration: "eenmalig", checkouts: n(4), orders: n(1) },
    ],
    perDay,
    heatmap,
    medianMinutesToOrder: 18,
    ordersTotal: Math.round(36 * scale * share),
    abandoned,
    sources: ["google", "meta", "tiktok"],
  };
}

// ---------- Analyse ----------

export function demoAnalyticsReport(): AnalyticsReport {
  const monthsBack = 12;
  const start = new Date(TODAY);
  const keys = Array.from({ length: monthsBack }, (_, i) => {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - (monthsBack - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
  let active = 0;
  const months: MonthRow[] = keys.map((month, i) => {
    const newSubs = Math.round(6 + i * 3.4 + (i % 3) * 2);
    const endedSubs = i < 2 ? 0 : Math.round(active * (0.045 + (i % 4) * 0.008));
    active = active + newSubs - endedSubs;
    const mrr = active * 1495;
    return {
      month,
      revenueCents: Math.round(mrr * 0.97 + newSubs * 160 + (i % 2) * 2900),
      refundsCents: i > 3 ? (i % 3) * 1795 : 0,
      estimated: false,
      mrrCents: mrr,
      newSubs,
      endedSubs,
      activeEnd: active,
      oneOffs: Math.round(1 + i * 0.6),
    };
  });
  const retentionCurve = [1, 0.95, 0.9, 0.84, 0.77, 0.73, 0.69, 0.66, 0.62, 0.6, 0.57, 0.55];
  const cohorts: CohortRow[] = keys.map((month, i) => ({
    month,
    size: Math.round(6 + i * 3.4 + (i % 3) * 2),
    retention: retentionCurve.map((v, k) => (k > monthsBack - 1 - i ? null : Math.max(0, Math.min(1, v - ((i * 7 + k * 3) % 5) / 100)))),
  }));
  const last = months[months.length - 1];
  return {
    months,
    kpis: {
      mrrCents: last.mrrCents,
      activeSubs: last.activeEnd,
      arpuCents: 1495,
      churn30: 0.061,
      avgLifetimeMonths: 16.4,
      ltvCents: Math.round(1495 * 16.4),
      revenue30Cents: last.revenueCents,
      refunds30Cents: 7180,
      guaranteeRequests30: 4,
      newCustomers30: 36,
      conversion30: 34 / 2150,
      visits30: 2150,
    },
    cohorts,
    mix: (
      [
        ["bundel", "3m", 74],
        ["voeding", "3m", 41],
        ["bundel", "6m", 33],
        ["voeding", "1m", 28],
        ["training", "3m", 19],
        ["bundel", "12m", 14],
        ["bundel", "1m", 12],
        ["voeding", "eenmalig", 9],
        ["training", "1m", 6],
      ] as [ProductId, DurationId, number][]
    ).map(([product, duration, count]) => ({ product, duration, count })),
    cancelReasons: [
      { reason: "te_duur", count: 9 },
      { reason: "geen_tijd", count: 7 },
      { reason: "doel_bereikt", count: 6 },
      { reason: "past_niet", count: 4 },
      { reason: "anders", count: 3 },
      { reason: "gezondheid", count: 2 },
    ],
    engagement: {
      checkins90: 214,
      checkinsOnTime90: 171,
      checkinsOpen: 23,
      checkinsOverdue: 7,
      weekly30: 488,
      weeklyOptOut: 19,
      healthConnections: [
        { provider: "junction", count: 31 },
        { provider: "withings", count: 12 },
      ],
    },
    results: { customers: 192, avgChangeKg: -4.6, lostShare: 0.87, reachedTarget: 23, avgWeeks: 9.8 },
    plans: { generated30: 118, avgGenerateMinutes: 3.4, avgAttempts: 1.08, failed: 1, avgDeliveryMinutes: 64, avgRating: 4.4, rated: 27 },
    emails: [
      { kind: "weekly", sent: 512, failed: 0, skipped: 0 },
      { kind: "checkin-0", sent: 96, failed: 1, skipped: 0 },
      { kind: "plans-upcoming", sent: 74, failed: 0, skipped: 0 },
      { kind: "checkin-1", sent: 41, failed: 0, skipped: 0 },
      { kind: "order", sent: 36, failed: 0, skipped: 0 },
      { kind: "plans-first", sent: 36, failed: 0, skipped: 0 },
      { kind: "login", sent: 29, failed: 0, skipped: 0 },
      { kind: "checkin-2", sent: 14, failed: 0, skipped: 0 },
      { kind: "checkout-reminder", sent: 11, failed: 0, skipped: 0 },
      { kind: "cancellation", sent: 9, failed: 0, skipped: 0 },
      { kind: "admin", sent: 8, failed: 0, skipped: 0 },
      { kind: "guarantee", sent: 4, failed: 0, skipped: 0 },
    ],
    discounts: [
      { code: "WELKOM10", orders: 14, revenueCents: 21220 },
      { code: "SANNE20", orders: 9, revenueCents: 12510 },
      { code: "VOORJAAR", orders: 3, revenueCents: 4290 },
    ],
    paymentsTracked: true,
  };
}

// ---------- Feedback ----------

const CHECKIN_SAMPLES: Partial<CheckinData>[] = [
  { comments: "Gaat echt goed! De overnight oats zijn mijn favoriet.", likedMeals: "Overnight oats, kip-pesto wrap", dislikedMeals: "Zalm met krieltjes (vis is niet mijn ding)", hunger: "Soms", energy: "Goed", sleep: "Goed", nutritionAdherence: "Meestal (70-90%)", trainingAdherence: "Alle trainingen", difficulty: "Precies goed" },
  { comments: "Weekenden blijven lastig met verjaardagen.", likedMeals: "Linzensalade", dislikedMeals: "Kwark als tussendoortje", hunger: "Vaak", energy: "Gemiddeld", sleep: "Matig", nutritionAdherence: "Soms (50-70%)", trainingAdherence: "De meeste", difficulty: "Precies goed" },
  { comments: "Graag iets meer variatie in het ontbijt.", hunger: "Soms", energy: "Goed", sleep: "Goed", nutritionAdherence: "Meestal (70-90%)", trainingAdherence: "De meeste", difficulty: "Te licht" },
  { injuries: "Knie zeurt na lunges", comments: "Trainingen voelen goed, behalve de lunges.", hunger: "Bijna nooit", energy: "Goed", sleep: "Goed", nutritionAdherence: "Bijna altijd (90% of meer)", trainingAdherence: "Alle trainingen", difficulty: "Te zwaar" },
  { likedMeals: "Shakshuka, roerei op brood", dislikedMeals: "Tofu-gerechten", hunger: "Soms", energy: "Laag", sleep: "Matig", nutritionAdherence: "Meestal (70-90%)", trainingAdherence: "Ongeveer de helft", difficulty: "Precies goed" },
  { comments: "Ik heb weinig tijd om te koken door ploegendiensten.", hunger: "Soms", energy: "Gemiddeld", sleep: "Slecht", nutritionAdherence: "Soms (50-70%)", trainingAdherence: "Ongeveer de helft", difficulty: "Te zwaar" },
  { comments: "4 kilo eraf! Super blij.", likedMeals: "Alles eigenlijk", hunger: "Bijna nooit", energy: "Goed", sleep: "Goed", nutritionAdherence: "Bijna altijd (90% of meer)", trainingAdherence: "Alle trainingen", difficulty: "Te licht" },
  { dislikedMeals: "Te veel kwark en skyr", comments: "Liever wat hartigere lunches.", hunger: "Soms", energy: "Goed", sleep: "Matig", nutritionAdherence: "Meestal (70-90%)", trainingAdherence: "De meeste", difficulty: "Precies goed" },
];

export async function demoFeedbackReport(): Promise<FeedbackReport> {
  const customers = await demoAdminData.customers();
  const c = (i: number) => customers[i % customers.length];
  const checkins = CHECKIN_SAMPLES.map((data, i) => ({
    createdAt: new Date(TODAY - (i * 3 + 1) * DAY - i * 5 * HOUR),
    customerId: c(i * 3).id,
    customerName: c(i * 3).name,
    seq: 2 + (i % 2),
    data: { weightKg: 78 - i * 0.7, ...data } as CheckinData,
  }));
  const counts = (key: keyof CheckinData) => {
    const m = new Map<string, number>();
    for (const ch of checkins) {
      const v = ch.data[key];
      if (typeof v === "string") m.set(v, (m.get(v) ?? 0) + 1);
    }
    return [...m.entries()].map(([answer, count]) => ({ answer, count: count * 9 + (answer.length % 4) })).sort((a, b) => b.count - a.count);
  };
  return {
    checkins,
    distributions: (
      [
        ["nutritionAdherence", "Voedingsschema gevolgd"],
        ["hunger", "Honger"],
        ["energy", "Energie"],
        ["sleep", "Slaap"],
        ["trainingAdherence", "Trainingen gedaan"],
        ["difficulty", "Zwaarte trainingen"],
      ] as [keyof CheckinData, string][]
    ).map(([key, label]) => ({ key, label, answers: counts(key) })),
    weekly: [
      "Deze week veel uit eten geweest, volgende week beter.",
      "Weegschaal zegt 0,8 kg minder!",
      "Erg druk op werk, trainingen ingekort.",
      "Honger in de middag, misschien een extra tussendoortje?",
    ].map((comment, i) => ({ createdAt: new Date(TODAY - (i * 2 + 1) * DAY), customerId: c(i * 5 + 1).id, customerName: c(i * 5 + 1).name, week: 2 + (i % 3), comment })),
    cancellations: [
      ["te_duur", "Even geen budget door een verbouwing."],
      ["doel_bereikt", "Streefgewicht gehaald, dank jullie wel!"],
      ["geen_tijd", null],
      ["past_niet", "Ik kook liever zonder recepten."],
      ["anders", "Ik ga verhuizen naar het buitenland."],
    ].map(([reason, comment], i) => ({
      at: new Date(TODAY - (i * 4 + 2) * DAY),
      customerId: c(i * 7 + 2).id,
      customerName: c(i * 7 + 2).name,
      reason,
      comment,
      product: i % 2 ? "voeding" : "bundel",
      duration: i % 3 ? "3m" : "1m",
    })),
    guarantees: [
      { reason: "Ik merkte dat ik liever met een diëtist werk." },
      { reason: null },
      { reason: "De trainingen passen niet bij mijn schema." },
    ].map((g, i) => ({ at: new Date(TODAY - (i * 5 + 3) * DAY), customerId: c(i * 11 + 4).id, customerName: c(i * 11 + 4).name, reason: g.reason })),
    ratings: [
      [5, "Mooi gevarieerd, klopt precies met de check-in."],
      [4, "Prima, maar het ontbijt komt vaak terug."],
      [3, "Te veel vis voor iemand die vis niet lekker vindt; opnieuw gemaakt."],
      [5, null],
    ].map(([rating, note], i) => ({
      at: new Date(TODAY - (i * 3 + 1) * DAY),
      planId: `a851f9a0-0000-4000-8000-00000000010${i}`,
      customerName: c(i).name,
      type: i % 2 ? "training" : "voeding",
      seq: 1 + (i % 3),
      rating: rating as number,
      note: note as string | null,
    })),
  };
}

// ---------- E-mails, logboek, notities ----------

const LOG_KINDS: [string, string][] = [
  ["order", "Orderbevestiging 8F3A21C0"],
  ["plans-first", "Je persoonlijke schema staat klaar, {naam}!"],
  ["weekly", "Weegmoment week 2: hoe gaat het, {naam}?"],
  ["checkin-0", "Tijd voor je check-in, {naam}"],
  ["plans-upcoming", "Je schema voor maandag 22 februari staat klaar, {naam}"],
  ["login", "Je inloglink voor Mijn schema's"],
  ["checkin-1", "Vandaag je check-in, dan ben je klaar voor maandag"],
  ["checkout-reminder", "Je persoonlijke plan staat nog voor je klaar, {naam}"],
  ["cancellation", "Bevestiging van je opzegging"],
  ["admin", "[A&A] Schema wacht op je goedkeuring"],
];

let emailLogCache: EmailLogRow[] | null = null;
async function allDemoEmails(): Promise<EmailLogRow[]> {
  if (emailLogCache) return emailLogCache;
  const customers = await demoAdminData.customers();
  const r = rng(42);
  emailLogCache = Array.from({ length: 60 }, (_, i) => {
    const [kind, subject] = LOG_KINDS[Math.floor(r() * LOG_KINDS.length)];
    const cust = customers[Math.floor(r() * customers.length)];
    const admin = kind === "admin";
    return {
      id: 1000 - i,
      to: admin ? "info@afvallenenafblijven.nl" : cust.email,
      kind,
      subject: subject.replace("{naam}", cust.name.split(" ")[0]),
      status: i === 17 ? "failed" : "sent",
      error: i === 17 ? "421 Service not available, try again later" : null,
      createdAt: new Date(TODAY - i * 7 * HOUR - Math.floor(r() * 50) * 60000),
      customerId: admin ? null : cust.id,
    } satisfies EmailLogRow;
  });
  return emailLogCache;
}

export async function demoEmailLog(filters: { q?: string; status?: string; kind?: string }): Promise<EmailLogRow[]> {
  const q = filters.q?.trim().toLowerCase();
  return (await allDemoEmails()).filter(
    (e) =>
      (!q || e.to.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q)) &&
      (!filters.status || e.status === filters.status) &&
      (!filters.kind || e.kind === filters.kind),
  );
}

export async function demoEmailCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const e of await allDemoEmails()) if (e.kind) counts[e.kind] = (counts[e.kind] ?? 0) + 7;
  return counts;
}

export async function demoCustomerEmails(email: string): Promise<EmailLogRow[]> {
  const own = (await allDemoEmails()).filter((e) => e.to === email);
  if (own.length > 0) return own;
  return [
    { id: 1, to: email, kind: "order", subject: "Orderbevestiging 8F3A21C0", status: "sent", error: null, createdAt: new Date(TODAY - 20 * DAY), customerId: null },
    { id: 2, to: email, kind: "plans-first", subject: "Je persoonlijke schema staat klaar!", status: "sent", error: null, createdAt: new Date(TODAY - 20 * DAY + 52 * 60000), customerId: null },
    { id: 3, to: email, kind: "weekly", subject: "Weegmoment week 2: hoe gaat het?", status: "sent", error: null, createdAt: new Date(TODAY - 6 * DAY), customerId: null },
  ];
}

export async function demoAdminLog(): Promise<AdminLogRow[]> {
  const customers = await demoAdminData.customers();
  return [
    ["Schema goedgekeurd", "Voeding · periode 2", 0],
    ["Kortingscode aangemaakt", "VOORJAAR (15% op de eerste maand)", null],
    ["E-mailtekst aangepast", "Check-in: uitnodiging (NL)", null],
    ["Schema opnieuw gemaakt", "Voeding · periode 1, aanwijzing: minder vis", 3],
    ["Notitie toegevoegd", null, 5],
    ["Garantie terugbetaald", "€ 17,95, abonnement beëindigd", 8],
    ["Vragenlijst aangepast", "Allergieën: noten toegevoegd", 2],
    ["Instellingen gewijzigd", "Herinnering bij niet-afgeronde betaling: aan (na 3 uur)", null],
    ["Abonnement opgezegd namens klant", "Opzegverzoek per e-mail", 11],
    ["Inloglink verstuurd", null, 6],
  ].map(([action, details, ci], i) => ({
    id: 100 - i,
    action: action as string,
    details: details as string | null,
    customerId: ci === null ? null : customers[ci as number].id,
    createdAt: new Date(TODAY - (i * 9 + 2) * HOUR),
  }));
}

export async function demoCustomerNotes(customerId: string): Promise<NoteRow[]> {
  const customers = await demoAdminData.customers();
  const i = customers.findIndex((c) => c.id === customerId);
  if (i < 0 || i % 3 !== 0) return [];
  return [
    { id: `${customerId.slice(0, 8)}-0000-4000-8000-000000000001`, text: "Belde over het ontbijt: liever hartig. Meegegeven in de aanwijzing voor het volgende schema.", createdAt: new Date(TODAY - 4 * DAY) },
    { id: `${customerId.slice(0, 8)}-0000-4000-8000-000000000002`, text: "Werkt in ploegendiensten; kooktijd kort houden.", createdAt: new Date(TODAY - 19 * DAY) },
  ];
}

export async function demoCustomerJourney(customerId: string): Promise<CustomerJourney | null> {
  const customers = await demoAdminData.customers();
  const i = Math.max(0, customers.findIndex((c) => c.id === customerId));
  const landings = ["/lp", "/lp/voeding", "/", "/lp/training", "/voedingsschema"];
  const sources = ["meta", "google", null, "tiktok", "meta"];
  return {
    firstAt: new Date(customers[i]?.createdAt.getTime() ?? TODAY - (14 + i) * 60000),
    landing: landings[i % landings.length],
    source: sources[i % sources.length],
    campaign: sources[i % sources.length] ? "lancering-januari" : null,
    device: i % 3 === 1 ? "desktop" : "mobiel",
    pages: [landings[i % landings.length], "/prijzen", "/start"].filter((p, k, a) => a.indexOf(p) === k),
    stepsSeen: 11 + (i % 3),
    minutesToOrder: 9 + ((i * 7) % 31),
  };
}

export function demoDiscountCodes(): DiscountCodeRow[] {
  const base = {
    description: null,
    amount_off_cents: null,
    duration_months: null,
    products: [],
    durations: [],
    max_redemptions: null,
    starts_at: null,
    expires_at: null,
    active: true,
    stripe_coupon_id: null,
    checkouts: 0,
  } satisfies Partial<DiscountCodeRow>;
  return [
    { ...base, id: "d0000001-0000-4000-8000-000000000001", code: "WELKOM10", description: "Nieuwsbrief en social", percent_off: 10, duration: "once", created_at: new Date(TODAY - 40 * DAY), redemptions: 14, checkouts: 31, revenue_cents: 21220 },
    { ...base, id: "d0000001-0000-4000-8000-000000000002", code: "SANNE20", description: "Influencer Sanne (Instagram)", percent_off: 20, duration: "repeating", duration_months: 3, max_redemptions: 50, created_at: new Date(TODAY - 25 * DAY), redemptions: 9, checkouts: 17, revenue_cents: 12510, stripe_coupon_id: "afb_code_SANNE20_d0000001" },
    { ...base, id: "d0000001-0000-4000-8000-000000000003", code: "VOORJAAR", description: "Voorjaarsactie", percent_off: 15, duration: "once", starts_at: new Date(TODAY - 5 * DAY), expires_at: new Date(TODAY + 25 * DAY), products: ["bundel"], created_at: new Date(TODAY - 6 * DAY), redemptions: 3, checkouts: 8, revenue_cents: 4290 },
    { ...base, id: "d0000001-0000-4000-8000-000000000004", code: "BEDRIJF5", description: "Bedrijfsfitness Acme", percent_off: null, amount_off_cents: 500, duration: "forever", durations: ["6m", "12m"], created_at: new Date(TODAY - 60 * DAY), redemptions: 2, checkouts: 2, revenue_cents: 2990 },
    { ...base, id: "d0000001-0000-4000-8000-000000000005", code: "BLACKFRIDAY", description: "Black Friday 2026", percent_off: 30, duration: "once", expires_at: new Date(TODAY - 80 * DAY), active: false, created_at: new Date(TODAY - 90 * DAY), redemptions: 0, checkouts: 4, revenue_cents: 0 },
  ];
}

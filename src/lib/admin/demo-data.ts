import "server-only";
import { monthlyPrice, products, type DurationId, type ProductId } from "@/config/pricing";
import { sampleNutritionPlan, sampleTargets, sampleTrainingPlan } from "@/content/sample-plans";
import { demoIntake } from "@/content/demo-account";
import { checkinWindow, type CheckinData } from "@/lib/checkin";
import type { OrderStatus } from "@/lib/repo";
import type { Campaign } from "@/lib/campaign";
import type {
  AdminCampaignRow,
  AdminCustomerRow,
  AdminData,
  AdminGuaranteeRow,
  AdminOrderRow,
  AdminPlanRow,
  AdminWithdrawalRow,
} from "@/lib/admin/data";

/**
 * Voorbeelddata voor /beheer in demo-modus (BEHEER_DEMO=1). Alles is fictief en
 * vast gegenereerd, zodat de demo er steeds hetzelfde uitziet.
 */

const TODAY = new Date("2027-02-15T10:00:00+01:00").getTime();
const DAY = 24 * 60 * 60 * 1000;

const FIRST = ["Sanne", "Lisa", "Mark", "Eva", "Daan", "Fleur", "Kim", "Tom", "Iris", "Bas", "Noor", "Lotte", "Ruben", "Anouk", "Sem", "Femke", "Joost", "Maud", "Thijs", "Esther", "Rick", "Laura", "Niels", "Sophie"];
const LAST = ["de Vries", "Jansen", "Bakker", "Visser", "Smit", "Meijer", "de Boer", "Mulder", "Bos", "Vos", "Peters", "Hendriks"];
const PRODUCT_CYCLE: ProductId[] = ["bundel", "voeding", "bundel", "training", "bundel", "voeding", "bundel", "voeding", "training", "bundel"];
const DURATION_CYCLE: DurationId[] = ["3m", "1m", "12m", "3m", "6m", "3m", "1m", "12m", "3m", "eenmalig", "3m", "1m"];
const CAMPAIGN_CYCLE: (Campaign | null)[] = [
  { source: "meta", medium: "paid_social", campaign: "lancering-januari", content: "video-sanne", landing: "lp" },
  null,
  { source: "google", medium: "cpc", campaign: "voedingsschema-zoekwoorden", landing: "lp/voeding" },
  { source: "meta", medium: "paid_social", campaign: "lancering-januari", content: "carrousel-recepten", landing: "lp/voeding" },
  { source: "tiktok", medium: "paid_social", campaign: "thuis-trainen", landing: "lp/training" },
  null,
  { source: "meta", medium: "paid_social", campaign: "lancering-januari", content: "video-sanne", landing: "lp" },
];
/** Hoeveel bezoekers per bestelling de betaalstap starten, per bron (voor een realistisch ogend overzicht). */
const STARTS_PER_ORDER: Record<string, number> = { meta: 2.8, google: 2.1, tiktok: 3.6, "": 2.4 };

function id(prefix: string, n: number): string {
  // Geldig ogende UUID, zodat links en referenties werken zoals in het echt.
  const hex = (n * 2654435761 + prefix.length * 97).toString(16).padStart(8, "0").slice(-8);
  return `${hex}-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

const customers: AdminCustomerRow[] = [];
const orders: AdminOrderRow[] = [];
const plans: AdminPlanRow[] = [];

for (let i = 0; i < 48; i++) {
  const first = FIRST[i % FIRST.length];
  const last = LAST[(i * 5) % LAST.length];
  const customerId = id("c", i + 1);
  // 36 bestellingen in de laatste 30 dagen (onregelmatig verdeeld), 12 oudere.
  const daysAgo = i < 36 ? (i * 7 + ((i * i) % 5)) % 30 : 30 + (i - 36) * 4;
  const createdAt = new Date(TODAY - daysAgo * DAY - ((i * 5) % 9) * 3600 * 1000);
  const product = PRODUCT_CYCLE[i % PRODUCT_CYCLE.length];
  const duration = DURATION_CYCLE[i % DURATION_CYCLE.length];
  const subscription = duration !== "eenmalig";
  const status: OrderStatus = !subscription ? "completed" : i % 17 === 5 ? "canceled" : i % 19 === 7 ? "past_due" : "active";
  const cancelAt = status === "active" && i % 9 === 4 ? new Date(createdAt.getTime() + 90 * DAY) : null;
  const orderId = id("o", i + 1);

  orders.push({
    id: orderId,
    reference: orderId.slice(0, 8).toUpperCase(),
    customerId,
    customerName: `${first} ${last}`,
    customerEmail: `${first.toLowerCase()}.${last.toLowerCase().replace(/\s+/g, "")}@voorbeeld.nl`,
    product,
    duration,
    status,
    cancelAt,
    amountCents: monthlyPrice(product, duration),
    monthlyCents: subscription ? monthlyPrice(product, duration) : 0,
    createdAt,
    stripeSubscriptionId: subscription ? `sub_demo${String(i + 1).padStart(4, "0")}` : null,
    campaign: CAMPAIGN_CYCLE[i % CAMPAIGN_CYCLE.length],
  });

  const ageDays = Math.floor((TODAY - createdAt.getTime()) / DAY);
  // Sommige abonnees hebben hun check-in nog niet ingevuld; die lopen een periode achter.
  const due = subscription && status !== "canceled" ? Math.floor(ageDays / 28) + 1 : 1;
  const periods = due > 1 && i % 7 === 3 ? due - 1 : due;
  let planCount = 0;
  for (let seq = 1; seq <= periods; seq++) {
    for (const type of products[product].includes) {
      const created = new Date(createdAt.getTime() + (seq - 1) * 28 * DAY + 60 * 1000);
      const newest = daysAgo === 0 && i === 0 && seq === periods;
      const failed = i === 3 && seq === periods && type === "training";
      plans.push({
        id: id(`p${type}`, (i + 1) * 100 + seq * 2 + (type === "voeding" ? 0 : 1)),
        orderId,
        customerId,
        customerName: `${first} ${last}`,
        customerEmail: orders[orders.length - 1].customerEmail,
        type,
        seq,
        status: newest ? "generating" : failed ? "failed" : "ready",
        attempts: failed ? 5 : 1,
        error: failed ? "Antwoord afgekapt (max_tokens bereikt)" : null,
        createdAt: created,
        generatedAt: newest || failed ? null : new Date(created.getTime() + 4 * 60 * 1000),
        emailedAt: newest || failed ? null : new Date(created.getTime() + 5 * 60 * 1000),
      });
      planCount++;
    }
  }

  customers.push({
    id: customerId,
    name: `${first} ${last}`,
    email: orders[orders.length - 1].customerEmail,
    createdAt,
    marketing: i % 3 === 0,
    stripeCustomerId: `cus_demo${String(i + 1).padStart(4, "0")}`,
    activeSubscriptions: subscription && (status === "active" || status === "past_due") ? 1 : 0,
    orders: 1,
    plans: planCount,
  });
}

// Nieuwste eerst, zoals de database ze teruggeeft.
orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
customers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

const withdrawals: AdminWithdrawalRow[] = [
  {
    id: id("w", 1),
    name: orders[2].customerName,
    email: orders[2].customerEmail,
    orderReference: orders[2].reference,
    message: "Ik heb per ongeluk het jaarabonnement gekozen.",
    createdAt: new Date(TODAY - 1 * DAY),
    handledAt: null,
  },
  {
    id: id("w", 2),
    name: orders[11].customerName,
    email: orders[11].customerEmail,
    orderReference: orders[11].reference,
    message: null,
    createdAt: new Date(TODAY - 12 * DAY),
    handledAt: new Date(TODAY - 11 * DAY),
  },
];

// Garantie-aanvragen: van recente eerste bestellingen (binnen de garantietermijn).
const guaranteeRequests: AdminGuaranteeRow[] = orders
  .filter((o) => TODAY - o.createdAt.getTime() < 14 * DAY)
  .slice(1, 3)
  .map((order, i) => ({
    id: id("g", i + 1),
    order,
    reason: i === 0 ? "Het past toch niet in mijn drukke werkweek." : null,
    createdAt: new Date(order.createdAt.getTime() + (i + 2) * DAY),
    handledAt: i === 1 ? new Date(order.createdAt.getTime() + (i + 3) * DAY) : null,
    stripeCustomerId: null,
  }));


const within30 = (d: Date) => TODAY - d.getTime() < 30 * DAY;

function demoCheckinData(seq: number): CheckinData {
  return {
    weightKg: 78 - seq * 1.2,
    waistCm: 92 - seq * 2,
    energy: seq % 2 ? "Goed" : "Gemiddeld",
    sleep: "Matig",
    nutritionAdherence: "Meestal (70-90%)",
    hunger: "Soms",
    likedMeals: "De kwarkbowl en de kip-teriyaki",
    dislikedMeals: "Liever geen zalm op maandag",
    trainingAdherence: "De meeste",
    difficulty: "Precies goed",
    injuries: seq === 2 ? "Knie zeurt soms na het wandelen" : undefined,
  };
}

function orderCheckin(o: AdminOrderRow) {
  const own = plans.filter((p) => p.orderId === o.id);
  const lastSeq = own.reduce((m, p) => Math.max(m, p.seq), 0);
  const lastStart = own.filter((p) => p.seq === lastSeq).reduce<Date | null>((min, p) => (!min || p.createdAt < min ? p.createdAt : min), null);
  return checkinWindow({
    duration: o.duration,
    status: o.status,
    cancelAt: o.cancelAt,
    lastSeq,
    lastPeriodStart: lastStart,
    submittedForNext: false,
    now: TODAY,
  });
}

export const demoAdminData: AdminData = {
  demo: true,

  async overview() {
    const active = orders.filter((o) => o.status === "active" && o.duration !== "eenmalig");
    const recent = orders.filter((o) => within30(o.createdAt));
    const perDay: { date: string; count: number }[] = [];
    for (let d = 29; d >= 0; d--) {
      const day = new Date(TODAY - d * DAY);
      const key = day.toISOString().slice(0, 10);
      perDay.push({ date: key, count: orders.filter((o) => o.createdAt.toISOString().slice(0, 10) === key).length });
    }
    const mix = new Map<string, { product: ProductId; duration: DurationId; count: number }>();
    for (const o of active) {
      const k = `${o.product}-${o.duration}`;
      mix.set(k, { product: o.product, duration: o.duration, count: (mix.get(k)?.count ?? 0) + 1 });
    }
    const windows = orders.map(orderCheckin);
    const byCampaign = new Map<string, AdminCampaignRow>();
    for (const o of recent) {
      const key = `${o.campaign?.source ?? ""}|${o.campaign?.campaign ?? ""}`;
      const row = byCampaign.get(key) ?? { source: o.campaign?.source ?? null, campaign: o.campaign?.campaign ?? null, started: 0, orders: 0, firstPaymentsCents: 0 };
      row.orders++;
      row.firstPaymentsCents += o.amountCents;
      byCampaign.set(key, row);
    }
    const campaigns = [...byCampaign.values()]
      .map((r) => ({ ...r, started: Math.round(r.orders * (STARTS_PER_ORDER[r.source ?? ""] ?? 2.5)) }))
      .sort((a, b) => b.orders - a.orders);
    return {
      campaigns,
      checkinsOpen: windows.filter((w) => w?.status === "open" || w?.status === "overdue").length,
      checkinsOverdue: windows.filter((w) => w?.status === "overdue").length,
      activeSubscriptions: active.length,
      mrrCents: active.reduce((s, o) => s + o.monthlyCents, 0),
      pendingCancellations: active.filter((o) => o.cancelAt).length,
      newOrders30: recent.length,
      firstPayments30Cents: recent.reduce((s, o) => s + o.amountCents, 0),
      checkoutStarts30: campaigns.reduce((sum, r) => sum + r.started, 0),
      plansReady30: plans.filter((p) => p.status === "ready" && p.generatedAt && within30(p.generatedAt)).length,
      plansFailed: plans.filter((p) => p.status === "failed").length,
      plansInProgress: plans.filter((p) => p.status === "generating" || p.status === "pending").length,
      openWithdrawals: withdrawals.filter((w) => !w.handledAt).length,
      openGuaranteeRequests: guaranteeRequests.filter((g) => !g.handledAt).length,
      ordersPerDay: perDay,
      productMix: [...mix.values()].sort((a, b) => b.count - a.count),
      recentOrders: orders.slice(0, 8),
    };
  },

  async customers(query) {
    const q = query?.trim().toLowerCase();
    return q ? customers.filter((c) => c.email.includes(q) || c.name.toLowerCase().includes(q)) : customers;
  },

  async customer(customerId) {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return null;
    const own = orders.filter((o) => o.customerId === customerId);
    const ownPlans = plans.filter((p) => p.customerId === customerId);
    const lastSeq = ownPlans.reduce((m, p) => Math.max(m, p.seq), 0);
    return {
      customer,
      orders: own.map((o) => ({ ...o, checkin: orderCheckin(o) })),
      plans: ownPlans,
      intake: {
        data: { ...demoIntake, product: own[0]?.product ?? "bundel" },
        consents: { healthData: true, terms: true, immediateDelivery: true, marketing: customer.marketing },
        createdAt: customer.createdAt,
      },
      weekly: [],
      checkins: Array.from({ length: Math.max(lastSeq - 1, 0) }, (_, k) => {
        const seq = lastSeq - k;
        const start = ownPlans.find((p) => p.seq === seq)?.createdAt ?? customer.createdAt;
        return { data: demoCheckinData(seq), forSeq: seq, createdAt: new Date(start.getTime() - 60 * 1000) };
      }),
    };
  },

  async orders(status) {
    return status ? orders.filter((o) => o.status === status) : orders;
  },

  async plans(status) {
    const list = [...plans].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return status ? list.filter((p) => p.status === status) : list;
  },

  async plan(planId) {
    const p = plans.find((x) => x.id === planId);
    if (!p) return null;
    return {
      ...p,
      content:
        p.status !== "ready"
          ? null
          : p.type === "voeding"
            ? { type: "voeding", plan: sampleNutritionPlan, targets: sampleTargets }
            : { type: "training", plan: sampleTrainingPlan },
    };
  },

  async withdrawals() {
    return withdrawals;
  },

  async guaranteeRequests() {
    return guaranteeRequests;
  },
};

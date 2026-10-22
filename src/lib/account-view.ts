import type { HealthView } from "@/lib/health/view";
import type { AccountView, DashboardOrder, DashboardPlan, GuaranteeView, PaymentView } from "@/lib/account-types";
import { durations, isSubscription } from "@/config/pricing";
import type { NutritionTargets } from "@/lib/calculations";
import { checkinWindow } from "@/lib/checkin";
import { weeklyWindow } from "@/lib/weekly";
import { addMonthsClamped } from "@/lib/dates";
import { guaranteeAvailable, guaranteeDeadline, guaranteeOrder } from "@/lib/guarantee";
import { periodStarts, periodsAt } from "@/lib/schedule";
import type { PaymentRow } from "@/lib/payments";
import {
  MAX_PLAN_ATTEMPTS,
  type CheckinRow,
  type GuaranteeRequestRow,
  type IntakeRow,
  type Order,
  type Plan,
  type WeeklyLogRow,
} from "@/lib/repo";

/** Zet bestellingen, schema's, check-ins en de vragenlijst om naar wat Mijn schema's toont. */
export function toAccountView(input: {
  name: string;
  orders: Order[];
  plans: Plan[];
  checkins: CheckinRow[];
  weekly: WeeklyLogRow[];
  weeklyReminders: boolean;
  intake: IntakeRow | null;
  targets: { seq: number; generated_at: Date | null; targets: NutritionTargets | null }[];
  health?: HealthView | null;
  guaranteeRequest?: GuaranteeRequestRow | null;
  payments?: PaymentRow[];
}): AccountView {
  const { orders, plans, checkins } = input;
  const now = Date.now();
  const dashboardOrders = orders.map((o): DashboardOrder => {
    const own = plans.filter((p) => p.order_id === o.id);
    const lastSeq = own.reduce((m, p) => Math.max(m, p.seq), 0);
    const starts = periodStarts(own, (p) => p.seq, (p) => p.starts_at);
    // De laatste periode kan al klaarstaan maar nog moeten beginnen (maandag); de check-in gaat daarna verder.
    const lastStart = starts.get(lastSeq) ?? null;
    // Weegmomenten horen bij de periode die al loopt.
    const running = periodsAt(starts, now).current;
    const months = durations[o.duration].months;
    const commitmentEnd = months > 1 ? addMonthsClamped(new Date(o.created_at), months) : null;
    return {
      id: o.id,
      reference: o.id.slice(0, 8).toUpperCase(),
      product: o.product,
      duration: o.duration,
      status: o.status,
      cancelAt: o.cancel_at,
      createdAt: o.created_at,
      manageable: Boolean(o.stripe_subscription_id) && isSubscription(o.duration),
      commitmentEndsAt: commitmentEnd && commitmentEnd.getTime() > now ? commitmentEnd : null,
      checkin: checkinWindow({
        duration: o.duration,
        status: o.status,
        cancelAt: o.cancel_at,
        lastSeq,
        lastPeriodStart: lastStart,
        submittedForNext: checkins.some((c) => c.order_id === o.id && c.for_seq === lastSeq + 1),
        now,
      }),
      weekly: weeklyWindow({
        duration: o.duration,
        status: o.status,
        lastSeq: running?.seq ?? 0,
        lastPeriodStart: running?.start ?? null,
        loggedWeeks: input.weekly.filter((w) => w.order_id === o.id && w.seq === running?.seq).map((w) => w.week),
        now,
      }),
      lastWeightKg:
        [...input.weekly].reverse().find((w) => w.order_id === o.id)?.data.weightKg ??
        checkins.find((c) => c.order_id === o.id && c.data.weightKg)?.data.weightKg ??
        null,
      nextPayment: nextPaymentFor(o, now),
    };
  });
  // Tot een schema is vrijgegeven (op een willekeurig moment binnen 2 uur) ziet de klant "wordt gemaakt".
  const dashboardPlans = plans.map(
    (p): DashboardPlan => ({
      id: p.id,
      type: p.type,
      seq: p.seq,
      startsAt: p.starts_at,
      status: p.released_at ? p.status : p.status === "failed" ? "failed" : "generating",
      generatedAt: p.released_at,
      failed: p.status === "failed" && p.attempts >= MAX_PLAN_ATTEMPTS,
      href: `/schema/${p.id}`,
      pdfHref: `/schema/${p.id}/pdf`,
    }),
  );
  const firstOrder = orders.reduce<Date | null>((min, o) => (!min || o.created_at < min ? o.created_at : min), null);
  return {
    now: new Date(now),
    name: input.name,
    orders: dashboardOrders,
    plans: dashboardPlans,
    intake: input.intake?.data ?? null,
    startedAt: firstOrder ?? input.intake?.created_at ?? null,
    checkins: [...checkins]
      .sort((a, b) => a.created_at.getTime() - b.created_at.getTime())
      .map((c) => ({ seq: c.for_seq, date: c.created_at, data: c.data })),
    weekly: input.weekly.map((w) => ({ seq: w.seq, week: w.week, date: w.created_at, data: w.data, adjustment: w.adjustment, status: w.status })),
    weeklyReminders: input.weeklyReminders,
    health: input.health ?? null,
    guarantee: toGuaranteeView(orders, input.guaranteeRequest ?? null, now),
    payments: toPaymentViews(input.payments ?? [], orders),
    targets: input.targets
      .filter((t) => t.targets)
      .map((t) => ({
        seq: t.seq,
        date: t.generated_at,
        calories: t.targets!.calories,
        proteinG: t.targets!.proteinG,
        carbsG: t.targets!.carbsG,
        fatG: t.targets!.fatG,
      })),
  };
}

/**
 * De volgende maandelijkse afschrijving van een lopend abonnement. Stripe
 * schrijft elke maand af op de dag van de aankoop; met een kortingscode kan
 * het bedrag afwijken, dan tonen we alleen de datum.
 */
function nextPaymentFor(o: Order, now: number): DashboardOrder["nextPayment"] {
  if (!isSubscription(o.duration) || !o.stripe_subscription_id || o.status !== "active") return null;
  let n = 1;
  let next = addMonthsClamped(new Date(o.created_at), n);
  while (next.getTime() <= now) next = addMonthsClamped(new Date(o.created_at), ++n);
  if (o.cancel_at && next.getTime() >= o.cancel_at.getTime()) return null;
  return { date: next, amountCents: o.discount_code || !o.monthly_cents ? null : o.monthly_cents };
}

/** Betalingen met de bestelling erbij en, bij abonnementen, de hoeveelste maand het is. */
function toPaymentViews(rows: PaymentRow[], orders: Order[]): PaymentView[] {
  const month = new Map<string, number>();
  const perOrder = new Map<string, number>();
  for (const p of [...rows].sort((a, b) => a.paid_at.getTime() - b.paid_at.getTime())) {
    if (p.kind !== "payment" || !p.order_id) continue;
    const n = (perOrder.get(p.order_id) ?? 0) + 1;
    perOrder.set(p.order_id, n);
    month.set(p.id, n);
  }
  return rows.map((p): PaymentView => {
    const order = orders.find((o) => o.id === p.order_id) ?? null;
    return {
      id: p.id,
      date: p.paid_at,
      kind: p.kind,
      amountCents: p.amount_cents,
      orderReference: order ? order.id.slice(0, 8).toUpperCase() : null,
      product: order?.product ?? null,
      duration: order?.duration ?? null,
      month: order && isSubscription(order.duration) && p.kind === "payment" ? (month.get(p.id) ?? null) : null,
      invoiceHref: p.kind === "payment" && p.invoice_id ? `/account/factuur/${encodeURIComponent(p.id)}` : null,
    };
  });
}

function toGuaranteeView(orders: Order[], request: GuaranteeRequestRow | null, now: number): GuaranteeView | null {
  const order = (request && orders.find((o) => o.id === request.order_id)) || guaranteeOrder(orders);
  if (!order) return null;
  const open = !request && guaranteeAvailable(order, now);
  if (!open && !request) return null;
  return {
    orderId: order.id,
    reference: order.id.slice(0, 8).toUpperCase(),
    amountCents: order.amount_cents,
    subscription: isSubscription(order.duration),
    deadline: guaranteeDeadline(order.created_at),
    open,
    requestedAt: request?.created_at ?? null,
    handledAt: request?.handled_at ?? null,
  };
}

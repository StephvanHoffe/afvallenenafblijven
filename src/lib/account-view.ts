import type { DashboardOrder, DashboardPlan } from "@/components/account/AccountDashboard";
import { durations, isSubscription } from "@/config/pricing";
import { checkinWindow } from "@/lib/checkin";
import { addMonthsClamped } from "@/lib/dates";
import { MAX_PLAN_ATTEMPTS, type CheckinRow, type Order, type Plan } from "@/lib/repo";

/** Zet bestellingen, schema's en check-ins om naar wat Mijn schema's toont. */
export function toDashboard(
  orders: Order[],
  plans: Plan[],
  checkins: CheckinRow[],
): { dashboardOrders: DashboardOrder[]; dashboardPlans: DashboardPlan[] } {
  const now = Date.now();
  const dashboardOrders = orders.map((o): DashboardOrder => {
    const own = plans.filter((p) => p.order_id === o.id);
    const lastSeq = own.reduce((m, p) => Math.max(m, p.seq), 0);
    const lastStart = own
      .filter((p) => p.seq === lastSeq)
      .reduce<Date | null>((min, p) => (!min || p.created_at < min ? p.created_at : min), null);
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
      lastWeightKg: [...checkins].find((c) => c.order_id === o.id && c.data.weightKg)?.data.weightKg ?? null,
    };
  });
  const dashboardPlans = plans.map(
    (p): DashboardPlan => ({
      id: p.id,
      type: p.type,
      seq: p.seq,
      status: p.status,
      generatedAt: p.generated_at,
      failed: p.status === "failed" && p.attempts >= MAX_PLAN_ATTEMPTS,
      href: `/schema/${p.id}`,
      pdfHref: `/schema/${p.id}/pdf`,
    }),
  );
  return { dashboardOrders, dashboardPlans };
}

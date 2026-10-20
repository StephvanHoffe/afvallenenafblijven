import type { DashboardOrder, DashboardPlan } from "@/components/account/AccountDashboard";
import { durations, isSubscription } from "@/config/pricing";
import { site } from "@/config/site";
import { addMonthsClamped } from "@/lib/dates";
import { MAX_PLAN_ATTEMPTS, type Order, type Plan } from "@/lib/repo";

/** Zet bestellingen en schema's om naar wat Mijn schema's toont. */
export function toDashboard(orders: Order[], plans: Plan[]): { dashboardOrders: DashboardOrder[]; dashboardPlans: DashboardPlan[] } {
  const now = Date.now();
  const dashboardOrders = orders.map((o): DashboardOrder => {
    const lastPlan = plans
      .filter((p) => p.order_id === o.id)
      .reduce<Date | null>((latest, p) => (!latest || p.created_at > latest ? p.created_at : latest), null);
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
      nextPlanAt:
        lastPlan && isSubscription(o.duration)
          ? new Date(new Date(lastPlan).getTime() + site.planIntervalDays * 24 * 60 * 60 * 1000)
          : null,
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
    }),
  );
  return { dashboardOrders, dashboardPlans };
}

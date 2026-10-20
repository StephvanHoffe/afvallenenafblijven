import { after, type NextRequest } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { ensureOrderForSession } from "@/lib/fulfillment";
import { processOrderPlans } from "@/lib/plans";
import { MAX_PLAN_ATTEMPTS, plansForOrder } from "@/lib/repo";
import { isStripeConfigured } from "@/lib/stripe";

export const maxDuration = 300;

/**
 * Status van een bestelling voor de bedankpagina. Vangt ook een vertraagde of
 * gemiste webhook op: bestaat de bestelling nog niet, dan halen we de checkout
 * zelf op bij Stripe, en openstaande schema's worden (opnieuw) in gang gezet.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id") ?? "";
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId) || !isDatabaseConfigured() || !isStripeConfigured()) {
    return Response.json({ state: "unknown" }, { status: 400 });
  }

  let order;
  try {
    order = await ensureOrderForSession(sessionId);
  } catch (err) {
    console.error("Status ophalen mislukt", err);
    return Response.json({ state: "unknown" }, { status: 404 });
  }
  if (!order) return Response.json({ state: "awaiting_payment" });

  const plans = (await plansForOrder(order.id)).filter((p) => p.seq === 1);
  const needsWork = plans.some((p) => p.status === "pending" || (p.status === "failed" && p.attempts < MAX_PLAN_ATTEMPTS));
  if (needsWork) after(() => processOrderPlans(order.id));

  const state = plans.every((p) => p.status === "ready")
    ? "ready"
    : plans.some((p) => p.status === "failed" && p.attempts >= MAX_PLAN_ATTEMPTS)
      ? "failed"
      : "processing";

  return Response.json(
    {
      state,
      product: order.product,
      duration: order.duration,
      value: order.amount_cents / 100,
      plans: plans.map((p) => ({ type: p.type, status: p.status })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

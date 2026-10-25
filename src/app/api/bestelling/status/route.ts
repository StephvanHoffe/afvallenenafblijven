import { after, type NextRequest } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { orderForIntake } from "@/lib/fulfillment";
import { isMollieConfigured } from "@/lib/mollie";
import { processOrderPlans, releaseAndNotify } from "@/lib/plans";
import { MAX_PLAN_ATTEMPTS, getIntake, plansForOrder } from "@/lib/repo";

export const maxDuration = 300;

/**
 * Status van een bestelling voor de bedankpagina (?bestelling = het nummer van
 * de vragenlijst, dat alleen de klant kent). Vangt ook een vertraagde of
 * gemiste webhook op: is er nog geen bestelling, dan halen we de betaling zelf
 * op bij Mollie, en openstaande schema's worden (opnieuw) in gang gezet.
 */
export async function GET(request: NextRequest) {
  const intakeId = request.nextUrl.searchParams.get("bestelling") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(intakeId) || !isDatabaseConfigured() || !isMollieConfigured()) {
    return Response.json({ state: "unknown" }, { status: 400 });
  }

  let result;
  try {
    const intake = await getIntake(intakeId);
    if (!intake) return Response.json({ state: "unknown" }, { status: 404 });
    result = await orderForIntake(intake);
  } catch (err) {
    console.error("Status ophalen mislukt", err);
    return Response.json({ state: "unknown" }, { status: 404 });
  }
  const { order, paymentStatus } = result;
  if (!order) {
    // Afgebroken, verlopen of mislukt: de klant kan het opnieuw proberen.
    const stopped = paymentStatus === "canceled" || paymentStatus === "expired" || paymentStatus === "failed";
    return Response.json({ state: stopped ? "payment_failed" : "awaiting_payment" }, { headers: { "Cache-Control": "no-store" } });
  }

  await releaseAndNotify({ orderId: order.id });
  const plans = (await plansForOrder(order.id)).filter((p) => p.seq === 1);
  const needsWork = plans.some((p) => p.status === "pending" || (p.status === "failed" && p.attempts < MAX_PLAN_ATTEMPTS));
  if (needsWork) after(() => processOrderPlans(order.id));

  // Klaar zodra het schema aan de klant is vrijgegeven (op een willekeurig moment binnen 2 uur).
  const state = plans.every((p) => p.status === "ready" && p.released_at)
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
      orderReference: order.id.slice(0, 8).toUpperCase(),
      plans: plans.map((p) => ({ type: p.type, status: p.released_at ? p.status : "generating" })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

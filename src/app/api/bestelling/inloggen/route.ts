import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { startSession } from "@/lib/auth";
import { getOrderBySession } from "@/lib/repo";

/**
 * Direct na de betaling inloggen vanaf de bedankpagina. Alleen geldig voor een
 * recente bestelling (de checkout-ID uit de Stripe-redirect is geheim).
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id") ?? "";
  const order = /^cs_[A-Za-z0-9_]+$/.test(sessionId) ? await getOrderBySession(sessionId) : null;
  const recent = order && Date.now() - new Date(order.created_at).getTime() < 72 * 60 * 60 * 1000;
  if (!order || !recent) redirect("/inloggen");
  await startSession(order.customer_id);
  redirect("/account");
}

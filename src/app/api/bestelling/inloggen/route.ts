import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { localePath, toLocale } from "@/i18n/config";
import { startSession } from "@/lib/auth";
import { getOrderBySession } from "@/lib/repo";

/**
 * Direct na de betaling inloggen vanaf de bedankpagina. Alleen geldig voor een
 * recente bestelling (de checkout-ID uit de Stripe-redirect is geheim).
 * De bedankpagina geeft de taal mee in ?taal= (API-routes hebben geen taal in het adres).
 */
export async function GET(request: NextRequest) {
  const l = toLocale(request.nextUrl.searchParams.get("taal"));
  const sessionId = request.nextUrl.searchParams.get("session_id") ?? "";
  const order = /^cs_[A-Za-z0-9_]+$/.test(sessionId) ? await getOrderBySession(sessionId) : null;
  const recent = order && Date.now() - new Date(order.created_at).getTime() < 72 * 60 * 60 * 1000;
  if (!order || !recent) redirect(localePath(l, "/inloggen"));
  await startSession(order.customer_id);
  redirect(localePath(l, "/account"));
}

import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { localePath, toLocale } from "@/i18n/config";
import { startSession } from "@/lib/auth";
import { getOrderByIntake } from "@/lib/repo";

/**
 * Direct na de betaling inloggen vanaf de bedankpagina. Alleen geldig voor een
 * recente bestelling (het nummer in ?bestelling= komt uit de terugkeerlink van
 * Mollie en is geheim). De bedankpagina geeft de taal mee in ?taal= (API-routes
 * hebben geen taal in het adres).
 */
export async function GET(request: NextRequest) {
  const l = toLocale(request.nextUrl.searchParams.get("taal"));
  const intakeId = request.nextUrl.searchParams.get("bestelling") ?? "";
  const order = /^[0-9a-f-]{36}$/i.test(intakeId) ? await getOrderByIntake(intakeId) : null;
  const recent = order && Date.now() - new Date(order.created_at).getTime() < 72 * 60 * 60 * 1000;
  if (!order || !recent) redirect(localePath(l, "/inloggen"));
  await startSession(order.customer_id);
  redirect(localePath(l, "/account"));
}

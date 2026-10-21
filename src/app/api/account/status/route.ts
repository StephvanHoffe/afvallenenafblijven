import { after, connection } from "next/server";
import { currentCustomer } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { notifyReleased, processPlan, releaseForCustomer } from "@/lib/plans";
import { processWeeklyLog } from "@/lib/weekly-server";
import { MAX_PLAN_ATTEMPTS, plansForCustomer, weeklyLogsForCustomer } from "@/lib/repo";

export const maxDuration = 300;

/**
 * Status van de schema's van de ingelogde klant, voor Mijn schema's terwijl
 * een nieuw schema wordt gemaakt. Geeft een klaar schema vrij zodra het
 * geplande moment is aangebroken, en zet openstaande schema's (opnieuw) in
 * gang, voor het geval de achtergrondtaak na de check-in werd onderbroken.
 */
export async function GET() {
  // Altijd per verzoek: het antwoord hangt af van de ingelogde klant.
  await connection();
  if (!isDatabaseConfigured()) return Response.json({ busy: false });
  const customer = await currentCustomer();
  if (!customer) return Response.json({ busy: false }, { status: 401 });
  const released = await releaseForCustomer(customer.id);
  if (released.length > 0) after(() => notifyReleased(released));
  const plans = await plansForCustomer(customer.id);
  // Herhaalpogingen wachten steeds iets langer (zie claimPlan); de geplande taak doet hetzelfde.
  const open = plans.filter((p) => p.status === "pending" || p.status === "failed");
  if (open.length > 0) after(() => Promise.all(open.map((p) => processPlan(p.id))));
  // Aanwijzingen bij een weegmoment die nog worden gemaakt.
  const weekly = (await weeklyLogsForCustomer(customer.id)).filter((w) => w.status === "pending" || w.status === "generating");
  const stuck = weekly.filter((w) => w.status === "pending");
  if (stuck.length > 0) after(() => Promise.all(stuck.map((w) => processWeeklyLog(w.id))));
  // Bezig zolang een schema nog niet aan de klant is vrijgegeven (behalve als het definitief is mislukt).
  const busy = plans.some((p) => !p.released_at && !(p.status === "failed" && p.attempts >= MAX_PLAN_ATTEMPTS)) || weekly.length > 0;
  return Response.json({ busy }, { headers: { "Cache-Control": "no-store" } });
}

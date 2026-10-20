import { after, connection } from "next/server";
import { currentCustomer } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { processPlan } from "@/lib/plans";
import { processWeeklyLog } from "@/lib/weekly-server";
import { plansForCustomer, weeklyLogsForCustomer } from "@/lib/repo";

const QUICK_RETRIES = 3;

export const maxDuration = 300;

/**
 * Status van de schema's van de ingelogde klant, voor Mijn schema's terwijl
 * een nieuw schema wordt gemaakt. Zet openstaande schema's ook (opnieuw) in
 * gang, voor het geval de achtergrondtaak na de check-in werd onderbroken.
 */
export async function GET() {
  // Altijd per verzoek: het antwoord hangt af van de ingelogde klant.
  await connection();
  if (!isDatabaseConfigured()) return Response.json({ busy: false });
  const customer = await currentCustomer();
  if (!customer) return Response.json({ busy: false }, { status: 401 });
  const plans = await plansForCustomer(customer.id);
  // Een paar snelle herhaalpogingen; daarna neemt de dagelijkse taak het over.
  const retry = (p: (typeof plans)[number]) => p.status === "pending" || (p.status === "failed" && p.attempts < QUICK_RETRIES);
  const open = plans.filter(retry);
  if (open.length > 0) after(() => Promise.all(open.map((p) => processPlan(p.id))));
  // Aanwijzingen bij een weegmoment die nog worden gemaakt.
  const weekly = (await weeklyLogsForCustomer(customer.id)).filter((w) => w.status === "pending" || w.status === "generating");
  const stuck = weekly.filter((w) => w.status === "pending");
  if (stuck.length > 0) after(() => Promise.all(stuck.map((w) => processWeeklyLog(w.id))));
  const busy = plans.some((p) => p.status === "generating" || retry(p)) || weekly.length > 0;
  return Response.json({ busy }, { headers: { "Cache-Control": "no-store" } });
}

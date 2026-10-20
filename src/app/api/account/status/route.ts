import { after, connection } from "next/server";
import { currentCustomer } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { processPlan } from "@/lib/plans";
import { plansForCustomer } from "@/lib/repo";

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
  const busy = plans.some((p) => p.status === "generating" || retry(p));
  return Response.json({ busy }, { headers: { "Cache-Control": "no-store" } });
}

import { isDatabaseConfigured } from "@/lib/db";
import { runScheduledWork } from "@/lib/plans";
import { cleanupExpiredData } from "@/lib/repo";
import { deleteJunctionUser } from "@/lib/health/junction";

export const maxDuration = 300;

/**
 * Dagelijkse taak (zie vercel.json): nieuwe schema's voor abonnees en
 * mislukte schema's opnieuw proberen. Beveiligd met CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Niet toegestaan", { status: 401 });
  }
  if (!isDatabaseConfigured()) return Response.json({ skipped: "geen database" });
  const { junctionUserIds, ...cleanup } = await cleanupExpiredData();
  for (const id of junctionUserIds) await deleteJunctionUser(id).catch((err) => console.error("Junction-gebruiker verwijderen mislukt", err));
  const result = await runScheduledWork(maxDuration * 1000 - 10_000);
  return Response.json({ ...result, cleanup });
}

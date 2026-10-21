import { isDatabaseConfigured } from "@/lib/db";
import { amsterdamDay, amsterdamHour } from "@/lib/dates";
import { runScheduledWork } from "@/lib/plans";
import { claimDailyRun, cleanupExpiredData } from "@/lib/repo";
import { deleteJunctionUser } from "@/lib/health/junction";

export const maxDuration = 300;

/** Vanaf dit uur (Nederlandse tijd) draait het dagelijkse deel: herinneringen gaan 's ochtends de deur uit. */
const DAILY_FROM_HOUR = 8;

/**
 * Geplande taak (zie vercel.json, elke 5 minuten): schema's op hun geplande
 * moment vrijgeven en mailen, en mislukte schema's opnieuw proberen. Eén keer
 * per dag, vanaf 08:00, ook de herinneringen en het opruimen. Beveiligd met
 * CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Niet toegestaan", { status: 401 });
  }
  if (!isDatabaseConfigured()) return Response.json({ skipped: "geen database" });
  const now = new Date();
  const daily = amsterdamHour(now) >= DAILY_FROM_HOUR && (await claimDailyRun(amsterdamDay(now)));
  let cleanup = null;
  if (daily) {
    const { junctionUserIds, ...counts } = await cleanupExpiredData();
    for (const id of junctionUserIds) await deleteJunctionUser(id).catch((err) => console.error("Junction-gebruiker verwijderen mislukt", err));
    cleanup = counts;
  }
  const result = await runScheduledWork(maxDuration * 1000 - 10_000, { daily });
  return Response.json({ daily, ...result, cleanup });
}

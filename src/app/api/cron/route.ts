import { db, isDatabaseConfigured, loadStoredConfig } from "@/lib/db";
import { amsterdamDay, amsterdamHour } from "@/lib/dates";
import { runScheduledWork } from "@/lib/plans";
import { claimDailyRun, cleanupExpiredData } from "@/lib/repo";
import { deleteJunctionUser } from "@/lib/health/junction";
import { isMollieConfigured } from "@/lib/mollie";
import { runSubscriptionMaintenance } from "@/lib/subscriptions";

export const maxDuration = 300;

/** Vanaf dit uur (Nederlandse tijd) draait het dagelijkse deel: herinneringen gaan 's ochtends de deur uit. */
const DAILY_FROM_HOUR = 8;

/** Zonder CRON_SECRET draait de taak hooguit eens per zoveel minuten, hoe vaak hij ook wordt aangeroepen. */
const OPEN_MIN_INTERVAL_MINUTES = 3;

/**
 * Geplande taak (zie vercel.json, elke 5 minuten): opgezegde abonnementen op
 * hun einddatum beëindigen, schema's op hun geplande moment vrijgeven en
 * mailen, en mislukte schema's opnieuw proberen. Eén keer per dag, vanaf
 * 08:00, ook de herinneringen, het opruimen en de controle van de abonnementen
 * bij Mollie.
 *
 * Staat CRON_SECRET bij Vercel, dan moet elke aanroep die sleutel meesturen
 * (Vercel doet dat zelf). Zonder CRON_SECRET hoeft er niets ingesteld te
 * worden: dan draait de taak voor aanroepen van Vercel Cron, maar hooguit eens
 * per 3 minuten. Dat is veilig omdat alles hieronder aan een tijdstip hangt en
 * dubbel draaien geen kwaad kan; een vervalste aanroep doet dus alleen wat toch
 * al gepland stond, en geeft geen cijfers terug.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorized = Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
  // Herkenbaar aan de headers van Vercel Cron. Niet waterdicht (headers zijn na te maken), daarom de rem hieronder.
  const fromVercelCron =
    request.headers.has("x-vercel-cron-schedule") || (request.headers.get("user-agent") ?? "").startsWith("vercel-cron/");
  if (!authorized && (secret || !fromVercelCron)) {
    return new Response("Niet toegestaan", { status: 401 });
  }
  if (!isDatabaseConfigured()) return Response.json({ skipped: "geen database" });
  await loadStoredConfig();
  const sql = await db();
  // Voor Beheer → Koppelingen: wanneer de geplande taak voor het laatst draaide.
  if (authorized) {
    await sql`
      insert into settings (key, value) values ('cron_last_run', to_jsonb(now()))
      on conflict (key) do update set value = excluded.value, updated_at = now()`.catch(() => {});
  } else {
    // Zonder sleutel: alleen als de vorige run lang genoeg geleden is (in één stap, dus ook bij gelijktijdige aanroepen).
    const claimed = await sql`
      insert into settings (key, value) values ('cron_last_run', to_jsonb(now()))
      on conflict (key) do update set value = excluded.value, updated_at = now()
        where settings.updated_at < now() - make_interval(mins => ${OPEN_MIN_INTERVAL_MINUTES})
      returning 1`;
    if (claimed.length === 0) return Response.json({ skipped: "net al gedraaid" });
  }
  const now = new Date();
  const daily = amsterdamHour(now) >= DAILY_FROM_HOUR && (await claimDailyRun(amsterdamDay(now)));
  let cleanup = null;
  if (daily) {
    const { junctionUserIds, ...counts } = await cleanupExpiredData();
    for (const id of junctionUserIds) await deleteJunctionUser(id).catch((err) => console.error("Junction-gebruiker verwijderen mislukt", err));
    cleanup = counts;
  }
  // Eerst de abonnementen, zodat een beëindigd abonnement geen nieuwe periode krijgt.
  const subscriptions = isMollieConfigured()
    ? await runSubscriptionMaintenance({ daily }).catch((err) => {
        console.error("Onderhoud van de abonnementen mislukt", err);
        return null;
      })
    : null;
  const result = await runScheduledWork(maxDuration * 1000 - 10_000, { daily });
  // Cijfers alleen met de sleutel.
  return authorized ? Response.json({ daily, subscriptions, ...result, cleanup }) : Response.json({ ok: true });
}

import { after } from "next/server";
import { isWithingsConfigured } from "@/lib/health/config";
import { connectionByExternalId, deleteConnection } from "@/lib/health/repo";
import { syncConnection } from "@/lib/health/sync";
import { WITHINGS_APPLI } from "@/lib/health/withings";

export const maxDuration = 60;

// Withings controleert bij het aanmelden of dit adres bereikbaar is.
export function HEAD() {
  return new Response(null, { status: 200 });
}

export function GET() {
  return new Response("ok");
}

/** Melding van Withings: er is een nieuwe meting. We halen de data zelf op (de melding bevat geen meetwaarden). */
export async function POST(request: Request) {
  if (!isWithingsConfigured()) return new Response("ok");
  const form = new URLSearchParams(await request.text());
  const userId = form.get("userid");
  const appli = Number(form.get("appli"));
  if (!userId) return new Response("ok");
  const conn = await connectionByExternalId("withings", userId);
  if (!conn) return new Response("ok");

  if (appli === WITHINGS_APPLI.profile && ["unlink", "delete"].includes(form.get("action") ?? "")) {
    // De klant heeft de koppeling in Withings zelf verbroken: dan wissen we ook bij ons alles.
    after(() => deleteConnection(conn.customer_id, "withings"));
    return new Response("ok");
  }
  const start = Number(form.get("startdate"));
  const days = start ? Math.min(30, Math.max(2, Math.ceil((Date.now() / 1000 - start) / 86400) + 1)) : 3;
  after(() => syncConnection(conn, days).then(() => undefined));
  return new Response("ok");
}

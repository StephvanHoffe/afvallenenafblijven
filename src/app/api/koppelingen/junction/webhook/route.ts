import { after } from "next/server";
import { isJunctionConfigured } from "@/lib/health/config";
import { verifyJunctionWebhook } from "@/lib/health/junction";
import { connectionByExternalId } from "@/lib/health/repo";
import { syncConnection } from "@/lib/health/sync";

export const maxDuration = 60;

/**
 * Webhook van Junction (nieuwe of bijgewerkte data, nieuwe bron). We lezen
 * alleen voor wie het is en halen de samenvattingen daarna zelf op; zo maakt
 * het niet uit welk soort bericht het precies is.
 */
export async function POST(request: Request) {
  if (!isJunctionConfigured()) return new Response("ok");
  const body = await request.text();
  if (!verifyJunctionWebhook(body, request.headers)) return new Response("Ongeldige handtekening", { status: 401 });

  let event: { event_type?: string; user_id?: string; data?: { user_id?: string } };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("ok");
  }
  const userId = event.user_id ?? event.data?.user_id;
  if (!userId) return new Response("ok");
  const conn = await connectionByExternalId("junction", userId);
  if (!conn) return new Response("ok");

  const type = event.event_type ?? "";
  const days = type.startsWith("historical.") || type === "provider.connection.created" ? 30 : 7;
  after(() => syncConnection(conn, days).then(() => undefined));
  return new Response("ok");
}

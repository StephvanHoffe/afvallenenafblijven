import { funnelEventSchema, isBot, recordFunnelEvent } from "@/lib/funnel";
import { isDemoMode } from "@/lib/admin/auth";

/** Ontvangt een stap van de anonieme funnelmeting (zie src/lib/track.ts). */
export async function POST(request: Request) {
  // In de demo (fictieve gegevens) meten we niets; zonder database slaat recordFunnelEvent niets op.
  if (isDemoMode()) return new Response(null, { status: 204 });
  const text = await request.text();
  if (text.length > 2000 || isBot(request.headers.get("user-agent"))) return new Response(null, { status: 204 });
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return new Response(null, { status: 204 });
  }
  const parsed = funnelEventSchema.safeParse(raw);
  if (parsed.success) {
    const e = parsed.data;
    await recordFunnelEvent({
      visitId: e.v,
      event: e.e,
      step: e.step,
      path: e.p,
      product: e.product,
      duration: e.duration,
      locale: e.l,
      device: e.d,
      source: e.s,
      campaign: e.c,
      landing: e.lp,
      referrer: e.r,
      seconds: e.sec,
    });
  }
  return new Response(null, { status: 204 });
}

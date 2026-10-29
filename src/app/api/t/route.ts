import { funnelEventSchema, isBot, recordFunnelEvent } from "@/lib/funnel";
import { isDemoMode } from "@/lib/admin/auth";

/** Vercel zet het land, de regio en de stad van de bezoeker in de headers; het IP-adres bewaren we niet. */
function place(headers: Headers): { country: string | null; region: string | null; city: string | null } {
  if (!process.env.VERCEL) return { country: null, region: null, city: null };
  let city = headers.get("x-vercel-ip-city");
  try {
    city = city ? decodeURIComponent(city) : null;
  } catch {
    city = null;
  }
  return { country: headers.get("x-vercel-ip-country"), region: headers.get("x-vercel-ip-country-region"), city };
}

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
      medium: e.m,
      campaign: e.c,
      content: e.ct,
      landing: e.lp,
      referrer: e.r,
      seconds: e.sec,
      scroll: e.sc,
      // De plaats alleen bij een paginaweergave: per bezoek is één keer genoeg.
      ...(e.e === "page_view" ? place(request.headers) : {}),
    });
  }
  return new Response(null, { status: 204 });
}

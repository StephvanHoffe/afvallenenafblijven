import "server-only";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/lib/db";

/**
 * Opslag van de anonieme funnelmeting (zie src/lib/track.ts). De stappen
 * "betaalstap gestart" en "betaald" schrijft de server zelf weg, met het
 * bezoeknummer dat bij de vragenlijst is meegestuurd.
 */

const short = (max: number) => z.string().max(max).optional().nullable();

export const funnelEventSchema = z.object({
  v: z.string().max(64).optional().nullable(),
  e: z.enum(["page_view", "quiz_step", "plan_select", "discount_applied", "checkout_submit", "checkout_error"]),
  step: short(40),
  product: short(20),
  duration: short(20),
  p: short(200),
  l: short(5),
  d: z.enum(["mobiel", "tablet", "desktop"]).optional().nullable(),
  s: short(120),
  c: short(120),
  lp: short(60),
});

export interface FunnelEventInput {
  visitId?: string | null;
  event: string;
  step?: string | null;
  path?: string | null;
  product?: string | null;
  duration?: string | null;
  locale?: string | null;
  device?: string | null;
  source?: string | null;
  campaign?: string | null;
  landing?: string | null;
}

const clean = (v: string | null | undefined, max = 120) => (v ? v.trim().replace(/[^\p{L}\p{N} ._\-+/|:]/gu, "").slice(0, max) || null : null);

export async function recordFunnelEvent(e: FunnelEventInput): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    const sql = await db();
    await sql`
      insert into funnel_events (visit_id, event, step, path, product, duration, locale, device, source, campaign, landing)
      values (${clean(e.visitId, 64)}, ${e.event}, ${clean(e.step, 40)}, ${clean(e.path, 200)}, ${clean(e.product, 20)},
              ${clean(e.duration, 20)}, ${clean(e.locale, 5)}, ${clean(e.device, 10)}, ${clean(e.source)}, ${clean(e.campaign)},
              ${clean(e.landing, 60)})`;
  } catch (err) {
    // Meten mag een bestelling nooit tegenhouden.
    console.error("Funnelstap opslaan mislukt", err);
  }
}

/** Zoekmachines, linkvoorbeelden en geautomatiseerde browsers tellen niet mee. */
export function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true;
  return /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|lighthouse|headless|pingdom|uptime|monitor/i.test(userAgent);
}

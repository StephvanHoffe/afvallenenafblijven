import { site } from "@/config/site";

/**
 * Tevredenheidsgarantie (zie art. 10 van de algemene voorwaarden): binnen
 * `site.guarantee.days` dagen na de eerste aankoop kan de klant de eerste
 * betaling volledig terugvragen. Dat kan via Mijn schema's of per e-mail.
 */

const amsterdamParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Amsterdam",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Verschil tussen Nederlandse tijd en UTC op een moment, in milliseconden. */
function amsterdamOffsetMs(utcMs: number): number {
  const parts = amsterdamParts.formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - (utcMs - (utcMs % 1000));
}

/**
 * Laatste moment om de garantie aan te vragen: het einde van de dag (Nederlandse
 * tijd) die `days` dagen na de aankoop valt. Zo klopt "tot en met <datum>".
 */
export function guaranteeDeadline(orderedAt: Date, days: number = site.guarantee.days): Date {
  const local = new Date(orderedAt.getTime() + amsterdamOffsetMs(orderedAt.getTime()));
  const nextMidnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + days + 1);
  return new Date(nextMidnight - amsterdamOffsetMs(nextMidnight) - 1);
}

/** De bestelling waar de garantie op slaat: de eerste aankoop van de klant. */
export function guaranteeOrder<T extends { created_at: Date }>(orders: T[]): T | null {
  return orders.reduce<T | null>((first, o) => (!first || o.created_at < first.created_at ? o : first), null);
}

/** Kan de garantie voor deze bestelling (nu) nog worden aangevraagd? */
export function guaranteeAvailable(order: { created_at: Date; amount_cents: number }, now: number = Date.now()): boolean {
  return site.guarantee.enabled && order.amount_cents > 0 && now <= guaranteeDeadline(order.created_at).getTime();
}

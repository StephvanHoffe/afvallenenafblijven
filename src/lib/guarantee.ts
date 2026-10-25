import { site } from "@/config/site";
import { amsterdamMidnight } from "@/lib/dates";

/**
 * Tevredenheidsgarantie (zie art. 10 van de algemene voorwaarden): binnen
 * `site.guarantee.days` dagen na de eerste aankoop kan de klant de eerste
 * betaling volledig terugvragen. Dat kan via Mijn schema's of per e-mail.
 */

/**
 * Laatste moment om de garantie aan te vragen: het einde van de dag (Nederlandse
 * tijd) die `days` dagen na de aankoop valt. Zo klopt "tot en met <datum>".
 */
export function guaranteeDeadline(orderedAt: Date, days: number = site.guarantee.days): Date {
  return new Date(amsterdamMidnight(orderedAt, days + 1).getTime() - 1);
}

/** De bestelling waar de garantie op slaat: de eerste aankoop van de klant. */
export function guaranteeOrder<T extends { created_at: Date }>(orders: T[]): T | null {
  return orders.reduce<T | null>((first, o) => (!first || o.created_at < first.created_at ? o : first), null);
}

/** Kan de garantie voor deze bestelling (nu) nog worden aangevraagd? */
export function guaranteeAvailable(order: { created_at: Date; amount_cents: number }, now: number = Date.now()): boolean {
  return site.guarantee.enabled && order.amount_cents > 0 && now <= guaranteeDeadline(order.created_at).getTime();
}

import { euro } from "@/lib/format";
import type { Locale } from "@/i18n/config";

/**
 * Kortingscodes (gedeeld door de vragenlijst, de server en het beheer). Een
 * code geeft een percentage of een vast bedrag korting, op de eerste betaling
 * ("once"), op de eerste N maanden ("repeating") of zolang het abonnement
 * loopt ("forever"). Een geldige code vervangt de lanceringskorting.
 */

export type DiscountDuration = "once" | "repeating" | "forever";

export interface DiscountTerms {
  code: string;
  percentOff: number | null;
  amountOffCents: number | null;
  duration: DiscountDuration;
  durationMonths: number | null;
}

/** Hoofdletters, cijfers, - en _; maximaal 30 tekens. */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 30);
}

/** Bedrag na korting (nooit onder nul). */
export function discountedAmount(cents: number, terms: Pick<DiscountTerms, "percentOff" | "amountOffCents">): number {
  if (terms.percentOff) return Math.max(0, Math.round(cents * (1 - terms.percentOff / 100)));
  if (terms.amountOffCents) return Math.max(0, cents - terms.amountOffCents);
  return cents;
}

/** Hoeveel betalingen de korting geldt (null = zolang het abonnement loopt). */
export function discountedPayments(terms: Pick<DiscountTerms, "duration" | "durationMonths">): number | null {
  return terms.duration === "once" ? 1 : terms.duration === "repeating" ? Math.max(1, terms.durationMonths ?? 1) : null;
}

/** "20% korting op je eerste maand", "€ 5,00 korting per maand, de eerste 3 maanden", … */
export function describeDiscount(terms: Omit<DiscountTerms, "code">, l: Locale = "nl", subscription = true): string {
  const off = terms.percentOff ? `${terms.percentOff}%` : euro(terms.amountOffCents ?? 0, l);
  if (!subscription) return l === "en" ? `${off} off` : `${off} korting`;
  if (terms.duration === "once") return l === "en" ? `${off} off your first month` : `${off} korting op je eerste maand`;
  if (terms.duration === "repeating") {
    const n = Math.max(1, terms.durationMonths ?? 1);
    return l === "en" ? `${off} off for the first ${n} months` : `${off} korting per maand, de eerste ${n} maanden`;
  }
  return l === "en" ? `${off} off every month` : `${off} korting op elke maand`;
}

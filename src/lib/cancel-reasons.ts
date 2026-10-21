import type { Locale } from "@/i18n/config";

/** Vaste keuzes in het opzegformulier, zodat je in het beheer ziet waarom klanten stoppen. */
export const CANCEL_REASONS = ["te_duur", "geen_tijd", "doel_bereikt", "past_niet", "gezondheid", "anders"] as const;
export type CancelReason = (typeof CANCEL_REASONS)[number];

const labels: Record<Locale, Record<CancelReason, string>> = {
  nl: {
    te_duur: "Te duur",
    geen_tijd: "Geen tijd of motivatie op dit moment",
    doel_bereikt: "Mijn doel is bereikt",
    past_niet: "De schema's passen niet bij mij",
    gezondheid: "Gezondheid of zwangerschap",
    anders: "Iets anders",
  },
  en: {
    te_duur: "Too expensive",
    geen_tijd: "No time or motivation right now",
    doel_bereikt: "I've reached my goal",
    past_niet: "The plans aren't right for me",
    gezondheid: "Health or pregnancy",
    anders: "Something else",
  },
};

export function cancelReasonLabel(reason: string | null, l: Locale = "nl"): string {
  if (!reason) return l === "en" ? "Not given" : "Niet opgegeven";
  return (labels[l] as Record<string, string>)[reason] ?? reason;
}

export function isCancelReason(v: unknown): v is CancelReason {
  return typeof v === "string" && (CANCEL_REASONS as readonly string[]).includes(v);
}

import { z } from "zod";

/**
 * Campagnebron van een bezoeker (utm-parameters uit de advertentielink) en de
 * landingspagina waarop die binnenkwam. Wordt via de links meegegeven aan de
 * vragenlijst en bij de bestelling opgeslagen, zodat je per campagne ziet wat
 * die oplevert. Er wordt niets in de browser bewaard.
 */

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/** Alleen gewone tekens, ingekort tot 120 tekens (te lange waarden worden ingekort, niet geweigerd). */
const value = z
  .string()
  .max(2000)
  .transform((v) => v.trim().replace(/[^\p{L}\p{N} ._\-+/|:]/gu, "").slice(0, 120) || undefined)
  .optional();

export const campaignSchema = z
  .object({
    source: value,
    medium: value,
    campaign: value,
    content: value,
    term: value,
    /** Landingspagina, bijv. "lp" of "lp/voeding". */
    landing: value,
  })
  .partial();

export type Campaign = z.infer<typeof campaignSchema>;

/** Leest de campagne uit de queryparameters; null als er geen utm-gegevens of landingspagina zijn. */
export function campaignFromParams(params: URLSearchParams): Campaign | null {
  const raw = {
    source: params.get("utm_source") ?? undefined,
    medium: params.get("utm_medium") ?? undefined,
    campaign: params.get("utm_campaign") ?? undefined,
    content: params.get("utm_content") ?? undefined,
    term: params.get("utm_term") ?? undefined,
    landing: params.get("lp") ?? undefined,
  };
  const parsed = campaignSchema.safeParse(raw);
  if (!parsed.success) return null;
  const clean = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v)) as Campaign;
  return Object.keys(clean).length ? clean : null;
}

/** De utm-parameters (en lp) uit een querystring, om door te geven aan een volgende pagina. */
export function forwardableParams(search: string): URLSearchParams {
  const from = new URLSearchParams(search);
  const out = new URLSearchParams();
  for (const k of [...UTM_KEYS, "lp"]) {
    const v = from.get(k);
    if (v) out.set(k, v.slice(0, 120));
  }
  return out;
}

/** Korte omschrijving voor het beheer, bijv. "meta / cpc · herfst-2026 (lp/voeding)". */
export function describeCampaign(c: Campaign | null | undefined): string | null {
  if (!c) return null;
  const head = [c.source, c.medium].filter(Boolean).join(" / ");
  const parts = [head, c.campaign, c.content].filter(Boolean).join(" · ");
  return [parts, c.landing ? `(${c.landing})` : ""].filter(Boolean).join(" ") || null;
}

/** Gedeelde helpers voor cookietoestemming (alleen in de browser gebruiken). */

export const CONSENT_COOKIE = "afb_cookie_consent";
export const CONSENT_VERSION = 1;
export const CONSENT_EVENT = "afb:consent-changed";
export const OPEN_SETTINGS_EVENT = "afb:open-cookie-settings";

export interface ConsentState {
  v: number;
  analytics: boolean;
  marketing: boolean;
  /** ISO-datum waarop de keuze is gemaakt. */
  date: string;
}

export function readConsent(): ConsentState | null {
  if (typeof document === "undefined") return null;
  try {
    // document.cookie kan een fout geven in afgeschermde omgevingen (bijv. een iframe).
    const raw = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
      ?.slice(CONSENT_COOKIE.length + 1);
    if (!raw) return null;
    const parsed = JSON.parse(decodeURIComponent(raw)) as ConsentState;
    return parsed.v === CONSENT_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export function writeConsent(choice: { analytics: boolean; marketing: boolean }): ConsentState {
  const state: ConsentState = { v: CONSENT_VERSION, ...choice, date: new Date().toISOString() };
  const secure = location.protocol === "https:" ? "; Secure" : "";
  try {
    // 12 maanden geldig; daarna vragen we opnieuw om toestemming.
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(state))}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax${secure}`;
  } catch {
    /* cookies geblokkeerd: de keuze geldt dan alleen voor dit bezoek */
  }
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: state }));
  return state;
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}

type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;

/**
 * Meet een conversiegebeurtenis. Doet niets als er geen toestemming is (dan
 * zijn de scripts simpelweg niet geladen).
 */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: Gtag; fbq?: Fbq };
  w.gtag?.("event", name, params);
  const metaEvents: Record<string, string> = {
    quiz_start: "Lead",
    begin_checkout: "InitiateCheckout",
    purchase: "Purchase",
    view_pricing: "ViewContent",
  };
  if (metaEvents[name]) w.fbq?.("track", metaEvents[name], params);
}

/**
 * Eigen, anonieme funnelmeting (alleen in de browser gebruiken). We meten
 * welke stappen bezoekers zetten (pagina's, vragen in de vragenlijst, plan
 * kiezen, afrekenen) om te zien waar mensen afhaken. Er worden geen cookies
 * gezet en geen persoonsgegevens, IP-adressen of browsergegevens bewaard: alleen
 * een willekeurig bezoeknummer per tabblad (sessionStorage, verdwijnt als het
 * tabblad sluit), het soort apparaat en de campagne uit de link. Wie in de
 * browser "Do Not Track" of Global Privacy Control aanzet, wordt niet gemeten.
 * De gegevens gaan nergens anders heen dan naar onze eigen database.
 */

const VISIT_KEY = "afb_bezoek";

export type FunnelEvent =
  | "page_view"
  | "quiz_step"
  | "plan_select"
  | "discount_applied"
  | "checkout_submit"
  | "checkout_error";

function enabled(): boolean {
  if (typeof window === "undefined") return false;
  // Of er echt iets wordt opgeslagen, beslist de server (niet in de demo of zonder database).
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl !== true && nav.doNotTrack !== "1";
}

/** Willekeurig bezoeknummer voor dit tabblad (null als opslag niet kan). */
export function visitId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = sessionStorage.getItem(VISIT_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(VISIT_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function deviceType(): "mobiel" | "tablet" | "desktop" {
  const w = window.innerWidth;
  return w < 768 ? "mobiel" : w < 1100 ? "tablet" : "desktop";
}

/** Meet één stap. Doet niets als meten uit staat; fouten worden genegeerd. */
export function track(event: FunnelEvent, data: { step?: string; product?: string | null; duration?: string | null } = {}) {
  if (!enabled()) return;
  try {
    const params = new URLSearchParams(window.location.search);
    const body = JSON.stringify({
      v: visitId(),
      e: event,
      step: data.step,
      product: data.product ?? undefined,
      duration: data.duration ?? undefined,
      p: window.location.pathname,
      l: document.documentElement.lang,
      d: deviceType(),
      s: params.get("utm_source") ?? undefined,
      c: params.get("utm_campaign") ?? undefined,
      lp: params.get("lp") ?? undefined,
    });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/t", blob)) {
      void fetch("/api/t", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    }
  } catch {
    /* meten mag de site nooit hinderen */
  }
}

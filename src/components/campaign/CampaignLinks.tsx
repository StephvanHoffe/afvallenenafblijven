"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { stripLocale } from "@/i18n/config";
import { forwardableParams } from "@/lib/campaign";
import { trackEvent } from "@/lib/consent";

/**
 * Geeft de campagnegegevens uit de advertentielink (utm_*) en de naam van de
 * landingspagina door aan de vragenlijst, zodat de bestelling aan de campagne
 * gekoppeld blijft (ook als de cookietoestemming pas later komt). Meet ook
 * klikken op de startknoppen. Bewaart niets in de browser.
 */
export function CampaignLinks() {
  const router = useRouter();

  useEffect(() => {
    const landing = stripLocale(window.location.pathname).replace(/^\//, "") || "lp";
    trackEvent("view_promotion", { promotion_name: landing });

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement) || a.target === "_blank") return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || stripLocale(url.pathname) !== "/start") return;

      trackEvent("select_promotion", { promotion_name: landing, creative_slot: a.dataset.lpCta ?? "link", goal: url.searchParams.get("doel") ?? undefined });
      const extra = forwardableParams(window.location.search);
      if (!extra.has("lp")) extra.set("lp", landing);
      for (const [k, v] of extra) if (!url.searchParams.has(k)) url.searchParams.set(k, v);
      e.preventDefault();
      router.push(url.pathname + url.search + url.hash);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}

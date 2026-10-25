"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/track";

/** Mijn schema's en de schema's zelf horen niet bij de funnel. */
const SKIP = /^\/(en\/)?(account|schema)(\/|$)/;

/**
 * Meet elke paginaweergave voor de funnel en de bezoekersanalyse (anoniem, zie
 * src/lib/track.ts), en hoe lang de pagina zichtbaar openstond: bij verlaten,
 * wisselen van tabblad of sluiten sturen we de opgetelde seconden.
 */
export function PageTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (SKIP.test(pathname)) return;
    const path = window.location.pathname;
    track("page_view");
    let visibleSince = document.visibilityState === "visible" ? Date.now() : null;
    let total = 0;
    const send = () => {
      if (visibleSince !== null) {
        total += Date.now() - visibleSince;
        visibleSince = null;
      }
      const seconds = Math.round(total / 1000);
      total = 0;
      if (seconds >= 1) track("page_leave", { path, seconds: Math.min(1800, seconds) });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") send();
      else visibleSince = Date.now();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", send);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", send);
      send();
    };
  }, [pathname]);
  return null;
}

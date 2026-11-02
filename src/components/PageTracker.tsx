"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/track";

/** Mijn schema's en de schema's zelf horen niet bij de funnel. */
const SKIP = /^\/(en\/)?(account|schema)(\/|$)/;

/** De eerste pagina van dit tabblad (een volledige paginalading, geen klik binnen de site). */
let firstPage = true;

/**
 * Meet elke paginaweergave voor de funnel en de bezoekersanalyse (anoniem, zie
 * src/lib/track.ts), hoe lang de pagina zichtbaar openstond en hoe ver erop is
 * gescrold: bij verlaten, wisselen van tabblad of sluiten sturen we de
 * opgetelde seconden en de verste scrollpositie (in procenten van de pagina).
 * Bij de eerste pagina tellen we vanaf het openen van de link (inclusief het
 * laden), zodat de tijd de echte bezoekduur is en niet pas begint als de
 * pagina klaar is.
 */
export function PageTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const initial = firstPage;
    firstPage = false;
    if (SKIP.test(pathname)) return;
    const path = window.location.pathname;
    track("page_view");
    // performance.timeOrigin = het moment waarop de link werd geopend (in ms, net als Date.now()).
    const openedAt = initial && performance.timeOrigin > 0 && performance.timeOrigin <= Date.now() ? performance.timeOrigin : Date.now();
    let visibleSince = document.visibilityState === "visible" ? openedAt : null;
    let total = 0;
    let deepest = 0;
    const measure = () => {
      const doc = document.documentElement;
      // Past de pagina op het scherm, dan is alles gezien.
      const seen = doc.scrollHeight <= window.innerHeight ? 1 : (window.scrollY + window.innerHeight) / doc.scrollHeight;
      deepest = Math.max(deepest, Math.min(100, Math.round(seen * 100)));
    };
    let frame = 0;
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(() => ((frame = 0), measure()));
    };
    // Eén keer na het laden (past de pagina op het scherm?) en verder bij scrollen. Niet bij het
    // verlaten: bij doorklikken staat de volgende pagina dan al in beeld.
    const settled = window.setTimeout(measure, 1000);
    const send = () => {
      if (visibleSince !== null) {
        total += Date.now() - visibleSince;
        visibleSince = null;
      }
      const seconds = Math.round(total / 1000);
      total = 0;
      if (seconds >= 1) track("page_leave", { path, seconds: Math.min(1800, seconds), scroll: deepest });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") send();
      else visibleSince = Date.now();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", send);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", send);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      window.clearTimeout(settled);
      send();
    };
  }, [pathname]);
  return null;
}

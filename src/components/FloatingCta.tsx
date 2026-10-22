"use client";

import Link from "@/i18n/Link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { Countdown } from "@/components/promo/Countdown";
import type { ProductId } from "@/config/pricing";
import { defineCopy, stripLocale } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import { CONSENT_EVENT, OPEN_SETTINGS_EVENT, readConsent } from "@/lib/consent";
import type { PromoView } from "@/lib/promotion";

const copy = defineCopy({
  nl: {
    main: { voeding: "Ja, maak mijn voedingsschema!", training: "Ja, maak mijn trainingsschema!", bundel: "Ja, maak mijn plan!" } as Record<ProductId, string>,
    mainAny: "Ja, maak mijn plan!",
    sub: "2 min invullen · binnen 2 uur in je mailbox",
    promoMain: (pct: number) => `Pak ${pct}% Black Friday-korting`,
    promoMainOther: (pct: number, label: string) => `Pak ${pct}% ${label}-korting`,
    promoUntil: (until: string) => `Alleen t/m ${until}`,
  },
  en: {
    main: { voeding: "Yes, make my nutrition plan!", training: "Yes, make my training plan!", bundel: "Yes, make my plan!" } as Record<ProductId, string>,
    mainAny: "Yes, make my plan!",
    sub: "2 min to fill in · in your inbox within 2 hours",
    promoMain: (pct: number) => `Get ${pct}% off for Black Friday`,
    promoMainOther: (pct: number, label: string) => `Get ${pct}% off: ${label}`,
    promoUntil: (until: string) => `Only until ${until}`,
  },
});

/** Pagina's zonder zwevende knop: de vragenlijst zelf, de klantomgeving en de juridische teksten. */
const HIDDEN =
  /^\/(start|account|bedankt|inloggen|schema|herroepen|abonnement-opzeggen|algemene-voorwaarden|privacybeleid|cookiebeleid|disclaimer)(\/|$)/;

/** Productpagina's en campagnevarianten starten de vragenlijst met dat plan al gekozen. */
const PRODUCT_PAGES: Record<string, ProductId> = {
  "/voedingsschema": "voeding",
  "/trainingsschema": "training",
  "/bundel": "bundel",
  "/lp/voeding": "voeding",
  "/lp/training": "training",
};

/**
 * De zwevende startknop: altijd in beeld op de verkooppagina's, rechtsonder op
 * een groot scherm en over de volle breedte op mobiel. Zweeft zacht, met een
 * gloed en een glans; tijdens een actie in actiekleuren met de aftelklok.
 * Staat de cookiebanner open, dan wacht de knop tot er een keuze is gemaakt.
 */
export function FloatingCta({
  promo,
  spacer = true,
}: {
  promo: PromoView | null;
  /** Ruimte onder de footer (in de footerkleur), zodat de knop onderaan niets afdekt. */
  spacer?: boolean;
}) {
  const l = useLocale();
  const c = copy[l];
  const path = stripLocale(usePathname() ?? "/");
  const [shown, setShown] = useState(false);
  const [cookieOpen, setCookieOpen] = useState(true);

  useEffect(() => {
    const sync = () => setCookieOpen(readConsent() === null);
    // Na een keuze is de banner weg, ook als de browser de cookie niet bewaart.
    const chosen = () => setCookieOpen(false);
    const openSettings = () => setCookieOpen(true);
    sync();
    window.addEventListener(CONSENT_EVENT, chosen);
    window.addEventListener(OPEN_SETTINGS_EVENT, openSettings);
    // Kort na het laden inschuiven, zodat de knop opvalt zonder de pagina te laten verspringen.
    const timer = window.setTimeout(() => setShown(true), 700);
    return () => {
      window.removeEventListener(CONSENT_EVENT, chosen);
      window.removeEventListener(OPEN_SETTINGS_EVENT, openSettings);
      window.clearTimeout(timer);
    };
  }, []);

  if (HIDDEN.test(path)) return null;
  const product = PRODUCT_PAGES[path] ?? null;
  const href = product ? `/start?plan=${product}` : "/start";
  const pct = promo ? Math.max(0, ...Object.values(promo.percentOff)) : 0;
  const bf = promo?.theme === "blackfriday";
  const visible = shown && !cookieOpen;

  const main = promo && pct > 0 ? (bf ? c.promoMain(pct) : c.promoMainOther(pct, promo.label)) : product ? c.main[product] : c.mainAny;

  return (
    <>
      {spacer && <div className="no-print h-24 bg-brand-950" aria-hidden />}
      <div
        className={`no-print fixed inset-x-3 bottom-3 z-50 transition-all duration-500 ease-out sm:inset-x-auto sm:right-6 sm:bottom-6 ${
          visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[140%] opacity-0"
        }`}
        aria-hidden={!visible}
      >
        <div className="cta-float relative">
          {/* Gloed die uitdijt achter de knop */}
          <span
            className={`cta-halo pointer-events-none absolute inset-0 rounded-full ${bf ? "bg-lime-glow/60" : "bg-brand-500/50"}`}
            aria-hidden
          />
          <Link
            href={href}
            data-lp-cta="zwevend"
            tabIndex={visible ? 0 : -1}
            className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-full py-2.5 pr-2.5 pl-3 shadow-[0_18px_40px_-12px_rgb(10_36_23/0.55)] transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-px sm:w-auto sm:min-w-[22rem] ${
              bf ? "bg-black text-white ring-2 ring-lime-glow" : "bg-brand-600 text-white ring-1 ring-white/20 hover:bg-brand-700"
            }`}
          >
            {/* Glans die over de knop trekt */}
            <span className="cta-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" aria-hidden />
            <span
              className={`relative grid size-12 shrink-0 place-items-center rounded-full text-[0.8125rem] font-black tracking-tight ${
                bf ? "bg-lime-glow text-brand-950" : "bg-white/15 text-lime-glow"
              }`}
              aria-hidden
            >
              {promo && pct > 0 ? `−${pct}%` : <Sparkles className="size-5" />}
            </span>
            <span className="relative min-w-0 flex-1 leading-tight">
              <span className="block text-[0.9375rem] font-extrabold sm:text-base">{main}</span>
              <span className={`block text-xs font-semibold ${bf ? "text-lime-glow" : "text-white/80"}`}>
                {promo && pct > 0 ? (
                  <>
                    <Countdown endsAt={promo.endsAt} variant="inline" />
                    <span className="sr-only"> · {c.promoUntil(promo.endsLabel)}</span>
                  </>
                ) : (
                  c.sub
                )}
              </span>
            </span>
            <span
              className={`relative grid size-11 shrink-0 place-items-center rounded-full ${bf ? "bg-white text-black" : "bg-lime-glow text-brand-950"}`}
              aria-hidden
            >
              {bf ? <Zap className="cta-nudge size-5" /> : <ArrowRight className="cta-nudge size-5" />}
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}

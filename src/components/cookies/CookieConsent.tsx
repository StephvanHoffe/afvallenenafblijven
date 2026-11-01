"use client";

import Link from "@/i18n/Link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import {
  CONSENT_EVENT,
  OPEN_SETTINGS_EVENT,
  readConsent,
  writeConsent,
  type ConsentState,
} from "@/lib/consent";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const copy = defineCopy({
  nl: {
    title: "Mogen we cookies gebruiken?",
    settingsTitle: "Cookie-instellingen",
    text: "We gebruiken noodzakelijke cookies om de site te laten werken. Met jouw toestemming gebruiken we ook cookies om de site te verbeteren en onze advertenties te meten. Meer info in ons",
    short: "Alleen met jouw toestemming, voor statistieken en advertenties. Zie ons",
    policy: "cookiebeleid",
    necessary: "Noodzakelijk",
    necessaryText: "Nodig voor inloggen, betalen en het onthouden van je keuze.",
    analytics: "Analytisch",
    analyticsText: "Anonieme statistieken over het gebruik van de site.",
    marketing: "Marketing",
    marketingText: "Meten en verbeteren van onze advertenties (bijv. Meta).",
    rejectAll: "Alles weigeren",
    save: "Keuze opslaan",
    necessaryOnly: "Alleen noodzakelijk",
    acceptAll: "Alles accepteren",
    choose: "Zelf kiezen",
  },
  en: {
    title: "May we use cookies?",
    settingsTitle: "Cookie settings",
    text: "We use necessary cookies to make the site work. With your consent, we also use cookies to improve the site and measure our adverts. More information in our",
    short: "Only with your consent, for statistics and adverts. See our",
    policy: "cookie policy",
    necessary: "Necessary",
    necessaryText: "Needed for logging in, paying and remembering your choice.",
    analytics: "Analytics",
    analyticsText: "Anonymous statistics about the use of the site.",
    marketing: "Marketing",
    marketingText: "Measuring and improving our adverts (e.g. Meta).",
    rejectAll: "Reject all",
    save: "Save choice",
    necessaryOnly: "Necessary only",
    acceptAll: "Accept all",
    choose: "Let me choose",
  },
});

/**
 * Cookiebanner volgens de richtlijnen van de Autoriteit Persoonsgegevens:
 * geen vooraf aangevinkte keuzes, "weigeren" even makkelijk als "accepteren",
 * en analytische/marketingscripts laden pas ná toestemming.
 */
export function CookieConsent() {
  const c = copy[useLocale()];
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    // Toestemming kan alleen in de browser worden uitgelezen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(existing);
    setShowBanner(!existing);
    const onChange = (e: Event) => setConsent((e as CustomEvent<ConsentState>).detail);
    const onOpen = () => {
      const current = readConsent();
      setAnalytics(current?.analytics ?? false);
      setMarketing(current?.marketing ?? false);
      setShowSettings(true);
      setShowBanner(true);
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    window.addEventListener(OPEN_SETTINGS_EVENT, onOpen);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onChange);
      window.removeEventListener(OPEN_SETTINGS_EVENT, onOpen);
    };
  }, []);

  function save(choice: { analytics: boolean; marketing: boolean }) {
    const hadTracking = consent?.analytics || consent?.marketing;
    writeConsent(choice);
    setShowBanner(false);
    setShowSettings(false);
    // Ingetrokken toestemming: herlaad zodat geladen scripts verdwijnen.
    if (hadTracking && (!choice.analytics || !choice.marketing)) window.location.reload();
  }

  return (
    <>
      {consent?.analytics && GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {consent?.marketing && META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      )}

      {showBanner && (
        <div
          className="no-print fixed inset-x-2 bottom-2 z-[60] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[26rem]"
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-title"
        >
          {/* Op mobiel compact: de melding mag de startknop van de pagina niet bedekken. */}
          <div className="card p-3.5 shadow-[var(--shadow-lift)] sm:p-5">
            <div className="mb-1.5 flex items-center gap-2 sm:mb-2">
              <Cookie className="size-5 text-brand-600" aria-hidden />
              <h2 id="cookie-title" className="text-[0.9375rem] font-bold sm:text-base">
                {showSettings ? c.settingsTitle : c.title}
              </h2>
              {!showSettings && (
                <button
                  type="button"
                  className="ml-auto shrink-0 text-sm font-semibold whitespace-nowrap text-muted underline hover:text-ink sm:hidden"
                  onClick={() => setShowSettings(true)}
                >
                  {c.choose}
                </button>
              )}
            </div>
            {!showSettings ? (
              <p className="text-[0.8125rem] leading-snug text-muted sm:text-sm sm:leading-relaxed">
                <span className="sm:hidden">{c.short}</span>
                <span className="hidden sm:inline">{c.text}</span>{" "}
                <Link href="/cookiebeleid" className="font-semibold text-brand-700 underline">
                  {c.policy}
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-3 text-sm">
                <label className="flex items-start gap-3 rounded-2xl bg-sand p-3">
                  <input type="checkbox" checked disabled className="mt-1 size-4 accent-brand-600" />
                  <span>
                    <span className="font-semibold">{c.necessary}</span>
                    <span className="block text-muted">{c.necessaryText}</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-sand p-3">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="mt-1 size-4 accent-brand-600"
                  />
                  <span>
                    <span className="font-semibold">{c.analytics}</span>
                    <span className="block text-muted">{c.analyticsText}</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-sand p-3">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="mt-1 size-4 accent-brand-600"
                  />
                  <span>
                    <span className="font-semibold">{c.marketing}</span>
                    <span className="block text-muted">{c.marketingText}</span>
                  </span>
                </label>
              </div>
            )}
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:mt-4">
              {showSettings ? (
                <>
                  <button type="button" className="btn-secondary !px-3 !py-2 text-sm sm:!py-2.5" onClick={() => save({ analytics: false, marketing: false })}>
                    {c.rejectAll}
                  </button>
                  <button type="button" className="btn-primary !px-3 !py-2 text-sm sm:!py-2.5" onClick={() => save({ analytics, marketing })}>
                    {c.save}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn-secondary !px-3 !py-2 text-sm sm:!py-2.5" onClick={() => save({ analytics: false, marketing: false })}>
                    {c.necessaryOnly}
                  </button>
                  <button type="button" className="btn-primary !px-3 !py-2 text-sm sm:!py-2.5" onClick={() => save({ analytics: true, marketing: true })}>
                    {c.acceptAll}
                  </button>
                </>
              )}
            </div>
            {!showSettings && (
              <button
                type="button"
                className="mt-3 hidden w-full text-center text-sm font-semibold text-muted underline hover:text-ink sm:block"
                onClick={() => setShowSettings(true)}
              >
                {c.choose}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

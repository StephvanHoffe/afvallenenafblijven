import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { ArrowRight } from "lucide-react";
import { CampaignLinks } from "@/components/campaign/CampaignLinks";
import { CookieConsent } from "@/components/cookies/CookieConsent";
import { FloatingCta } from "@/components/FloatingCta";
import { CookieSettingsButton } from "@/components/cookies/CookieSettingsButton";
import { LanguageSwitcher, LanguageSwitcherFallback } from "@/components/i18n/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { site } from "@/config/site";
import { resultDisclaimer } from "@/content/disclaimers";
import { defineCopy } from "@/i18n/config";
import Link from "@/i18n/Link";
import { getLocale } from "@/i18n/server";
import { currentPromotion } from "@/lib/promotion";

const copy = defineCopy({
  nl: {
    skip: "Naar de inhoud",
    start: "Start je gratis vragenlijst",
    startShort: "Start",
    legal: [
      { href: "/algemene-voorwaarden", label: "Algemene voorwaarden" },
      { href: "/privacybeleid", label: "Privacybeleid" },
      { href: "/cookiebeleid", label: "Cookiebeleid" },
      { href: "/disclaimer", label: "Disclaimer" },
      { href: "/contact", label: "Contact" },
    ],
    kvk: "KvK",
    vat: "Btw",
    medical: "Onze schema's zijn geen vervanging van medisch advies.",
  },
  en: {
    skip: "Skip to content",
    start: "Start your free questionnaire",
    startShort: "Start",
    legal: [
      { href: "/algemene-voorwaarden", label: "Terms and conditions" },
      { href: "/privacybeleid", label: "Privacy policy" },
      { href: "/cookiebeleid", label: "Cookie policy" },
      { href: "/disclaimer", label: "Disclaimer" },
      { href: "/contact", label: "Contact" },
    ],
    kvk: "Chamber of Commerce no.",
    vat: "VAT",
    medical: "Our plans are not a substitute for medical advice.",
  },
});

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

/**
 * Opmaak voor campagnepagina's (bezoekers uit advertenties): geen menu dat
 * afleidt, wel de startknop, de taalkeuze en de verplichte bedrijfsgegevens.
 */
export default async function CampaignLayout({ children }: { children: React.ReactNode }) {
  const l = await getLocale();
  const c = copy[l];
  const company = site.company;
  return (
    <>
      <a
        href="#inhoud"
        className="sr-only z-[70] rounded-full bg-white px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {c.skip}
      </a>
      <header className="no-print sticky top-0 z-40 border-b border-line/80 bg-cream/90 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-2">
            {/* Op mobiel past de startknop er anders niet naast; bezoekers komen via de advertentie al in de juiste taal binnen. */}
            <div className="hidden sm:block">
              <Suspense fallback={<LanguageSwitcherFallback />}>
                <LanguageSwitcher />
              </Suspense>
            </div>
            <Link href="/start" data-lp-cta="header" className="btn-primary !px-4 !py-2 text-sm sm:!px-5 sm:!py-2.5 sm:text-[0.9375rem]">
              <span className="sm:hidden">{c.startShort}</span>
              <span className="hidden sm:inline">{c.start}</span> <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </header>
      <main id="inhoud" className="flex-1">
        {children}
      </main>
      <footer className="no-print bg-brand-950 pb-24 text-sm text-white/65">
        <div className="container-page flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {c.legal.map((x) => (
              <li key={x.href}>
                <Link href={x.href} className="hover:text-lime-glow">
                  {x.label}
                </Link>
              </li>
            ))}
            <li>
              <CookieSettingsButton className="hover:text-lime-glow" />
            </li>
          </ul>
          <p className="text-xs leading-relaxed text-white/50 md:max-w-md md:text-right">
            © <CopyrightYear /> {company.legalName} · {c.kvk} {company.kvk} · {c.vat} {company.vat}.{" "}
            {c.medical} {resultDisclaimer[l].short}
          </p>
        </div>
      </footer>
      <Suspense fallback={null}>
        <FloatingCta promo={await currentPromotion(l)} spacer={false} />
      </Suspense>
      <CookieConsent />
      <CampaignLinks />
    </>
  );
}

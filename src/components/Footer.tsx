import Link from "@/i18n/Link";
import { Suspense } from "react";
import { cacheLife } from "next/cache";
import { Logo } from "@/components/Logo";
import { CookieSettingsButton } from "@/components/cookies/CookieSettingsButton";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { companyAddressLine, site } from "@/config/site";
import { defineCopy } from "@/i18n/config";
import { getLocale } from "@/i18n/server";

const copy = defineCopy({
  nl: {
    columns: [
      {
        title: "Schema's",
        links: [
          { href: "/voedingsschema", label: "Voedingsschema" },
          { href: "/trainingsschema", label: "Trainingsschema" },
          { href: "/bundel", label: "Bundel" },
          { href: "/prijzen", label: "Prijzen & abonnementen" },
          { href: "/voorbeeld", label: "Bekijk een voorbeeld" },
        ],
      },
      {
        title: "Over ons",
        links: [
          { href: "/hoe-werkt-het", label: "Hoe werkt het" },
          { href: "/over-ons", label: "Over Afvallen & Afblijven" },
          { href: "/contact#veelgestelde-vragen", label: "Veelgestelde vragen" },
          { href: "/contact", label: "Contact" },
          { href: "/account", label: "Mijn schema's" },
        ],
      },
      {
        title: "Service & juridisch",
        legal: true,
        links: [
          { href: "/algemene-voorwaarden", label: "Algemene voorwaarden" },
          { href: "/privacybeleid", label: "Privacybeleid" },
          { href: "/cookiebeleid", label: "Cookiebeleid" },
          { href: "/disclaimer", label: "Disclaimer" },
          { href: "/abonnement-opzeggen", label: "Abonnement opzeggen" },
          { href: "/herroepen", label: "Overeenkomst herroepen" },
        ],
      },
    ],
    intro:
      "Persoonlijke voedings- en trainingsschema's die passen bij jouw doel, lichaam en agenda. Zodat je niet alleen afvalt, maar ook afblijft.",
    payments: "Veilig betalen met iDEAL | Wero, Bancontact, creditcard en SEPA-incasso.",
    kvk: "KvK",
    vat: "Btw",
    medical: "Onze schema's zijn geen vervanging van medisch advies.",
    disclaimer: "Lees de disclaimer",
  },
  en: {
    columns: [
      {
        title: "Plans",
        links: [
          { href: "/voedingsschema", label: "Nutrition plan" },
          { href: "/trainingsschema", label: "Workout plan" },
          { href: "/bundel", label: "Bundle" },
          { href: "/prijzen", label: "Pricing & subscriptions" },
          { href: "/voorbeeld", label: "See an example" },
        ],
      },
      {
        title: "About us",
        links: [
          { href: "/hoe-werkt-het", label: "How it works" },
          { href: "/over-ons", label: "About Afvallen & Afblijven" },
          { href: "/contact#veelgestelde-vragen", label: "Frequently asked questions" },
          { href: "/contact", label: "Contact" },
          { href: "/account", label: "My plans" },
        ],
      },
      {
        title: "Service & legal",
        legal: true,
        links: [
          { href: "/algemene-voorwaarden", label: "Terms and conditions" },
          { href: "/privacybeleid", label: "Privacy policy" },
          { href: "/cookiebeleid", label: "Cookie policy" },
          { href: "/disclaimer", label: "Disclaimer" },
          { href: "/abonnement-opzeggen", label: "Cancel subscription" },
          { href: "/herroepen", label: "Withdraw from the contract" },
        ],
      },
    ],
    intro:
      "Personal nutrition and workout plans that fit your goal, body and schedule. So you don't just lose weight, you keep it off.",
    payments: "Pay securely with iDEAL | Wero, Bancontact, credit card and SEPA Direct Debit.",
    kvk: "Chamber of Commerce no.",
    vat: "VAT",
    medical: "Our plans are not a substitute for medical advice.",
    disclaimer: "Read the disclaimer",
  },
});

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export async function Footer() {
  const t = copy[await getLocale()];
  const c = site.company;
  return (
    <footer className="no-print mt-auto bg-brand-950 text-white/80">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo light />
          <p className="max-w-xs text-sm leading-relaxed text-white/70">{t.intro}</p>
          <p className="text-sm text-white/60">{t.payments}</p>
          <Suspense>
            <LanguageSwitcher variant="footer" />
          </Suspense>
        </div>
        {t.columns.map((col) => (
          <div key={col.title}>
            <h2 className="mb-3 text-sm font-bold tracking-wide text-white uppercase">{col.title}</h2>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-lime-glow">
                    {l.label}
                  </Link>
                </li>
              ))}
              {col.legal && (
                <li>
                  <CookieSettingsButton className="hover:text-lime-glow" />
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs leading-relaxed text-white/55 md:flex-row md:items-center md:justify-between">
          <p>
            © <CopyrightYear /> {c.legalName} · {companyAddressLine()} · {t.kvk} {c.kvk} · {t.vat} {c.vat} ·{" "}
            <a href={`mailto:${c.email}`} className="underline hover:text-white">
              {c.email}
            </a>
          </p>
          <p>
            {t.medical}{" "}
            <Link href="/disclaimer" className="underline hover:text-white">
              {t.disclaimer}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

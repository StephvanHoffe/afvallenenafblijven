import { Suspense } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitcher, LanguageSwitcherFallback } from "@/components/i18n/LanguageSwitcher";
import { defineCopy, type Locale } from "@/i18n/config";
import Link from "@/i18n/Link";
import { getLocale } from "@/i18n/server";

const copy = defineCopy({
  nl: {
    nav: [
      { href: "/voedingsschema", label: "Voeding" },
      { href: "/trainingsschema", label: "Training" },
      { href: "/bundel", label: "Bundel" },
      { href: "/prijzen", label: "Prijzen" },
      { href: "/hoe-werkt-het", label: "Hoe werkt het" },
    ],
    mainMenu: "Hoofdmenu",
    account: "Mijn schema's",
    start: "Start je plan",
  },
  en: {
    nav: [
      { href: "/voedingsschema", label: "Nutrition" },
      { href: "/trainingsschema", label: "Training" },
      { href: "/bundel", label: "Bundle" },
      { href: "/prijzen", label: "Pricing" },
      { href: "/hoe-werkt-het", label: "How it works" },
    ],
    mainMenu: "Main menu",
    account: "My plans",
    start: "Start your plan",
  },
});

export function mainNav(l: Locale) {
  return copy[l].nav;
}

export async function Header() {
  const l = await getLocale();
  const c = copy[l];
  return (
    <header className="no-print sticky top-0 z-40 border-b border-line/80 bg-cream/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label={c.mainMenu} className="hidden items-center gap-1 lg:flex">
          {c.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-[0.9375rem] font-semibold whitespace-nowrap text-ink/80 transition hover:bg-brand-50 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {/* Tussen 1024 en 1280 px is de kopbalk vol: daar staat de taalkeuze in de footer. */}
          <div className="hidden sm:block lg:hidden xl:block">
            <Suspense fallback={<LanguageSwitcherFallback />}>
              <LanguageSwitcher />
            </Suspense>
          </div>
          <Link
            href="/account"
            className="hidden rounded-full px-3.5 py-2 text-[0.9375rem] font-semibold whitespace-nowrap text-ink/80 hover:bg-brand-50 sm:block"
          >
            {c.account}
          </Link>
          <Link href="/start" className="btn-primary hidden !px-5 !py-2.5 text-[0.9375rem] sm:inline-flex">
            {c.start}
          </Link>
          {/* Het menu leest het huidige adres; tot dat bekend is, staat er dezelfde knop. */}
          <Suspense
            fallback={
              <span className="grid size-11 place-items-center rounded-full border border-line bg-white lg:hidden" aria-hidden>
                <Menu className="size-5" />
              </span>
            }
          >
            <MobileMenu items={c.nav} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

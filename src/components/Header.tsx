import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MobileMenu } from "@/components/MobileMenu";

export const mainNav = [
  { href: "/voedingsschema", label: "Voeding" },
  { href: "/trainingsschema", label: "Training" },
  { href: "/bundel", label: "Bundel" },
  { href: "/prijzen", label: "Prijzen" },
  { href: "/hoe-werkt-het", label: "Hoe werkt het" },
];

export function Header() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-line/80 bg-cream/90 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Hoofdmenu" className="hidden items-center gap-1 lg:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-[0.9375rem] font-semibold text-ink/80 transition hover:bg-brand-50 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/account"
            className="hidden rounded-full px-3.5 py-2 text-[0.9375rem] font-semibold text-ink/80 hover:bg-brand-50 sm:block"
          >
            Mijn schema&apos;s
          </Link>
          <Link href="/start" className="btn-primary hidden !px-5 !py-2.5 text-[0.9375rem] sm:inline-flex">
            Start je plan
          </Link>
          <MobileMenu items={mainNav} />
        </div>
      </div>
    </header>
  );
}

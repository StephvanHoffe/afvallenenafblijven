import Link from "next/link";
import { cacheLife } from "next/cache";
import { Logo } from "@/components/Logo";
import { CookieSettingsButton } from "@/components/cookies/CookieSettingsButton";
import { companyAddressLine, site } from "@/config/site";

const columns = [
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
    links: [
      { href: "/algemene-voorwaarden", label: "Algemene voorwaarden" },
      { href: "/privacybeleid", label: "Privacybeleid" },
      { href: "/cookiebeleid", label: "Cookiebeleid" },
      { href: "/disclaimer", label: "Disclaimer" },
      { href: "/abonnement-opzeggen", label: "Abonnement opzeggen" },
      { href: "/herroepen", label: "Overeenkomst herroepen" },
    ],
  },
];

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export function Footer() {
  const c = site.company;
  return (
    <footer className="no-print mt-auto bg-brand-950 text-white/80">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo light />
          <p className="max-w-xs text-sm leading-relaxed text-white/70">
            Persoonlijke voedings- en trainingsschema&apos;s die passen bij jouw doel, lichaam en agenda. Zodat je niet
            alleen afvalt, maar ook afblijft.
          </p>
          <p className="text-sm text-white/60">
            Veilig betalen met iDEAL | Wero, Bancontact, creditcard en SEPA-incasso.
          </p>
        </div>
        {columns.map((col) => (
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
              {col.title === "Service & juridisch" && (
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
            © <CopyrightYear /> {c.legalName} · {companyAddressLine()} · KvK {c.kvk} · Btw {c.vat} ·{" "}
            <a href={`mailto:${c.email}`} className="underline hover:text-white">
              {c.email}
            </a>
          </p>
          <p>
            Onze schema&apos;s zijn geen vervanging van medisch advies.{" "}
            <Link href="/disclaimer" className="underline hover:text-white">
              Lees de disclaimer
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

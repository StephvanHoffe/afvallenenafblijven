import { site } from "@/config/site";
import { defineCopy, intlLocale, type Locale } from "@/i18n/config";
import Link from "@/i18n/Link";
import { getLocale } from "@/i18n/server";

const copy = defineCopy({
  nl: { updated: "Laatst bijgewerkt:" },
  en: { updated: "Last updated:" },
});

const NL_MONTHS = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

/**
 * De wijzigingsdatum staat als Nederlandse tekst in de config ("20 oktober 2026").
 * In het Engels tonen we die als "20 October 2026"; lukt het omzetten niet, dan
 * tonen we de tekst zoals hij is.
 */
function updatedLabel(l: Locale): string {
  if (l === "nl") return site.legalUpdated;
  const m = /^(\d{1,2})\s+(\p{L}+)\s+(\d{4})$/u.exec(site.legalUpdated.trim());
  const month = m ? NL_MONTHS.indexOf(m[2].toLowerCase()) : -1;
  if (!m || month < 0) return site.legalUpdated;
  return new Intl.DateTimeFormat(intlLocale(l), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    Date.UTC(Number(m[3]), month, Number(m[1])),
  );
}

/**
 * Melding boven een Engelse juridische tekst: de Nederlandse versie is leidend.
 * `path` is het (Nederlandse) pad van dezelfde pagina, bijv. "/privacybeleid".
 */
export function TranslationNote({ path }: { path: string }) {
  return (
    <p className="mt-6 rounded-2xl bg-sand px-4 py-3 text-sm leading-relaxed text-muted">
      This is an English translation for your convenience. In case of any difference, the Dutch version prevails.{" "}
      <Link href={path} locale="nl" hrefLang="nl" className="font-semibold text-brand-700 underline">
        Read the Dutch version
      </Link>
      .
    </p>
  );
}

export async function LegalPage({
  title,
  intro,
  path,
  children,
}: {
  title: string;
  intro?: React.ReactNode;
  /** Pad van de pagina; op de Engelse site tonen we dan de vertaalmelding met een link naar de Nederlandse versie. */
  path?: string;
  children: React.ReactNode;
}) {
  const l = await getLocale();
  return (
    <article className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="heading-lg">{title}</h1>
        <p className="mt-2 text-sm text-muted">
          {copy[l].updated} {updatedLabel(l)}
        </p>
        {l === "en" && path && <TranslationNote path={path} />}
        {intro && <p className="mt-6 text-lg leading-relaxed text-muted">{intro}</p>}
        <div className="prose-legal mt-6">{children}</div>
      </div>
    </article>
  );
}

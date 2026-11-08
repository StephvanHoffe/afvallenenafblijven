import { ArrowRight, Info } from "lucide-react";
import { CtaBanner, FaqJsonLd, FaqList, SectionHeading } from "@/components/marketing";
import type { FaqItem } from "@/content/faq";
import { site } from "@/config/site";
import { knowledgePages } from "@/content/knowledge";
import { resultDisclaimer } from "@/content/disclaimers";
import { localeUrl, type Locale } from "@/i18n/config";
import Link from "@/i18n/Link";

/**
 * Bouwstenen voor de kennispagina's (rekenhulpen en artikelen): zelfde
 * opmaak, een kort antwoord bovenaan (voor Google en de AI-overzichten),
 * Article- en FAQPage-gegevens, en een vaste afsluiting naar de vragenlijst.
 */

/** "8 november 2026" / "8 November 2026". */
export function formatUpdated(iso: string, l: Locale): string {
  return new Intl.DateTimeFormat(l === "en" ? "en-GB" : "nl-NL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${iso}T12:00:00`));
}

/** Article-gegevens voor Google (auteur en uitgever: de organisatie, geen persoon). */
export function ArticleSchema({ l, path, title, description, updated }: { l: Locale; path: string; title: string; description: string; updated: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    inLanguage: l,
    datePublished: updated,
    dateModified: updated,
    mainEntityOfPage: localeUrl(site.url, l, path),
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, url: site.url, logo: { "@type": "ImageObject", url: `${site.url}/icon.svg` } },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/**
 * Bovenkant van een kennispagina: label, H1 (met accent), inleiding, datum en
 * het korte antwoord. `children` (bijv. een rekenhulp) komt eronder, in de
 * volle breedte van de pagina.
 */
export function ContentHero({
  l,
  eyebrow,
  title,
  accent,
  intro,
  updated,
  short,
  children,
}: {
  l: Locale;
  eyebrow: string;
  title: string;
  accent?: string;
  intro: string;
  updated: string;
  /** Kort antwoord (1-4 zinnen, met getallen). */
  short: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-gradient-to-b from-brand-50 to-cream pt-10 pb-12 sm:pt-14">
      <div className="container-page">
        <div className="max-w-3xl">
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h1 className="heading-xl">
            {title}
            {accent ? (
              <>
                {" "}
                <span className="text-brand-600">{accent}</span>
              </>
            ) : null}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">{intro}</p>
          <p className="mt-3 text-sm text-muted">{l === "en" ? `Updated on ${formatUpdated(updated, l)}` : `Bijgewerkt op ${formatUpdated(updated, l)}`}</p>
          <div className="mt-6 rounded-[1.5rem] border-2 border-brand-200 bg-white p-5 sm:p-6">
            <p className="flex items-center gap-2 font-extrabold">
              <Info className="size-5 text-brand-600" aria-hidden /> {l === "en" ? "Short answer" : "Kort antwoord"}
            </p>
            <p className="mt-2 leading-relaxed">{short}</p>
          </div>
        </div>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}

/** Lopende tekst van een artikel (max. leesbreedte). */
export function ArticleBody({ children }: { children: React.ReactNode }) {
  return <article className="container-page max-w-3xl space-y-14 py-12">{children}</article>;
}

/** Een H2-sectie met alinea's, optioneel opsomming en extra inhoud (tabel, link). */
export function Section({
  title,
  paragraphs = [],
  bullets,
  children,
}: {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  children?: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="heading-md">{title}</h2>
      {paragraphs.map((p) => (
        <p key={p.slice(0, 48)} className="text-lg leading-relaxed text-muted">
          {p}
        </p>
      ))}
      {bullets && bullets.length > 0 && (
        <ul className="list-disc space-y-2 pl-6 text-lg leading-relaxed text-muted marker:text-brand-600">
          {bullets.map((b) => (
            <li key={b.slice(0, 48)}>{b}</li>
          ))}
        </ul>
      )}
      {children}
    </section>
  );
}

/** Eenvoudige tabel met kopregel; de eerste kolom is de rijkop. */
export function DataTable({ head, rows, note, minWidth = "28rem" }: { head: string[]; rows: (string | number)[][]; note?: string; minWidth?: string }) {
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-white">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead className="bg-sand text-xs font-bold text-muted uppercase">
            <tr>
              {head.map((h) => (
                <th key={h} scope="col" className="px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={String(r[0])}>
                {r.map((cell, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="px-4 py-3 font-semibold">
                      {cell}
                    </th>
                  ) : (
                    <td key={i} className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="text-sm text-muted">{note}</p>}
    </div>
  );
}

/** Tekstlink met pijl, voor interne links in een artikel. */
export function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 font-bold text-brand-700 underline">
      {children} <ArrowRight className="size-4 shrink-0" aria-hidden />
    </Link>
  );
}

/** Donker blok met de stap naar een persoonlijk plan (de vragenlijst of een productpagina). */
export function PlanBox({
  title,
  text,
  href,
  cta,
  note,
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
  note?: string;
}) {
  return (
    <section className="rounded-[2rem] bg-brand-900 p-6 text-white sm:p-8">
      <h2 className="heading-md text-white">{title}</h2>
      <p className="mt-3 text-lg leading-relaxed text-white/80">{text}</p>
      <Link href={href} className="btn-primary mt-5 !bg-lime-glow !text-brand-950">
        {cta} <ArrowRight className="size-5" aria-hidden />
      </Link>
      {note && <p className="mt-2 text-sm text-white/70">{note}</p>}
    </section>
  );
}

/** Links naar verwante kennispagina's (uit src/content/knowledge.ts). */
export function RelatedPages({ l, paths }: { l: Locale; paths: string[] }) {
  const items = paths.map((p) => knowledgePages.find((k) => k.path === p)).filter((k): k is NonNullable<typeof k> => Boolean(k));
  if (items.length === 0) return null;
  return (
    <section className="space-y-4">
      <h2 className="heading-md">{l === "en" ? "Read more" : "Lees ook"}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((k) => (
          <li key={k.path}>
            <Link href={k.path} className="card flex h-full items-center justify-between gap-3 p-4 font-bold transition hover:border-brand-300">
              {k.title[l]} <ArrowRight className="size-4 shrink-0 text-brand-600" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Veelgestelde vragen (met FAQPage-gegevens), de standaard disclaimer en de afsluitende banner. */
export function FaqAndClose({ l, items }: { l: Locale; items: FaqItem[] }) {
  return (
    <>
      <section className="container-page pb-16">
        <SectionHeading eyebrow={l === "en" ? "Frequently asked questions" : "Veelgestelde vragen"} title={l === "en" ? "Your questions answered" : "Antwoord op je vragen"} />
        <FaqList items={items} />
        <FaqJsonLd items={items} />
        <p className="mx-auto mt-6 max-w-3xl text-center text-xs text-muted">{resultDisclaimer[l].short}</p>
      </section>
      <CtaBanner />
    </>
  );
}

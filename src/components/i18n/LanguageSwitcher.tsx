"use client";

import { Globe } from "lucide-react";
import { locales, type Locale } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import Link from "@/i18n/Link";
import { usePagePath } from "@/i18n/navigation";

const names: Record<Locale, string> = { nl: "Nederlands", en: "English" };
const switchLabel: Record<Locale, string> = { nl: "Taal kiezen", en: "Choose language" };

/**
 * Wisselt tussen Nederlands en Engels op dezelfde pagina.
 * - compact: "NL | EN" in de kopbalk
 * - full: twee knoppen met de volledige taalnaam (mobiel menu)
 * - footer: lichte tekstlinks op de donkere footer
 */
export function LanguageSwitcher({ variant = "compact", onNavigate }: { variant?: "compact" | "full" | "footer"; onNavigate?: () => void }) {
  const current = useLocale();
  const path = usePagePath();

  if (variant === "full") {
    return (
      <nav aria-label={switchLabel[current]} className="grid grid-cols-2 gap-2">
        {locales.map((l) => (
          <Link
            key={l}
            href={path}
            locale={l}
            hrefLang={l}
            lang={l}
            onClick={onNavigate}
            aria-current={l === current ? "true" : undefined}
            className={`flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold ${
              l === current ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-ink hover:border-brand-300"
            }`}
          >
            {l === current && <Globe className="size-4" aria-hidden />}
            {names[l]}
          </Link>
        ))}
      </nav>
    );
  }

  if (variant === "footer") {
    return (
      <nav aria-label={switchLabel[current]} className="flex items-center gap-2 text-sm">
        <Globe className="size-4 text-white/60" aria-hidden />
        {locales.map((l, i) => (
          <span key={l} className="flex items-center gap-2">
            {i > 0 && <span className="text-white/30" aria-hidden>|</span>}
            <Link
              href={path}
              locale={l}
              hrefLang={l}
              lang={l}
              aria-current={l === current ? "true" : undefined}
              className={l === current ? "font-bold text-white" : "hover:text-lime-glow"}
            >
              {names[l]}
            </Link>
          </span>
        ))}
      </nav>
    );
  }

  return <CompactSwitcher current={current} path={path} />;
}

function CompactSwitcher({ current, path }: { current: Locale; path: string }) {
  return (
    <nav aria-label={switchLabel[current]} className="flex items-center rounded-full border border-line bg-white p-0.5 text-xs font-bold">
      {locales.map((l) => (
        <Link
          key={l}
          href={path}
          locale={l}
          hrefLang={l}
          lang={l}
          aria-label={names[l]}
          aria-current={l === current ? "true" : undefined}
          className={`rounded-full px-2.5 py-1.5 uppercase ${l === current ? "bg-brand-600 text-white" : "text-ink/70 hover:text-ink"}`}
        >
          {l}
        </Link>
      ))}
    </nav>
  );
}

/** Zelfde knoppen zonder huidig adres: wordt getoond tot het adres bekend is. */
export function LanguageSwitcherFallback() {
  return (
    <span className="flex items-center rounded-full border border-line bg-white p-0.5 text-xs font-bold" aria-hidden>
      {locales.map((l) => (
        <span key={l} className="rounded-full px-2.5 py-1.5 uppercase text-ink/70">
          {l}
        </span>
      ))}
    </span>
  );
}

/**
 * Talen van de website. Nederlands is de standaard en staat zonder
 * voorvoegsel in het adres (/prijzen); Engels staat onder /en (/en/prijzen).
 * De proxy herschrijft Nederlandse adressen intern naar /nl/...
 */
export const locales = ["nl", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "nl";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}

/** Locale voor Intl (datums, getallen, bedragen). */
export function intlLocale(l: Locale): string {
  return l === "en" ? "en-GB" : "nl-NL";
}

const PREFIX = /^\/(nl|en)(?=\/|$|\?|#)/;

/** Haalt het taalvoorvoegsel van een pad: "/en/prijzen" → "/prijzen". */
export function stripLocale(path: string): string {
  const stripped = path.replace(PREFIX, "");
  return stripped === "" || stripped.startsWith("?") || stripped.startsWith("#") ? `/${stripped}` : stripped;
}

/** De taal van een pad: "/en/..." is Engels, al het andere Nederlands. */
export function localeOfPath(path: string): Locale {
  return /^\/en(?=\/|$|\?|#)/.test(path) ? "en" : "nl";
}

/**
 * Een intern pad in de gegeven taal: localePath("en", "/prijzen") → "/en/prijzen".
 * Externe links, ankers en paden onder /api of /beheer blijven ongewijzigd.
 */
export function localePath(l: Locale, path: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || /^\/(api|beheer)(\/|$|\?)/.test(path)) return path;
  const base = stripLocale(path);
  if (l === defaultLocale) return base;
  return base === "/" ? `/${l}` : base.startsWith("/?") || base.startsWith("/#") ? `/${l}${base.slice(1)}` : `/${l}${base}`;
}

/** Volledige URL in de gegeven taal, voor e-mails en metadata. */
export function localeUrl(siteUrl: string, l: Locale, path: string): string {
  return `${siteUrl}${localePath(l, path)}`;
}

/** Koppelt een kopie per taal; TypeScript controleert dat de Engelse dezelfde vorm heeft. */
export function defineCopy<T>(copy: { nl: T; en: NoInfer<T> }): Record<Locale, T> {
  return copy;
}

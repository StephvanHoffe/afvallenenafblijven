import type { Metadata } from "next";
import { site } from "@/config/site";
import { localePath, locales, type Locale } from "@/i18n/config";

/** Canonieke URL en hreflang-alternatieven voor een pagina die in beide talen bestaat. */
export function alternates(l: Locale, path: string): NonNullable<Metadata["alternates"]> {
  return {
    canonical: localePath(l, path),
    languages: {
      ...Object.fromEntries(locales.map((x) => [x, localePath(x, path)])),
      "x-default": localePath("nl", path),
    },
  };
}

const TITLE_SUFFIX = ` | ${site.name}`;

/**
 * Paginatitel voor Google: met " | Afvallen & Afblijven" als dat binnen ± 60
 * tekens past, anders alleen de titel zelf (Google zet de sitenaam er dan zelf
 * boven, uit de WebSite-gegevens). Zo blijft het zoekwoord vooraan zichtbaar.
 */
export function pageTitle(title: string): NonNullable<Metadata["title"]> {
  return title.length + TITLE_SUFFIX.length > 60 ? { absolute: title } : title;
}

import type { Metadata } from "next";
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

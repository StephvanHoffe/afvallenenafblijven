"use client";

import { usePathname } from "next/navigation";
import { stripLocale } from "@/i18n/config";

/**
 * Het huidige pad zonder taalvoorvoegsel ("/en/prijzen" en "/prijzen" geven
 * allebei "/prijzen"). Door de herschrijving in de proxy kan usePathname op de
 * server "/nl/prijzen" geven en in de browser "/prijzen"; zonder voorvoegsel
 * zijn ze gelijk, dus geen hydratatieverschil.
 */
export function usePagePath(): string {
  return stripLocale(usePathname());
}

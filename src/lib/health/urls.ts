import { site } from "@/config/site";
import { localeUrl, toLocale } from "@/i18n/config";

/** Waar de klant na het koppelen terechtkomt: Mijn gegevens, bij de koppelingen. */
export function connectionsPageUrl(locale: string, status: "gekoppeld" | "fout" | "geannuleerd"): string {
  return localeUrl(site.url, toLocale(locale), `/account/gegevens?koppeling=${status}#koppelingen`);
}

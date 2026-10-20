import { headers } from "next/headers";
import { lang } from "next/root-params";
import { toLocale, type Locale } from "@/i18n/config";

/**
 * De taal van de huidige pagina, in Server Components. In de beheeromgeving
 * (zonder taal in het adres) is dat Nederlands.
 */
export async function getLocale(): Promise<Locale> {
  return toLocale(await lang());
}

/**
 * De taal van het verzoek, in Server Actions en Route Handlers (waar
 * next/root-params niet werkt). De proxy zet de header op basis van het adres.
 */
export async function requestLocale(): Promise<Locale> {
  return toLocale((await headers()).get("x-taal"));
}

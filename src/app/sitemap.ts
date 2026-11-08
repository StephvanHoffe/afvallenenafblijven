import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { knowledgePages } from "@/content/knowledge";
import { localeUrl, locales } from "@/i18n/config";

const basePages: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/start", priority: 0.9 },
  { path: "/voedingsschema", priority: 0.9 },
  { path: "/trainingsschema", priority: 0.9 },
  { path: "/bundel", priority: 0.9 },
  { path: "/prijzen", priority: 0.8 },
  { path: "/voorbeeld", priority: 0.7 },
  { path: "/hoe-werkt-het", priority: 0.7 },
  { path: "/kennis", priority: 0.7 },
  { path: "/over-ons", priority: 0.5 },
  { path: "/contact", priority: 0.5 },
  { path: "/algemene-voorwaarden", priority: 0.3 },
  { path: "/privacybeleid", priority: 0.3 },
  { path: "/cookiebeleid", priority: 0.2 },
  { path: "/disclaimer", priority: 0.2 },
  { path: "/abonnement-opzeggen", priority: 0.2 },
  { path: "/herroepen", priority: 0.2 },
];

/** De vaste pagina's plus alle kennispagina's (rekenhulpen 0,8, de rest 0,7). */
const pages = [
  ...basePages,
  ...knowledgePages.map((k) => ({ path: k.path, priority: k.category === "rekenhulpen" ? 0.8 : 0.7 })),
];

/** Elke pagina in beide talen, met de andere taal als alternatief (hreflang). */
export default function sitemap(): MetadataRoute.Sitemap {
  return pages.flatMap((p) =>
    locales.map((l) => ({
      url: localeUrl(site.url, l, p.path),
      priority: p.priority,
      changeFrequency: "monthly" as const,
      alternates: { languages: Object.fromEntries(locales.map((x) => [x, localeUrl(site.url, x, p.path)])) },
    })),
  );
}

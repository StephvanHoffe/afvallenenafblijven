import type { MetadataRoute } from "next";
import { site } from "@/config/site";

const pages: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/start", priority: 0.9 },
  { path: "/voedingsschema", priority: 0.9 },
  { path: "/trainingsschema", priority: 0.9 },
  { path: "/bundel", priority: 0.9 },
  { path: "/prijzen", priority: 0.8 },
  { path: "/voorbeeld", priority: 0.7 },
  { path: "/hoe-werkt-het", priority: 0.7 },
  { path: "/over-ons", priority: 0.5 },
  { path: "/contact", priority: 0.5 },
  { path: "/algemene-voorwaarden", priority: 0.3 },
  { path: "/privacybeleid", priority: 0.3 },
  { path: "/cookiebeleid", priority: 0.2 },
  { path: "/disclaimer", priority: 0.2 },
  { path: "/abonnement-opzeggen", priority: 0.2 },
  { path: "/herroepen", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((p) => ({ url: `${site.url}${p.path}`, priority: p.priority, changeFrequency: "monthly" }));
}

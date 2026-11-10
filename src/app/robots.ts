import type { MetadataRoute } from "next";
import { site } from "@/config/site";

// /voorbeeld/pdf: het voorbeeld als pdf-download (traag en geen zoekpagina; de pagina /voorbeeld zelf wel).
const privatePaths = ["/account", "/schema/", "/schema-aanvullen", "/bedankt", "/inloggen", "/voorbeeld/mijn-schemas", "/voorbeeld/pdf/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/beheer", ...privatePaths.flatMap((p) => [p, `/en${p}`])],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}

import type { MetadataRoute } from "next";
import { site } from "@/config/site";

const privatePaths = ["/account", "/schema/", "/bedankt", "/inloggen", "/voorbeeld/mijn-schemas"];

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

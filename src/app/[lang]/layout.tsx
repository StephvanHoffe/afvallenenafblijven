import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import "../globals.css";
import { jakarta } from "@/app/fonts";
import { site } from "@/config/site";
import { isLocale, locales } from "@/i18n/config";
import { LocaleProvider } from "@/i18n/client";

export function generateStaticParams() {
  return locales.map((l) => ({ lang: l }));
}

const copy = {
  nl: {
    title: `${site.name} – Persoonlijk voedings- en trainingsschema`,
    description: site.description,
    ogAlt: "Gezonde maaltijden",
    ogLocale: "nl_NL",
  },
  en: {
    title: `${site.name} – Personal nutrition and workout plans`,
    description:
      "Personal nutrition plans and workout plans, tailored to your goal, body and schedule. In your inbox within minutes. Cancel monthly.",
    ogAlt: "Healthy meals",
    ogLocale: "en_GB",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const l = await lang();
  if (!isLocale(l)) return {};
  const c = copy[l];
  return {
    metadataBase: new URL(site.url),
    title: { default: c.title, template: `%s | ${site.name}` },
    description: c.description,
    applicationName: site.name,
    openGraph: {
      type: "website",
      locale: c.ogLocale,
      alternateLocale: l === "nl" ? "en_GB" : "nl_NL",
      siteName: site.name,
      images: [{ url: "/images/food-flatlay.jpg", width: 1600, height: 1089, alt: c.ogAlt }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: "#123f29",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const l = await lang();
  if (!isLocale(l)) notFound();
  return (
    <html lang={l} className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <LocaleProvider locale={l}>{children}</LocaleProvider>
      </body>
    </html>
  );
}

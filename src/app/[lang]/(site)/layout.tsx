import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/cookies/CookieConsent";
import { site } from "@/config/site";
import { getLocale } from "@/i18n/server";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  email: site.company.email,
  logo: `${site.url}/icon.svg`,
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const l = await getLocale();
  return (
    <>
      <a
        href="#inhoud"
        className="sr-only z-[70] rounded-full bg-white px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {l === "en" ? "Skip to content" : "Naar de inhoud"}
      </a>
      <AnnouncementBar />
      <Header />
      <main id="inhoud" className="flex-1">
        {children}
      </main>
      <Footer />
      <CookieConsent />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
    </>
  );
}

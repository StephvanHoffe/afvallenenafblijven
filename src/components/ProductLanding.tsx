import Image from "next/image";
import Link from "@/i18n/Link";
import { ArrowRight, Check } from "lucide-react";
import { CtaBanner, FaqJsonLd, FaqList, Guarantee, PageHero, SectionHeading, TrustRow } from "@/components/marketing";
import { PricingTable } from "@/components/pricing/PricingTable";
import { StickyCta } from "@/components/StickyCta";
import type { FaqItem } from "@/content/faq";
import type { ProductId } from "@/config/pricing";
import { site } from "@/config/site";
import { defineCopy } from "@/i18n/config";
import { getLocale } from "@/i18n/server";
import { launchOfferActive } from "@/lib/launch";

const copy = defineCopy<{
  start: Record<ProductId, string>;
  seePrices: string;
  forWhoEyebrow: string;
  forWhoTitle: string;
  sample: string;
  pricingEyebrow: string;
  pricingTitle: string;
  pricingIntroBundle: string;
  pricingIntroSingle: string;
  faqEyebrow: string;
  faqTitle: string;
}>({
  nl: {
    start: { voeding: "Start je voedingsschema", training: "Start je trainingsschema", bundel: "Start je bundel" },
    seePrices: "Bekijk prijzen",
    forWhoEyebrow: "Voor wie?",
    forWhoTitle: "Dit is voor jou als je…",
    sample: "Bekijk een voorbeeldschema",
    pricingEyebrow: "Prijzen",
    pricingTitle: "Kies je looptijd",
    pricingIntroBundle: "Tip: met de bundel krijg je voeding én training en betaal je per maand minder dan los.",
    pricingIntroSingle: "Je betaalt per maand via automatische incasso. Hoe langer de minimale looptijd, hoe lager je maandprijs.",
    faqEyebrow: "Veelgestelde vragen",
    faqTitle: "Goed om te weten",
  },
  en: {
    start: { voeding: "Start your nutrition plan", training: "Start your workout plan", bundel: "Start your bundle" },
    seePrices: "See pricing",
    forWhoEyebrow: "Who is it for?",
    forWhoTitle: "This is for you if you…",
    sample: "See a sample plan",
    pricingEyebrow: "Pricing",
    pricingTitle: "Choose your term",
    pricingIntroBundle: "Tip: the bundle gives you nutrition and training, and you pay less per month than buying them separately.",
    pricingIntroSingle: "You pay monthly by direct debit. The longer the minimum term, the lower your monthly price.",
    faqEyebrow: "Frequently asked questions",
    faqTitle: "Good to know",
  },
});

export interface ProductLandingContent {
  product: ProductId;
  eyebrow: string;
  title: React.ReactNode;
  intro: string;
  heroImage: string;
  heroAlt: string;
  forWho: string[];
  included: { title: string; text: string }[];
  showcase: { image: string; alt: string; title: string; text: string; bullets: string[] };
  pricingProducts: ProductId[];
  faq: FaqItem[];
}

export async function ProductLanding({ content }: { content: ProductLandingContent }) {
  const launch = { active: await launchOfferActive(), percentOff: site.launchOffer.percentOff };
  const c = copy[await getLocale()];
  return (
    <>
      <div className="bg-gradient-to-b from-brand-50 to-cream">
        <PageHero eyebrow={content.eyebrow} title={content.title} intro={content.intro} image={content.heroImage} imageAlt={content.heroAlt}>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={`/start?plan=${content.product}`} className="btn-primary text-lg">
              {c.start[content.product]} <ArrowRight className="size-5" aria-hidden />
            </Link>
            <Link href="#prijzen" className="btn-secondary text-lg">
              {c.seePrices}
            </Link>
          </div>
          <div className="mt-8">
            <TrustRow />
          </div>
        </PageHero>
      </div>

      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow mb-3">{c.forWhoEyebrow}</p>
            <h2 className="heading-lg">{c.forWhoTitle}</h2>
            <ul className="mt-6 space-y-3">
              {content.forWho.map((t) => (
                <li key={t} className="flex gap-3 text-lg">
                  <Check className="mt-1 size-5 shrink-0 text-brand-600" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {content.included.map((i) => (
              <div key={i.title} className="card p-5">
                <h3 className="font-bold">{i.title}</h3>
                <p className="mt-1.5 text-muted">{i.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-950 py-16 text-white">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
            <Image src={content.showcase.image} alt={content.showcase.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div>
            <h2 className="heading-lg text-white">{content.showcase.title}</h2>
            <p className="mt-4 text-lg text-white/75">{content.showcase.text}</p>
            <ul className="mt-6 space-y-3">
              {content.showcase.bullets.map((b) => (
                <li key={b} className="flex gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-lime-glow" aria-hidden /> {b}
                </li>
              ))}
            </ul>
            <Link href="/voorbeeld" className="btn-glow mt-8">
              {c.sample} <ArrowRight className="size-5" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section id="prijzen" className="scroll-mt-20 bg-sand py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow={c.pricingEyebrow}
            title={c.pricingTitle}
            intro={content.pricingProducts.length > 1 ? c.pricingIntroBundle : c.pricingIntroSingle}
          />
          <PricingTable only={content.pricingProducts} launch={launch} highlight="bundel" />
          <div className="mt-12">
            <Guarantee />
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <SectionHeading eyebrow={c.faqEyebrow} title={c.faqTitle} />
        <FaqList items={content.faq} />
        <FaqJsonLd items={content.faq} />
      </section>

      <CtaBanner href={`/start?plan=${content.product}`} />
      <StickyCta href={`/start?plan=${content.product}`} />
    </>
  );
}

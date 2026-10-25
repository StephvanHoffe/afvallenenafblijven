import Image from "next/image";
import Link from "@/i18n/Link";
import { ArrowRight, Check } from "lucide-react";
import { FixSection, FutureSection, PainSection } from "@/components/conversion";
import { CtaBanner, FaqJsonLd, FaqList, Guarantee, PageHero, SectionHeading, TrustRow } from "@/components/marketing";
import { PricingTable } from "@/components/pricing/PricingTable";
import type { FaqItem } from "@/content/faq";
import type { ProductId } from "@/config/pricing";
import { defineCopy } from "@/i18n/config";
import { getLocale } from "@/i18n/server";
import { currentPromotion } from "@/lib/promotion";

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
  finalTitle: Record<ProductId, string>;
}>({
  nl: {
    start: { voeding: "Maak mijn voedingsschema", training: "Maak mijn trainingsschema", bundel: "Start mijn bundel" },
    seePrices: "Bekijk prijzen",
    forWhoEyebrow: "Voor wie?",
    forWhoTitle: "Dit is voor jou als je…",
    sample: "Bekijk een voorbeeldschema",
    pricingEyebrow: "Prijzen",
    pricingTitle: "Kies je looptijd en begin vandaag",
    pricingIntroBundle:
      "Een nieuwe gewoonte heeft volgens onderzoek gemiddeld zo'n 66 dagen nodig. Kies je 3 maanden of langer, dan krijg je elke 4 weken een nieuw, bijgestuurd schema en betaal je minder per maand. Met de bundel krijg je voeding én training, voor minder dan los.",
    pricingIntroSingle:
      "Een nieuwe gewoonte heeft volgens onderzoek gemiddeld zo'n 66 dagen nodig. Kies je 3 maanden of langer, dan krijg je elke 4 weken een nieuw, bijgestuurd schema en betaal je minder per maand.",
    faqEyebrow: "Veelgestelde vragen",
    faqTitle: "Nog twijfels?",
    finalTitle: {
      voeding: "Weet vanavond al wat je morgen eet",
      training: "Maak je volgende training de eerste mét plan",
      bundel: "Laat je voeding en training eindelijk samenwerken",
    },
  },
  en: {
    start: { voeding: "Create my nutrition plan", training: "Create my workout plan", bundel: "Start my bundle" },
    seePrices: "See pricing",
    forWhoEyebrow: "Who is it for?",
    forWhoTitle: "This is for you if you…",
    sample: "See a sample plan",
    pricingEyebrow: "Pricing",
    pricingTitle: "Choose your term and start today",
    pricingIntroBundle:
      "According to research, a new habit takes around 66 days on average. Choose 3 months or longer and you get a new, fine-tuned plan every 4 weeks, at a lower monthly price. The bundle gives you nutrition and training for less than buying them separately.",
    pricingIntroSingle:
      "According to research, a new habit takes around 66 days on average. Choose 3 months or longer and you get a new, fine-tuned plan every 4 weeks, at a lower monthly price.",
    faqEyebrow: "Frequently asked questions",
    faqTitle: "Still unsure?",
    finalTitle: {
      voeding: "Know tonight what you'll eat tomorrow",
      training: "Make your next workout the first one with a plan",
      bundel: "Get your nutrition and training working together",
    },
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
  const promo = await currentPromotion(await getLocale());
  const l = await getLocale();
  const c = copy[l];
  const startHref = `/start?plan=${content.product}`;
  return (
    <>
      <div className="bg-gradient-to-b from-brand-50 to-cream">
        <PageHero eyebrow={content.eyebrow} title={content.title} intro={content.intro} image={content.heroImage} imageAlt={content.heroAlt}>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={startHref} className="btn-primary text-lg">
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

      {/* Eerst het probleem en wat het kost, dan hoe wij het anders doen. */}
      <PainSection topic={content.product} l={l} href={startHref} />
      <FixSection topic={content.product} l={l} />

      <section className="bg-sand py-16">
        <div className="container-page">
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

      <FutureSection topic={content.product} l={l} href={startHref} />

      <section id="prijzen" className="scroll-mt-20 bg-sand py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow={c.pricingEyebrow}
            title={c.pricingTitle}
            intro={content.pricingProducts.length > 1 ? c.pricingIntroBundle : c.pricingIntroSingle}
          />
          <PricingTable only={content.pricingProducts} promo={promo} highlight="bundel" />
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

      <CtaBanner href={startHref} title={c.finalTitle[content.product]} label={c.start[content.product]} />
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { CtaBanner, FaqJsonLd, FaqList, Guarantee, PageHero, SectionHeading, TrustRow } from "@/components/marketing";
import { PricingTable } from "@/components/pricing/PricingTable";
import { StickyCta } from "@/components/StickyCta";
import type { FaqItem } from "@/content/faq";
import { products, type ProductId } from "@/config/pricing";
import { site } from "@/config/site";
import { launchOfferActive } from "@/lib/launch";

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
  const p = products[content.product];
  return (
    <>
      <div className="bg-gradient-to-b from-brand-50 to-cream">
        <PageHero eyebrow={content.eyebrow} title={content.title} intro={content.intro} image={content.heroImage} imageAlt={content.heroAlt}>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={`/start?plan=${content.product}`} className="btn-primary text-lg">
              Start je {p.shortName.toLowerCase() === "bundel" ? "bundel" : p.shortName.toLowerCase() + "sschema"} <ArrowRight className="size-5" aria-hidden />
            </Link>
            <Link href="#prijzen" className="btn-secondary text-lg">
              Bekijk prijzen
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
            <p className="eyebrow mb-3">Voor wie?</p>
            <h2 className="heading-lg">Dit is voor jou als je…</h2>
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
              Bekijk een voorbeeldschema <ArrowRight className="size-5" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section id="prijzen" className="scroll-mt-20 bg-sand py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Prijzen"
            title="Kies je looptijd"
            intro={
              content.pricingProducts.length > 1
                ? "Tip: met de bundel krijg je voeding én training en betaal je per maand minder dan los."
                : "Hoe langer de looptijd, hoe voordeliger. Na de eerste periode maandelijks opzegbaar."
            }
          />
          <PricingTable only={content.pricingProducts} launch={launch} highlight="bundel" />
          <div className="mt-12">
            <Guarantee />
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <SectionHeading eyebrow="Veelgestelde vragen" title="Goed om te weten" />
        <FaqList items={content.faq} />
        <FaqJsonLd items={content.faq} />
      </section>

      <CtaBanner href={`/start?plan=${content.product}`} />
      <StickyCta href={`/start?plan=${content.product}`} />
    </>
  );
}

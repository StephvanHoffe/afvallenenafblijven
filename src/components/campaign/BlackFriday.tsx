import { ArrowRight, Zap } from "lucide-react";
import { TrustRow } from "@/components/marketing";
import { Countdown } from "@/components/promo/Countdown";
import { applyPercentOff } from "@/config/pricing";
import { site } from "@/config/site";
import { defineCopy, type Locale } from "@/i18n/config";
import Link from "@/i18n/Link";
import { euro } from "@/lib/format";
import type { PromoView } from "@/lib/promotion";

/**
 * Black Friday-uitvoering van de landingspagina's: verschijnt vanzelf zolang
 * een actie met `theme: "blackfriday"` loopt (zie promotions in src/config/site.ts).
 */
export const bfCopy = defineCopy({
  nl: {
    badge: (until: string) => `Black Friday · alleen t/m ${until}`,
    off: "korting",
    offSub: (months: number) => (months > 1 ? `op je eerste ${months} maanden, op elk pakket` : "op je eerste betaling, op elk pakket"),
    price: (promo: string, regular: string, months: number) =>
      `Je eerste ${months > 1 ? `${months} maanden` : "maand"} vanaf ${promo} per maand, daarna vanaf ${regular} per maand.`,
    endsIn: "De actie stopt over",
    cta: (pct: number) => `Pak mijn ${pct}% korting`,
    sticker: "korting",
    marquee: (pct: number, months: number, until: string) => [
      "Black Friday",
      `${pct}% korting`,
      months > 1 ? `eerste ${months} maanden` : "eerste maand",
      "elk pakket",
      `alleen t/m ${until}`,
    ],
    pricingEyebrow: "Black Friday-prijzen",
    pricingTitle: (pct: number, months: number) => `${pct}% korting op je eerste ${months > 1 ? `${months} maanden` : "maand"}`,
    pricingIntro: "De korting staat al in de prijzen en zit automatisch in je eerste betaling. Daarna betaal je de normale prijs.",
    finalEyebrow: "Black Friday",
    finalTitle: "Begin nu, voor de helft van de prijs",
    finalText: (pct: number, months: number, until: string) =>
      `Zet vandaag de eerste stap met ${pct}% korting op je eerste ${months > 1 ? `${months} maanden` : "maand"}. Alleen t/m ${until}; daarna geldt weer de normale prijs.`,
    finalRisk: (days: number) => ` Niet tevreden? Binnen ${days} dagen krijg je je eerste betaling terug.`,
  },
  en: {
    badge: (until: string) => `Black Friday · only until ${until}`,
    off: "off",
    offSub: (months: number) => (months > 1 ? `your first ${months} months, on every plan` : "your first payment, on every plan"),
    price: (promo: string, regular: string, months: number) =>
      `Your first ${months > 1 ? `${months} months` : "month"} from ${promo} a month, then from ${regular} a month.`,
    endsIn: "The offer ends in",
    cta: (pct: number) => `Get my ${pct}% off`,
    sticker: "off",
    marquee: (pct: number, months: number, until: string) => [
      "Black Friday",
      `${pct}% off`,
      months > 1 ? `first ${months} months` : "first month",
      "every plan",
      `only until ${until}`,
    ],
    pricingEyebrow: "Black Friday prices",
    pricingTitle: (pct: number, months: number) => `${pct}% off your first ${months > 1 ? `${months} months` : "month"}`,
    pricingIntro: "The discount is already in the prices and is applied to your first payment automatically. After that, you pay the regular price.",
    finalEyebrow: "Black Friday",
    finalTitle: "Start now, for half the price",
    finalText: (pct: number, months: number, until: string) =>
      `Take the first step today with ${pct}% off your first ${months > 1 ? `${months} months` : "month"}. Only until ${until}; after that, the regular price applies again.`,
    finalRisk: (days: number) => ` Not satisfied? Get your first payment back within ${days} days.`,
  },
});

/** Het hoogste kortingspercentage van de actie (bij Black Friday overal gelijk). */
export function promoPercent(promo: PromoView): number {
  return Math.max(0, ...Object.values(promo.percentOff));
}

/** Achtergrond van de donkere Black Friday-vlakken: zwart met een zachte gloed in de merkkleuren. */
export const bfGlow = {
  backgroundColor: "#060807",
  backgroundImage:
    "radial-gradient(48rem 26rem at 85% -10%, rgb(200 241 105 / 0.16), transparent 60%), radial-gradient(36rem 22rem at -5% 105%, rgb(244 93 34 / 0.14), transparent 60%)",
};

/** Het actieblok in de hero: de korting, wat je betaalt, de aftelklok en de startknop. */
export function BlackFridayOffer({ promo, l, href, fromPrice }: { promo: PromoView; l: Locale; href: string; fromPrice: number }) {
  const c = bfCopy[l];
  const pct = promoPercent(promo);
  return (
    <div className="mt-7 max-w-xl rounded-[var(--radius-card)] bg-white/[0.06] p-5 ring-1 ring-lime-glow/35 sm:p-6">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <p className="text-6xl leading-none font-black tracking-tight text-lime-glow sm:text-7xl">{pct}%</p>
        <p className="pb-1 text-xl leading-tight font-extrabold">
          {c.off}
          <span className="block text-sm font-semibold text-white/70">{c.offSub(promo.months)}</span>
        </p>
      </div>
      <p className="mt-3 text-[0.9375rem] text-white/80">{c.price(euro(applyPercentOff(fromPrice, pct), l), euro(fromPrice, l), promo.months)}</p>
      <p className="mt-5 text-xs font-bold tracking-wide text-white/60 uppercase">{c.endsIn}</p>
      <Countdown endsAt={promo.endsAt} className="mt-2" />
      <Link href={href} data-lp-cta="black-friday" className="btn-glow mt-6 w-full text-lg sm:w-auto">
        <Zap className="size-5" aria-hidden /> {c.cta(pct)} <ArrowRight className="size-5" aria-hidden />
      </Link>
    </div>
  );
}

/** Lopende band met de actie, onder de hero. Beweegt niet als de bezoeker minder beweging wil. */
export function BlackFridayMarquee({ promo, l }: { promo: PromoView; l: Locale }) {
  const items = bfCopy[l].marquee(promoPercent(promo), promo.months, promo.endsLabel);
  return (
    <div className="overflow-hidden border-y border-lime-glow/25 bg-black py-3 text-lime-glow" aria-hidden>
      <div className="marquee-track flex w-max text-sm font-extrabold tracking-[0.18em] whitespace-nowrap uppercase">
        {[0, 1].map((copyIndex) => (
          <span key={copyIndex} className="flex">
            {[...items, ...items].map((text, i) => (
              <span key={i} className="flex items-center gap-6 pr-6">
                {text}
                <span className="text-accent-400">✦</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Afsluitend blok: nog één keer de actie, met aftelklok en startknop. */
export async function BlackFridayFinal({ promo, l, href }: { promo: PromoView; l: Locale; href: string }) {
  const c = bfCopy[l];
  const pct = promoPercent(promo);
  return (
    <section className="container-page py-16">
      <div className="relative overflow-hidden rounded-[2rem] px-6 py-14 text-center text-white ring-1 ring-lime-glow/25 sm:px-12" style={bfGlow}>
        <div className="relative mx-auto flex max-w-2xl flex-col items-center">
          <p className="eyebrow !text-lime-glow">{c.finalEyebrow}</p>
          <h2 className="heading-lg mt-3 text-white">{c.finalTitle}</h2>
          <p className="mt-4 text-lg text-white/80">
            {c.finalText(pct, promo.months, promo.endsLabel)}
            {site.guarantee.enabled ? c.finalRisk(site.guarantee.days) : ""}
          </p>
          <Countdown endsAt={promo.endsAt} className="mt-7 justify-center" />
          <Link href={href} data-lp-cta="black-friday-slot" className="btn-glow mt-8 text-lg">
            <Zap className="size-5" aria-hidden /> {c.cta(pct)} <ArrowRight className="size-5" aria-hidden />
          </Link>
          <div className="mt-8 flex justify-center">
            <TrustRow light />
          </div>
        </div>
      </div>
    </section>
  );
}

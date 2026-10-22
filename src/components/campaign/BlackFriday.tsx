import { ArrowRight, Zap } from "lucide-react";
import { TrustRow } from "@/components/marketing";
import { Countdown } from "@/components/promo/Countdown";
import { applyPercentOff, durations, type DurationId } from "@/config/pricing";
import { site } from "@/config/site";
import { defineCopy, type Locale } from "@/i18n/config";
import Link from "@/i18n/Link";
import { euro } from "@/lib/format";
import type { PromoView } from "@/lib/promotion";

const period = (months: number, l: Locale) =>
  l === "en" ? (months > 1 ? `first ${months} months` : "first month") : months > 1 ? `eerste ${months} maanden` : "eerste maand";

/**
 * Black Friday-uitvoering van de landingspagina's: verschijnt vanzelf zolang
 * een actie met `theme: "blackfriday"` loopt (zie promotions in src/config/site.ts).
 * Verschilt de korting per looptijd (een staffel), dan staat er "tot" bij.
 */
export const bfCopy = defineCopy({
  nl: {
    badge: (until: string) => `Black Friday · alleen t/m ${until}`,
    upTo: "tot",
    off: "korting",
    offSub: (months: number, tiers: boolean) =>
      tiers
        ? `op je ${period(months, "nl")}: hoe langer je kiest, hoe meer korting`
        : months > 1
          ? `op je ${period(months, "nl")}, op elk pakket`
          : "op je eerste betaling, op elk pakket",
    tier: (months: number) => (months === 0 ? "los schema" : months === 1 ? "per maand" : `${months} maanden`),
    price: (promo: string, regular: string, months: number) =>
      `Je ${period(months, "nl")} vanaf ${promo} per maand, daarna vanaf ${regular} per maand.`,
    endsIn: "De actie stopt over",
    cta: (pct: number, tiers: boolean) => (tiers ? `Pak tot ${pct}% korting` : `Pak mijn ${pct}% korting`),
    sticker: "korting",
    marquee: (pct: number, months: number, until: string, tiers: boolean) => [
      "Black Friday",
      `${tiers ? "tot " : ""}${pct}% korting`,
      period(months, "nl"),
      tiers ? "hoe langer, hoe meer korting" : "elk pakket",
      `alleen t/m ${until}`,
    ],
    pricingEyebrow: "Black Friday-prijzen",
    pricingTitle: (pct: number, months: number, tiers: boolean) => `${tiers ? `Tot ${pct}%` : `${pct}%`} korting op je ${period(months, "nl")}`,
    pricingIntro: (tiers: boolean): string =>
      tiers
        ? "Hoe langer je kiest, hoe meer korting. De korting staat al in de prijzen en zit automatisch in je eerste betalingen; daarna betaal je de normale prijs."
        : "De korting staat al in de prijzen en zit automatisch in je eerste betaling. Daarna betaal je de normale prijs.",
    finalEyebrow: "Black Friday",
    finalTitle: (tiers: boolean): string => (tiers ? "Begin nu, met Black Friday-korting" : "Begin nu, voor de helft van de prijs"),
    finalText: (pct: number, months: number, until: string, tiers: boolean) =>
      `Zet vandaag de eerste stap met ${tiers ? "tot " : ""}${pct}% korting op je ${period(months, "nl")}${tiers ? " (bij 12 maanden)" : ""}. Alleen t/m ${until}; daarna geldt weer de normale prijs.`,
    finalRisk: (days: number) => ` Niet tevreden? Binnen ${days} dagen krijg je je eerste betaling terug.`,
  },
  en: {
    badge: (until: string) => `Black Friday · only until ${until}`,
    upTo: "up to",
    off: "off",
    offSub: (months: number, tiers: boolean) =>
      tiers
        ? `your ${period(months, "en")}: the longer you choose, the bigger the discount`
        : months > 1
          ? `your ${period(months, "en")}, on every plan`
          : "your first payment, on every plan",
    tier: (months: number) => (months === 0 ? "one-off plan" : months === 1 ? "monthly" : `${months} months`),
    price: (promo: string, regular: string, months: number) =>
      `Your ${period(months, "en")} from ${promo} a month, then from ${regular} a month.`,
    endsIn: "The offer ends in",
    cta: (pct: number, tiers: boolean) => (tiers ? `Get up to ${pct}% off` : `Get my ${pct}% off`),
    sticker: "off",
    marquee: (pct: number, months: number, until: string, tiers: boolean) => [
      "Black Friday",
      `${tiers ? "up to " : ""}${pct}% off`,
      period(months, "en"),
      tiers ? "the longer, the bigger the discount" : "every plan",
      `only until ${until}`,
    ],
    pricingEyebrow: "Black Friday prices",
    pricingTitle: (pct: number, months: number, tiers: boolean) => `${tiers ? `Up to ${pct}%` : `${pct}%`} off your ${period(months, "en")}`,
    pricingIntro: (tiers: boolean): string =>
      tiers
        ? "The longer you choose, the bigger the discount. The discount is already in the prices and is applied to your first payments automatically; after that, you pay the regular price."
        : "The discount is already in the prices and is applied to your first payment automatically. After that, you pay the regular price.",
    finalEyebrow: "Black Friday",
    finalTitle: (tiers: boolean) => (tiers ? "Start now, with Black Friday savings" : "Start now, for half the price"),
    finalText: (pct: number, months: number, until: string, tiers: boolean) =>
      `Take the first step today with ${tiers ? "up to " : ""}${pct}% off your ${period(months, "en")}${tiers ? " (on 12 months)" : ""}. Only until ${until}; after that, the regular price applies again.`,
    finalRisk: (days: number) => ` Not satisfied? Get your first payment back within ${days} days.`,
  },
});

/** Het hoogste kortingspercentage van de actie. */
export function promoPercent(promo: PromoView): number {
  return Math.max(0, ...Object.values(promo.percentOff));
}

/** Verschilt de korting per looptijd? Dan tonen we "tot" en de staffel. */
export function promoHasTiers(promo: PromoView): boolean {
  return new Set(Object.values(promo.percentOff).filter((v) => v > 0)).size > 1;
}

/** De staffel, van de langste looptijd naar los. */
export function promoTiers(promo: PromoView): { duration: DurationId; months: number; percent: number }[] {
  return (["12m", "6m", "3m", "1m", "eenmalig"] as const)
    .filter((d) => (promo.percentOff[d] ?? 0) > 0)
    .map((d) => ({ duration: d, months: durations[d].months, percent: promo.percentOff[d] }));
}

/** Achtergrond van de donkere Black Friday-vlakken: zwart met een zachte gloed in de merkkleuren. */
export const bfGlow = {
  backgroundColor: "#060807",
  backgroundImage:
    "radial-gradient(48rem 26rem at 85% -10%, rgb(200 241 105 / 0.16), transparent 60%), radial-gradient(36rem 22rem at -5% 105%, rgb(244 93 34 / 0.14), transparent 60%)",
};

/**
 * Het actieblok in de hero: de korting (met de staffel), wat je betaalt, de
 * aftelklok en de startknop. Een zwart blok op de lichte achtergrond, zodat
 * het opvalt zonder dat de hele pagina donker wordt.
 */
export function BlackFridayOffer({ promo, l, href, fromPrice }: { promo: PromoView; l: Locale; href: string; fromPrice: number }) {
  const c = bfCopy[l];
  const pct = promoPercent(promo);
  const tiers = promoHasTiers(promo);
  return (
    <div className="mt-7 max-w-xl rounded-[var(--radius-card)] p-5 text-white shadow-[var(--shadow-lift)] ring-1 ring-lime-glow/35 sm:p-6" style={bfGlow}>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <p className="leading-none font-black tracking-tight text-lime-glow">
          {tiers && <span className="mb-1 block text-lg font-extrabold tracking-normal">{c.upTo}</span>}
          <span className="text-6xl sm:text-7xl">{pct}%</span>
        </p>
        <p className="pb-1 text-xl leading-tight font-extrabold">
          {c.off}
          <span className="block text-sm font-semibold text-white/70">{c.offSub(promo.months, tiers)}</span>
        </p>
      </div>
      {tiers && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {promoTiers(promo).map((t, i) => (
            <li
              key={t.duration}
              className={`rounded-full px-3 py-1.5 text-sm font-bold ${i === 0 ? "bg-lime-glow text-brand-950" : "bg-white/10 text-white ring-1 ring-white/15"}`}
            >
              −{t.percent}% <span className={i === 0 ? "font-semibold" : "font-semibold text-white/70"}>{c.tier(t.months)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-[0.9375rem] text-white/80">{c.price(euro(applyPercentOff(fromPrice, pct), l), euro(fromPrice, l), promo.months)}</p>
      <p className="mt-5 text-xs font-bold tracking-wide text-white/60 uppercase">{c.endsIn}</p>
      <Countdown endsAt={promo.endsAt} className="mt-2" />
      <Link href={href} data-lp-cta="black-friday" className="btn-glow mt-6 w-full text-lg sm:w-auto">
        <Zap className="size-5" aria-hidden /> {c.cta(pct, tiers)} <ArrowRight className="size-5" aria-hidden />
      </Link>
    </div>
  );
}

/** Lopende band met de actie, onder de hero. Beweegt niet als de bezoeker minder beweging wil. */
export function BlackFridayMarquee({ promo, l }: { promo: PromoView; l: Locale }) {
  const items = bfCopy[l].marquee(promoPercent(promo), promo.months, promo.endsLabel, promoHasTiers(promo));
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
  const tiers = promoHasTiers(promo);
  return (
    <section className="container-page py-16">
      <div className="relative overflow-hidden rounded-[2rem] px-6 py-14 text-center text-white ring-1 ring-lime-glow/25 sm:px-12" style={bfGlow}>
        <div className="relative mx-auto flex max-w-2xl flex-col items-center">
          <p className="eyebrow !text-lime-glow">{c.finalEyebrow}</p>
          <h2 className="heading-lg mt-3 text-white">{c.finalTitle(tiers)}</h2>
          <p className="mt-4 text-lg text-white/80">
            {c.finalText(pct, promo.months, promo.endsLabel, tiers)}
            {site.guarantee.enabled ? c.finalRisk(site.guarantee.days) : ""}
          </p>
          {tiers && (
            <ul className="mt-6 flex flex-wrap justify-center gap-2">
              {promoTiers(promo).map((t, i) => (
                <li
                  key={t.duration}
                  className={`rounded-full px-3 py-1.5 text-sm font-bold ${i === 0 ? "bg-lime-glow text-brand-950" : "bg-white/10 text-white ring-1 ring-white/15"}`}
                >
                  −{t.percent}% <span className={i === 0 ? "font-semibold" : "font-semibold text-white/70"}>{c.tier(t.months)}</span>
                </li>
              ))}
            </ul>
          )}
          <Countdown endsAt={promo.endsAt} className="mt-7 justify-center" />
          <Link href={href} data-lp-cta="black-friday-slot" className="btn-glow mt-8 text-lg">
            <Zap className="size-5" aria-hidden /> {c.cta(pct, tiers)} <ArrowRight className="size-5" aria-hidden />
          </Link>
          <div className="mt-8 flex justify-center">
            <TrustRow light />
          </div>
        </div>
      </div>
    </section>
  );
}

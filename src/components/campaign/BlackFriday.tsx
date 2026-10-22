import { Zap } from "lucide-react";
import { Countdown } from "@/components/promo/Countdown";
import { durations, type DurationId } from "@/config/pricing";
import { defineCopy, type Locale } from "@/i18n/config";
import type { PromoView } from "@/lib/promotion";

const period = (months: number, l: Locale) =>
  l === "en" ? (months > 1 ? `first ${months} months` : "first month") : months > 1 ? `eerste ${months} maanden` : "eerste maand";

/**
 * Black Friday op de landingspagina's: verschijnt vanzelf zolang een actie met
 * `theme: "blackfriday"` loopt (zie promotions in src/config/site.ts). Bewust
 * als accent (een regel in de hero, het actieblok bij de prijzen en de
 * afsluiter), zodat het verhaal van de pagina voorop blijft staan.
 * Verschilt de korting per looptijd (een staffel), dan staat er "tot" bij.
 */
export const bfCopy = defineCopy({
  nl: {
    label: "Black Friday",
    deal: (pct: number, months: number, tiers: boolean) => `${tiers ? "tot " : ""}${pct}% korting op je ${period(months, "nl")}`,
    until: (until: string) => `t/m ${until}`,
    endsIn: "De actie stopt over",
    tier: (months: number) => (months === 0 ? "los schema" : months === 1 ? "per maand" : `${months} maanden`),
    pricingTitle: (pct: number, months: number, tiers: boolean) => `${tiers ? `Tot ${pct}%` : `${pct}%`} korting op je ${period(months, "nl")}`,
    pricingIntro: (tiers: boolean): string =>
      tiers
        ? "Hoe langer je kiest, hoe meer korting. De korting zit automatisch in je eerste betalingen; daarna betaal je de normale prijs."
        : "De korting zit automatisch in je eerste betaling. Daarna betaal je de normale prijs.",
  },
  en: {
    label: "Black Friday",
    deal: (pct: number, months: number, tiers: boolean) => `${tiers ? "up to " : ""}${pct}% off your ${period(months, "en")}`,
    until: (until: string) => `until ${until}`,
    endsIn: "The offer ends in",
    tier: (months: number) => (months === 0 ? "one-off plan" : months === 1 ? "monthly" : `${months} months`),
    pricingTitle: (pct: number, months: number, tiers: boolean) => `${tiers ? `Up to ${pct}%` : `${pct}%`} off your ${period(months, "en")}`,
    pricingIntro: (tiers: boolean): string =>
      tiers
        ? "The longer you choose, the bigger the discount. The discount is applied to your first payments automatically; after that, you pay the regular price."
        : "The discount is applied to your first payment automatically. After that, you pay the regular price.",
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

/** Eén regel in de hero: de actie en hoe lang hij nog loopt. */
export function BlackFridayStrip({ promo, l }: { promo: PromoView; l: Locale }) {
  const c = bfCopy[l];
  return (
    <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-black py-2 pr-4 pl-2 text-sm font-semibold text-white">
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-lime-glow px-2.5 py-1 font-extrabold text-brand-950">
        <Zap className="size-4" aria-hidden /> {c.label}
      </span>
      <span>{c.deal(promoPercent(promo), promo.months, promoHasTiers(promo))}</span>
      <span className="text-lime-glow">
        <Countdown endsAt={promo.endsAt} variant="inline" />
      </span>
    </p>
  );
}

/** Kortingschips per looptijd; de grootste korting licht op. */
export function PromoTierChips({ promo, l, className = "" }: { promo: PromoView; l: Locale; className?: string }) {
  const c = bfCopy[l];
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {promoTiers(promo).map((t, i) => (
        <li
          key={t.duration}
          className={`rounded-full px-3 py-1.5 text-sm font-bold ${i === 0 ? "bg-lime-glow text-brand-950" : "bg-white/10 text-white ring-1 ring-white/15"}`}
        >
          −{t.percent}% <span className={i === 0 ? "font-semibold" : "font-semibold text-white/70"}>{c.tier(t.months)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Het actieblok boven de prijstabel: de korting, de staffel en de aftelklok. */
export function BlackFridayDeal({ promo, l }: { promo: PromoView; l: Locale }) {
  const c = bfCopy[l];
  const pct = promoPercent(promo);
  const tiers = promoHasTiers(promo);
  return (
    <div className="mx-auto max-w-4xl rounded-[var(--radius-card)] px-5 py-8 text-center text-white ring-1 ring-lime-glow/25 sm:px-10" style={bfGlow}>
      <p className="eyebrow !text-lime-glow">
        {c.label} · {c.until(promo.endsLabel)}
      </p>
      <h2 className="heading-lg mt-3 text-white">{c.pricingTitle(pct, promo.months, tiers)}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-white/75">{c.pricingIntro(tiers)}</p>
      {tiers && <PromoTierChips promo={promo} l={l} className="mt-5 justify-center" />}
      <p className="mt-6 text-xs font-bold tracking-wide text-white/60 uppercase">{c.endsIn}</p>
      <Countdown endsAt={promo.endsAt} className="mt-2 justify-center" />
    </div>
  );
}

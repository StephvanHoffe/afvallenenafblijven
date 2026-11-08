"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import { formatNumber } from "@/lib/format";

/**
 * Vuistregel (indicatie, geen voorschrift): 0,03 tot 0,035 liter per kilo
 * lichaamsgewicht, plus 0,5 tot 1 liter per uur sporten. Onze schema's
 * rekenen met 0,033 liter per kilo (src/lib/calculations.ts).
 */
const PER_KG = { low: 0.03, high: 0.035 } as const;
const PER_HOUR_SPORT = { low: 0.5, high: 1 } as const;
const SPORT_MINUTES = [0, 30, 60, 90, 120] as const;
const GLASS_L = 0.25;

const copy = defineCopy({
  nl: {
    title: "Bereken hoeveel je ongeveer moet drinken",
    weight: "Je gewicht",
    sport: "Hoe lang sport je vandaag?",
    sportLabel: (min: number) => (min === 0 ? "Niet" : min < 60 ? `${min} min` : `${formatNumber(min / 60, min % 60 ? 1 : 0, "nl")} uur`),
    empty: "Vul je gewicht in, dan zie je hier een indicatie van hoeveel je per dag kunt drinken.",
    outOfRange: "Controleer je gewicht: vul het in kilo's in, bijvoorbeeld 74.",
    perDay: "vocht per dag (indicatie)",
    glasses: (low: string, high: string) => `Dat is ongeveer ${low} tot ${high} glazen van 250 ml.`,
    base: (low: string, high: string) => `Basis: ${low}–${high} liter`,
    sportExtra: (low: string, high: string) => `Sporten: + ${low}–${high} liter`,
    note: "Een vuistregel, geen voorschrift. Alles wat je drinkt telt mee, ook thee, koffie en melk. Drink extra bij warmte of koorts, en let op je dorst en de kleur van je urine. Heb je hart- of nierproblemen, volg dan het advies van je arts.",
    privacy: "We slaan niets op: de berekening gebeurt in je eigen browser.",
  },
  en: {
    title: "Work out roughly how much to drink",
    weight: "Your weight",
    sport: "How long are you exercising today?",
    sportLabel: (min: number) => (min === 0 ? "None" : min < 60 ? `${min} min` : `${formatNumber(min / 60, min % 60 ? 1 : 0, "en")} h`),
    empty: "Fill in your weight and you'll see an indication of how much you could drink a day.",
    outOfRange: "Please check your weight: fill it in in kilos, for example 74.",
    perDay: "fluid a day (indication)",
    glasses: (low: string, high: string) => `That's around ${low} to ${high} glasses of 250 ml.`,
    base: (low: string, high: string) => `Base: ${low}–${high} litres`,
    sportExtra: (low: string, high: string) => `Exercise: + ${low}–${high} litres`,
    note: "A rule of thumb, not a prescription. Everything you drink counts, including tea, coffee and milk. Drink more in hot weather or with a fever, and pay attention to your thirst and the colour of your urine. If you have heart or kidney problems, follow your doctor's advice.",
    privacy: "We don't store anything: the calculation happens in your own browser.",
  },
});

const num = (v: string) => Number(v.replace(",", "."));
const litres = (x: number) => Math.round(x * 10) / 10;

/** Indicatie van je vochtbehoefte per dag, alleen in de browser. */
export function WaterCalculator() {
  const l = useLocale();
  const c = copy[l];
  const [weight, setWeight] = useState("");
  const [minutes, setMinutes] = useState<(typeof SPORT_MINUTES)[number]>(0);
  const n = (x: number, d = 0) => formatNumber(x, d, l);

  const result = useMemo(() => {
    const w = num(weight);
    if (!w) return { state: "empty" as const };
    if (w < 35 || w > 250) return { state: "range" as const };
    const hours = minutes / 60;
    const base = { low: w * PER_KG.low, high: w * PER_KG.high };
    const sport = { low: hours * PER_HOUR_SPORT.low, high: hours * PER_HOUR_SPORT.high };
    const total = { low: litres(base.low + sport.low), high: litres(base.high + sport.high) };
    return {
      state: "ok" as const,
      total,
      base: { low: litres(base.low), high: litres(base.high) },
      sport: { low: litres(sport.low), high: litres(sport.high) },
      glasses: { low: Math.round(total.low / GLASS_L), high: Math.round(total.high / GLASS_L) },
    };
  }, [weight, minutes]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <form className="card space-y-5 p-5 sm:p-6" onSubmit={(e) => e.preventDefault()} aria-labelledby="water-titel">
        <h2 id="water-titel" className="text-xl font-extrabold">
          {c.title}
        </h2>
        <label className="block max-w-[12rem]">
          <span className="label">{c.weight}</span>
          <span className="relative block">
            <input className="input pr-9" inputMode="decimal" autoComplete="off" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="74" />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">kg</span>
          </span>
        </label>
        <fieldset>
          <legend className="label">{c.sport}</legend>
          <div className="flex flex-wrap gap-2">
            {SPORT_MINUTES.map((m) => {
              const on = m === minutes;
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setMinutes(m)}
                  className={`rounded-2xl border-2 px-4 py-2.5 text-sm font-bold transition focus-visible:ring-4 focus-visible:ring-brand-200 focus-visible:outline-none ${
                    on ? "border-brand-600 bg-brand-50 text-brand-900" : "border-line bg-white hover:border-brand-300"
                  }`}
                >
                  {c.sportLabel(m)}
                </button>
              );
            })}
          </div>
        </fieldset>
        <p className="text-xs text-muted">{c.privacy}</p>
      </form>

      <div aria-live="polite" className="space-y-4 lg:self-start">
        {result.state !== "ok" ? (
          <div className="card flex items-start gap-3 p-5 text-muted sm:p-6">
            <Info className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
            <p>{result.state === "range" ? c.outOfRange : c.empty}</p>
          </div>
        ) : (
          <>
            <div className="rounded-[1.75rem] bg-brand-900 p-6 text-white shadow-[var(--shadow-lift)] sm:p-7">
              <p className="text-5xl font-extrabold tracking-tight tabular-nums sm:text-6xl">
                {n(result.total.low, 1)}–{n(result.total.high, 1)} <span className="text-2xl font-bold text-white/80">{l === "en" ? "litres" : "liter"}</span>
              </p>
              <p className="mt-2 text-lg font-semibold text-white/85">{c.perDay}</p>
              <p className="mt-3 text-sm text-white/75">{c.glasses(n(result.glasses.low), n(result.glasses.high))}</p>
              <p className="mt-1 text-sm text-white/75">
                {c.base(n(result.base.low, 1), n(result.base.high, 1))}
                {minutes > 0 && <> · {c.sportExtra(n(result.sport.low, 1), n(result.sport.high, 1))}</>}
              </p>
            </div>
            <p className="text-sm text-muted">{c.note}</p>
          </>
        )}
      </div>
    </div>
  );
}

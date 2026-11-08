"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Calculator, Info } from "lucide-react";
import Link from "@/i18n/Link";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import { trackEvent } from "@/lib/consent";
import { formatNumber } from "@/lib/format";

/** Referentiewaarden van de Gezondheidsraad voor volwassenen: 40 tot 70 % van de energie uit koolhydraten. */
const SHARES = [0.4, 0.55, 0.7] as const;
const KCAL_PER_GRAM = 4;

const copy = defineCopy({
  nl: {
    title: "Bereken je koolhydraten per dag",
    kcal: "Hoeveel calorieën eet je per dag?",
    noKcal: "Weet je je calorieën niet? Bereken je caloriebehoefte",
    empty: "Vul je calorieën per dag in, dan zie je hier direct hoeveel gram koolhydraten daarbij past.",
    outOfRange: "Controleer je invoer: vul je calorieën per dag in, bijvoorbeeld 2000.",
    perDay: "koolhydraten per dag",
    range: "40 tot 70 % van je energie (Gezondheidsraad)",
    shares: ["Ondergrens (40 %)", "Midden (55 %)", "Bovengrens (70 %)"],
    kcalOf: (kcal: string) => `${kcal} kcal`,
    plan: "Afvallen? In onze schema's komen eerst je eiwit en vet; de rest is voor koolhydraten, en nooit minder dan 50 gram per dag.",
    cta: "Maak mijn persoonlijke plan",
    ctaNote: "Gratis vragenlijst · ± 3 minuten · je betaalt pas als je een plan kiest",
    privacy: "We slaan niets op: de berekening gebeurt in je eigen browser.",
  },
  en: {
    title: "Calculate your carbs per day",
    kcal: "How many calories do you eat a day?",
    noKcal: "Don't know your calories? Calculate your calorie needs",
    empty: "Fill in your calories per day and you'll see straight away how many grams of carbs fit.",
    outOfRange: "Please check your input: fill in your calories per day, for example 2000.",
    perDay: "carbs a day",
    range: "40 to 70% of your energy (Dutch Health Council)",
    shares: ["Lower limit (40%)", "Middle (55%)", "Upper limit (70%)"],
    kcalOf: (kcal: string) => `${kcal} kcal`,
    plan: "Losing weight? In our plans, your protein and fat come first; the rest goes to carbs, and never less than 50 grams a day.",
    cta: "Create my personal plan",
    ctaNote: "Free questionnaire · about 3 minutes · you only pay once you choose a plan",
    privacy: "We don't store anything: the calculation happens in your own browser.",
  },
});

/** Calorieën zijn hele getallen: "2.000", "2,000" en "2000" worden allemaal 2000. */
const num = (v: string) => Number(v.replace(/\D/g, ""));
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** Koolhydraten per dag bij 40, 55 en 70 % van de energie, alleen in de browser. */
export function CarbCalculator() {
  const l = useLocale();
  const c = copy[l];
  const [kcal, setKcal] = useState("");
  const n = (x: number) => formatNumber(x, 0, l);

  const result = useMemo(() => {
    const k = num(kcal);
    if (!k) return { state: "empty" as const };
    if (k < 1000 || k > 5000) return { state: "range" as const };
    const grams = SHARES.map((s) => ({ grams: roundTo((k * s) / KCAL_PER_GRAM, 5), kcal: roundTo(k * s, 10) }));
    return { state: "ok" as const, kcal: k, grams };
  }, [kcal]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <form className="card space-y-5 p-5 sm:p-6" onSubmit={(e) => e.preventDefault()} aria-labelledby="koolhydraten-titel">
        <h2 id="koolhydraten-titel" className="text-xl font-extrabold">
          {c.title}
        </h2>
        <label className="block">
          <span className="label">{c.kcal}</span>
          <span className="relative block">
            <input
              className="input pr-14"
              inputMode="numeric"
              autoComplete="off"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
              placeholder="2000"
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">kcal</span>
          </span>
        </label>
        <Link href="/caloriebehoefte-berekenen" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 underline">
          <Calculator className="size-4 shrink-0" aria-hidden /> {c.noKcal}
        </Link>
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
                {n(result.grams[0].grams)}–{n(result.grams[2].grams)} <span className="text-2xl font-bold text-white/80">g</span>
              </p>
              <p className="mt-2 text-lg font-semibold text-white/85">{c.perDay}</p>
              <p className="mt-1 text-sm text-white/75">{c.range}</p>
              <ul className="mt-5 grid grid-cols-3 gap-2">
                {result.grams.map((g, i) => (
                  <li key={c.shares[i]} className="rounded-2xl bg-white/10 p-3">
                    <p className="text-xs font-semibold text-white/75">{c.shares[i]}</p>
                    <p className="mt-1 text-xl font-extrabold tabular-nums">{n(g.grams)} g</p>
                    <p className="text-xs text-white/70 tabular-nums">{c.kcalOf(n(g.kcal))}</p>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-muted">{c.plan}</p>
            <div className="card p-5">
              <Link
                href="/start?doel=afvallen"
                data-cta="koolhydraten-rekenhulp"
                onClick={() => trackEvent("carbs_to_quiz", { kcal: result.kcal })}
                className="btn-primary w-full !whitespace-normal sm:w-auto"
              >
                {c.cta} <ArrowRight className="size-5" aria-hidden />
              </Link>
              <p className="mt-2 text-xs text-muted">{c.ctaNote}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

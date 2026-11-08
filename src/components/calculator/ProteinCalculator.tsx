"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import Link from "@/i18n/Link";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import { PROTEIN_MINIMUM_PER_KG, PROTEIN_PER_KG, referenceWeight } from "@/lib/calculations";
import { trackEvent } from "@/lib/consent";
import { formatNumber } from "@/lib/format";

type Goal = "basis" | "afblijven" | "afvallen" | "sterker";

const PER_KG: Record<Goal, number> = { basis: PROTEIN_MINIMUM_PER_KG, ...PROTEIN_PER_KG };
const MEALS = 4;

const copy = defineCopy({
  nl: {
    title: "Bereken je eiwitbehoefte",
    weight: "Gewicht",
    height: "Lengte",
    goal: "Wat is je doel?",
    goals: {
      basis: { label: "Gezond eten", hint: "Minimum (Gezondheidsraad)" },
      afblijven: { label: "Op gewicht blijven", hint: "En regelmatig sporten" },
      afvallen: { label: "Afvallen", hint: "Spieren behouden" },
      sterker: { label: "Spieren opbouwen", hint: "Met krachttraining" },
    },
    empty: "Vul je gewicht en lengte in, dan zie je hier direct hoeveel eiwit je per dag nodig hebt.",
    outOfRange: "Controleer je gegevens: lengte in centimeters (bijv. 172), gewicht in kilo's (bijv. 74).",
    perDay: "eiwit per dag",
    perKg: (n: string) => `± ${n} gram per kilo lichaamsgewicht`,
    perMeal: (g: string) => `Verdeeld over ${MEALS} eetmomenten is dat ± ${g} gram per maaltijd.`,
    ref: (kg: string) => `Bij je lengte en gewicht rekenen we met ${kg} kilo: het gewicht bij een BMI van 25. Je spiermassa groeit niet mee met vetmassa.`,
    cta: "Laat je weekmenu op dit doel maken",
    ctaNote: "Gratis vragenlijst · ± 3 minuten · je betaalt pas als je een plan kiest",
    privacy: "We slaan niets op: de berekening gebeurt in je eigen browser.",
  },
  en: {
    title: "Calculate your protein needs",
    weight: "Weight",
    height: "Height",
    goal: "What's your goal?",
    goals: {
      basis: { label: "Eat healthily", hint: "Minimum (Dutch Health Council)" },
      afblijven: { label: "Maintain my weight", hint: "And work out regularly" },
      afvallen: { label: "Lose weight", hint: "Keep your muscle" },
      sterker: { label: "Build muscle", hint: "With strength training" },
    },
    empty: "Fill in your weight and height and you'll see straight away how much protein you need a day.",
    outOfRange: "Please check your details: height in centimetres (e.g. 172), weight in kilos (e.g. 74).",
    perDay: "protein a day",
    perKg: (n: string) => `± ${n} grams per kilo of body weight`,
    perMeal: (g: string) => `Spread over ${MEALS} meals, that's ± ${g} grams per meal.`,
    ref: (kg: string) => `For your height and weight, we use ${kg} kilos: the weight at a BMI of 25. Your muscle mass doesn't grow along with fat mass.`,
    cta: "Get your weekly menu built on this target",
    ctaNote: "Free questionnaire · about 3 minutes · you only pay once you choose a plan",
    privacy: "We don't store anything: the calculation happens in your own browser.",
  },
});

const num = (v: string) => Number(v.replace(",", "."));
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** Eiwit per dag met dezelfde regels als de schema's (src/lib/calculations.ts), alleen in de browser. */
export function ProteinCalculator() {
  const l = useLocale();
  const c = copy[l];
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [goal, setGoal] = useState<Goal>("afvallen");
  const n = (x: number, d = 0) => formatNumber(x, d, l);

  const result = useMemo(() => {
    const w = num(weight);
    const h = num(height);
    if (!w || !h) return { state: "empty" as const };
    if (h < 120 || h > 230 || w < 35 || w > 300) return { state: "range" as const };
    const ref = referenceWeight(w, h);
    // Het minimum op hele grammen (zoals in de tabel), de doelen op 5 gram (zoals in de schema's).
    const grams = goal === "basis" ? Math.round(ref * PER_KG[goal]) : roundTo(ref * PER_KG[goal], 5);
    return { state: "ok" as const, grams, ref, usedRef: ref < w - 0.5, perKg: grams / w, perMeal: roundTo(grams / MEALS, 5) };
  }, [weight, height, goal]);

  const quizGoal = goal === "basis" ? "afblijven" : goal;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <form className="card space-y-5 p-5 sm:p-6" onSubmit={(e) => e.preventDefault()} aria-labelledby="eiwit-titel">
        <h2 id="eiwit-titel" className="text-xl font-extrabold">
          {c.title}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">{c.weight}</span>
            <span className="relative block">
              <input className="input pr-9" inputMode="decimal" autoComplete="off" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="74" />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">kg</span>
            </span>
          </label>
          <label className="block">
            <span className="label">{c.height}</span>
            <span className="relative block">
              <input className="input pr-9" inputMode="numeric" autoComplete="off" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="172" />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">cm</span>
            </span>
          </label>
        </div>
        <fieldset>
          <legend className="label">{c.goal}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PER_KG) as Goal[]).map((g) => {
              const on = g === goal;
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setGoal(g)}
                  className={`rounded-2xl border-2 px-3 py-2.5 text-left text-sm leading-tight font-bold transition focus-visible:ring-4 focus-visible:ring-brand-200 focus-visible:outline-none ${
                    on ? "border-brand-600 bg-brand-50 text-brand-900" : "border-line bg-white hover:border-brand-300"
                  }`}
                >
                  {c.goals[g].label}
                  <span className="mt-0.5 block text-xs font-medium text-muted">{c.goals[g].hint}</span>
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
                {n(result.grams)} <span className="text-2xl font-bold text-white/80">g</span>
              </p>
              <p className="mt-2 text-lg font-semibold text-white/85">{c.perDay}</p>
              <p className="mt-3 text-sm text-white/75">{c.perKg(n(result.perKg, 1))}</p>
              <p className="mt-1 text-sm text-white/75">{c.perMeal(n(result.perMeal))}</p>
            </div>
            {result.usedRef && <p className="text-sm text-muted">{c.ref(n(result.ref))}</p>}
            <div className="card p-5">
              <Link
                href={`/start?doel=${quizGoal}`}
                data-cta="eiwit-rekenhulp"
                onClick={() => trackEvent("protein_to_quiz", { goal })}
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

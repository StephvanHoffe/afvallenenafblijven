"use client";

import { useMemo, useState } from "react";
import { Calculator, Info } from "lucide-react";
import { foods, nutrientsFor, roundNutrients } from "@/content/nutrition";
import Link from "@/i18n/Link";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import { formatNumber } from "@/lib/format";

/** WHO: vrije suikers onder 10 % van de energie, liefst onder 5 %. 1 gram suiker = 4 kcal; een suikerklontje ≈ 4 gram. */
const MAX_SHARE = 0.1;
const IDEAL_SHARE = 0.05;
const KCAL_PER_GRAM = 4;
const GRAMS_PER_CUBE = 4;

const colaPortion = foods.cola.portions[0];
const COLA_SUGAR = roundNutrients(nutrientsFor("cola", colaPortion.amount)).sugars ?? 0;

const copy = defineCopy({
  nl: {
    title: "Bereken je suikergrens per dag",
    kcal: "Hoeveel calorieën eet je per dag?",
    noKcal: "Weet je je calorieën niet? Bereken je caloriebehoefte",
    empty: "Vul je calorieën per dag in, dan zie je hier hoeveel vrije suikers er volgens het WHO-advies bij passen.",
    outOfRange: "Controleer je invoer: vul je calorieën per dag in, bijvoorbeeld 2000.",
    max: "Maximaal (10 %)",
    ideal: "Liefst (5 %)",
    lessThan: (g: string) => `minder dan ${g} g`,
    cubes: (n: string) => `≈ ${n} suikerklontjes`,
    perDay: "vrije suikers per dag",
    cola: (sugar: string, share: string) => `Ter vergelijking: één blikje cola (33 cl) bevat ± ${sugar} gram suiker. Dat is al ${share} % van je maximum.`,
    colaOver: (sugar: string) => `Ter vergelijking: één blikje cola (33 cl) bevat ± ${sugar} gram suiker. Dat is al meer dan je hele maximum.`,
    note: "Het gaat om vrije suikers: toegevoegde suiker en de suikers in honing, siroop en vruchtensap. Suikers in heel fruit en melk tellen niet mee.",
    privacy: "We slaan niets op: de berekening gebeurt in je eigen browser.",
  },
  en: {
    title: "Calculate your daily sugar limit",
    kcal: "How many calories do you eat a day?",
    noKcal: "Don't know your calories? Calculate your calorie needs",
    empty: "Fill in your calories per day and you'll see how much free sugar fits within the WHO advice.",
    outOfRange: "Please check your input: fill in your calories per day, for example 2000.",
    max: "Maximum (10%)",
    ideal: "Ideally (5%)",
    lessThan: (g: string) => `less than ${g} g`,
    cubes: (n: string) => `≈ ${n} sugar cubes`,
    perDay: "free sugars a day",
    cola: (sugar: string, share: string) => `For comparison: one can of cola (33 cl) contains around ${sugar} grams of sugar. That's already ${share}% of your maximum.`,
    colaOver: (sugar: string) => `For comparison: one can of cola (33 cl) contains around ${sugar} grams of sugar. That's already more than your whole maximum.`,
    note: "This is about free sugars: added sugar and the sugars in honey, syrup and fruit juice. Sugars in whole fruit and milk don't count.",
    privacy: "We don't store anything: the calculation happens in your own browser.",
  },
});

/** Calorieën zijn hele getallen: "2.000", "2,000" en "2000" worden allemaal 2000. */
const num = (v: string) => Number(v.replace(/\D/g, ""));

/** Grens voor vrije suikers bij 10 en 5 % van de energie, alleen in de browser. */
export function SugarCalculator() {
  const l = useLocale();
  const c = copy[l];
  const [kcal, setKcal] = useState("");
  const n = (x: number, d = 0) => formatNumber(x, d, l);

  const result = useMemo(() => {
    const k = num(kcal);
    if (!k) return { state: "empty" as const };
    if (k < 1000 || k > 5000) return { state: "range" as const };
    const max = Math.round((k * MAX_SHARE) / KCAL_PER_GRAM);
    const ideal = Math.round((k * IDEAL_SHARE) / KCAL_PER_GRAM);
    return {
      state: "ok" as const,
      max,
      ideal,
      // Afgerond naar beneden: het is een bovengrens.
      maxCubes: Math.floor(max / GRAMS_PER_CUBE),
      idealCubes: Math.floor(ideal / GRAMS_PER_CUBE),
      colaShare: Math.round((COLA_SUGAR / max) * 100),
    };
  }, [kcal]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <form className="card space-y-5 p-5 sm:p-6" onSubmit={(e) => e.preventDefault()} aria-labelledby="suiker-titel">
        <h2 id="suiker-titel" className="text-xl font-extrabold">
          {c.title}
        </h2>
        <label className="block">
          <span className="label">{c.kcal}</span>
          <span className="relative block">
            <input className="input pr-14" inputMode="numeric" autoComplete="off" value={kcal} onChange={(e) => setKcal(e.target.value)} placeholder="2000" />
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
              <p className="text-lg font-semibold text-white/85">{c.perDay}</p>
              <ul className="mt-4 grid grid-cols-2 gap-3">
                <li className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs font-semibold text-white/75">{c.max}</p>
                  <p className="mt-1 text-2xl font-extrabold tabular-nums sm:text-3xl">{c.lessThan(n(result.max))}</p>
                  <p className="mt-1 text-sm text-white/75">{c.cubes(n(result.maxCubes))}</p>
                </li>
                <li className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs font-semibold text-white/75">{c.ideal}</p>
                  <p className="mt-1 text-2xl font-extrabold tabular-nums sm:text-3xl">{c.lessThan(n(result.ideal))}</p>
                  <p className="mt-1 text-sm text-white/75">{c.cubes(n(result.idealCubes))}</p>
                </li>
              </ul>
              <p className="mt-4 text-sm text-white/75">{result.colaShare > 100 ? c.colaOver(n(COLA_SUGAR)) : c.cola(n(COLA_SUGAR), n(result.colaShare))}</p>
            </div>
            <p className="text-sm text-muted">{c.note}</p>
          </>
        )}
      </div>
    </div>
  );
}

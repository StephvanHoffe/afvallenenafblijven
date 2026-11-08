"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Info, TriangleAlert } from "lucide-react";
import Link from "@/i18n/Link";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import { intakeLabels } from "@/i18n/options";
import { savePrefill } from "@/lib/calculator-prefill";
import { bmi as bmiOf, minimumCalories, nutritionTargets } from "@/lib/calculations";
import { trackEvent } from "@/lib/consent";
import { formatNumber } from "@/lib/format";
import { activityOptions, paceOptions, type Intake } from "@/lib/intake";

type Goal = "afvallen" | "afblijven" | "sterker";

const copy = defineCopy({
  nl: {
    title: "Bereken je caloriebehoefte",
    sex: "Geslacht",
    sexes: { vrouw: "Vrouw", man: "Man" },
    age: "Leeftijd",
    years: "jaar",
    height: "Lengte",
    weight: "Gewicht",
    activity: "Hoe actief ben je overdag?",
    sport: "Hoe vaak sport je per week?",
    sportTimes: (n: number) => (n === 0 ? "Niet" : n === 6 ? "6×+" : `${n}×`),
    goal: "Wat is je doel?",
    goals: { afvallen: "Afvallen", afblijven: "Op gewicht blijven", sterker: "Spieren opbouwen" },
    pace: "Hoe snel wil je afvallen?",
    empty: "Vul je gegevens in, dan zie je hier direct je uitkomst.",
    tooYoung: "Deze rekenhulp is voor volwassenen (18 jaar en ouder). Voor kinderen en tieners gelden andere behoeften.",
    outOfRange: "Controleer je lengte en gewicht: vul je lengte in centimeters in (bijv. 172) en je gewicht in kilo's (bijv. 74).",
    resultFor: {
      afvallen: (kg: string) => `per dag om af te vallen (± ${kg} kg per week)`,
      afblijven: () => "per dag om op gewicht te blijven",
      sterker: () => "per dag om spieren op te bouwen (klein overschot)",
    },
    minimum: (kcal: string) => `We gaan nooit onder ${kcal} kcal per dag; daaronder krijg je te weinig voedingsstoffen binnen.`,
    capped: "Je gekozen tempo vraagt een groter tekort dan verstandig is (meer dan 25% onder je verbruik). We rekenen daarom met een rustiger tempo.",
    underweight:
      "Met jouw lengte en gewicht heb je volgens de BMI al ondergewicht. Afvallen is dan niet gezond; hieronder zie je wat je nodig hebt om op gewicht te blijven. Overleg bij twijfel met je huisarts.",
    highBmi: "Bij een BMI van 35 of hoger raden we aan om je huisarts op de hoogte te brengen van je plannen.",
    bmr: "Ruststofwisseling (BMR)",
    bmrHint: "Wat je lichaam in rust verbruikt",
    tdee: "Dagelijks verbruik (TDEE)",
    tdeeHint: "Om op gewicht te blijven",
    protein: "Eiwit",
    proteinHint: (perKg: string) => `± ${perKg} g per kilo lichaamsgewicht`,
    fat: "Vet",
    carbs: "Koolhydraten",
    bmi: "BMI",
    kcal: "kcal",
    perDay: "per dag",
    ctaTitle: "Van een getal naar een plan",
    ctaText:
      "Een getal alleen helpt je niet de week door. In je persoonlijke voedingsschema staat een weekmenu met recepten en boodschappenlijst dat precies op dit doel uitkomt, en elke week bijgestuurd wordt.",
    cta: "Maak er een persoonlijk plan van",
    ctaNote: "Je antwoorden staan al klaar in de vragenlijst · je betaalt pas als je een plan kiest",
    privacy: "Je gegevens blijven op je eigen apparaat: we slaan niets op en sturen niets door.",
    pregnant: "Zwanger of geef je borstvoeding? Dan heb je andere behoeften; overleg met je verloskundige of huisarts.",
  },
  en: {
    title: "Calculate your calorie needs",
    sex: "Sex",
    sexes: { vrouw: "Female", man: "Male" },
    age: "Age",
    years: "years",
    height: "Height",
    weight: "Weight",
    activity: "How active are you during the day?",
    sport: "How often do you work out per week?",
    sportTimes: (n: number) => (n === 0 ? "None" : n === 6 ? "6×+" : `${n}×`),
    goal: "What's your goal?",
    goals: { afvallen: "Lose weight", afblijven: "Maintain my weight", sterker: "Build muscle" },
    pace: "How fast would you like to lose weight?",
    empty: "Fill in your details and you'll see your result here straight away.",
    tooYoung: "This calculator is for adults (18 and over). Children and teenagers have different needs.",
    outOfRange: "Please check your height and weight: enter your height in centimetres (e.g. 172) and your weight in kilos (e.g. 74).",
    resultFor: {
      afvallen: (kg: string) => `a day to lose weight (± ${kg} kg a week)`,
      afblijven: () => "a day to maintain your weight",
      sterker: () => "a day to build muscle (small surplus)",
    },
    minimum: (kcal: string) => `We never go below ${kcal} kcal a day; below that, you don't get enough nutrients.`,
    capped: "Your chosen pace needs a bigger deficit than is sensible (more than 25% below your maintenance level), so we use a steadier pace.",
    underweight:
      "Based on your height and weight, your BMI already indicates that you're underweight. Losing weight wouldn't be healthy, so below you'll see what you need to maintain your weight. If in doubt, talk to your GP.",
    highBmi: "With a BMI of 35 or higher, we recommend letting your GP know about your plans.",
    bmr: "Basal metabolic rate (BMR)",
    bmrHint: "What your body uses at rest",
    tdee: "Daily energy use (TDEE)",
    tdeeHint: "To maintain your weight",
    protein: "Protein",
    proteinHint: (perKg: string) => `± ${perKg} g per kilo of body weight`,
    fat: "Fat",
    carbs: "Carbohydrates",
    bmi: "BMI",
    kcal: "kcal",
    perDay: "a day",
    ctaTitle: "From a number to a plan",
    ctaText:
      "A number alone won't get you through the week. Your personal nutrition plan has a weekly menu with recipes and a shopping list that adds up to exactly this target, and it's fine-tuned every week.",
    cta: "Turn this into a personal plan",
    ctaNote: "Your answers are already filled in · you only pay once you choose a plan",
    privacy: "Your details stay on your own device: we don't store or send anything.",
    pregnant: "Pregnant or breastfeeding? Then your needs are different; please talk to your midwife or GP.",
  },
});

const num = (v: string) => Number(v.replace(",", "."));

function Choice<T extends string | number>({
  label,
  value,
  options,
  onChange,
  columns = "grid-cols-2",
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
  columns?: string;
}) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className={`grid gap-2 ${columns}`}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.value)}
              className={`rounded-2xl border-2 px-3 py-2.5 text-left text-sm leading-tight font-bold transition focus-visible:ring-4 focus-visible:ring-brand-200 focus-visible:outline-none ${
                on ? "border-brand-600 bg-brand-50 text-brand-900" : "border-line bg-white hover:border-brand-300"
              }`}
            >
              {o.label}
              {o.hint && <span className="mt-0.5 block text-xs font-medium text-muted">{o.hint}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Gratis rekenhulp: ruststofwisseling, dagelijks verbruik en het dagdoel voor
 * calorieën en eiwit, met dezelfde formules en grenzen als de schema's
 * (src/lib/calculations.ts). Rekent alleen in de browser; pas bij "maak er een
 * plan van" zetten we de antwoorden klaar voor de vragenlijst (sessionStorage).
 */
export function CalorieCalculator() {
  const l = useLocale();
  const c = copy[l];
  const labels = intakeLabels(l);
  const [sex, setSex] = useState<Intake["sex"] | null>(null);
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState<Intake["activity"] | null>(null);
  const [sport, setSport] = useState(2);
  const [goal, setGoal] = useState<Goal>("afvallen");
  const [pace, setPace] = useState<Intake["pace"]>("gemiddeld");
  const n = (x: number, d = 0) => formatNumber(x, d, l);

  const result = useMemo(() => {
    const a = num(age);
    const h = num(height);
    const w = num(weight);
    if (!sex || !activity || !a || !h || !w) return { state: "empty" as const };
    if (a < 18) return { state: "young" as const };
    if (a > 100 || h < 120 || h > 230 || w < 35 || w > 300) return { state: "range" as const };
    const currentBmi = bmiOf(w, h);
    const underweight = goal === "afvallen" && currentBmi < 18.5;
    const effectiveGoal: Intake["goal"] = underweight ? "afblijven" : goal;
    const input = {
      sex,
      age: Math.round(a),
      heightCm: Math.round(h),
      weightKg: w,
      activity,
      goal: effectiveGoal,
      pace,
      experience: "beginner" as const,
      trainingDays: sport,
      product: "bundel" as const,
    };
    const t = nutritionTargets(input);
    const wantedKg = paceOptions[pace].kgPerWeek;
    return {
      state: "ok" as const,
      t,
      goal: effectiveGoal as Goal,
      underweight,
      atMinimum: effectiveGoal === "afvallen" && t.calories <= minimumCalories(input),
      capped: effectiveGoal === "afvallen" && -t.expectedKgPerWeek < wantedKg - 0.05,
      proteinPerKg: t.proteinG / w,
      prefill: { sex, age: input.age, heightCm: input.heightCm, weightKg: w, activity, pace },
    };
  }, [sex, age, height, weight, activity, sport, goal, pace]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
      <form className="card space-y-5 p-5 sm:p-6" onSubmit={(e) => e.preventDefault()} aria-labelledby="rekenhulp-titel">
        <h2 id="rekenhulp-titel" className="text-xl font-extrabold">
          {c.title}
        </h2>
        <Choice
          label={c.sex}
          value={sex}
          onChange={setSex}
          options={(["vrouw", "man"] as const).map((v) => ({ value: v, label: c.sexes[v] }))}
        />
        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="label">{c.age}</span>
            <span className="relative block">
              <input className="input pr-10" inputMode="numeric" autoComplete="off" value={age} onChange={(e) => setAge(e.target.value)} placeholder="40" />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">{c.years}</span>
            </span>
          </label>
          <label className="block">
            <span className="label">{c.height}</span>
            <span className="relative block">
              <input className="input pr-9" inputMode="numeric" autoComplete="off" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="172" />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">cm</span>
            </span>
          </label>
          <label className="block">
            <span className="label">{c.weight}</span>
            <span className="relative block">
              <input className="input pr-9" inputMode="decimal" autoComplete="off" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="74" />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">kg</span>
            </span>
          </label>
        </div>
        <Choice
          label={c.activity}
          value={activity}
          onChange={setActivity}
          options={(Object.keys(activityOptions) as Intake["activity"][]).map((v) => ({
            value: v,
            label: labels.activity[v].label,
            hint: labels.activity[v].description,
          }))}
        />
        <Choice
          label={c.sport}
          value={sport}
          onChange={setSport}
          columns="grid-cols-4 sm:grid-cols-7"
          options={[0, 1, 2, 3, 4, 5, 6].map((v) => ({ value: v, label: c.sportTimes(v) }))}
        />
        <Choice
          label={c.goal}
          value={goal}
          onChange={setGoal}
          columns="grid-cols-3"
          options={(["afvallen", "afblijven", "sterker"] as const).map((v) => ({ value: v, label: c.goals[v] }))}
        />
        {goal === "afvallen" && (
          <Choice
            label={c.pace}
            value={pace}
            onChange={setPace}
            columns="grid-cols-3"
            options={(Object.keys(paceOptions) as Intake["pace"][]).map((v) => ({
              value: v,
              label: labels.pace[v].label,
              hint: labels.pace[v].description,
            }))}
          />
        )}
        <p className="text-xs text-muted">{c.privacy}</p>
      </form>

      <div aria-live="polite" className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        {result.state !== "ok" ? (
          <div className="card flex items-start gap-3 p-5 text-muted sm:p-6">
            <Info className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
            <p>{result.state === "young" ? c.tooYoung : result.state === "range" ? c.outOfRange : c.empty}</p>
          </div>
        ) : (
          <>
            <div className="rounded-[1.75rem] bg-brand-900 p-6 text-white shadow-[var(--shadow-lift)] sm:p-7">
              <p className="text-5xl font-extrabold tracking-tight tabular-nums sm:text-6xl">
                {n(result.t.calories)} <span className="text-2xl font-bold text-white/80">{c.kcal}</span>
              </p>
              <p className="mt-2 text-lg font-semibold text-white/85">
                {result.goal === "afvallen" ? c.resultFor.afvallen(n(-result.t.expectedKgPerWeek, 1)) : c.resultFor[result.goal]()}
              </p>
              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-white/15 pt-4 text-sm">
                <div>
                  <dt className="text-white/70">{c.protein}</dt>
                  <dd className="text-xl font-extrabold tabular-nums">{n(result.t.proteinG)} g</dd>
                </div>
                <div>
                  <dt className="text-white/70">{c.fat}</dt>
                  <dd className="text-xl font-extrabold tabular-nums">{n(result.t.fatG)} g</dd>
                </div>
                <div>
                  <dt className="text-white/70">{c.carbs}</dt>
                  <dd className="text-xl font-extrabold tabular-nums">{n(result.t.carbsG)} g</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-white/70">{c.proteinHint(n(result.proteinPerKg, 1))}</p>
            </div>
            {/* Op mobiel onder elkaar (label links, getal rechts), vanaf sm naast elkaar. */}
            <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
              {[
                { label: c.bmr, value: `${n(result.t.bmr)} ${c.kcal}`, hint: c.bmrHint },
                { label: c.tdee, value: `${n(result.t.tdee)} ${c.kcal}`, hint: c.tdeeHint },
                { label: c.bmi, value: n(result.t.bmi, 1), hint: "" },
              ].map((x) => (
                <div key={x.label} className="card flex items-center justify-between gap-3 px-4 py-3 sm:block sm:p-4">
                  <div className="min-w-0">
                    <p className="text-xs leading-tight font-bold text-muted">{x.label}</p>
                    {x.hint && <p className="text-xs leading-tight text-muted sm:hidden">{x.hint}</p>}
                  </div>
                  <p className="shrink-0 text-lg font-extrabold tabular-nums sm:mt-1">{x.value}</p>
                  {x.hint && <p className="hidden text-xs leading-tight text-muted sm:block">{x.hint}</p>}
                </div>
              ))}
            </div>
            {(result.underweight || result.atMinimum || result.capped || result.t.bmi >= 35) && (
              <div className="flex items-start gap-3 rounded-2xl border border-accent-200 bg-accent-50 p-4 text-sm">
                <TriangleAlert className="mt-0.5 size-5 shrink-0 text-accent-600" aria-hidden />
                <div className="space-y-1.5">
                  {result.underweight && <p>{c.underweight}</p>}
                  {result.atMinimum && <p>{c.minimum(n(minimumCalories({ sex: result.prefill.sex })))}</p>}
                  {result.capped && !result.atMinimum && <p>{c.capped}</p>}
                  {result.t.bmi >= 35 && <p>{c.highBmi}</p>}
                </div>
              </div>
            )}
            <div className="card p-5 sm:p-6">
              <p className="text-lg font-extrabold">{c.ctaTitle}</p>
              <p className="mt-2 text-muted">{c.ctaText}</p>
              <Link
                href={`/start?doel=${result.goal}`}
                data-cta="rekenhulp"
                onClick={() => {
                  savePrefill(result.prefill);
                  trackEvent("calculator_to_quiz", { goal: result.goal });
                }}
                className="btn-primary mt-4 w-full !whitespace-normal sm:w-auto"
              >
                {c.cta} <ArrowRight className="size-5" aria-hidden />
              </Link>
              <p className="mt-2 text-xs text-muted">{c.ctaNote}</p>
            </div>
            <p className="text-xs text-muted">{c.pregnant}</p>
          </>
        )}
      </div>
    </div>
  );
}

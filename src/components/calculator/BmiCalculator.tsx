"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Calculator, Info, TriangleAlert } from "lucide-react";
import Link from "@/i18n/Link";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import { bmi as bmiOf } from "@/lib/calculations";
import { trackEvent } from "@/lib/consent";
import { formatNumber } from "@/lib/format";

type Sex = "vrouw" | "man";
type Category = "under" | "healthy" | "over" | "obese";
type SeniorStatus = "low" | "ok" | "high";
type WaistRisk = "ok" | "raised" | "high";

/** BMI-grenzen voor volwassenen (WHO, ook gebruikt door het Voedingscentrum). */
const HEALTHY = { min: 18.5, max: 24.9 };
/** Voor 70-plussers vindt het Voedingscentrum een BMI van ongeveer 22 tot 28 gezond. */
const SENIOR = { age: 70, min: 22, max: 28 };
/** Buikomvang in cm (Voedingscentrum): onder `ok` gezond, tot en met `raised` verhoogd risico, daarboven sterk verhoogd. */
const WAIST: Record<Sex, { ok: number; raised: number }> = { vrouw: { ok: 80, raised: 88 }, man: { ok: 94, raised: 102 } };
/** Bereik van de schaalbalk in de uitkomst. */
const SCALE = { min: 15, max: 40 };
const SEGMENTS = [
  { from: 15, to: 18.5, className: "bg-accent-200" },
  { from: 18.5, to: 25, className: "bg-brand-400" },
  { from: 25, to: 30, className: "bg-accent-300" },
  { from: 30, to: 40, className: "bg-accent-500" },
];

const copy = defineCopy({
  nl: {
    title: "Bereken je BMI",
    height: "Lengte",
    weight: "Gewicht",
    optional: "Optioneel",
    optionalHint: "voor een completer beeld",
    age: "Leeftijd",
    years: "jaar",
    sex: "Geslacht",
    sexes: { vrouw: "Vrouw", man: "Man" } as Record<Sex, string>,
    waist: "Buikomvang",
    waistHow: "Vul je geslacht en buikomvang in om te zien of je buikomvang gezond is. Meet halverwege je onderste rib en de bovenkant van je heupbot, terwijl je rustig uitademt.",
    privacy: "We slaan niets op: de berekening gebeurt in je eigen browser.",
    empty: "Vul je lengte en gewicht in, dan zie je hier direct je BMI en welk gewicht gezond is bij jouw lengte.",
    outOfRange: "Controleer je gegevens: lengte in centimeters (tussen 120 en 230, bijv. 172) en gewicht in kilo's (tussen 35 en 300, bijv. 74).",
    ageInvalid: "Controleer je leeftijd: vul die in hele jaren in (bijv. 45), of laat het veld leeg.",
    tooYoung:
      "Ben je jonger dan 18? Dan past deze BMI-indeling niet bij jou. Voor kinderen en tieners hangt een gezonde BMI af van leeftijd en geslacht, en daarvoor worden aparte grafieken gebruikt. Twijfel je over je gewicht, vraag het dan aan je huisarts of de jeugdarts.",
    yourBmi: "Je BMI",
    categories: { under: "Ondergewicht", healthy: "Gezond gewicht", over: "Overgewicht", obese: "Obesitas" } as Record<Category, string>,
    categoryNote: "Indeling voor volwassenen (WHO)",
    formula: (w: string, m: string, b: string) => `${w} kg ÷ (${m} m)² = ${b}`,
    range: (h: string) => `Gezond gewicht bij ${h} cm`,
    rangeHint: "BMI 18,5 tot 24,9",
    seniorRange: "Gezond gewicht voor 70-plussers",
    seniorRangeHint: "BMI 22 tot 28 (Voedingscentrum)",
    messages: {
      under:
        "Je BMI ligt onder de 18,5. Volgens de WHO-indeling heet dat ondergewicht. Afvallen is dan niet gezond. Twijfel je of je gewicht goed is, of val je af zonder dat je dat wilt? Overleg dan met je huisarts.",
      healthy: "Je BMI ligt tussen 18,5 en 24,9. Dat is een gezond gewicht voor je lengte. Je buikomvang laat daarnaast zien hoeveel vet je rond je buik hebt.",
      over: "Je BMI ligt tussen 25 en 29,9. Volgens de WHO-indeling heet dat overgewicht. De BMI ziet geen verschil tussen spieren en vet, dus kijk ook naar je buikomvang.",
      obese: "Je BMI is 30 of hoger. Volgens de WHO-indeling heet dat obesitas. De BMI zegt niet waar je vet zit; je buikomvang laat daar meer van zien.",
    } as Record<Category, string>,
    senior: (min: string, max: string) =>
      `Je bent 70 of ouder. Dan vindt het Voedingscentrum een BMI van ongeveer 22 tot 28 gezond. Bij jouw lengte is dat zo'n ${min} tot ${max} kilo.`,
    seniorStatus: {
      low: "Je BMI ligt daaronder. Afvallen is dan niet verstandig. Val je af zonder dat je dat wilt, of twijfel je? Overleg dan met je huisarts.",
      ok: "Je BMI valt daarbinnen.",
      high: "Je BMI ligt daarboven. Wil je afvallen, doe het dan rustig, eet genoeg eiwit en blijf bewegen, zodat je spieren sterk blijven. Twijfel je, overleg dan met je huisarts.",
    } as Record<SeniorStatus, string>,
    gp: "Bij een BMI van 35 of hoger raden we aan om je huisarts op de hoogte te brengen als je wilt gaan afvallen.",
    waistTitle: "Je buikomvang",
    waistRisk: { ok: "Gezond", raised: "Verhoogd risico", high: "Sterk verhoogd risico" } as Record<WaistRisk, string>,
    waistText: (sex: Sex, cm: string, ok: number, raised: number) =>
      `${cm} cm. Voor ${sex === "vrouw" ? "vrouwen" : "mannen"} is minder dan ${ok} cm gezond, ${ok} tot ${raised} cm geeft een verhoogd risico en meer dan ${raised} cm een sterk verhoogd risico (Voedingscentrum).`,
    waistWhy: "Veel buikvet hangt samen met een hoger risico op onder andere hart- en vaatziekten en diabetes type 2.",
    waistInvalid: "Controleer je buikomvang: vul die in centimeters in (bijv. 84).",
    waistNeedsSex: "Kies ook je geslacht, dan zie je of je buikomvang gezond is.",
    lossTitle: "Wil je afvallen?",
    lossText:
      "Kijk eerst hoeveel calorieën je per dag nodig hebt. Of maak meteen een persoonlijk plan: dat wordt automatisch samengesteld op basis van je gegevens, met een weekmenu, recepten en boodschappenlijst.",
    keepTitle: "Op gewicht blijven?",
    keepText: "Met een persoonlijk plan eet je volgens je eigen verbruik, met een weekmenu, recepten en boodschappenlijst. Het plan wordt automatisch samengesteld op basis van je gegevens.",
    planCta: "Maak mijn persoonlijke plan",
    calorieCta: "Bereken je caloriebehoefte",
    ctaNote: "± 3 minuten · je betaalt pas als je een plan kiest",
    pregnant: "Zwanger? Dan zegt je BMI weinig. Je verloskundige of huisarts kan je vertellen wat voor jou gezond is.",
  },
  en: {
    title: "Calculate your BMI",
    height: "Height",
    weight: "Weight",
    optional: "Optional",
    optionalHint: "for a fuller picture",
    age: "Age",
    years: "years",
    sex: "Sex",
    sexes: { vrouw: "Female", man: "Male" },
    waist: "Waist",
    waistHow: "Fill in your sex and waist measurement to see whether your waist is healthy. Measure halfway between your lowest rib and the top of your hip bone, while breathing out gently.",
    privacy: "We don't store anything: the calculation happens in your own browser.",
    empty: "Fill in your height and weight and you'll see your BMI straight away, plus which weight is healthy for your height.",
    outOfRange: "Please check your details: height in centimetres (between 120 and 230, e.g. 172) and weight in kilos (between 35 and 300, e.g. 74).",
    ageInvalid: "Please check your age: enter it in whole years (e.g. 45), or leave the field empty.",
    tooYoung:
      "Under 18? Then these BMI categories don't apply to you. For children and teenagers, a healthy BMI depends on age and sex, and separate charts are used for that. If you're unsure about your weight, ask your GP.",
    yourBmi: "Your BMI",
    categories: { under: "Underweight", healthy: "Healthy weight", over: "Overweight", obese: "Obesity" },
    categoryNote: "Categories for adults (WHO)",
    formula: (w: string, m: string, b: string) => `${w} kg ÷ (${m} m)² = ${b}`,
    range: (h: string) => `Healthy weight at ${h} cm`,
    rangeHint: "BMI 18.5 to 24.9",
    seniorRange: "Healthy weight for over-70s",
    seniorRangeHint: "BMI 22 to 28 (Voedingscentrum)",
    messages: {
      under:
        "Your BMI is below 18.5. In the WHO categories, that's underweight. Losing weight wouldn't be healthy. If you're unsure whether your weight is right, or you're losing weight without trying, please talk to your GP.",
      healthy: "Your BMI is between 18.5 and 24.9. That's a healthy weight for your height. Your waist measurement also shows how much fat you carry around your middle.",
      over: "Your BMI is between 25 and 29.9. In the WHO categories, that's overweight. BMI can't tell muscle from fat, so look at your waist measurement too.",
      obese: "Your BMI is 30 or higher. In the WHO categories, that's obesity. BMI doesn't show where you carry fat; your waist measurement tells you more about that.",
    },
    senior: (min: string, max: string) =>
      `You're 70 or older. For your age group, the Netherlands Nutrition Centre (Voedingscentrum) considers a BMI of roughly 22 to 28 healthy. At your height, that's about ${min} to ${max} kilos.`,
    seniorStatus: {
      low: "Your BMI is below that. Losing weight wouldn't be sensible. If you're losing weight without trying, or you're unsure, please talk to your GP.",
      ok: "Your BMI is within that range.",
      high: "Your BMI is above that. If you want to lose weight, take it slowly, eat enough protein and keep moving so your muscles stay strong. If in doubt, talk to your GP.",
    },
    gp: "With a BMI of 35 or higher, we recommend letting your GP know if you're planning to lose weight.",
    waistTitle: "Your waist",
    waistRisk: { ok: "Healthy", raised: "Increased risk", high: "Greatly increased risk" },
    waistText: (sex: Sex, cm: string, ok: number, raised: number) =>
      `${cm} cm. For ${sex === "vrouw" ? "women" : "men"}, less than ${ok} cm is healthy, ${ok} to ${raised} cm means an increased risk and more than ${raised} cm a greatly increased risk (Voedingscentrum).`,
    waistWhy: "A lot of belly fat is linked to a higher risk of conditions such as cardiovascular disease and type 2 diabetes.",
    waistInvalid: "Please check your waist measurement: enter it in centimetres (e.g. 84).",
    waistNeedsSex: "Choose your sex as well to see whether your waist measurement is healthy.",
    lossTitle: "Want to lose weight?",
    lossText:
      "Start by checking how many calories you need a day. Or create a personal plan straight away: it's put together automatically from your details, with a weekly menu, recipes and a shopping list.",
    keepTitle: "Want to stay at this weight?",
    keepText: "With a personal plan, you eat in line with your own energy use, with a weekly menu, recipes and a shopping list. The plan is put together automatically from your details.",
    planCta: "Create my personal plan",
    calorieCta: "Calculate your calorie needs",
    ctaNote: "About 3 minutes · you only pay once you choose a plan",
    pregnant: "Pregnant? Then your BMI says little. Your midwife or GP can tell you what's healthy for you.",
  },
});

const num = (v: string) => Number(v.replace(",", "."));
const round1 = (x: number) => Math.round(x * 10) / 10;

/** Categorie op basis van de BMI op 1 decimaal (zoals getoond): 24,9 is nog gezond, 25,0 niet meer. */
function categoryOf(b: number): Category {
  return b < HEALTHY.min ? "under" : b < 25 ? "healthy" : b < 30 ? "over" : "obese";
}

/**
 * Hele kilo's bij deze lengte waarbij de BMI (op 1 decimaal) tussen `lo` en
 * `hi` ligt. Zo spreken het gezonde bereik en de getoonde categorie elkaar
 * nooit tegen. Zelfde berekening als de tabel op /bmi-berekenen.
 */
function weightRange(heightCm: number, lo: number, hi: number) {
  const m2 = (heightCm / 100) ** 2;
  let min = Math.floor(lo * m2);
  while (round1(bmiOf(min, heightCm)) < lo) min++;
  let max = Math.ceil(hi * m2);
  while (round1(bmiOf(max, heightCm)) > hi) max--;
  return { min, max };
}

type WaistResult =
  | { state: "none" }
  | { state: "invalid" }
  | { state: "needsSex" }
  | { state: "ok"; cm: number; sex: Sex; risk: WaistRisk };

function waistResult(value: string, sex: Sex | null): WaistResult {
  if (!value.trim()) return { state: "none" };
  const cm = num(value);
  if (!(cm >= 40 && cm <= 200)) return { state: "invalid" };
  if (!sex) return { state: "needsSex" };
  const limits = WAIST[sex];
  return { state: "ok", cm, sex, risk: cm < limits.ok ? "ok" : cm <= limits.raised ? "raised" : "high" };
}


function calculate(height: string, weight: string, age: string, sex: Sex | null, waist: string) {
  const h = num(height);
  const w = num(weight);
  const hasAge = age.trim() !== "";
  const a = num(age);
  if (hasAge && !(a > 0 && a <= 120)) return { state: "age" as const };
  if (hasAge && a < 18) return { state: "young" as const };
  if (!h || !w) return { state: "empty" as const };
  if (h < 120 || h > 230 || w < 35 || w > 300) return { state: "range" as const };
  const value = round1(bmiOf(w, h));
  const senior =
    hasAge && a >= SENIOR.age
      ? { ...weightRange(h, SENIOR.min, SENIOR.max), status: (value < SENIOR.min ? "low" : value <= SENIOR.max ? "ok" : "high") as SeniorStatus }
      : null;
  return {
    state: "ok" as const,
    h,
    w,
    value,
    category: categoryOf(value),
    range: weightRange(h, HEALTHY.min, HEALTHY.max),
    senior,
    waist: waistResult(waist, sex),
  };
}

type Result = ReturnType<typeof calculate>;
type OkResult = Extract<Result, { state: "ok" }>;

/** BMI-rekenhulp met gezond gewicht bij je lengte en (optioneel) je buikomvang. Rekent alleen in de browser. */
export function BmiCalculator() {
  const l = useLocale();
  const c = copy[l];
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex | null>(null);
  const [waist, setWaist] = useState("");

  const result = useMemo(() => calculate(height, weight, age, sex, waist), [height, weight, age, sex, waist]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
      <form className="card space-y-5 p-5 sm:p-6" onSubmit={(e) => e.preventDefault()} aria-labelledby="bmi-titel">
        <h2 id="bmi-titel" className="text-xl font-extrabold">
          {c.title}
        </h2>
        <div className="grid grid-cols-2 gap-3">
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

        <div className="space-y-4 border-t border-line pt-5">
          <p className="text-sm font-bold">
            {c.optional} <span className="font-normal text-muted">· {c.optionalHint}</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label">{c.age}</span>
              <span className="relative block">
                <input className="input pr-11" inputMode="numeric" autoComplete="off" value={age} onChange={(e) => setAge(e.target.value)} placeholder="40" />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">{c.years}</span>
              </span>
            </label>
            <label className="block">
              <span className="label">{c.waist}</span>
              <span className="relative block">
                <input className="input pr-9" inputMode="decimal" autoComplete="off" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="84" />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">cm</span>
              </span>
            </label>
          </div>
          <fieldset>
            <legend className="label">{c.sex}</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["vrouw", "man"] as const).map((s) => {
                const on = s === sex;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSex(s)}
                    className={`rounded-2xl border-2 px-3 py-2.5 text-left text-sm leading-tight font-bold transition focus-visible:ring-4 focus-visible:ring-brand-200 focus-visible:outline-none ${
                      on ? "border-brand-600 bg-brand-50 text-brand-900" : "border-line bg-white hover:border-brand-300"
                    }`}
                  >
                    {c.sexes[s]}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <p className="text-xs text-muted">{c.waistHow}</p>
        </div>
        <p className="text-xs text-muted">{c.privacy}</p>
      </form>

      <div aria-live="polite" className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        {result.state === "ok" ? (
          <ResultView r={result} />
        ) : (
          <div className="card flex items-start gap-3 p-5 text-muted sm:p-6">
            <Info className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
            <p>{result.state === "young" ? c.tooYoung : result.state === "age" ? c.ageInvalid : result.state === "range" ? c.outOfRange : c.empty}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const pct = (bmi: number) => `${((bmi - SCALE.min) / (SCALE.max - SCALE.min)) * 100}%`;

function ResultView({ r }: { r: OkResult }) {
  const l = useLocale();
  const c = copy[l];
  const n = (x: number, d = 0) => formatNumber(x, d, l);
  /** Hele getallen zonder decimalen, anders met 1 decimaal. */
  const n1 = (x: number) => n(x, x % 1 ? 1 : 0);

  const clamped = Math.min(Math.max(r.value, SCALE.min), SCALE.max);
  const warn = r.senior ? r.senior.status === "low" : r.category === "under";
  const message = r.senior ? `${c.senior(n(r.senior.min), n(r.senior.max))} ${c.seniorStatus[r.senior.status]}` : c.messages[r.category];
  // Afvaladvies alleen bij overgewicht of obesitas (bij 70+: boven een BMI van 28), nooit bij ondergewicht.
  const wantsLoss = r.senior ? r.senior.status === "high" : r.category === "over" || r.category === "obese";
  const keep = !wantsLoss && (r.senior ? r.senior.status === "ok" : r.category === "healthy");

  return (
    <>
      <div className="rounded-[1.75rem] bg-brand-900 p-6 text-white shadow-[var(--shadow-lift)] sm:p-7">
        <p className="text-sm font-semibold text-white/75">{c.yourBmi}</p>
        <p className="text-5xl font-extrabold tracking-tight tabular-nums sm:text-6xl">{n(r.value, 1)}</p>
        <p className="mt-2 text-lg font-semibold text-white/90">
          {c.categories[r.category]} <span className="text-sm font-medium text-white/70">· {c.categoryNote}</span>
        </p>
        <div aria-hidden className="mt-5">
          <div className="relative">
            <div className="flex h-2.5 overflow-hidden rounded-full">
              {SEGMENTS.map((s) => (
                <div key={s.from} className={s.className} style={{ width: `${((s.to - s.from) / (SCALE.max - SCALE.min)) * 100}%` }} />
              ))}
            </div>
            <div className="absolute -top-1.5 h-5.5 w-1.5 -translate-x-1/2 rounded-full bg-white ring-2 ring-brand-900" style={{ left: pct(clamped) }} />
          </div>
          <div className="relative mt-1.5 h-4 text-[11px] text-white/70 tabular-nums">
            {[18.5, 25, 30].map((t) => (
              <span key={t} className="absolute -translate-x-1/2" style={{ left: pct(t) }}>
                {n1(t)}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-white/70 tabular-nums">{c.formula(n1(r.w), n(r.h / 100, 2), n(r.value, 1))}</p>
      </div>

      <div className={`grid gap-3 ${r.senior ? "sm:grid-cols-2" : ""}`}>
        <div className="card p-4 sm:p-5">
          <p className="text-sm font-bold text-muted">{c.range(n1(r.h))}</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">
            {n(r.range.min)}–{n(r.range.max)} kg
          </p>
          <p className="text-xs text-muted">{c.rangeHint}</p>
        </div>
        {r.senior && (
          <div className="card p-4 sm:p-5">
            <p className="text-sm font-bold text-muted">{c.seniorRange}</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">
              {n(r.senior.min)}–{n(r.senior.max)} kg
            </p>
            <p className="text-xs text-muted">{c.seniorRangeHint}</p>
          </div>
        )}
      </div>

      <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${warn ? "border-accent-200 bg-accent-50" : "border-line bg-white"}`}>
        {warn ? <TriangleAlert className="mt-0.5 size-5 shrink-0 text-accent-600" aria-hidden /> : <Info className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />}
        <div className="space-y-1.5">
          <p>{message}</p>
          {r.value >= 35 && <p className="font-semibold">{c.gp}</p>}
        </div>
      </div>

      {r.waist.state === "ok" ? (
        <div className="card p-4 sm:p-5">
          <p className="text-sm font-bold text-muted">{c.waistTitle}</p>
          <p className={`mt-1 text-xl font-extrabold ${r.waist.risk === "ok" ? "text-brand-700" : "text-accent-600"}`}>{c.waistRisk[r.waist.risk]}</p>
          <p className="mt-1 text-sm text-muted">{c.waistText(r.waist.sex, n1(r.waist.cm), WAIST[r.waist.sex].ok, WAIST[r.waist.sex].raised)}</p>
          {r.waist.risk !== "ok" && <p className="mt-1 text-sm text-muted">{c.waistWhy}</p>}
        </div>
      ) : r.waist.state !== "none" ? (
        <p className="text-sm text-muted">{r.waist.state === "invalid" ? c.waistInvalid : c.waistNeedsSex}</p>
      ) : null}

      {(wantsLoss || keep) && (
        <div className="card p-5 sm:p-6">
          <p className="text-lg font-extrabold">{wantsLoss ? c.lossTitle : c.keepTitle}</p>
          <p className="mt-2 text-muted">{wantsLoss ? c.lossText : c.keepText}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={wantsLoss ? "/start?doel=afvallen" : "/start?doel=afblijven"}
              data-cta="bmi-rekenhulp"
              onClick={() => trackEvent("bmi_to_quiz", { category: r.category })}
              className="btn-primary w-full !whitespace-normal sm:w-auto"
            >
              {c.planCta} <ArrowRight className="size-5" aria-hidden />
            </Link>
            {wantsLoss && (
              <Link href="/caloriebehoefte-berekenen" className="btn-secondary w-full !whitespace-normal sm:w-auto">
                <Calculator className="size-5" aria-hidden /> {c.calorieCta}
              </Link>
            )}
          </div>
          <p className="mt-2 text-xs text-muted">{c.ctaNote}</p>
        </div>
      )}
      <p className="text-xs text-muted">{c.pregnant}</p>
    </>
  );
}

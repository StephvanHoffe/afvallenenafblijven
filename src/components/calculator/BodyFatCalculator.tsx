"use client";

import { useId, useMemo, useState } from "react";
import { ArrowRight, Info, TriangleAlert } from "lucide-react";
import Link from "@/i18n/Link";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import { trackEvent } from "@/lib/consent";
import { formatNumber } from "@/lib/format";

type Sex = "vrouw" | "man";
type Band = "laag" | "gezond" | "hoog" | "zeerHoog";

const AGE_GROUPS = ["20–39", "40–59", "60–79"] as const;

/**
 * Grenzen per leeftijdsgroep (Gallagher e.a., 2000): [onder = laag, t/m = gezond, t/m = hoog].
 * Dezelfde getallen staan in de tabellen op /vetpercentage-berekenen.
 */
const RANGES: Record<Sex, [number, number, number][]> = {
  vrouw: [
    [21, 33, 39],
    [23, 34, 40],
    [24, 36, 42],
  ],
  man: [
    [8, 20, 25],
    [11, 22, 28],
    [13, 25, 30],
  ],
};

const BANDS: Band[] = ["laag", "gezond", "hoog", "zeerHoog"];

const copy = defineCopy({
  nl: {
    title: "Bereken je vetpercentage",
    sex: "Geslacht",
    sexes: { vrouw: "Vrouw", man: "Man" },
    age: "Leeftijd",
    years: "jaar",
    height: "Lengte",
    waist: "Taille",
    waistHint: { vrouw: "Op het smalste punt van je taille", man: "Ter hoogte van je navel", none: "Man: op navelhoogte · vrouw: smalste punt" },
    neck: "Nek",
    neckHint: "Net onder je adamsappel",
    hip: "Heup",
    hipHint: "Op het breedste punt van je billen",
    empty: "Kies je geslacht en vul je maten in, dan zie je hier direct je geschatte vetpercentage.",
    tooYoung: "Deze rekenhulp is voor volwassenen (18 jaar en ouder). Voor kinderen en tieners gelden andere grenzen.",
    outOfRange: "Controleer je gegevens: je leeftijd in jaren en je lengte en omtrekken in centimeters (bijv. lengte 172, taille 84, nek 36).",
    neckWaist: "Je taille moet groter zijn dan je nek. Controleer je metingen.",
    implausible: "Met deze maten komt er geen realistische uitkomst uit. Meet je nek en taille nog eens na.",
    result: "geschat vetpercentage",
    bands: { laag: "Laag", gezond: "Gezond", hoog: "Hoog", zeerHoog: "Zeer hoog" },
    group: (sex: Sex, ages: string) => `${sex === "vrouw" ? "vrouwen" : "mannen"} van ${ages} jaar`,
    healthyFor: (group: string, range: string) => `Gezond voor ${group}: ${range}`,
    bandsTitle: (group: string) => `Grenzen voor ${group}`,
    yours: "jouw uitkomst",
    youngNote: "Voor 18 en 19 jaar gebruiken we de grenzen voor 20 tot 39 jaar.",
    oldNote: "Voor 80-plussers zijn geen aparte grenzen vastgesteld; we tonen die voor 60 tot 79 jaar.",
    estimate:
      "Dit is een schatting: de meetlintmethode zit er meestal een paar procentpunten naast. Meet steeds op dezelfde manier, dan zie je goed of je vetpercentage daalt.",
    bandNote: {
      laag: "Een laag vetpercentage is niet altijd beter: je lichaam heeft vet nodig. Twijfel je of heb je klachten, bespreek het dan met je huisarts.",
      gezond: "",
      hoog: "Je vetpercentage verlagen doe je met een klein calorietekort, krachttraining en genoeg eiwit. Hieronder lees je hoe.",
      zeerHoog:
        "Je vetpercentage verlagen doe je met een klein calorietekort, krachttraining en genoeg eiwit. Wil je weten wat deze uitkomst voor jouw gezondheid betekent, bespreek het dan met je huisarts.",
    },
    cta: "Maak mijn persoonlijke plan",
    ctaNote: "Gratis vragenlijst · ± 3 minuten · je betaalt pas als je een plan kiest",
    privacy: "We slaan niets op: de berekening gebeurt in je eigen browser.",
    pregnant: "Zwanger? Dan geeft deze rekenhulp geen betrouwbare uitkomst.",
  },
  en: {
    title: "Calculate your body fat",
    sex: "Sex",
    sexes: { vrouw: "Female", man: "Male" },
    age: "Age",
    years: "years",
    height: "Height",
    waist: "Waist",
    waistHint: { vrouw: "At the narrowest point of your waist", man: "Level with your navel", none: "Men: at navel level · women: narrowest point" },
    neck: "Neck",
    neckHint: "Just below your Adam's apple",
    hip: "Hips",
    hipHint: "At the widest point of your bottom",
    empty: "Choose your sex and fill in your measurements, and you'll see your estimated body fat percentage here straight away.",
    tooYoung: "This calculator is for adults (18 and over). Children and teenagers have different ranges.",
    outOfRange: "Please check your details: your age in years and your height and measurements in centimetres (e.g. height 172, waist 84, neck 36).",
    neckWaist: "Your waist must be larger than your neck. Please check your measurements.",
    implausible: "These measurements don't give a realistic result. Please measure your neck and waist again.",
    result: "estimated body fat",
    bands: { laag: "Low", gezond: "Healthy", hoog: "High", zeerHoog: "Very high" },
    group: (sex: Sex, ages: string) => `${sex === "vrouw" ? "women" : "men"} aged ${ages}`,
    healthyFor: (group: string, range: string) => `Healthy for ${group}: ${range}`,
    bandsTitle: (group: string) => `Ranges for ${group}`,
    yours: "your result",
    youngNote: "For ages 18 and 19, we use the ranges for 20 to 39.",
    oldNote: "There are no separate ranges for people aged 80 and over, so we show those for 60 to 79.",
    estimate:
      "This is an estimate: the tape-measure method is usually a few percentage points out. Always measure the same way, and you'll see clearly whether your body fat is going down.",
    bandNote: {
      laag: "A low body fat percentage isn't always better: your body needs fat. If you're unsure or have symptoms, talk to your GP.",
      gezond: "",
      hoog: "You lower your body fat with a small calorie deficit, strength training and enough protein. Read how below.",
      zeerHoog:
        "You lower your body fat with a small calorie deficit, strength training and enough protein. If you'd like to know what this result means for your health, talk to your GP.",
    },
    cta: "Create my personal plan",
    ctaNote: "Free questionnaire · about 3 minutes · you only pay once you choose a plan",
    privacy: "We don't store anything: the calculation happens in your own browser.",
    pregnant: "Pregnant? Then this calculator won't give a reliable result.",
  },
});

const num = (v: string) => Number(v.replace(",", "."));

/** U.S. Navy-methode (maten in cm, log met grondtal 10). */
function navyBodyFat(sex: Sex, heightCm: number, waistCm: number, neckCm: number, hipCm: number): number {
  const density =
    sex === "man"
      ? 1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)
      : 1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.221 * Math.log10(heightCm);
  return 495 / density - 450;
}

/** Categorie op de afgeronde uitkomst: < laag, t/m gezond, t/m hoog, daarboven zeer hoog. */
function bandOf(pct: number, [low, healthy, high]: [number, number, number]): Band {
  if (pct < low) return "laag";
  if (pct <= healthy) return "gezond";
  if (pct <= high) return "hoog";
  return "zeerHoog";
}

function Field({
  label,
  unit,
  hint,
  value,
  onChange,
  placeholder,
  decimal = true,
}: {
  label: string;
  unit: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  decimal?: boolean;
}) {
  const hintId = useId();
  return (
    <label className="block">
      <span className="label">{label}</span>
      <span className="relative block">
        <input
          className="input pr-10"
          inputMode={decimal ? "decimal" : "numeric"}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-describedby={hint ? hintId : undefined}
        />
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">{unit}</span>
      </span>
      {hint && (
        <span id={hintId} className="mt-1 block text-xs leading-snug text-muted">
          {hint}
        </span>
      )}
    </label>
  );
}

/** Vetpercentage met de meetlintmethode (U.S. Navy), alleen in de browser. */
export function BodyFatCalculator() {
  const l = useLocale();
  const c = copy[l];
  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [waist, setWaist] = useState("");
  const [neck, setNeck] = useState("");
  const [hip, setHip] = useState("");
  const n = (x: number) => formatNumber(x, 0, l);
  const pct = (x: number) => `${n(x)}%`;

  const result = useMemo(() => {
    const a = num(age);
    const h = num(height);
    const w = num(waist);
    const ne = num(neck);
    const hi = num(hip);
    if (!sex || !a || !h || !w || !ne || (sex === "vrouw" && !hi)) return { state: "empty" as const };
    if (a < 18) return { state: "young" as const };
    if (a > 100 || h < 130 || h > 230 || w < 40 || w > 200 || ne < 20 || ne > 70 || (sex === "vrouw" && (hi < 60 || hi > 200))) {
      return { state: "range" as const };
    }
    if (w <= ne) return { state: "neck" as const };
    const raw = navyBodyFat(sex, h, w, ne, hi);
    if (!Number.isFinite(raw) || raw < 2 || raw > 75) return { state: "implausible" as const };
    const value = Math.round(raw);
    const groupIndex = a < 40 ? 0 : a < 60 ? 1 : 2;
    const range = RANGES[sex][groupIndex];
    return {
      state: "ok" as const,
      sex,
      value,
      range,
      band: bandOf(value, range),
      ages: AGE_GROUPS[groupIndex],
      ageNote: a < 20 ? c.youngNote : a >= 80 ? c.oldNote : "",
    };
  }, [sex, age, height, waist, neck, hip, c]);

  const message =
    result.state === "young"
      ? c.tooYoung
      : result.state === "range"
        ? c.outOfRange
        : result.state === "neck"
          ? c.neckWaist
          : result.state === "implausible"
            ? c.implausible
            : c.empty;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <form className="card space-y-5 p-5 sm:p-6" onSubmit={(e) => e.preventDefault()} aria-labelledby="vetpercentage-titel">
        <h2 id="vetpercentage-titel" className="text-xl font-extrabold">
          {c.title}
        </h2>
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
        <div className="grid grid-cols-2 gap-3">
          <Field label={c.age} unit={c.years} value={age} onChange={setAge} placeholder="40" decimal={false} />
          <Field label={c.height} unit="cm" value={height} onChange={setHeight} placeholder="172" decimal={false} />
        </div>
        <div className={`grid grid-cols-2 gap-3 ${sex === "vrouw" ? "sm:grid-cols-3" : ""}`}>
          <Field label={c.waist} unit="cm" hint={c.waistHint[sex ?? "none"]} value={waist} onChange={setWaist} placeholder="84" />
          <Field label={c.neck} unit="cm" hint={c.neckHint} value={neck} onChange={setNeck} placeholder="36" />
          {sex === "vrouw" && <Field label={c.hip} unit="cm" hint={c.hipHint} value={hip} onChange={setHip} placeholder="100" />}
        </div>
        <p className="text-xs text-muted">{c.privacy}</p>
      </form>

      <div aria-live="polite" className="space-y-4 lg:self-start">
        {result.state !== "ok" ? (
          <div className="card flex items-start gap-3 p-5 text-muted sm:p-6">
            <Info className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
            <p>{message}</p>
          </div>
        ) : (
          <>
            <div className="rounded-[1.75rem] bg-brand-900 p-6 text-white shadow-[var(--shadow-lift)] sm:p-7">
              <p className="text-5xl font-extrabold tracking-tight tabular-nums sm:text-6xl">
                {n(result.value)}
                <span className="text-2xl font-bold text-white/80">%</span>
              </p>
              <p className="mt-2 text-lg font-semibold text-white/85">{c.result}</p>
              <p className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-bold">{c.bands[result.band]}</p>
              <p className="mt-3 text-sm text-white/75">
                {c.healthyFor(c.group(result.sex, result.ages), `${result.range[0]}–${pct(result.range[1])}`)}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-sm font-bold">{c.bandsTitle(c.group(result.sex, result.ages))}</p>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {BANDS.map((b, i) => {
                  const [low, healthy, high] = result.range;
                  const label = [`< ${pct(low)}`, `${low}–${pct(healthy)}`, `${healthy}–${pct(high)}`, `> ${pct(high)}`][i];
                  const on = b === result.band;
                  return (
                    <li
                      key={b}
                      aria-current={on ? "true" : undefined}
                      className={`rounded-2xl border-2 px-3 py-2 text-sm leading-tight ${on ? "border-brand-600 bg-brand-50 text-brand-900" : "border-line"}`}
                    >
                      <span className="block font-bold">{c.bands[b]}</span>
                      <span className="block tabular-nums text-muted">{label}</span>
                      {on && <span className="sr-only"> ({c.yours})</span>}
                    </li>
                  );
                })}
              </ul>
              {result.ageNote && <p className="mt-3 text-xs text-muted">{result.ageNote}</p>}
            </div>
            {c.bandNote[result.band] && (
              <div className="flex items-start gap-3 rounded-2xl border border-accent-200 bg-accent-50 p-4 text-sm">
                <TriangleAlert className="mt-0.5 size-5 shrink-0 text-accent-600" aria-hidden />
                <p>{c.bandNote[result.band]}</p>
              </div>
            )}
            <p className="text-sm text-muted">{c.estimate}</p>
            <div className="card p-5">
              <Link
                href={result.band === "hoog" || result.band === "zeerHoog" ? "/start?doel=afvallen_strakker" : "/start"}
                data-cta="vetpercentage-rekenhulp"
                onClick={() => trackEvent("bodyfat_to_quiz", { band: result.band })}
                className="btn-primary w-full !whitespace-normal sm:w-auto"
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

"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import Link from "@/i18n/Link";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import { trackEvent } from "@/lib/consent";
import { formatNumber } from "@/lib/format";

type Pace = "rustig" | "stevig" | "snel" | "zeerSnel";

/**
 * Wandelen op vlak terrein, met MET-waarden uit het Compendium of Physical
 * Activities. 1 MET is je verbruik in rust: ± 1 kcal per kilo per uur.
 * (Dezelfde waarden staan in de tabel op /afvallen-met-wandelen.)
 */
const PACES: Record<Pace, { kmh: number; met: number }> = {
  rustig: { kmh: 4, met: 3.0 },
  stevig: { kmh: 5, met: 3.5 },
  snel: { kmh: 5.6, met: 4.3 },
  zeerSnel: { kmh: 6.4, met: 5.0 },
};
/** Gemiddeld; afhankelijk van je paslengte is het 1.300 tot 1.500 stappen per kilometer. */
const STEPS_PER_KM = 1400;

const copy = defineCopy({
  nl: {
    title: "Bereken hoeveel calorieën je verbrandt",
    weight: "Gewicht",
    duration: "Hoe lang wandel je?",
    pace: "Hoe snel wandel je?",
    paces: {
      rustig: { label: "Rustig", inline: "rustig" },
      stevig: { label: "Stevig", inline: "stevig" },
      snel: { label: "Snel", inline: "snel" },
      zeerSnel: { label: "Zeer snel", inline: "zeer snel" },
    },
    kmh: (v: string) => `± ${v} km/u`,
    empty: "Vul je gewicht en de duur in, dan zie je hier direct hoeveel calorieën je verbrandt.",
    outOfRange: "Controleer je gegevens: gewicht in kilo's (bijv. 75) en duur in minuten (bijv. 45, maximaal 600).",
    total: (min: string, pace: string) => `in totaal, bij ${min} minuten ${pace} wandelen`,
    extra: "Extra door wandelen",
    distance: "Afstand",
    steps: "Stappen",
    explain: (rest: string, extra: string) =>
      `In het totaal zit ook wat je lichaam in rust al verbruikt (± ${rest} kcal in deze tijd). Wat het wandelen je echt extra kost, is ± ${extra} kcal.`,
    note: "Een schatting op basis van gemiddelden voor vlak terrein (Compendium of Physical Activities) en ± 1.400 stappen per kilometer. Bergop of op zand verbrand je meer; je horloge kan een ander getal geven.",
    ctaTitle: "Laat wandelen en eten samenwerken",
    ctaText:
      "Wandelen helpt, maar wat je eet maakt het grootste verschil. In je persoonlijke plan krijg je een dagelijks stappendoel en een weekmenu dat precies op je caloriedoel uitkomt.",
    cta: "Maak mijn persoonlijke plan",
    ctaNote: "Gratis vragenlijst · ± 3 minuten · je betaalt pas als je een plan kiest",
    privacy: "We slaan niets op: de berekening gebeurt in je eigen browser.",
  },
  en: {
    title: "Work out how many calories you burn",
    weight: "Weight",
    duration: "How long do you walk?",
    pace: "How fast do you walk?",
    paces: {
      rustig: { label: "Easy", inline: "easy" },
      stevig: { label: "Brisk", inline: "brisk" },
      snel: { label: "Fast", inline: "fast" },
      zeerSnel: { label: "Very fast", inline: "very fast" },
    },
    kmh: (v: string) => `± ${v} km/h`,
    empty: "Fill in your weight and how long you walk, and you'll see straight away how many calories you burn.",
    outOfRange: "Please check your details: weight in kilos (e.g. 75) and duration in minutes (e.g. 45, up to 600).",
    total: (min: string, pace: string) => `in total, for ${min} minutes of ${pace} walking`,
    extra: "Extra from walking",
    distance: "Distance",
    steps: "Steps",
    explain: (rest: string, extra: string) =>
      `The total includes what your body burns at rest anyway (± ${rest} kcal in this time). What walking really costs you on top of that is ± ${extra} kcal.`,
    note: "An estimate based on averages for level ground (Compendium of Physical Activities) and about 1,400 steps per kilometre. Uphill or on sand you burn more; your watch may show a different number.",
    ctaTitle: "Make walking and eating work together",
    ctaText:
      "Walking helps, but what you eat makes the biggest difference. Your personal plan gives you a daily step target and a weekly menu that adds up to exactly your calorie target.",
    cta: "Create my personal plan",
    ctaNote: "Free questionnaire · about 3 minutes · you only pay once you choose a plan",
    privacy: "We don't store anything: the calculation happens in your own browser.",
  },
});

const num = (v: string) => Number(v.replace(",", "."));
const roundTo = (n: number, step: number) => Math.round(n / step) * step;
/** Kleine getallen op 5 kcal, de rest op 10 kcal. */
const roundKcal = (n: number) => (n < 100 ? roundTo(n, 5) : roundTo(n, 10));

/**
 * Calorieën met wandelen: MET × gewicht (kg) × tijd (uur). Dat is het totale
 * verbruik; wat wandelen extra kost, is (MET − 1) × gewicht × tijd. Rekent
 * alleen in de browser.
 */
export function WalkingCalculator() {
  const l = useLocale();
  const c = copy[l];
  const [weight, setWeight] = useState("");
  const [duration, setDuration] = useState("60");
  const [pace, setPace] = useState<Pace>("stevig");
  const n = (x: number, d = 0) => formatNumber(x, d, l);

  const result = useMemo(() => {
    const w = num(weight);
    const min = Math.round(num(duration));
    if (!w || !min) return { state: "empty" as const };
    if (w < 35 || w > 300 || min < 1 || min > 600) return { state: "range" as const };
    const hours = min / 60;
    const { met, kmh } = PACES[pace];
    const km = kmh * hours;
    return {
      state: "ok" as const,
      min,
      total: roundKcal(met * w * hours),
      extra: roundKcal((met - 1) * w * hours),
      rest: roundKcal(w * hours),
      km,
      steps: roundTo(km * STEPS_PER_KM, 100),
    };
  }, [weight, duration, pace]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <form className="card space-y-5 p-5 sm:p-6" onSubmit={(e) => e.preventDefault()} aria-labelledby="wandel-titel">
        <h2 id="wandel-titel" className="text-xl font-extrabold">
          {c.title}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">{c.weight}</span>
            <span className="relative block">
              <input className="input pr-9" inputMode="decimal" autoComplete="off" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="75" />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">kg</span>
            </span>
          </label>
          <label className="block">
            <span className="label">{c.duration}</span>
            <span className="relative block">
              <input className="input pr-10" inputMode="numeric" autoComplete="off" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="60" />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">min</span>
            </span>
          </label>
        </div>
        <fieldset>
          <legend className="label">{c.pace}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(PACES) as Pace[]).map((p) => {
              const on = p === pace;
              const kmh = PACES[p].kmh;
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPace(p)}
                  className={`rounded-2xl border-2 px-3 py-2.5 text-left text-sm leading-tight font-bold transition focus-visible:ring-4 focus-visible:ring-brand-200 focus-visible:outline-none ${
                    on ? "border-brand-600 bg-brand-50 text-brand-900" : "border-line bg-white hover:border-brand-300"
                  }`}
                >
                  {c.paces[p].label}
                  <span className="mt-0.5 block text-xs font-medium text-muted">{c.kmh(n(kmh, Number.isInteger(kmh) ? 0 : 1))}</span>
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
                {n(result.total)} <span className="text-2xl font-bold text-white/80">kcal</span>
              </p>
              <p className="mt-2 text-lg font-semibold text-white/85">{c.total(n(result.min), c.paces[pace].inline)}</p>
              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-white/15 pt-4 text-sm">
                <div>
                  <dt className="leading-tight text-white/70">{c.extra}</dt>
                  <dd className="mt-1 text-xl font-extrabold tabular-nums">± {n(result.extra)} kcal</dd>
                </div>
                <div>
                  <dt className="leading-tight text-white/70">{c.distance}</dt>
                  <dd className="mt-1 text-xl font-extrabold tabular-nums">± {n(result.km, 1)} km</dd>
                </div>
                <div>
                  <dt className="leading-tight text-white/70">{c.steps}</dt>
                  <dd className="mt-1 text-xl font-extrabold tabular-nums">± {n(result.steps)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-white/75">{c.explain(n(result.rest), n(result.extra))}</p>
            </div>
            <p className="text-sm text-muted">{c.note}</p>
            <div className="card p-5 sm:p-6">
              <p className="text-lg font-extrabold">{c.ctaTitle}</p>
              <p className="mt-2 text-muted">{c.ctaText}</p>
              <Link
                href="/start?doel=afvallen"
                data-cta="wandel-rekenhulp"
                onClick={() => trackEvent("walking_to_quiz", { pace })}
                className="btn-primary mt-4 w-full !whitespace-normal sm:w-auto"
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

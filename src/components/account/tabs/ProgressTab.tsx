import Link from "@/i18n/Link";
import { ArrowRight } from "lucide-react";
import { accountHref } from "@/components/account/AccountShell";
import { AnswersGrid, BmiScale, GoalMeter, StatTile } from "@/components/account/charts/Indicators";
import { ColumnChart } from "@/components/account/charts/ColumnChart";
import { TimeChart } from "@/components/account/charts/TimeChart";
import { HealthProgress } from "@/components/account/health/HealthProgress";
import { Section } from "@/components/account/shared";
import { WeightChartFor, changeIsGood, signedKg } from "@/components/account/tabs/OverviewTab";
import { products } from "@/config/pricing";
import { defineCopy, type Locale } from "@/i18n/config";
import type { AccountView } from "@/lib/account-types";
import { formatDate, formatNumber } from "@/lib/format";
import { buildProgress, latestPeriodStart } from "@/lib/progress";

const copy = defineCopy({
  nl: {
    empty: "Zodra je je eerste schema hebt, zie je hier je voortgang.",
    atStart: "Bij de start",
    now: "Nu",
    measuredOn: (date: string) => `gemeten op ${date}`,
    difference: "Verschil",
    waist: "Taille",
    waistNow: (cm: string) => `nu ${cm} cm`,
    toTarget: "Tot je streefgewicht",
    checkins: "Check-ins",
    reached: "Bereikt!",
    weightTitle: "Je gewicht",
    weightIntro: (projection: boolean) =>
      `Je startgewicht uit de vragenlijst en je gewicht bij elke check-in${projection ? ", naast het verwachte verloop van je plan bij de start" : ""}.`,
    projectedBefore: "Volgens de schatting bij de start haal je je streefgewicht rond",
    projectedAfter: ". Dat is een schatting, geen belofte: afvallen gaat niet in een rechte lijn en schommelingen van een kilo zijn normaal.",
    table: "Alle metingen als tabel",
    date: "Datum",
    moment: "Moment",
    weight: "Gewicht",
    vsStart: "T.o.v. start",
    waistTitle: "Taille-omtrek",
    waistIntro: "Zegt vaak meer dan de weegschaal, zeker als je ook traint.",
    yourWaist: "Je taille",
    waistDescription: (from: string, to: string) => `Je taille-omtrek: van ${from} cm naar ${to} cm.`,
    waistOnce: "Gemeten bij je check-in. Na je volgende meting zie je hier een grafiek.",
    waistNone: "Vul bij je volgende check-in je taille-omtrek in om ook die te volgen.",
    bmiIntro: "Berekend uit je lengte en gewicht.",
    notYet: "Nog niet beschikbaar.",
    caloriesTitle: "Je caloriedoel per periode",
    caloriesIntro: "Na elke check-in stellen we je dagdoel bij op je nieuwe gewicht en je voortgang.",
    kcalPerDay: "kcal per dag",
    caloriesDescription: (parts: string) => `Caloriedoel per periode: ${parts}.`,
    periodKcal: (seq: number, kcal: number) => `periode ${seq} ${kcal} kcal`,
    period: (seq: number) => `Periode ${seq}`,
    macros: (p: number, c: number, f: number) => `${p} g eiwit · ${c} g koolhydraten · ${f} g vet`,
    perDay: "per dag",
    caloriesOnce: "Na je eerste check-in zie je hier hoe je dagdoel meebeweegt.",
    answersTitle: "Hoe ging het?",
    answersIntro: "Je antwoorden uit elke check-in. Hiermee stemmen we je volgende schema af.",
    toCheckin: "Naar de check-in",
    answersNone: "Na je eerste check-in zie je hier hoe het ging: energie, slaap, honger en hoe goed het schema lukte.",
  },
  en: {
    empty: "As soon as you have your first plan, you'll see your progress here.",
    atStart: "At the start",
    now: "Now",
    measuredOn: (date: string) => `measured on ${date}`,
    difference: "Change",
    waist: "Waist",
    waistNow: (cm: string) => `now ${cm} cm`,
    toTarget: "To your target weight",
    checkins: "Check-ins",
    reached: "Reached!",
    weightTitle: "Your weight",
    weightIntro: (projection: boolean) =>
      `Your starting weight from the questionnaire and your weight at each check-in${projection ? ", alongside the expected progress of your plan at the start" : ""}.`,
    projectedBefore: "Based on the estimate at the start, you could reach your target weight around",
    projectedAfter: ". That's an estimate, not a promise: weight loss doesn't happen in a straight line, and fluctuations of a kilo are normal.",
    table: "All measurements as a table",
    date: "Date",
    moment: "Measurement",
    weight: "Weight",
    vsStart: "Vs. start",
    waistTitle: "Waist circumference",
    waistIntro: "Often tells you more than the scales, especially if you also train.",
    yourWaist: "Your waist",
    waistDescription: (from: string, to: string) => `Your waist circumference: from ${from} cm to ${to} cm.`,
    waistOnce: "Measured at your check-in. After your next measurement, you'll see a chart here.",
    waistNone: "Enter your waist circumference at your next check-in to track that too.",
    bmiIntro: "Calculated from your height and weight.",
    notYet: "Not available yet.",
    caloriesTitle: "Your calorie target per period",
    caloriesIntro: "After every check-in, we adjust your daily target to your new weight and your progress.",
    kcalPerDay: "kcal per day",
    caloriesDescription: (parts: string) => `Calorie target per period: ${parts}.`,
    periodKcal: (seq: number, kcal: number) => `period ${seq} ${kcal} kcal`,
    period: (seq: number) => `Period ${seq}`,
    macros: (p: number, c: number, f: number) => `${p} g protein · ${c} g carbohydrates · ${f} g fat`,
    perDay: "per day",
    caloriesOnce: "After your first check-in, you'll see how your daily target changes with you here.",
    answersTitle: "How did it go?",
    answersIntro: "Your answers from every check-in. We use them to tailor your next plan.",
    toCheckin: "Go to the check-in",
    answersNone: "After your first check-in, you'll see how it went here: energy, sleep, hunger and how well you got on with the plan.",
  },
});

export function ProgressTab({ view, base, l }: { view: AccountView; base: string; l: Locale }) {
  const c = copy[l];
  const p = buildProgress(view, l);
  const hasNutrition = view.orders.some((o) => products[o.product].includes.includes("voeding"));
  const waistChange = p.waist.length > 1 ? Math.round((p.waist.at(-1)!.v - p.waist[0].v) * 10) / 10 : null;
  const num = (n: number) => formatNumber(n, 1, l);

  if (!view.intake && view.checkins.length === 0) {
    return <p className="card p-6 text-muted">{c.empty}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={c.atStart} value={p.startKg !== null ? `${num(p.startKg)} kg` : "–"} sub={view.startedAt ? formatDate(view.startedAt, l) : undefined} />
        <StatTile
          label={c.now}
          value={p.currentKg !== null ? `${num(p.currentKg)} kg` : "–"}
          sub={p.currentAt ? c.measuredOn(formatDate(new Date(p.currentAt), l)) : undefined}
        />
        <StatTile label={c.difference} value={p.changeKg !== null ? signedKg(p.changeKg, l) : "–"} tone={changeIsGood(p) ? "good" : "default"} sub={p.goalLabel ?? undefined} />
        {waistChange !== null ? (
          <StatTile
            label={c.waist}
            value={`${waistChange > 0 ? "+" : waistChange < 0 ? "−" : "±"}${num(Math.abs(waistChange))} cm`}
            sub={c.waistNow(num(p.waist.at(-1)!.v))}
            tone={waistChange < 0 && p.direction === "down" ? "good" : "default"}
          />
        ) : (
          <StatTile
            label={p.toGoKg !== null ? c.toTarget : c.checkins}
            value={p.toGoKg !== null ? (p.toGoKg === 0 ? c.reached : `${num(p.toGoKg)} kg`) : String(view.checkins.length)}
            tone={p.toGoKg === 0 ? "good" : "default"}
          />
        )}
      </div>

      <Section title={c.weightTitle} intro={c.weightIntro(p.projection.length > 1)}>
        {p.goalShare !== null && p.startKg !== null && p.currentKg !== null && p.targetKg !== null && (
          <div className="mb-6">
            <GoalMeter startKg={p.startKg} currentKg={p.currentKg} targetKg={p.targetKg} share={p.goalShare} l={l} />
          </div>
        )}
        <WeightChartFor progress={p} l={l} />
        {p.projectedGoalAt && p.toGoKg !== 0 && (
          <p className="mt-3 text-sm text-muted">
            {c.projectedBefore} <strong className="text-ink">{formatDate(new Date(p.projectedGoalAt), l)}</strong>
            {c.projectedAfter}
          </p>
        )}
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-bold text-brand-700">{c.table}</summary>
          <div className="mt-3 overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[22rem] text-left">
              <thead className="bg-sand text-xs font-bold tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-2">{c.date}</th>
                  <th className="px-4 py-2">{c.moment}</th>
                  <th className="px-4 py-2 text-right">{c.weight}</th>
                  <th className="px-4 py-2 text-right">{c.vsStart}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {p.weights.map((w) => (
                  <tr key={w.t}>
                    <td className="px-4 py-2 whitespace-nowrap">{formatDate(new Date(w.t), l)}</td>
                    <td className="px-4 py-2">{w.label}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{num(w.v)} kg</td>
                    <td className="px-4 py-2 text-right tabular-nums">{p.startKg !== null ? signedKg(Math.round((w.v - p.startKg) * 10) / 10, l) : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Section>

      {view.health && (
        <HealthProgress
          health={view.health}
          periodStart={latestPeriodStart(view)}
          reportedActivity={view.intake?.activity ?? null}
          ownWeights={p.weights.map((w) => ({ day: new Date(w.t).toISOString().slice(0, 10), kg: w.v }))}
          connectHref={`${accountHref(base, "gegevens")}#koppelingen`}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title={c.waistTitle} intro={c.waistIntro}>
          {p.waist.length > 1 ? (
            <TimeChart
              compact
              height={200}
              unit="cm"
              measured={{ label: c.yourWaist, points: p.waist }}
              description={c.waistDescription(num(p.waist[0].v), num(p.waist.at(-1)!.v))}
            />
          ) : p.waist.length === 1 ? (
            <p className="text-[0.9375rem]">
              <strong className="text-2xl font-extrabold">{num(p.waist[0].v)} cm</strong>
              <span className="mt-1 block text-sm text-muted">{c.waistOnce}</span>
            </p>
          ) : (
            <p className="text-sm text-muted">{c.waistNone}</p>
          )}
        </Section>
        <Section title="BMI" intro={c.bmiIntro}>
          {p.bmiNow !== null ? <BmiScale start={p.bmiStart} now={p.bmiNow} l={l} /> : <p className="text-sm text-muted">{c.notYet}</p>}
        </Section>
      </div>

      {hasNutrition && view.targets.length > 0 && (
        <Section title={c.caloriesTitle} intro={c.caloriesIntro}>
          {view.targets.length > 1 ? (
            <ColumnChart
              unit={c.kcalPerDay}
              description={c.caloriesDescription(view.targets.map((t) => c.periodKcal(t.seq, t.calories)).join(", "))}
              columns={view.targets.map((t) => ({
                label: c.period(t.seq),
                value: t.calories,
                detail: c.macros(t.proteinG, t.carbsG, t.fatG),
              }))}
            />
          ) : (
            <p className="text-[0.9375rem]">
              <strong className="text-2xl font-extrabold">{formatNumber(view.targets[0].calories, 0, l)} kcal</strong> {c.perDay}
              <span className="mt-1 block text-sm text-muted">{c.caloriesOnce}</span>
            </p>
          )}
        </Section>
      )}

      <Section
        title={c.answersTitle}
        intro={c.answersIntro}
        action={
          <Link href={accountHref(base, "check-in")} className="inline-flex items-center gap-1 text-sm font-bold text-brand-700">
            {c.toCheckin} <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      >
        {view.checkins.length > 0 ? <AnswersGrid checkins={view.checkins} l={l} /> : <p className="text-sm text-muted">{c.answersNone}</p>}
      </Section>
    </div>
  );
}

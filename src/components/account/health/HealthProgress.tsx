"use client";

import { Activity, ArrowRight, Footprints, Watch } from "lucide-react";
import { StatTile } from "@/components/account/charts/Indicators";
import { ColumnChart } from "@/components/account/charts/ColumnChart";
import { WorkoutWeeksChart } from "@/components/account/health/WorkoutWeeksChart";
import { defineCopy, intlLocale, type Locale } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import Link from "@/i18n/Link";
import { intakeLabels } from "@/i18n/options";
import { formatNumber } from "@/lib/format";
import { latestScaleWeight, nextActivityLevel, summarizeActivity, trainingEffect, weeklyHealth } from "@/lib/health/insights";
import { sourceName, type HealthView } from "@/lib/health/view";
import type { Intake } from "@/lib/intake";

const DAY = 24 * 60 * 60 * 1000;

const copy = defineCopy({
  nl: {
    title: "Beweging en trainingen",
    intro: (sources: string) => `Uit je gekoppelde apps: ${sources}.`,
    ctaTitle: "Zie of je echt traint en wat het oplevert",
    ctaText:
      "Koppel Apple Health, je horloge (Garmin, Fitbit, Polar, Oura) of je Withings-weegschaal. Dan zie je hier je stappen, trainingen en gewicht, en rekenen we daarmee bij je volgende schema.",
    ctaButton: "Koppel je app",
    steps: "Stappen per dag",
    stepsSub: (days: number) => `gemiddeld, laatste ${days} dagen`,
    workouts: "Trainingen deze periode",
    workoutsValue: (done: number, planned: number | null) => (planned ? `${done} van ${planned}` : String(done)),
    workoutsSub: (n: number | null) => (n ? `gepland: ${n} per week` : "geregistreerd in je app"),
    active: "Actieve minuten",
    activeSub: "per week, stevig bewegen",
    weight: "Laatste weging",
    weightSub: (source: string, day: string) => `${source} · ${day}`,
    none: "–",
    workoutChart: "Trainingen per week",
    workoutChartDesc: (n: number) => `Aantal trainingen per week in de afgelopen ${n} weken, met het geplande aantal als stippellijn.`,
    stepsChart: "Stappen per dag",
    stepsChartIntro: "Gemiddeld per week",
    stepsChartDesc: (n: number) => `Gemiddeld aantal stappen per dag, per week, in de afgelopen ${n} weken.`,
    stepsUnit: "stappen per dag",
    yieldTitle: "Wat levert het op?",
    effect: (planned: number, on: string, other: string) =>
      `In weken waarin je je ${planned} trainingen deed, veranderde je gewicht gemiddeld ${on} per week; in de andere weken ${other}.`,
    effectNone:
      "Na een paar weken met trainingen en wegingen zie je hier wat je trainingen opleveren: we vergelijken weken waarin je je schema haalde met de andere weken.",
    week: "Week van",
    stepsCol: "Stappen/dag",
    workoutsCol: "Trainingen",
    weightCol: "Gewicht",
    useTitle: "Zo gebruiken we dit",
    activitySame: (steps: string, level: string) =>
      `Je zet gemiddeld ${steps} stappen per dag (${level}). Dat past bij wat je bij de start opgaf; je caloriedoel blijft daarop gebaseerd.`,
    activityChange: (steps: string, measured: string, reported: string, next: string) =>
      `Je zet gemiddeld ${steps} stappen per dag (${measured}), terwijl je '${reported}' opgaf. Bij je volgende schema rekenen we daarom met '${next}'.`,
    activityTooFew: (days: number) => `Nog te weinig dagen met stappen (${days}) om je activiteitsniveau op te baseren; na 10 dagen rekenen we ermee.`,
    adherenceUse: "Je check-in en weegmoment vullen we alvast in met je geregistreerde trainingen en wegingen.",
    weekLabel: (d: Date, l: Locale) => new Intl.DateTimeFormat(intlLocale(l), { day: "numeric", month: "short", timeZone: "UTC" }).format(d),
    kg: (n: number, l: Locale) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${formatNumber(Math.abs(n), 1, l)} kg`,
    workoutDetail: (minutes: number) => `${minutes} minuten`,
  },
  en: {
    title: "Activity and workouts",
    intro: (sources: string) => `From your connected apps: ${sources}.`,
    ctaTitle: "See whether you really train and what it achieves",
    ctaText:
      "Connect Apple Health, your watch (Garmin, Fitbit, Polar, Oura) or your Withings scale. You'll then see your steps, workouts and weight here, and we'll use them for your next plan.",
    ctaButton: "Connect your app",
    steps: "Steps per day",
    stepsSub: (days: number) => `average, last ${days} days`,
    workouts: "Workouts this period",
    workoutsValue: (done: number, planned: number | null) => (planned ? `${done} of ${planned}` : String(done)),
    workoutsSub: (n: number | null) => (n ? `planned: ${n} a week` : "recorded in your app"),
    active: "Active minutes",
    activeSub: "per week, moderate to vigorous",
    weight: "Latest weigh-in",
    weightSub: (source: string, day: string) => `${source} · ${day}`,
    none: "–",
    workoutChart: "Workouts per week",
    workoutChartDesc: (n: number) => `Number of workouts per week over the last ${n} weeks, with the planned number as a dashed line.`,
    stepsChart: "Steps per day",
    stepsChartIntro: "Weekly average",
    stepsChartDesc: (n: number) => `Average steps per day, per week, over the last ${n} weeks.`,
    stepsUnit: "steps a day",
    yieldTitle: "What does it achieve?",
    effect: (planned: number, on: string, other: string) =>
      `In weeks when you did your ${planned} workouts, your weight changed by ${on} a week on average; in the other weeks by ${other}.`,
    effectNone:
      "After a few weeks of workouts and weigh-ins, you'll see what your training achieves here: we compare weeks when you stuck to your plan with the other weeks.",
    week: "Week of",
    stepsCol: "Steps/day",
    workoutsCol: "Workouts",
    weightCol: "Weight",
    useTitle: "How we use this",
    activitySame: (steps: string, level: string) =>
      `You average ${steps} steps a day (${level}). That matches what you told us at the start, so your calorie target stays based on it.`,
    activityChange: (steps: string, measured: string, reported: string, next: string) =>
      `You average ${steps} steps a day (${measured}), while you told us '${reported}'. For your next plan we'll therefore use '${next}'.`,
    activityTooFew: (days: number) => `Not enough days with steps yet (${days}) to base your activity level on; from 10 days we'll use it.`,
    adherenceUse: "We'll pre-fill your check-in and weekly weigh-in with your recorded workouts and weigh-ins.",
    weekLabel: (d: Date, l: Locale) => new Intl.DateTimeFormat(intlLocale(l), { day: "numeric", month: "short", timeZone: "UTC" }).format(d),
    kg: (n: number, l: Locale) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${formatNumber(Math.abs(n), 1, l)} kg`,
    workoutDetail: (minutes: number) => `${minutes} minutes`,
  },
});

/** Activiteit uit de gekoppelde apps op het tabblad Voortgang. */
export function HealthProgress({
  health,
  periodStart,
  reportedActivity,
  ownWeights,
  connectHref,
}: {
  health: HealthView;
  /** Begin van de lopende periode (de laatste schema's). */
  periodStart: Date | null;
  reportedActivity: Intake["activity"] | null;
  /** Wegingen die de klant zelf invulde (check-ins en weegmomenten). */
  ownWeights: { day: string; kg: number }[];
  connectHref: string;
}) {
  const l = useLocale();
  const c = copy[l];
  const labels = intakeLabels(l);

  if (health.connections.length === 0) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border-2 border-brand-200 bg-brand-50 p-5 sm:p-6">
        <div className="flex max-w-2xl gap-3">
          <Watch className="mt-0.5 size-6 shrink-0 text-brand-600" aria-hidden />
          <div>
            <h2 className="text-lg font-extrabold">{c.ctaTitle}</h2>
            <p className="mt-1 text-[0.9375rem]">{c.ctaText}</p>
          </div>
        </div>
        <Link href={connectHref} className="btn-primary !py-2.5 text-sm">
          {c.ctaButton} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
    );
  }

  const now = new Date(health.now);
  const from = periodStart && now.getTime() - new Date(periodStart).getTime() > 3 * DAY ? new Date(periodStart) : new Date(now.getTime() - 28 * DAY);
  const days = Math.max(1, Math.round((now.getTime() - from.getTime()) / DAY));
  const summary = summarizeActivity(health.days, health.workouts, from, now, health.plannedPerWeek);
  const weeks = weeklyHealth(health.days, health.workouts, ownWeights, 8);
  const effect = trainingEffect(weeklyHealth(health.days, health.workouts, ownWeights, 16), health.plannedPerWeek, now);
  const scale = latestScaleWeight(health.days, now, 14);
  const sources = [...new Set(health.connections.flatMap((x) => (x.sources.length ? x.sources : [x.provider])))].map(sourceName).join(", ");
  const dayLabel = (day: string) => new Intl.DateTimeFormat(intlLocale(l), { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
  const activeWeekly = summary.avgActiveMinutes !== null ? summary.avgActiveMinutes * 7 : null;
  const next = reportedActivity ? nextActivityLevel(reportedActivity, summary.measuredActivity) : null;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="heading-md flex items-center gap-2">
          <Activity className="size-6 text-brand-600" aria-hidden /> {c.title}
        </h2>
        <p className="mt-1 text-sm text-muted">{c.intro(sources)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={c.steps}
          value={summary.avgSteps !== null ? formatNumber(summary.avgSteps, 0, l) : c.none}
          sub={summary.avgSteps !== null ? c.stepsSub(days) : undefined}
        />
        <StatTile
          label={c.workouts}
          value={c.workoutsValue(summary.workouts, summary.plannedWorkouts)}
          sub={c.workoutsSub(health.plannedPerWeek)}
          tone={summary.adherence !== null && summary.adherence >= 0.9 ? "good" : "default"}
        />
        <StatTile label={c.active} value={activeWeekly !== null ? formatNumber(activeWeekly, 0, l) : c.none} sub={activeWeekly !== null ? c.activeSub : undefined} />
        <StatTile
          label={c.weight}
          value={scale ? `${formatNumber(scale.kg, 1, l)} kg` : c.none}
          sub={scale ? c.weightSub(sourceName(scale.source), dayLabel(scale.day)) : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card min-w-0 p-5 sm:p-6">
          <h3 className="text-lg font-extrabold">{c.workoutChart}</h3>
          <div className="mt-4">
            <WorkoutWeeksChart
              planned={health.plannedPerWeek}
              description={c.workoutChartDesc(weeks.length)}
              weeks={weeks.map((w) => ({
                label: c.weekLabel(new Date(`${w.start}T12:00:00Z`), l),
                value: w.workouts,
                detail: w.workoutMinutes ? c.workoutDetail(w.workoutMinutes) : undefined,
              }))}
            />
          </div>
        </div>
        <div className="card min-w-0 p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-lg font-extrabold">
            <Footprints className="size-5 text-brand-600" aria-hidden /> {c.stepsChart}
          </h3>
          <p className="text-sm text-muted">{c.stepsChartIntro}</p>
          <div className="mt-4">
            <ColumnChart
              unit={c.stepsUnit}
              description={c.stepsChartDesc(weeks.length)}
              columns={weeks
                .filter((w) => w.avgSteps !== null)
                .map((w) => ({ label: c.weekLabel(new Date(`${w.start}T12:00:00Z`), l), value: w.avgSteps ?? 0 }))}
            />
          </div>
        </div>
      </div>

      <div className="card min-w-0 p-5 sm:p-6">
        <h3 className="text-lg font-extrabold">{c.yieldTitle}</h3>
        <p className="mt-1 text-[0.9375rem]">
          {effect && health.plannedPerWeek
            ? c.effect(health.plannedPerWeek, c.kg(effect.onPlanAvgChange, l), c.kg(effect.otherAvgChange, l))
            : c.effectNone}
        </p>
        <div className="relative mt-4 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[26rem] text-left text-sm">
            <thead className="bg-sand text-xs font-bold tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-2.5">{c.week}</th>
                <th className="px-4 py-2.5 text-right">{c.stepsCol}</th>
                <th className="px-4 py-2.5 text-right">{c.workoutsCol}</th>
                <th className="px-4 py-2.5 text-right">{c.weightCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...weeks].reverse().map((w) => (
                <tr key={w.start}>
                  <td className="px-4 py-2.5 font-semibold whitespace-nowrap">{c.weekLabel(new Date(`${w.start}T12:00:00Z`), l)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{w.avgSteps !== null ? formatNumber(w.avgSteps, 0, l) : c.none}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {health.plannedPerWeek ? `${w.workouts} / ${health.plannedPerWeek}` : w.workouts}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{w.weightChange !== null ? c.kg(w.weightChange, l) : c.none}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] bg-sand p-5 sm:p-6">
        <h3 className="font-extrabold">{c.useTitle}</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.9375rem]">
          <li>
            {summary.measuredActivity && summary.avgSteps !== null && reportedActivity && next
              ? next === reportedActivity
                ? c.activitySame(formatNumber(summary.avgSteps, 0, l), labels.activity[summary.measuredActivity].label.toLowerCase())
                : c.activityChange(
                    formatNumber(summary.avgSteps, 0, l),
                    labels.activity[summary.measuredActivity].label.toLowerCase(),
                    labels.activity[reportedActivity].label.toLowerCase(),
                    labels.activity[next].label.toLowerCase(),
                  )
              : c.activityTooFew(summary.daysWithSteps)}
          </li>
          <li>{c.adherenceUse}</li>
        </ul>
      </div>
    </section>
  );
}

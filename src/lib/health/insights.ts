import type { HealthDay, HealthWorkout, WorkoutKind } from "@/lib/health/types";
import type { Intake } from "@/lib/intake";

/**
 * Wat de gekoppelde data ons vertelt: hoe actief iemand echt is, of de
 * trainingen gedaan worden en wat dat oplevert. Pure functies, zodat ze zowel
 * in de omgeving als bij het maken van een nieuw schema te gebruiken zijn.
 */

const DAY = 24 * 60 * 60 * 1000;
/** Dagen met minder stappen tellen we niet mee: dan is het horloge of de telefoon waarschijnlijk niet gedragen. */
const MIN_WORN_STEPS = 1000;
/** Zoveel dagen met stappen zijn nodig voordat we het activiteitsniveau baseren op metingen. */
export const MIN_DAYS_FOR_ACTIVITY = 10;

type ActivityKey = Intake["activity"];
const ACTIVITY_ORDER: ActivityKey[] = ["zittend", "licht", "actief", "zwaar"];

export interface ActivitySummary {
  from: string;
  to: string;
  /** Dagen in de periode met bruikbare stappen. */
  daysWithSteps: number;
  avgSteps: number | null;
  /** Gemiddeld aantal actieve (stevig bewegen) minuten per dag. */
  avgActiveMinutes: number | null;
  avgActiveKcal: number | null;
  /** Trainingen (zonder wandelingen, zie isTrainingSession). */
  workouts: number;
  workoutMinutes: number;
  workoutsPerWeek: number;
  /** Ingeplande trainingen in deze periode (trainingsdagen × weken), null zonder trainingsschema. */
  plannedWorkouts: number | null;
  /** Gedaan ÷ gepland, null zonder trainingsschema. */
  adherence: number | null;
  /** Alle geregistreerde activiteiten per soort, wandelingen inbegrepen. */
  byKind: Partial<Record<WorkoutKind, number>>;
  /** Activiteitsniveau op basis van stappen; null bij te weinig metingen. */
  measuredActivity: ActivityKey | null;
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** Telt mee als training van het schema: alles behalve wandelen, vanaf een kwartier. */
export function isTrainingSession(w: HealthWorkout): boolean {
  return w.sport !== "wandelen" && w.minutes >= 15;
}
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Activiteitsniveau bij een gemiddeld aantal stappen per dag. */
export function activityForSteps(steps: number): ActivityKey {
  if (steps < 5000) return "zittend";
  if (steps < 7500) return "licht";
  if (steps < 12000) return "actief";
  return "zwaar";
}

export function summarizeActivity(
  days: HealthDay[],
  workouts: HealthWorkout[],
  from: Date,
  to: Date,
  plannedPerWeek: number | null,
): ActivitySummary {
  const f = ymd(from);
  const t = ymd(to);
  const inRange = days.filter((d) => d.day >= f && d.day <= t);
  const worn = inRange.filter((d) => (d.steps ?? 0) >= MIN_WORN_STEPS);
  const all = workouts.filter((w) => w.startedAt >= from && w.startedAt <= to);
  const ws = all.filter(isTrainingSession);
  const weeks = Math.max(1, (to.getTime() - from.getTime()) / (7 * DAY));
  const avgSteps = avg(worn.map((d) => d.steps ?? 0));
  const activeMinutes = inRange.filter((d) => d.activeMinutes !== null).map((d) => d.activeMinutes ?? 0);
  const activeKcal = worn.filter((d) => d.activeKcal !== null).map((d) => d.activeKcal ?? 0);
  const byKind: Partial<Record<WorkoutKind, number>> = {};
  for (const w of all) byKind[w.sport] = (byKind[w.sport] ?? 0) + 1;
  const planned = plannedPerWeek ? Math.round(plannedPerWeek * weeks) : null;
  return {
    from: f,
    to: t,
    daysWithSteps: worn.length,
    avgSteps: avgSteps === null ? null : Math.round(avgSteps),
    avgActiveMinutes: activeMinutes.length ? Math.round(avg(activeMinutes) ?? 0) : null,
    avgActiveKcal: activeKcal.length ? Math.round(avg(activeKcal) ?? 0) : null,
    workouts: ws.length,
    workoutMinutes: ws.reduce((a, w) => a + w.minutes, 0),
    workoutsPerWeek: Math.round((ws.length / weeks) * 10) / 10,
    plannedWorkouts: planned,
    adherence: planned ? Math.round((ws.length / planned) * 100) / 100 : null,
    byKind,
    measuredActivity: worn.length >= MIN_DAYS_FOR_ACTIVITY && avgSteps !== null ? activityForSteps(avgSteps) : null,
  };
}

/**
 * Het activiteitsniveau voor het volgende schema: richting de meting, maar
 * hooguit één stap per periode. Zo schiet het caloriedoel niet ineens alle
 * kanten op door een week zonder horloge.
 */
export function nextActivityLevel(current: ActivityKey, measured: ActivityKey | null): ActivityKey {
  if (!measured || measured === current) return current;
  const from = ACTIVITY_ORDER.indexOf(current);
  const to = ACTIVITY_ORDER.indexOf(measured);
  return ACTIVITY_ORDER[from + Math.sign(to - from)];
}

/** Het antwoord op "Hoeveel trainingen heb je gedaan?" op basis van de geregistreerde trainingen. */
export function adherenceAnswer(adherence: number | null): string | null {
  if (adherence === null) return null;
  if (adherence >= 0.9) return "Alle trainingen";
  if (adherence >= 0.65) return "De meeste";
  if (adherence >= 0.35) return "Ongeveer de helft";
  return "Weinig of geen";
}

/** De laatste weging uit een gekoppelde weegschaal of app, als die recent is. */
export function latestScaleWeight(days: HealthDay[], now: Date, withinDays = 7): { kg: number; day: string; source: string } | null {
  const since = ymd(new Date(now.getTime() - withinDays * DAY));
  const last = [...days].reverse().find((d) => d.weightKg !== null && d.day >= since);
  return last ? { kg: last.weightKg ?? 0, day: last.day, source: last.weightSource ?? last.source } : null;
}

export interface HealthWeek {
  /** Maandag van de week, YYYY-MM-DD. */
  start: string;
  avgSteps: number | null;
  workouts: number;
  workoutMinutes: number;
  activeMinutes: number | null;
  /** Gewichtsverandering in die week (laatste − eerste weging), null bij te weinig wegingen. */
  weightChange: number | null;
}

function mondayOf(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  const shift = (d.getUTCDay() + 6) % 7;
  return ymd(new Date(d.getTime() - shift * DAY));
}

/**
 * Per week: stappen, trainingen en gewichtsverandering. Gewichten komen uit de
 * koppeling en uit de wegingen die de klant zelf invult.
 */
export function weeklyHealth(days: HealthDay[], workouts: HealthWorkout[], ownWeights: { day: string; kg: number }[], weeks = 12): HealthWeek[] {
  const map = new Map<string, { steps: number[]; workouts: number; minutes: number; active: number[]; weights: { day: string; kg: number }[] }>();
  const week = (start: string) => {
    let w = map.get(start);
    if (!w) {
      w = { steps: [], workouts: 0, minutes: 0, active: [], weights: [] };
      map.set(start, w);
    }
    return w;
  };
  for (const d of days) {
    const w = week(mondayOf(d.day));
    if ((d.steps ?? 0) >= MIN_WORN_STEPS) w.steps.push(d.steps ?? 0);
    if (d.activeMinutes !== null) w.active.push(d.activeMinutes);
    if (d.weightKg !== null) w.weights.push({ day: d.day, kg: d.weightKg });
  }
  for (const x of ownWeights) week(mondayOf(x.day)).weights.push(x);
  for (const wo of workouts.filter(isTrainingSession)) {
    const w = week(mondayOf(ymd(wo.startedAt)));
    w.workouts++;
    w.minutes += wo.minutes;
  }
  // Doorlopende weken vanaf de eerste week met gegevens uit een koppeling; eerdere eigen wegingen dienen alleen als beginpunt.
  const healthWeeks = [...days.map((d) => mondayOf(d.day)), ...workouts.map((w) => mondayOf(ymd(w.startedAt)))].sort();
  if (healthWeeks.length === 0) return [];
  const firstHealth = healthWeeks[0];
  const lastWeek = [...map.keys()].sort().at(-1)!;
  const starts = [...map.keys()].filter((k) => k < firstHealth).sort();
  for (let k = firstHealth; k <= lastWeek; k = ymd(new Date(Date.parse(`${k}T12:00:00Z`) + 7 * DAY))) starts.push(k);

  // Gewichtsverandering: van de laatste weging vóór de week (hooguit 10 dagen eerder) tot de laatste in de week.
  // Is de vorige weging ouder, dan alleen binnen de week zelf (bij minstens twee wegingen).
  let previous: { day: string; kg: number } | null = null;
  const out: HealthWeek[] = [];
  for (const start of starts) {
    const w = map.get(start) ?? { steps: [], workouts: 0, minutes: 0, active: [], weights: [] };
    const sorted = [...w.weights].sort((a, b) => a.day.localeCompare(b.day));
    const last = sorted.at(-1) ?? null;
    const recent = previous && last && Date.parse(last.day) - Date.parse(previous.day) <= 10 * DAY ? previous : null;
    const first = recent ?? (sorted.length > 1 ? sorted[0] : null);
    if (last) previous = last;
    if (start < firstHealth) continue;
    out.push({
      start,
      avgSteps: w.steps.length ? Math.round(avg(w.steps) ?? 0) : null,
      workouts: w.workouts,
      workoutMinutes: w.minutes,
      activeMinutes: w.active.length ? Math.round((avg(w.active) ?? 0) * 7) : null,
      weightChange: first && last ? Math.round((last.kg - first.kg) * 10) / 10 : null,
    });
  }
  return out.slice(-weeks);
}

export interface TrainingEffect {
  /** Weken waarin minstens het geplande aantal trainingen is gedaan. */
  onPlanWeeks: number;
  onPlanAvgChange: number;
  otherWeeks: number;
  otherAvgChange: number;
}

/**
 * Vergelijkt weken waarin het schema gevolgd werd met de andere weken (min.
 * twee van elk). De lopende week telt nog niet mee.
 */
export function trainingEffect(weeks: HealthWeek[], plannedPerWeek: number | null, now: Date): TrainingEffect | null {
  if (!plannedPerWeek) return null;
  const complete = weeks.filter((w) => Date.parse(`${w.start}T00:00:00Z`) + 7 * DAY <= now.getTime());
  const withChange = complete.filter((w) => w.weightChange !== null);
  const onPlan = withChange.filter((w) => w.workouts >= plannedPerWeek);
  const other = withChange.filter((w) => w.workouts < plannedPerWeek);
  if (onPlan.length < 2 || other.length < 2) return null;
  const mean = (xs: HealthWeek[]) => Math.round((avg(xs.map((w) => w.weightChange ?? 0)) ?? 0) * 100) / 100;
  return { onPlanWeeks: onPlan.length, onPlanAvgChange: mean(onPlan), otherWeeks: other.length, otherAvgChange: mean(other) };
}

import type { AccountView } from "@/lib/account-types";
import { bmi, nutritionTargets, weightProjection } from "@/lib/calculations";
import { goalOptions, wantsWeightLoss, type Intake } from "@/lib/intake";

/**
 * De voortgang van een klant, berekend uit de vragenlijst (het startpunt) en
 * de check-ins. Alles wat de grafieken in Mijn schema's tonen komt hier vandaan.
 */

const WEEK = 7 * 24 * 60 * 60 * 1000;

export interface SeriesPoint {
  /** Tijdstip in milliseconden. */
  t: number;
  v: number;
  label: string;
}

export interface Progress {
  goal: Intake["goal"] | null;
  goalLabel: string | null;
  /** Bij afvallen is omlaag goed; bij sterker worden omhoog. */
  direction: "down" | "up" | "steady";
  heightCm: number | null;
  weights: SeriesPoint[];
  waist: SeriesPoint[];
  /** Verwacht verloop volgens het plan bij de start (alleen bij afvallen). */
  projection: SeriesPoint[];
  startKg: number | null;
  currentKg: number | null;
  currentAt: number | null;
  changeKg: number | null;
  targetKg: number | null;
  toGoKg: number | null;
  /** Deel van de weg naar het streefgewicht (0-1), alleen bij afvallen. */
  goalShare: number | null;
  projectedGoalAt: number | null;
  bmiStart: number | null;
  bmiNow: number | null;
  /** Ingevulde check-ins met een periode, oudste eerst. */
  checkins: AccountView["checkins"];
}

export function buildProgress(view: AccountView): Progress {
  const intake = view.intake;
  const start = view.startedAt ? new Date(view.startedAt).getTime() : null;
  const goal = [...view.checkins].reverse().find((c) => c.data.goal)?.data.goal ?? intake?.goal ?? null;

  const weights: SeriesPoint[] = [];
  if (intake && start !== null) weights.push({ t: start, v: intake.weightKg, label: "Start" });
  for (const c of view.checkins) {
    if (c.data.weightKg) {
      weights.push({ t: new Date(c.date).getTime(), v: c.data.weightKg, label: c.seq ? `Check-in periode ${c.seq}` : "Check-in" });
    }
  }
  weights.sort((a, b) => a.t - b.t);

  const waist = view.checkins
    .filter((c) => c.data.waistCm)
    .map((c) => ({ t: new Date(c.date).getTime(), v: c.data.waistCm!, label: c.seq ? `Check-in periode ${c.seq}` : "Check-in" }));

  let projection: SeriesPoint[] = [];
  if (intake && start !== null) {
    const p = weightProjection(intake, nutritionTargets(intake));
    if (p) projection = p.points.map((v, i) => ({ t: start + i * WEEK, v, label: i === 0 ? "Start" : `Week ${i}` }));
  }

  const first = weights[0] ?? null;
  const last = weights.at(-1) ?? null;
  const loss = goal ? wantsWeightLoss({ goal }) : false;
  const targetKg = loss ? (intake?.targetWeightKg ?? null) : null;
  const toGoKg = last && targetKg !== null ? Math.max(Math.round((last.v - targetKg) * 10) / 10, 0) : null;
  const goalShare =
    first && last && targetKg !== null && first.v > targetKg
      ? Math.min(Math.max((first.v - last.v) / (first.v - targetKg), 0), 1)
      : null;
  const heightCm = intake?.heightCm ?? null;
  const round1 = (n: number) => Math.round(n * 10) / 10;

  return {
    goal,
    goalLabel: goal ? goalOptions[goal].label : null,
    direction: loss ? "down" : goal === "sterker" ? "up" : "steady",
    heightCm,
    weights,
    waist,
    projection,
    startKg: first?.v ?? null,
    currentKg: last?.v ?? null,
    currentAt: last?.t ?? null,
    changeKg: first && last ? round1(last.v - first.v) : null,
    targetKg,
    toGoKg,
    goalShare,
    projectedGoalAt: projection.length > 1 ? projection.at(-1)!.t : null,
    bmiStart: first && heightCm ? round1(bmi(first.v, heightCm)) : null,
    bmiNow: last && heightCm ? round1(bmi(last.v, heightCm)) : null,
    checkins: view.checkins,
  };
}

/**
 * Het profiel zoals het nu is: de vragenlijst, bijgewerkt met de laatste
 * check-ins (gewicht, doel en aantal trainingsdagen).
 */
export function currentProfile(view: AccountView): Intake | null {
  if (!view.intake) return null;
  const latest = <K extends "weightKg" | "goal" | "trainingDays">(key: K) =>
    [...view.checkins].reverse().find((c) => c.data[key] !== undefined)?.data[key];
  return {
    ...view.intake,
    weightKg: latest("weightKg") ?? view.intake.weightKg,
    goal: latest("goal") ?? view.intake.goal,
    trainingDays: latest("trainingDays") ?? view.intake.trainingDays,
  };
}

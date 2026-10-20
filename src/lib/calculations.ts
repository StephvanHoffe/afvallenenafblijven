import {
  activityOptions,
  paceOptions,
  wantsWeightLoss,
  type Intake,
} from "@/lib/intake";

/**
 * Energie- en macroberekeningen. Deze getallen rekenen we zelf uit (in plaats
 * van ze aan het taalmodel over te laten), zodat elk schema op dezelfde,
 * controleerbare basis staat.
 */

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  waterL: number;
  /** Dagelijks stappendoel als advies. */
  steps: number;
  bmi: number;
  /** Verwachte verandering in kg per week (negatief = afvallen). */
  expectedKgPerWeek: number;
}

const KCAL_PER_KG_FAT = 7700;

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** Ruststofwisseling volgens Mifflin-St Jeor; de formule verschilt voor mannen en vrouwen. */
export function bmr(intake: Pick<Intake, "sex" | "weightKg" | "heightCm" | "age">): number {
  const base = 10 * intake.weightKg + 6.25 * intake.heightCm - 5 * intake.age;
  return intake.sex === "man" ? base + 5 : base - 161;
}

export function activityFactor(intake: Pick<Intake, "activity" | "trainingDays" | "product">): number {
  const base = activityOptions[intake.activity].factor;
  // Wie (ook) een trainingsschema volgt, traint ingepland; anders rekenen we
  // conservatief met één extra beweegmoment per week.
  const sessions = intake.product === "voeding" ? 1 : intake.trainingDays;
  return Math.min(base + sessions * 0.035, 1.9);
}

function roundTo(n: number, step: number) {
  return Math.round(n / step) * step;
}

export function nutritionTargets(intake: Intake): NutritionTargets {
  const b = bmr(intake);
  const tdee = b * activityFactor(intake);
  const minCalories = intake.sex === "man" ? 1500 : 1200;

  let calories = tdee;
  let expectedKgPerWeek = 0;

  if (wantsWeightLoss(intake)) {
    const wanted = (paceOptions[intake.pace].kgPerWeek * KCAL_PER_KG_FAT) / 7;
    // Nooit meer dan 25% onder het onderhoudsniveau en nooit onder het minimum.
    const deficit = Math.min(wanted, tdee * 0.25);
    calories = Math.max(tdee - deficit, minCalories);
    expectedKgPerWeek = -((tdee - calories) * 7) / KCAL_PER_KG_FAT;
  } else if (intake.goal === "sterker") {
    // Klein overschot voor spieropbouw zonder onnodige vetwinst.
    const surplus = intake.experience === "beginner" ? 250 : 200;
    calories = tdee + surplus;
    expectedKgPerWeek = 0.15;
  }

  calories = roundTo(calories, 10);

  // Eiwit op basis van een "referentiegewicht": bij overgewicht rekenen we niet
  // met het volle lichaamsgewicht, maar met het gewicht bij BMI 25.
  const currentBmi = bmi(intake.weightKg, intake.heightCm);
  const refWeight = currentBmi > 27 ? 25 * (intake.heightCm / 100) ** 2 : intake.weightKg;
  const proteinPerKg = intake.goal === "afblijven" ? 1.6 : intake.goal === "afvallen" ? 1.8 : 2.0;
  const proteinG = roundTo(refWeight * proteinPerKg, 5);

  // Vet: 28% van de energie, met een ondergrens van 0,7 g per kg referentiegewicht.
  const fatG = roundTo(Math.max((calories * 0.28) / 9, refWeight * 0.7), 5);
  const carbsG = Math.max(roundTo((calories - proteinG * 4 - fatG * 9) / 4, 5), 50);

  return {
    bmr: Math.round(b),
    tdee: roundTo(tdee, 10),
    calories,
    proteinG,
    fatG,
    carbsG,
    fiberG: Math.round((calories / 1000) * 14),
    waterL: Math.round(intake.weightKg * 0.033 * 10) / 10,
    steps: intake.activity === "zittend" ? 8000 : 10000,
    bmi: Math.round(currentBmi * 10) / 10,
    expectedKgPerWeek: Math.round(expectedKgPerWeek * 100) / 100,
  };
}

export interface Projection {
  weeks: number;
  /** Gewicht per week, beginnend bij het huidige gewicht. */
  points: number[];
}

/**
 * Indicatieve prognose richting het streefgewicht. Afvallen gaat in de praktijk
 * niet lineair; we vlakken het tempo daarom licht af naarmate het doel nadert.
 */
export function weightProjection(intake: Intake, targets: NutritionTargets): Projection | null {
  if (!wantsWeightLoss(intake) || !intake.targetWeightKg) return null;
  const toLose = intake.weightKg - intake.targetWeightKg;
  if (toLose <= 0 || targets.expectedKgPerWeek >= 0) return null;

  const points = [intake.weightKg];
  let w = intake.weightKg;
  const rate = -targets.expectedKgPerWeek;
  for (let week = 1; week <= 104 && w > intake.targetWeightKg + 0.05; week++) {
    const remainingShare = (w - intake.targetWeightKg) / toLose;
    const weeklyLoss = rate * (0.65 + 0.35 * remainingShare);
    w = Math.max(intake.targetWeightKg, w - weeklyLoss);
    points.push(Math.round(w * 10) / 10);
  }
  return { weeks: points.length - 1, points };
}

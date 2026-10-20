import {
  activityOptions,
  allergyOptions,
  budgetOptions,
  conditionOptions,
  cookingTimeOptions,
  dietOptions,
  experienceOptions,
  goalOptions,
  locationOptions,
  paceOptions,
  sexOptions,
  type Intake,
} from "@/lib/intake";
import { products } from "@/config/pricing";
import type { CheckinData } from "@/lib/checkin";

/** Intake-antwoorden als leesbare rijen voor het beheer. */
export function describeIntake(i: Intake): [string, string][] {
  const list = (v: string[]) => (v.length ? v.join(", ") : "geen");
  return [
    ["Plan", products[i.product]?.name ?? i.product],
    ["Doel", goalOptions[i.goal]?.label ?? i.goal],
    ["Geslacht", sexOptions[i.sex] ?? i.sex],
    ["Leeftijd", `${i.age} jaar`],
    ["Lengte", `${i.heightCm} cm`],
    ["Gewicht", `${i.weightKg} kg`],
    ["Streefgewicht", i.targetWeightKg ? `${i.targetWeightKg} kg` : "–"],
    ["Tempo", paceOptions[i.pace]?.label ?? i.pace],
    ["Activiteit", activityOptions[i.activity]?.label ?? i.activity],
    ["Eetpatroon", dietOptions[i.diet] ?? i.diet],
    ["Allergieën", list([...i.allergies.map((a) => allergyOptions[a] ?? a), ...(i.otherAllergies ? [i.otherAllergies] : [])])],
    ["Lust niet", i.dislikes ?? "–"],
    ["Eetmomenten", `${i.mealsPerDay} per dag`],
    ["Kooktijd", cookingTimeOptions[i.cookingTime]?.label ?? i.cookingTime],
    ["Budget", budgetOptions[i.budget] ?? i.budget],
    ["Trainingsplek", locationOptions[i.location]?.label ?? i.location],
    ["Ervaring", experienceOptions[i.experience]?.label ?? i.experience],
    ["Training", `${i.trainingDays}x per week, ${i.sessionMinutes} min`],
    ["Blessures", i.injuries ?? "–"],
    ["Zwanger / borstvoeding", i.pregnant ? "ja" : "nee"],
    ["Eetstoornis", i.eatingDisorder ? "ja" : "nee"],
    ["Aandoeningen", list(i.conditions.map((c) => conditionOptions[c] ?? c))],
    ["Medicatie", i.medication ?? "–"],
    ["Arts geraadpleegd", i.doctorApproval ? "ja" : "nee"],
  ];
}

/** Check-in-antwoorden als leesbare regels voor het beheer (alleen ingevulde velden). */
export function describeCheckin(c: CheckinData): [string, string][] {
  const rows: [string, string | number | undefined][] = [
    ["Gewicht", c.weightKg ? `${String(c.weightKg).replace(".", ",")} kg` : undefined],
    ["Taille", c.waistCm ? `${c.waistCm} cm` : undefined],
    ["Energie", c.energy],
    ["Slaap", c.sleep],
    ["Voeding gevolgd", c.nutritionAdherence],
    ["Honger", c.hunger],
    ["Lekker", c.likedMeals],
    ["Anders / niet meer", c.dislikedMeals],
    ["Trainingen gedaan", c.trainingAdherence],
    ["Zwaarte", c.difficulty],
    ["Trainingsdagen", c.trainingDays ? `${c.trainingDays}x per week` : undefined],
    ["Klachten", c.injuries],
    ["Nieuw doel", c.goal ? (goalOptions[c.goal]?.label ?? c.goal) : undefined],
    ["Opmerkingen", c.comments],
  ];
  return rows.filter((r): r is [string, string | number] => r[1] !== undefined && r[1] !== "").map(([k, v]) => [k, String(v)]);
}

export function stripeDashboardUrl(kind: "customers" | "subscriptions", id: string): string {
  const test = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test");
  return `https://dashboard.stripe.com/${test ? "test/" : ""}${kind}/${id}`;
}

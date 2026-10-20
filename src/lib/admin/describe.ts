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

export { describeCheckin } from "@/lib/checkin";

export function stripeDashboardUrl(kind: "customers" | "subscriptions", id: string): string {
  const test = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test");
  return `https://dashboard.stripe.com/${test ? "test/" : ""}${kind}/${id}`;
}

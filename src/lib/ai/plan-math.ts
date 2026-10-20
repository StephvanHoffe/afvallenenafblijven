import type { NutritionPlan } from "@/lib/ai/schemas";

export interface DayTotals {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** Dagtotalen rekenen we zelf uit de maaltijden uit, in plaats van ze aan het model te vragen. */
export function dayTotals(day: NutritionPlan["days"][number]): DayTotals {
  return day.meals.reduce(
    (t, m) => ({
      kcal: t.kcal + m.kcal,
      proteinG: t.proteinG + m.proteinG,
      carbsG: t.carbsG + m.carbsG,
      fatG: t.fatG + m.fatG,
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

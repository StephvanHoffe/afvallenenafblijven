import type { Intake } from "@/lib/intake";
import { z } from "zod";
import type { NutritionTargets } from "@/lib/calculations";

/**
 * Structuur van de schema's die Claude maakt. Claude levert via structured
 * outputs altijd JSON in exact deze vorm, zodat we ieder schema consistent en
 * mooi kunnen weergeven (scherm, print en PDF).
 */

const ingredient = z.object({
  item: z.string().describe("Ingrediënt, zoals 'Magere kwark' of 'Volkoren wrap'"),
  amount: z.string().describe("Hoeveelheid met eenheid, zoals '150 g', '1 el' of '2 stuks'"),
});

const meal = z.object({
  moment: z.string().describe("Ontbijt, Lunch, Tussendoortje of Avondeten"),
  name: z.string().describe("Aantrekkelijke naam van het gerecht"),
  prepMinutes: z.number().describe("Bereidingstijd in minuten"),
  ingredients: z.array(ingredient),
  instructions: z.array(z.string()).describe("Korte, concrete bereidingsstappen"),
  kcal: z.number(),
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  swap: z.string().describe("Een gelijkwaardig alternatief (vergelijkbare kcal en eiwit)"),
});

export const nutritionPlanSchema = z.object({
  title: z.string(),
  intro: z.string().describe("Persoonlijke introductie van 2-4 zinnen, gericht aan de klant (je/jij)"),
  changes: z
    .array(z.string())
    .describe(
      "Wat er is aangepast ten opzichte van het vorige schema en waarom, op basis van de check-in (2-5 korte punten, gericht aan de klant). Lege lijst bij het eerste schema.",
    ),
  principles: z.array(z.string()).describe("4-6 kernafspraken die dit schema laten werken"),
  days: z.array(
    z.object({
      day: z.string().describe("Maandag t/m Zondag"),
      meals: z.array(meal),
      tip: z.string().describe("Korte tip voor deze dag"),
    }),
  ),
  snackIdeas: z.array(
    z.object({
      name: z.string(),
      kcal: z.number(),
      proteinG: z.number(),
    }),
  ),
  shoppingList: z.array(
    z.object({
      category: z.string().describe("Bijv. Groente & fruit, Zuivel, Vlees/vis/vega, Brood & granen, Voorraadkast"),
      items: z.array(ingredient),
    }),
  ),
  mealPrepTips: z.array(z.string()),
  eatingOutTips: z.array(z.string()),
  adjustmentGuide: z
    .string()
    .describe("Hoe de klant tussentijds (na 2 weken) zelf bijstuurt als het gewicht niet of te snel daalt, of bij honger"),
});

export type NutritionPlan = z.infer<typeof nutritionPlanSchema>;

const exercise = z.object({
  name: z.string(),
  muscleGroups: z.string(),
  sets: z.number(),
  reps: z.string().describe("Bijv. '8-10', '12 per kant' of '30 sec'"),
  restSeconds: z.number(),
  intensity: z.string().describe("Bijv. 'RPE 7 (nog 3 herhalingen over)'"),
  cues: z.array(z.string()).describe("2-3 korte techniekaanwijzingen"),
  alternative: z.string().describe("Makkelijkere of alternatieve variant, bijv. bij blessures of zonder materiaal"),
});

export const trainingPlanSchema = z.object({
  title: z.string(),
  intro: z.string().describe("Persoonlijke introductie van 2-4 zinnen, gericht aan de klant (je/jij)"),
  changes: z
    .array(z.string())
    .describe(
      "Wat er is aangepast ten opzichte van het vorige schema en waarom, op basis van de check-in (2-5 korte punten, gericht aan de klant). Lege lijst bij het eerste schema.",
    ),
  weekSchedule: z
    .array(z.object({ day: z.string(), activity: z.string() }))
    .describe("Maandag t/m Zondag: welke training, of rust/actief herstel"),
  warmup: z.object({
    minutes: z.number(),
    steps: z.array(z.string()),
  }),
  workouts: z.array(
    z.object({
      name: z.string().describe("Bijv. 'Training A – Benen & billen'"),
      focus: z.string(),
      minutes: z.number(),
      exercises: z.array(exercise),
      finisher: z.string().describe("Optionele korte afsluiter, of lege string"),
    }),
  ),
  cooldown: z.array(z.string()),
  progression: z
    .array(
      z.object({
        week: z.number(),
        focus: z.string(),
        instructions: z.string(),
      }),
    )
    .describe("Week 1 t/m 4"),
  cardioAndSteps: z.string(),
  recoveryTips: z.array(z.string()),
  safetyNotes: z.array(z.string()),
});

export type TrainingPlan = z.infer<typeof trainingPlanSchema>;

export type PlanContent =
  | {
      type: "voeding";
      plan: NutritionPlan;
      targets: NutritionTargets;
      /** Totale bijstelling van het caloriedoel na check-ins (kcal per dag). */
      adjustmentKcal?: number;
      /** Activiteitsniveau waarmee gerekend is (kan door gemeten stappen afwijken van de intake). */
      activity?: Intake["activity"];
    }
  | { type: "training"; plan: TrainingPlan };

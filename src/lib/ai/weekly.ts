import "server-only";
import { z } from "zod";
import { generateStructured } from "@/lib/ai/generate";
import type { PlanContent } from "@/lib/ai/schemas";
import type { Intake } from "@/lib/intake";
import { formatNumber } from "@/lib/format";
import type { WeeklyAdjustment, WeeklyData } from "@/lib/weekly";
import { defineCopy, type Locale } from "@/i18n/config";
import { checkinLabel, intakeLabels } from "@/i18n/options";

/**
 * Concrete aanwijzingen na een weegmoment: kleine aanpassingen binnen het
 * bestaande schema (geen nieuw schema). De beslissing zelf (hoeveel kcal,
 * zwaarder of lichter) is al met vaste regels genomen.
 */

const instructionsSchema = z.object({
  nutrition: z
    .object({
      summary: z.string().describe("Eén zin aan de klant (je/jij) over wat er verandert"),
      swaps: z
        .array(
          z.object({
            meal: z.string().describe("Welke maaltijd, bijv. 'Ontbijt (elke dag)' of 'Avondeten maandag'"),
            change: z.string().describe("Concrete aanpassing met hoeveelheden"),
            kcal: z.number().describe("Effect in kcal per dag, negatief bij minder"),
          }),
        )
        .describe("2-4 aanpassingen die samen ongeveer het gevraagde aantal kcal per dag opleveren"),
    })
    .nullable(),
  training: z
    .object({
      summary: z.string().describe("Eén zin aan de klant (je/jij) over wat er verandert"),
      changes: z
        .array(
          z.object({
            exercise: z.string().describe("Naam van de oefening zoals in het schema"),
            change: z.string().describe("Concrete aanpassing: gewicht, herhalingen, sets, rust of variant"),
          }),
        )
        .describe("Per oefening die verandert één regel; houd het bij de belangrijkste oefeningen"),
    })
    .nullable(),
});

const SYSTEM = `Je bent de diëtist en personal trainer van "Afvallen & Afblijven". Een klant heeft zijn wekelijkse weegmoment ingevuld. Op basis daarvan is al besloten wat er moet veranderen. Jij vertaalt die beslissing naar kleine, concrete aanpassingen binnen het bestaande schema, voor de rest van deze periode. Je maakt geen nieuw schema.

Regels:
- Voeding: kies 2-4 aanpassingen die samen ongeveer het gevraagde aantal kcal per dag opleveren (binnen 30 kcal). Werk met hoeveelheden uit het schema (bijv. "30 g havermout in plaats van 40 g"). Pas bij voorkeur iets aan dat elke dag terugkomt, zoals het ontbijt of een tussendoortje. Houd het eiwit gelijk of hoger. Vermijd allergenen en producten die de klant niet lust.
- Training: zwaarder = per oefening een kleine stap (1-2 kg zwaarder, 1-2 herhalingen meer of een moeilijkere variant); lichter = ongeveer 10% minder gewicht of 2 herhalingen minder, en wat meer rust; eenvoudiger = minder sets of kortere trainingen, zodat ze in de week passen. Houd rekening met klachten of blessures.
- Schrijf in kort, warm Nederlands en spreek de klant aan met je/jij. Geen medische claims.
- Laat "nutrition" leeg (null) als er niets aan de voeding verandert, en "training" leeg als er niets aan de training verandert.`;

/** Taalinstructie voor Engelstalige klanten (komt achter de vaste systeemprompt). */
const LANGUAGE_EN = `## Taal: Engels
Deze klant gebruikt de Engelstalige website. Schrijf "summary", "meal", "change" en "exercise" in kort, warm en natuurlijk Brits Engels (en-GB) en spreek de klant aan met "you". Dit gaat voor op de aanwijzing om in het Nederlands te schrijven.
- Noem maaltijden en oefeningen zoals ze in het schema hieronder staan (bijv. "Breakfast (every day)" of "Dinner Monday").
- Gebruik metrische eenheden (g, ml, kg, kcal) en schrijf decimalen met een punt.
- Gegevens van de klant kunnen deels Nederlands zijn; vertaal wat je daaruit overneemt naar het Engels.
- De JSON-sleutels en de structuur blijven ongewijzigd.`;

function nutritionBlock(content: Extract<PlanContent, { type: "voeding" }>): string {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const day of content.plan.days) {
    for (const m of day.meals) {
      if (seen.has(m.name)) continue;
      seen.add(m.name);
      lines.push(`- ${day.day}, ${m.moment}: ${m.name} (${m.kcal} kcal, ${m.proteinG} g eiwit): ${m.ingredients.map((i) => `${i.amount} ${i.item}`).join(", ")}`);
    }
  }
  return lines.join("\n");
}

function trainingBlock(content: Extract<PlanContent, { type: "training" }>): string {
  return content.plan.workouts
    .map((w) => `${w.name}:\n${w.exercises.map((e) => `- ${e.name}: ${e.sets} x ${e.reps}, rust ${e.restSeconds} s, ${e.intensity}`).join("\n")}`)
    .join("\n");
}

export async function weeklyInstructions(
  input: {
    decision: WeeklyAdjustment;
    data: WeeklyData;
    intake: Intake;
    nutrition: Extract<PlanContent, { type: "voeding" }> | null;
    training: Extract<PlanContent, { type: "training" }> | null;
  },
  /** De taal waarin de aanwijzingen voor de klant worden geschreven. */
  l: Locale = "nl",
): Promise<Pick<WeeklyAdjustment, "nutrition" | "trainingPlan">> {
  const { decision, data, intake } = input;
  const wantsNutrition = decision.kcal !== 0 && input.nutrition;
  const wantsTraining = decision.training && input.training;
  if (!wantsNutrition && !wantsTraining) return {};

  const num = (n: number, digits = 0) => formatNumber(n, digits, l);
  const answer = (v: string) => checkinLabel(l, v);
  const allergyLabels = intakeLabels(l).allergy;
  const allergies = [...intake.allergies.map((a) => allergyLabels[a]), ...(intake.otherAllergies ? [intake.otherAllergies] : [])];
  const prompt = [
    "## Beslissing",
    wantsNutrition
      ? `Voeding: ${decision.kcal > 0 ? "verhoog" : "verlaag"} de inname met ongeveer ${Math.abs(decision.kcal)} kcal per dag (nieuw dagdoel ${num(decision.calories ?? 0)} kcal). Reden: ${decision.nutritionReason}`
      : "Voeding: geen aanpassing (nutrition = null).",
    wantsTraining ? `Training: ${decision.training}. Reden: ${decision.trainingReason}` : "Training: geen aanpassing (training = null).",
    "",
    "## Weegmoment van de klant",
    `Gewicht: ${num(data.weightKg, 1)} kg`,
    data.hunger ? `Honger: ${answer(data.hunger)}` : null,
    data.energy ? `Energie: ${answer(data.energy)}` : null,
    data.nutritionAdherence ? `Voedingsschema gevolgd: ${answer(data.nutritionAdherence)}` : null,
    data.trainingAdherence ? `Trainingen gedaan: ${answer(data.trainingAdherence)}` : null,
    data.difficulty ? `Zwaarte trainingen: ${answer(data.difficulty)}` : null,
    data.comments ? `Opmerking: ${data.comments}` : null,
    "",
    "## Klant",
    `Allergieën (strikt vermijden): ${allergies.length ? allergies.join(", ") : "geen"}`,
    `Lust niet: ${intake.dislikes ?? "niets opgegeven"}`,
    intake.injuries ? `Blessures of klachten: ${intake.injuries}` : null,
    wantsNutrition ? `\n## Huidig voedingsschema (dagdoel ${num(input.nutrition!.targets.calories)} kcal)\n${nutritionBlock(input.nutrition!)}` : null,
    wantsTraining ? `\n## Huidig trainingsschema\n${trainingBlock(input.training!)}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const system = l === "en" ? [SYSTEM, LANGUAGE_EN] : SYSTEM;
  const result = await generateStructured(instructionsSchema, system, prompt, { effort: "medium", maxTokens: 8000 });
  return {
    nutrition: wantsNutrition && result.nutrition ? result.nutrition : undefined,
    trainingPlan: wantsTraining && result.training ? result.training : undefined,
  };
}

const fallbackCopy = defineCopy({
  nl: {
    less: (kcal: number) => `Eet vanaf nu ongeveer ${kcal} kcal per dag minder.`,
    everyDay: "Elke dag",
    lessTip: "Gebruik de tips onder 'Tussentijds bijsturen' in je schema, bijvoorbeeld wat minder noten, olie of rijst.",
    more: (kcal: number) => `Eet vanaf nu ongeveer ${kcal} kcal per dag meer.`,
    snackMeal: "Tussendoortje (elke dag)",
    snack: (name: string, kcal: number) => `Neem er elke dag een snack bij, bijvoorbeeld: ${name} (${kcal} kcal).`,
    proteinSnack: "Neem er elke dag een eiwitrijk tussendoortje bij.",
    harder: "Pak een iets zwaarder gewicht (1-2 kg) of doe 1-2 herhalingen meer per set.",
    lighter: "Gebruik ongeveer 10% minder gewicht of doe 2 herhalingen minder, en neem wat langer rust.",
    simpler: "Doe per oefening één set minder, zodat elke training korter is.",
    trainingSummary: "We passen je trainingen aan.",
    allExercises: "Alle oefeningen",
  },
  en: {
    less: (kcal: number) => `From now on, eat about ${kcal} kcal less per day.`,
    everyDay: "Every day",
    lessTip: "Use the tips in your plan for adjusting along the way, for example slightly less nuts, oil or rice.",
    more: (kcal: number) => `From now on, eat about ${kcal} kcal more per day.`,
    snackMeal: "Snack (every day)",
    snack: (name: string, kcal: number) => `Add a snack every day, for example: ${name} (${kcal} kcal).`,
    proteinSnack: "Add a protein-rich snack every day.",
    harder: "Use a slightly heavier weight (1-2 kg) or do 1-2 more reps per set.",
    lighter: "Use about 10% less weight or do 2 fewer reps, and rest a little longer.",
    simpler: "Do one set fewer per exercise, so each workout is shorter.",
    trainingSummary: "We're adjusting your workouts.",
    allExercises: "All exercises",
  },
});

/** Vaste aanwijzingen als Claude (tijdelijk) niet beschikbaar is. */
export function fallbackInstructions(
  input: {
    decision: WeeklyAdjustment;
    nutrition: Extract<PlanContent, { type: "voeding" }> | null;
    training: Extract<PlanContent, { type: "training" }> | null;
  },
  l: Locale = "nl",
): Pick<WeeklyAdjustment, "nutrition" | "trainingPlan"> {
  const { decision } = input;
  const c = fallbackCopy[l];
  const out: Pick<WeeklyAdjustment, "nutrition" | "trainingPlan"> = {};
  if (decision.kcal !== 0 && input.nutrition) {
    const snack = input.nutrition.plan.snackIdeas[0];
    out.nutrition =
      decision.kcal < 0
        ? {
            summary: c.less(Math.abs(decision.kcal)),
            swaps: [{ meal: c.everyDay, change: c.lessTip, kcal: decision.kcal }],
          }
        : {
            summary: c.more(decision.kcal),
            swaps: [
              {
                meal: c.snackMeal,
                change: snack ? c.snack(snack.name, snack.kcal) : c.proteinSnack,
                kcal: decision.kcal,
              },
            ],
          };
  }
  if (decision.training && input.training) {
    const change = decision.training === "zwaarder" ? c.harder : decision.training === "lichter" ? c.lighter : c.simpler;
    out.trainingPlan = {
      summary: decision.trainingReason ?? c.trainingSummary,
      changes: [{ exercise: c.allExercises, change }],
    };
  }
  return out;
}

import "server-only";
import { z } from "zod";
import { generateStructured } from "@/lib/ai/generate";
import type { PlanContent } from "@/lib/ai/schemas";
import { allergyOptions, type Intake } from "@/lib/intake";
import { formatNumber } from "@/lib/format";
import type { WeeklyAdjustment, WeeklyData } from "@/lib/weekly";

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

export async function weeklyInstructions(input: {
  decision: WeeklyAdjustment;
  data: WeeklyData;
  intake: Intake;
  nutrition: Extract<PlanContent, { type: "voeding" }> | null;
  training: Extract<PlanContent, { type: "training" }> | null;
}): Promise<Pick<WeeklyAdjustment, "nutrition" | "trainingPlan">> {
  const { decision, data, intake } = input;
  const wantsNutrition = decision.kcal !== 0 && input.nutrition;
  const wantsTraining = decision.training && input.training;
  if (!wantsNutrition && !wantsTraining) return {};

  const allergies = [...intake.allergies.map((a) => allergyOptions[a]), ...(intake.otherAllergies ? [intake.otherAllergies] : [])];
  const prompt = [
    "## Beslissing",
    wantsNutrition
      ? `Voeding: ${decision.kcal > 0 ? "verhoog" : "verlaag"} de inname met ongeveer ${Math.abs(decision.kcal)} kcal per dag (nieuw dagdoel ${formatNumber(decision.calories ?? 0)} kcal). Reden: ${decision.nutritionReason}`
      : "Voeding: geen aanpassing (nutrition = null).",
    wantsTraining ? `Training: ${decision.training}. Reden: ${decision.trainingReason}` : "Training: geen aanpassing (training = null).",
    "",
    "## Weegmoment van de klant",
    `Gewicht: ${formatNumber(data.weightKg, 1)} kg`,
    data.hunger ? `Honger: ${data.hunger}` : null,
    data.energy ? `Energie: ${data.energy}` : null,
    data.nutritionAdherence ? `Voedingsschema gevolgd: ${data.nutritionAdherence}` : null,
    data.trainingAdherence ? `Trainingen gedaan: ${data.trainingAdherence}` : null,
    data.difficulty ? `Zwaarte trainingen: ${data.difficulty}` : null,
    data.comments ? `Opmerking: ${data.comments}` : null,
    "",
    "## Klant",
    `Allergieën (strikt vermijden): ${allergies.length ? allergies.join(", ") : "geen"}`,
    `Lust niet: ${intake.dislikes ?? "niets opgegeven"}`,
    intake.injuries ? `Blessures of klachten: ${intake.injuries}` : null,
    wantsNutrition ? `\n## Huidig voedingsschema (dagdoel ${formatNumber(input.nutrition!.targets.calories)} kcal)\n${nutritionBlock(input.nutrition!)}` : null,
    wantsTraining ? `\n## Huidig trainingsschema\n${trainingBlock(input.training!)}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const result = await generateStructured(instructionsSchema, SYSTEM, prompt, { effort: "medium", maxTokens: 8000 });
  return {
    nutrition: wantsNutrition && result.nutrition ? result.nutrition : undefined,
    trainingPlan: wantsTraining && result.training ? result.training : undefined,
  };
}

/** Vaste aanwijzingen als Claude (tijdelijk) niet beschikbaar is. */
export function fallbackInstructions(input: {
  decision: WeeklyAdjustment;
  nutrition: Extract<PlanContent, { type: "voeding" }> | null;
  training: Extract<PlanContent, { type: "training" }> | null;
}): Pick<WeeklyAdjustment, "nutrition" | "trainingPlan"> {
  const { decision } = input;
  const out: Pick<WeeklyAdjustment, "nutrition" | "trainingPlan"> = {};
  if (decision.kcal !== 0 && input.nutrition) {
    const snack = input.nutrition.plan.snackIdeas[0];
    out.nutrition =
      decision.kcal < 0
        ? {
            summary: `Eet vanaf nu ongeveer ${Math.abs(decision.kcal)} kcal per dag minder.`,
            swaps: [
              { meal: "Elke dag", change: "Gebruik de tips onder 'Tussentijds bijsturen' in je schema, bijvoorbeeld wat minder noten, olie of rijst.", kcal: decision.kcal },
            ],
          }
        : {
            summary: `Eet vanaf nu ongeveer ${decision.kcal} kcal per dag meer.`,
            swaps: [
              {
                meal: "Tussendoortje (elke dag)",
                change: snack ? `Neem er elke dag een snack bij, bijvoorbeeld: ${snack.name} (${snack.kcal} kcal).` : "Neem er elke dag een eiwitrijk tussendoortje bij.",
                kcal: decision.kcal,
              },
            ],
          };
  }
  if (decision.training && input.training) {
    const change =
      decision.training === "zwaarder"
        ? "Pak een iets zwaarder gewicht (1-2 kg) of doe 1-2 herhalingen meer per set."
        : decision.training === "lichter"
          ? "Gebruik ongeveer 10% minder gewicht of doe 2 herhalingen minder, en neem wat langer rust."
          : "Doe per oefening één set minder, zodat elke training korter is.";
    out.trainingPlan = {
      summary: decision.trainingReason ?? "We passen je trainingen aan.",
      changes: [{ exercise: "Alle oefeningen", change }],
    };
  }
  return out;
}

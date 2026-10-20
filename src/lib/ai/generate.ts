import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { nutritionTargets, type NutritionTargets } from "@/lib/calculations";
import type { Intake } from "@/lib/intake";
import {
  NUTRITION_SYSTEM_PROMPT,
  TRAINING_SYSTEM_PROMPT,
  nutritionUserPrompt,
  trainingUserPrompt,
  type ProgressContext,
} from "@/lib/ai/prompts";
import {
  nutritionPlanSchema,
  trainingPlanSchema,
  type NutritionPlan,
  type PlanContent,
  type TrainingPlan,
} from "@/lib/ai/schemas";
import { dayTotals } from "@/lib/ai/plan-math";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  // De SDK leest ANTHROPIC_API_KEY uit de omgeving.
  client ??= new Anthropic({ maxRetries: 3 });
  return client;
}

export class PlanGenerationError extends Error {}

async function generateStructured<T extends z.ZodType>(
  schema: T,
  system: string,
  userPrompt: string,
): Promise<z.infer<T>> {
  const stream = anthropic().beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    // Bij een (onterechte) weigering door de veiligheidsfilters probeert de API
    // het verzoek automatisch opnieuw op het aanbevolen fallback-model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: betaZodOutputFormat(schema) },
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userPrompt }],
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new PlanGenerationError(
      `Model weigerde het verzoek (${message.stop_details?.category ?? "onbekend"})`,
    );
  }
  if (message.stop_reason === "max_tokens") {
    throw new PlanGenerationError("Antwoord afgekapt (max_tokens bereikt)");
  }
  if (!message.parsed_output) {
    throw new PlanGenerationError("Antwoord kon niet als schema worden gelezen");
  }
  return message.parsed_output;
}

/** Controleert het schema op de harde eisen en geeft gevonden problemen terug. */
export function reviewNutritionPlan(
  plan: NutritionPlan,
  intake: Intake,
  targets: NutritionTargets,
  kcalTolerance = 0.08,
): string[] {
  const problems: string[] = [];
  if (plan.days.length !== 7) problems.push(`Het schema bevat ${plan.days.length} dagen in plaats van 7.`);
  for (const day of plan.days) {
    const t = dayTotals(day);
    if (day.meals.length !== intake.mealsPerDay) {
      problems.push(`${day.day} heeft ${day.meals.length} eetmomenten in plaats van ${intake.mealsPerDay}.`);
    }
    const deviation = (t.kcal - targets.calories) / targets.calories;
    if (Math.abs(deviation) > kcalTolerance) {
      problems.push(
        `${day.day} komt uit op ${t.kcal} kcal terwijl het doel ${targets.calories} kcal is. Pas de porties aan.`,
      );
    }
    if (t.proteinG < targets.proteinG * 0.9) {
      problems.push(`${day.day} bevat ${t.proteinG} g eiwit terwijl het doel minimaal ${targets.proteinG} g is.`);
    }
  }
  return problems;
}

export function reviewTrainingPlan(plan: TrainingPlan, intake: Intake): string[] {
  const problems: string[] = [];
  if (plan.weekSchedule.length !== 7) problems.push("Het weekoverzicht bevat niet precies 7 dagen.");
  if (plan.workouts.length === 0) problems.push("Er staan geen trainingen in het schema.");
  if (plan.progression.length < 4) problems.push("De progressie moet week 1 t/m 4 beschrijven.");
  const tooLong = plan.workouts.filter((w) => w.minutes > intake.sessionMinutes + 10);
  for (const w of tooLong) {
    problems.push(`${w.name} duurt ${w.minutes} minuten terwijl de klant maximaal ${intake.sessionMinutes} minuten heeft.`);
  }
  return problems;
}

/**
 * Genereert een voedingsschema. Voldoet de eerste versie niet aan de harde
 * eisen (calorieën, eiwit, aantal maaltijden), dan vragen we één keer om een
 * gecorrigeerde versie. Blijft er een kleine afwijking over, dan accepteren
 * we die binnen een ruimere marge; anders falen we zodat het later opnieuw
 * geprobeerd wordt.
 */
export async function generateNutritionPlan(
  name: string,
  intake: Intake,
  progress: ProgressContext,
): Promise<Extract<PlanContent, { type: "voeding" }>> {
  const targets = nutritionTargets(intake);
  let plan = await generateStructured(
    nutritionPlanSchema,
    NUTRITION_SYSTEM_PROMPT,
    nutritionUserPrompt(name, intake, targets, progress),
  );

  let problems = reviewNutritionPlan(plan, intake, targets);
  if (problems.length > 0) {
    const feedback = `Een eerdere versie van dit schema voldeed niet aan de eisen:\n- ${problems.join("\n- ")}\nMaak een volledig nieuw schema waarin deze punten zijn opgelost.`;
    plan = await generateStructured(
      nutritionPlanSchema,
      NUTRITION_SYSTEM_PROMPT,
      nutritionUserPrompt(name, intake, targets, progress, feedback),
    );
    problems = reviewNutritionPlan(plan, intake, targets, 0.12);
    if (problems.length > 0) {
      throw new PlanGenerationError(`Voedingsschema voldoet niet: ${problems.join(" ")}`);
    }
  }
  return { type: "voeding", plan, targets };
}

export async function generateTrainingPlan(
  name: string,
  intake: Intake,
  progress: ProgressContext,
): Promise<Extract<PlanContent, { type: "training" }>> {
  let plan = await generateStructured(trainingPlanSchema, TRAINING_SYSTEM_PROMPT, trainingUserPrompt(name, intake, progress));
  let problems = reviewTrainingPlan(plan, intake);
  if (problems.length > 0) {
    const feedback = `Een eerdere versie van dit schema voldeed niet aan de eisen:\n- ${problems.join("\n- ")}\nMaak een volledig nieuw schema waarin deze punten zijn opgelost.`;
    plan = await generateStructured(
      trainingPlanSchema,
      TRAINING_SYSTEM_PROMPT,
      trainingUserPrompt(name, intake, progress, feedback),
    );
    problems = reviewTrainingPlan(plan, intake);
    if (problems.length > 0) {
      throw new PlanGenerationError(`Trainingsschema voldoet niet: ${problems.join(" ")}`);
    }
  }
  return { type: "training", plan };
}

/** Korte samenvatting van een schema, als context voor het volgende schema. */
export function summarizePlan(content: PlanContent): string {
  if (content.type === "voeding") {
    const dishes = content.plan.days.flatMap((d) => d.meals.map((m) => m.name));
    return `Voedingsschema op ${content.targets.calories} kcal en ${content.targets.proteinG} g eiwit. Gerechten: ${[...new Set(dishes)].join(", ")}.`;
  }
  return content.plan.workouts
    .map((w) => `${w.name}: ${w.exercises.map((e) => `${e.name} ${e.sets}x${e.reps}`).join(", ")}`)
    .join("\n");
}

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { nutritionTargets, type NutritionTargets } from "@/lib/calculations";
import type { Intake } from "@/lib/intake";
import {
  NUTRITION_SYSTEM_PROMPT,
  TRAINING_SYSTEM_PROMPT,
  languageInstruction,
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
import { allergenProblems } from "@/lib/allergens";
import type { Locale } from "@/i18n/config";
import { loadStoredConfig } from "@/lib/db";

/** Het model: in te stellen bij Beheer → Koppelingen (of ANTHROPIC_MODEL bij de hosting). */
export function claudeModel(): string {
  return process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
}

let client: { key: string; client: Anthropic } | null = null;
/** De Claude-client. De sleutel kan in het beheer zijn gewijzigd: dan maken we een nieuwe. */
export async function anthropic(): Promise<Anthropic> {
  await loadStoredConfig();
  const key = process.env.ANTHROPIC_API_KEY ?? "";
  if (client?.key !== key) client = { key, client: new Anthropic({ apiKey: key || undefined, maxRetries: 3 }) };
  return client.client;
}

export class PlanGenerationError extends Error {}

/**
 * Vraagt Claude om JSON in de vorm van `schema`. `system` mag uit meerdere
 * delen bestaan (bijv. de vaste prompt plus een taalinstructie); alleen het
 * eerste deel wordt gecachet, zodat de vaste prompt voor iedereen gelijk blijft.
 */
export async function generateStructured<T extends z.ZodType>(
  schema: T,
  system: string | readonly string[],
  userPrompt: string,
  options: { effort?: "low" | "medium" | "high"; maxTokens?: number } = {},
): Promise<z.infer<T>> {
  const [base, ...extra] = typeof system === "string" ? [system] : system;
  const stream = (await anthropic()).beta.messages.stream({
    model: claudeModel(),
    max_tokens: options.maxTokens ?? 64000,
    // Bij een (onterechte) weigering door de veiligheidsfilters probeert de API
    // het verzoek automatisch opnieuw op het aanbevolen fallback-model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: options.effort ?? "high", format: betaZodOutputFormat(schema) },
    system: [
      { type: "text", text: base, cache_control: { type: "ephemeral" } },
      ...extra.map((text) => ({ type: "text" as const, text })),
    ],
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
  // Allergenen: elk ingrediënt, gerecht en product op de boodschappenlijst wordt nagelopen.
  problems.push(...allergenProblems(plan, intake));
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
 * eisen (calorieën, eiwit, aantal maaltijden, allergenen), dan vragen we één keer om een
 * gecorrigeerde versie. Blijft er een kleine afwijking over, dan accepteren
 * we die binnen een ruimere marge; anders falen we zodat het later opnieuw
 * geprobeerd wordt.
 */
/** De systeemprompt, met voor Engelstalige klanten een taalinstructie erachter. */
function systemFor(base: string, l: Locale, kind: "voeding" | "training"): string | string[] {
  const language = languageInstruction(l, kind);
  return language ? [base, language] : base;
}

export async function generateNutritionPlan(
  name: string,
  intake: Intake,
  progress: ProgressContext,
  /** Dagdoelen na bijstelling op basis van de check-in; standaard berekend uit de intake. */
  adjusted?: { targets: NutritionTargets; adjustmentKcal: number },
  /** De taal waarin het schema voor de klant wordt geschreven. */
  l: Locale = "nl",
): Promise<Extract<PlanContent, { type: "voeding" }>> {
  const targets = adjusted?.targets ?? nutritionTargets(intake);
  const system = systemFor(NUTRITION_SYSTEM_PROMPT, l, "voeding");
  let plan = await generateStructured(nutritionPlanSchema, system, nutritionUserPrompt(name, intake, targets, progress, undefined, l));

  let problems = reviewNutritionPlan(plan, intake, targets);
  if (problems.length > 0) {
    const feedback = `Een eerdere versie van dit schema voldeed niet aan de eisen:\n- ${problems.join("\n- ")}\nMaak een volledig nieuw schema waarin deze punten zijn opgelost.`;
    plan = await generateStructured(nutritionPlanSchema, system, nutritionUserPrompt(name, intake, targets, progress, feedback, l));
    problems = reviewNutritionPlan(plan, intake, targets, 0.12);
    if (problems.length > 0) {
      throw new PlanGenerationError(`Voedingsschema voldoet niet: ${problems.join(" ")}`);
    }
  }
  return { type: "voeding", plan, targets, ...(adjusted?.adjustmentKcal ? { adjustmentKcal: adjusted.adjustmentKcal } : {}) };
}

export async function generateTrainingPlan(
  name: string,
  intake: Intake,
  progress: ProgressContext,
  /** De taal waarin het schema voor de klant wordt geschreven. */
  l: Locale = "nl",
): Promise<Extract<PlanContent, { type: "training" }>> {
  const system = systemFor(TRAINING_SYSTEM_PROMPT, l, "training");
  let plan = await generateStructured(trainingPlanSchema, system, trainingUserPrompt(name, intake, progress, undefined, l));
  let problems = reviewTrainingPlan(plan, intake);
  if (problems.length > 0) {
    const feedback = `Een eerdere versie van dit schema voldeed niet aan de eisen:\n- ${problems.join("\n- ")}\nMaak een volledig nieuw schema waarin deze punten zijn opgelost.`;
    plan = await generateStructured(trainingPlanSchema, system, trainingUserPrompt(name, intake, progress, feedback, l));
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

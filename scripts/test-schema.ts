/**
 * Test de kwaliteit van de schema's vóór de lancering, zonder betaling of database.
 *
 *   ANTHROPIC_API_KEY=... npm run schema:test            # voeding + training
 *   ANTHROPIC_API_KEY=... npm run schema:test voeding    # alleen voeding
 *
 * Het resultaat komt in de map schema-test/ (JSON). Let op: elke run kost
 * API-tegoed (enkele tientallen eurocenten per schema).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { intakeSchema } from "../src/lib/intake";
import { nutritionTargets } from "../src/lib/calculations";
import { generateNutritionPlan, generateTrainingPlan } from "../src/lib/ai/generate";
import { dayTotals } from "../src/lib/ai/plan-math";

const which = process.argv[2] ?? "beide";

const intake = intakeSchema.parse({
  product: "bundel",
  goal: "afvallen_strakker",
  sex: "vrouw",
  age: 34,
  heightCm: 168,
  weightKg: 78,
  targetWeightKg: 68,
  pace: "gemiddeld",
  activity: "zittend",
  diet: "flexitarisch",
  allergies: ["noten"],
  dislikes: "champignons, koriander",
  mealsPerDay: 4,
  cookingTime: "normaal",
  budget: "normaal",
  location: "thuis_materiaal",
  experience: "beginner",
  trainingDays: 3,
  sessionMinutes: 45,
  injuries: "soms last van mijn rechterknie",
  pregnant: false,
  eatingDisorder: false,
  conditions: [],
});

async function main() {
  mkdirSync("schema-test", { recursive: true });
  const progress = { periodNumber: 1 };
  console.log("Dagdoelen:", nutritionTargets(intake));

  if (which === "beide" || which === "voeding") {
    const started = Date.now();
    const result = await generateNutritionPlan("Sanne", intake, progress);
    writeFileSync("schema-test/voeding.json", JSON.stringify(result, null, 2));
    console.log(`\nVoedingsschema klaar in ${Math.round((Date.now() - started) / 1000)} s`);
    for (const day of result.plan.days) {
      const t = dayTotals(day);
      console.log(`  ${day.day.padEnd(10)} ${t.kcal} kcal · ${t.proteinG} g eiwit · ${day.meals.length} maaltijden`);
    }
  }
  if (which === "beide" || which === "training") {
    const started = Date.now();
    const result = await generateTrainingPlan("Sanne", intake, progress);
    writeFileSync("schema-test/training.json", JSON.stringify(result, null, 2));
    console.log(`\nTrainingsschema klaar in ${Math.round((Date.now() - started) / 1000)} s`);
    for (const w of result.plan.workouts) console.log(`  ${w.name}: ${w.exercises.length} oefeningen, ${w.minutes} min`);
  }
  console.log("\nResultaat opgeslagen in schema-test/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

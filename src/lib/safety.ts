import { bmi } from "@/lib/calculations";
import { hasMedicalCondition, wantsWeightLoss, type Intake } from "@/lib/intake";

/**
 * Veiligheidscheck vóór de betaling. Sommige situaties vragen om begeleiding
 * door een arts of diëtist; daar verkopen we bewust geen standaardschema voor.
 */
export type SafetyResult =
  | { ok: true; warnings: string[] }
  | { ok: false; reason: string };

export function checkSafety(intake: Intake): SafetyResult {
  const currentBmi = bmi(intake.weightKg, intake.heightCm);
  const includesNutrition = intake.product !== "training";

  if (intake.pregnant) {
    return {
      ok: false,
      reason:
        "Tijdens een zwangerschap of borstvoedingsperiode heb je andere voedingsbehoeften. Overleg daarom met je verloskundige, huisarts of een diëtist. We maken in deze periode geen schema voor je.",
    };
  }

  if (intake.eatingDisorder && includesNutrition) {
    return {
      ok: false,
      reason:
        "Bij (een geschiedenis van) een eetstoornis is begeleiding door een professional belangrijk. Een standaard voedingsschema is dan niet verstandig. Je huisarts kan je doorverwijzen; ook Proud2Bme en de Korrelatie (0900 1450) kunnen je verder helpen.",
    };
  }

  if (wantsWeightLoss(intake) && currentBmi < 18.5) {
    return {
      ok: false,
      reason:
        "Met jouw lengte en gewicht heb je volgens de BMI al ondergewicht. Afvallen is dan niet gezond. Overleg bij twijfel met je huisarts. Wil je fit blijven of sterker worden? Kies dan een ander doel.",
    };
  }

  if (wantsWeightLoss(intake) && intake.targetWeightKg) {
    const targetBmi = bmi(intake.targetWeightKg, intake.heightCm);
    if (targetBmi < 18.5) {
      return {
        ok: false,
        reason:
          "Je streefgewicht ligt onder een gezond gewicht (BMI lager dan 18,5). Kies een streefgewicht dat bij je lengte past, dan helpen we je graag verder.",
      };
    }
  }

  if (hasMedicalCondition(intake) && !intake.doctorApproval) {
    return {
      ok: false,
      reason:
        "Je hebt aangegeven dat je een medische aandoening hebt. Overleg eerst met je arts of een voedings- of trainingsschema voor jou verstandig is en bevestig dat in de vragenlijst.",
    };
  }

  const warnings: string[] = [];
  if (currentBmi >= 35) {
    warnings.push(
      "Bij een BMI van 35 of hoger raden we aan om je huisarts op de hoogte te brengen van je plannen.",
    );
  }
  if (intake.age >= 65) {
    warnings.push("Ben je 65 jaar of ouder? Bespreek een nieuw trainingsprogramma bij voorkeur eerst met je huisarts.");
  }
  return { ok: true, warnings };
}

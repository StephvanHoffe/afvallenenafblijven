import { bmi } from "@/lib/calculations";
import { hasMedicalCondition, wantsWeightLoss, type Intake } from "@/lib/intake";
import { defineCopy, type Locale } from "@/i18n/config";

/**
 * Veiligheidscheck vóór de betaling. Sommige situaties vragen om begeleiding
 * door een arts of diëtist; daar verkopen we bewust geen standaardschema voor.
 */
export type SafetyResult =
  | { ok: true; warnings: string[] }
  | { ok: false; reason: string };

const copy = defineCopy({
  nl: {
    pregnant:
      "Tijdens een zwangerschap of borstvoedingsperiode heb je andere voedingsbehoeften. Overleg daarom met je verloskundige, huisarts of een diëtist. We maken in deze periode geen schema voor je.",
    eatingDisorder:
      "Bij (een geschiedenis van) een eetstoornis is begeleiding door een professional belangrijk. Een standaard voedingsschema is dan niet verstandig. Je huisarts kan je doorverwijzen; ook Proud2Bme en de Korrelatie (0900 1450) kunnen je verder helpen.",
    underweight:
      "Met jouw lengte en gewicht heb je volgens de BMI al ondergewicht. Afvallen is dan niet gezond. Overleg bij twijfel met je huisarts. Wil je fit blijven of sterker worden? Kies dan een ander doel.",
    targetUnderweight:
      "Je streefgewicht ligt onder een gezond gewicht (BMI lager dan 18,5). Kies een streefgewicht dat bij je lengte past, dan helpen we je graag verder.",
    medical:
      "Je hebt aangegeven dat je een medische aandoening hebt. Overleg eerst met je arts of een voedings- of trainingsschema voor jou verstandig is en bevestig dat in de vragenlijst.",
    highBmi: "Bij een BMI van 35 of hoger raden we aan om je huisarts op de hoogte te brengen van je plannen.",
    senior: "Ben je 65 jaar of ouder? Bespreek een nieuw trainingsprogramma bij voorkeur eerst met je huisarts.",
  },
  en: {
    pregnant:
      "During pregnancy or while breastfeeding, your nutritional needs are different. Please talk to your midwife, GP or a dietitian. We won't create a plan for you during this period.",
    eatingDisorder:
      "If you have (or have had) an eating disorder, support from a professional is important. A standard nutrition plan isn't a wise choice in that case. Your GP can refer you; Proud2Bme and Korrelatie (0900 1450) can also help you further.",
    underweight:
      "Based on your height and weight, your BMI already indicates that you're underweight. Losing weight wouldn't be healthy. If in doubt, talk to your GP. Want to stay fit or get stronger? Then choose a different goal.",
    targetUnderweight:
      "Your target weight is below a healthy weight (BMI under 18.5). Choose a target weight that suits your height and we'll be happy to help you further.",
    medical:
      "You've indicated that you have a medical condition. Please check with your doctor first whether a nutrition or workout plan is a sensible choice for you, and confirm this in the questionnaire.",
    highBmi: "With a BMI of 35 or higher, we recommend letting your GP know about your plans.",
    senior: "Are you 65 or older? Ideally, discuss a new workout plan with your GP first.",
  },
});

export function checkSafety(intake: Intake, l: Locale = "nl"): SafetyResult {
  const c = copy[l];
  const currentBmi = bmi(intake.weightKg, intake.heightCm);
  const includesNutrition = intake.product !== "training";

  if (intake.pregnant) {
    return { ok: false, reason: c.pregnant };
  }

  if (intake.eatingDisorder && includesNutrition) {
    return { ok: false, reason: c.eatingDisorder };
  }

  if (wantsWeightLoss(intake) && currentBmi < 18.5) {
    return { ok: false, reason: c.underweight };
  }

  if (wantsWeightLoss(intake) && intake.targetWeightKg) {
    const targetBmi = bmi(intake.targetWeightKg, intake.heightCm);
    if (targetBmi < 18.5) {
      return { ok: false, reason: c.targetUnderweight };
    }
  }

  if (hasMedicalCondition(intake) && !intake.doctorApproval) {
    return { ok: false, reason: c.medical };
  }

  const warnings: string[] = [];
  if (currentBmi >= 35) {
    warnings.push(c.highBmi);
  }
  if (intake.age >= 65) {
    warnings.push(c.senior);
  }
  return { ok: true, warnings };
}

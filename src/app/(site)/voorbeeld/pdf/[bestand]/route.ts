import { notFound } from "next/navigation";
import {
  sampleNutritionPlan,
  sampleNutritionPlanFollowUp,
  sampleTargets,
  sampleTargetsFollowUp,
  sampleTrainingPlan,
  sampleTrainingPlanFollowUp,
} from "@/content/sample-plans";
import { DEMO_SEQ, demoCustomerName, demoPlanDate, demoWeekly } from "@/content/demo-account";
import { adjustmentsFor } from "@/lib/weekly";
import { pdfResponse, renderPlansPdf, type PdfPart, type PdfPlan } from "@/lib/pdf/render";

/**
 * Voorbeeld-PDF's voor de voorbeeldpagina en de demo van Mijn schema's.
 * Fictieve klant; worden bij het bouwen van de site als vaste bestanden gemaakt.
 */
const files: Record<string, { plans: PdfPlan[]; part?: PdfPart; fileName: string }> = {
  voorbeeld: {
    plans: [
      { content: { type: "voeding", plan: sampleNutritionPlan, targets: sampleTargets }, seq: 1, generatedAt: null },
      { content: { type: "training", plan: sampleTrainingPlan }, seq: 1, generatedAt: null },
    ],
    fileName: "voorbeeld-schemas-afvallen-en-afblijven.pdf",
  },
  voedingsschema: {
    plans: [{ content: { type: "voeding", plan: sampleNutritionPlanFollowUp, targets: sampleTargetsFollowUp }, seq: DEMO_SEQ, generatedAt: demoPlanDate, adjustments: adjustmentsFor(demoWeekly, DEMO_SEQ, "voeding") }],
    fileName: "voorbeeld-voedingsschema-periode-4.pdf",
  },
  trainingsschema: {
    plans: [{ content: { type: "training", plan: sampleTrainingPlanFollowUp }, seq: DEMO_SEQ, generatedAt: demoPlanDate, adjustments: adjustmentsFor(demoWeekly, DEMO_SEQ, "training") }],
    fileName: "voorbeeld-trainingsschema-periode-4.pdf",
  },
  boodschappenlijst: {
    plans: [{ content: { type: "voeding", plan: sampleNutritionPlanFollowUp, targets: sampleTargetsFollowUp }, seq: DEMO_SEQ, generatedAt: demoPlanDate, adjustments: adjustmentsFor(demoWeekly, DEMO_SEQ, "voeding") }],
    part: "boodschappen",
    fileName: "voorbeeld-boodschappenlijst.pdf",
  },
  alles: {
    plans: [
      { content: { type: "voeding", plan: sampleNutritionPlanFollowUp, targets: sampleTargetsFollowUp }, seq: DEMO_SEQ, generatedAt: demoPlanDate, adjustments: adjustmentsFor(demoWeekly, DEMO_SEQ, "voeding") },
      { content: { type: "training", plan: sampleTrainingPlanFollowUp }, seq: DEMO_SEQ, generatedAt: demoPlanDate, adjustments: adjustmentsFor(demoWeekly, DEMO_SEQ, "training") },
    ],
    fileName: "voorbeeld-schemas-periode-4.pdf",
  },
};

export function generateStaticParams() {
  return Object.keys(files).map((bestand) => ({ bestand }));
}

export async function GET(_request: Request, ctx: RouteContext<"/voorbeeld/pdf/[bestand]">) {
  const { bestand } = await ctx.params;
  const file = files[bestand];
  if (!file) notFound();
  return pdfResponse(await renderPlansPdf(file.plans, demoCustomerName, file.part), file.fileName, {
    cache: "public, max-age=3600",
  });
}

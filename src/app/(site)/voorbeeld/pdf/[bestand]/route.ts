import { notFound } from "next/navigation";
import {
  sampleNutritionPlan,
  sampleNutritionPlanPeriod2,
  sampleTargets,
  sampleTrainingPlan,
  sampleTrainingPlanPeriod2,
} from "@/content/sample-plans";
import { demoCustomerName, demoPlanDate } from "@/content/demo-account";
import { pdfResponse, renderPlansPdf, type PdfPart, type PdfPlan } from "@/lib/pdf/render";

/**
 * Voorbeeld-PDF's voor de voorbeeldpagina en de demo van Mijn schema's.
 * Fictieve klant; worden bij het bouwen van de site als vaste bestanden gemaakt.
 */
const files: Record<string, { plans: PdfPlan[]; part?: PdfPart; fileName: string }> = {
  voorbeeld: {
    plans: [
      { content: { type: "voeding", plan: sampleNutritionPlan, targets: sampleTargets }, seq: 1, generatedAt: demoPlanDate },
      { content: { type: "training", plan: sampleTrainingPlan }, seq: 1, generatedAt: demoPlanDate },
    ],
    fileName: "voorbeeld-schemas-afvallen-en-afblijven.pdf",
  },
  voedingsschema: {
    plans: [{ content: { type: "voeding", plan: sampleNutritionPlanPeriod2, targets: sampleTargets }, seq: 2, generatedAt: demoPlanDate }],
    fileName: "voorbeeld-voedingsschema-periode-2.pdf",
  },
  trainingsschema: {
    plans: [{ content: { type: "training", plan: sampleTrainingPlanPeriod2 }, seq: 2, generatedAt: demoPlanDate }],
    fileName: "voorbeeld-trainingsschema-periode-2.pdf",
  },
  boodschappenlijst: {
    plans: [{ content: { type: "voeding", plan: sampleNutritionPlanPeriod2, targets: sampleTargets }, seq: 2, generatedAt: demoPlanDate }],
    part: "boodschappen",
    fileName: "voorbeeld-boodschappenlijst.pdf",
  },
  alles: {
    plans: [
      { content: { type: "voeding", plan: sampleNutritionPlanPeriod2, targets: sampleTargets }, seq: 2, generatedAt: demoPlanDate },
      { content: { type: "training", plan: sampleTrainingPlanPeriod2 }, seq: 2, generatedAt: demoPlanDate },
    ],
    fileName: "voorbeeld-schemas-periode-2.pdf",
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

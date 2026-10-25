import { locales, toLocale, type Locale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { samplePlansFor } from "@/content/sample-plans";
import { DEMO_SEQ, demoCustomerName, demoPlanDate, demoWeeklyFor } from "@/content/demo-account";
import { adjustmentsFor } from "@/lib/weekly";
import { pdfResponse, renderPlansPdf, type PdfPart, type PdfPlan } from "@/lib/pdf/render";

type DemoFile = { plans: PdfPlan[]; part?: PdfPart; fileName: string };

const FILES = ["voorbeeld", "voedingsschema", "trainingsschema", "boodschappenlijst", "alles"] as const;

/**
 * Voorbeeld-PDF's voor de voorbeeldpagina en de demo van Mijn schema's.
 * Fictieve klant; worden bij het bouwen van de site als vaste bestanden gemaakt.
 */
function filesFor(l: Locale): Record<(typeof FILES)[number], DemoFile> {
  const {
    sampleNutritionPlan,
    sampleNutritionPlanFollowUp,
    sampleTargets,
    sampleTargetsFollowUp,
    sampleTrainingPlan,
    sampleTrainingPlanFollowUp,
  } = samplePlansFor(l);
  const demoWeekly = demoWeeklyFor(l);
  const en = l === "en";
  const nutrition: PdfPlan = {
    content: { type: "voeding", plan: sampleNutritionPlanFollowUp, targets: sampleTargetsFollowUp },
    seq: DEMO_SEQ,
    generatedAt: demoPlanDate,
    adjustments: adjustmentsFor(demoWeekly, DEMO_SEQ, "voeding"),
  };
  const training: PdfPlan = {
    content: { type: "training", plan: sampleTrainingPlanFollowUp },
    seq: DEMO_SEQ,
    generatedAt: demoPlanDate,
    adjustments: adjustmentsFor(demoWeekly, DEMO_SEQ, "training"),
  };
  return {
    voorbeeld: {
      plans: [
        { content: { type: "voeding", plan: sampleNutritionPlan, targets: sampleTargets }, seq: 1, generatedAt: null },
        { content: { type: "training", plan: sampleTrainingPlan }, seq: 1, generatedAt: null },
      ],
      fileName: en ? "sample-plans-afvallen-en-afblijven.pdf" : "voorbeeld-schemas-afvallen-en-afblijven.pdf",
    },
    voedingsschema: {
      plans: [nutrition],
      fileName: en ? "sample-nutrition-plan-period-4.pdf" : "voorbeeld-voedingsschema-periode-4.pdf",
    },
    trainingsschema: {
      plans: [training],
      fileName: en ? "sample-workout-plan-period-4.pdf" : "voorbeeld-trainingsschema-periode-4.pdf",
    },
    boodschappenlijst: {
      plans: [nutrition],
      part: "boodschappen",
      fileName: en ? "sample-shopping-list.pdf" : "voorbeeld-boodschappenlijst.pdf",
    },
    alles: {
      plans: [nutrition, training],
      fileName: en ? "sample-plans-period-4.pdf" : "voorbeeld-schemas-periode-4.pdf",
    },
  };
}

const isFile = (value: string): value is (typeof FILES)[number] => (FILES as readonly string[]).includes(value);

export function generateStaticParams() {
  // Route Handlers erven de talen van de root layout niet: geef ze hier zelf mee.
  return locales.flatMap((lang) => FILES.map((bestand) => ({ lang, bestand })));
}

export async function GET(_request: Request, ctx: RouteContext<"/[lang]/voorbeeld/pdf/[bestand]">) {
  const { lang, bestand } = await ctx.params;
  if (!isFile(bestand)) notFound();
  // De taal uit het adres (niet uit de headers), zodat de PDF statisch blijft.
  const l = toLocale(lang);
  const file = filesFor(l)[bestand];
  return pdfResponse(await renderPlansPdf(file.plans, demoCustomerName, file.part, l), file.fileName, {
    cache: "public, max-age=3600",
  });
}

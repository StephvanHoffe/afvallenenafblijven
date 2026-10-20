import type { Metadata } from "next";
import { DemoBanner } from "@/components/account/DemoBanner";
import { PlanDocument } from "@/components/plan/PlanDocument";
import { samplePlansFor } from "@/content/sample-plans";
import { DEMO_SEQ, demoCustomerName, demoPlanDate, demoWeeklyFor } from "@/content/demo-account";
import { defineCopy } from "@/i18n/config";
import { getLocale } from "@/i18n/server";
import { adjustmentsFor } from "@/lib/weekly";

const copy = defineCopy({
  nl: {
    title: "Voorbeeld: voedingsschema",
    banner: "Voorbeeld van een voedingsschema in Mijn schema's, voor een fictieve klant.",
  },
  en: {
    title: "Example: nutrition plan",
    banner: "Example of a nutrition plan in My plans, for a fictional customer.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return {
    title: copy[l].title,
    robots: { index: false },
  };
}

export default async function DemoNutritionPage() {
  const l = await getLocale();
  const { sampleNutritionPlanFollowUp, sampleTargetsFollowUp } = samplePlansFor(l);
  return (
    <section className="container-page py-10 sm:py-14">
      <DemoBanner>{copy[l].banner}</DemoBanner>
      <PlanDocument
        content={{ type: "voeding", plan: sampleNutritionPlanFollowUp, targets: sampleTargetsFollowUp }}
        customerName={demoCustomerName}
        generatedAt={demoPlanDate}
        backHref="/voorbeeld/mijn-schemas/schemas"
        preview
        adjustments={adjustmentsFor(demoWeeklyFor(l), DEMO_SEQ, "voeding")}
        pdfHref="/voorbeeld/pdf/voedingsschema"
        shoppingPdfHref="/voorbeeld/pdf/boodschappenlijst"
        storageKey={l === "en" ? "afb-boodschappen-voorbeeld-en" : "afb-boodschappen-voorbeeld"}
        l={l}
      />
    </section>
  );
}

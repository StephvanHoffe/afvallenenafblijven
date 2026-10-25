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
    title: "Voorbeeld: trainingsschema",
    banner: "Voorbeeld van een trainingsschema in Mijn schema's, voor een fictieve klant.",
  },
  en: {
    title: "Example: workout plan",
    banner: "Example of a workout plan in My plans, for a fictional customer.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return {
    title: copy[l].title,
    robots: { index: false },
  };
}

export default async function DemoTrainingPage() {
  const l = await getLocale();
  const { sampleTrainingPlanFollowUp } = samplePlansFor(l);
  return (
    <section className="container-page py-10 sm:py-14">
      <DemoBanner>{copy[l].banner}</DemoBanner>
      <PlanDocument
        content={{ type: "training", plan: sampleTrainingPlanFollowUp }}
        customerName={demoCustomerName}
        generatedAt={demoPlanDate}
        backHref="/voorbeeld/mijn-schemas/schemas"
        preview
        adjustments={adjustmentsFor(demoWeeklyFor(l), DEMO_SEQ, "training")}
        pdfHref="/voorbeeld/pdf/trainingsschema"
        l={l}
      />
    </section>
  );
}

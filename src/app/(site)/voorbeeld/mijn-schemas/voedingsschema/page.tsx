import type { Metadata } from "next";
import { DemoBanner } from "@/components/account/DemoBanner";
import { PlanDocument } from "@/components/plan/PlanDocument";
import { sampleNutritionPlanPeriod2, sampleTargets } from "@/content/sample-plans";
import { demoCustomerName, demoPlanDate } from "@/content/demo-account";

export const metadata: Metadata = {
  title: "Voorbeeld: voedingsschema",
  robots: { index: false },
};

export default function DemoNutritionPage() {
  return (
    <section className="container-page py-10 sm:py-14">
      <DemoBanner>Voorbeeld van een voedingsschema in Mijn schema&apos;s, voor een fictieve klant.</DemoBanner>
      <PlanDocument
        content={{ type: "voeding", plan: sampleNutritionPlanPeriod2, targets: sampleTargets }}
        customerName={demoCustomerName}
        generatedAt={demoPlanDate}
        backHref="/voorbeeld/mijn-schemas"
        preview
        pdfHref="/voorbeeld/pdf/voedingsschema"
        shoppingPdfHref="/voorbeeld/pdf/boodschappenlijst"
        storageKey="afb-boodschappen-voorbeeld"
      />
    </section>
  );
}

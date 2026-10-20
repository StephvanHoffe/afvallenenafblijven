import type { Metadata } from "next";
import { DemoBanner } from "@/components/account/DemoBanner";
import { PlanDocument } from "@/components/plan/PlanDocument";
import { sampleTrainingPlanFollowUp } from "@/content/sample-plans";
import { demoCustomerName, demoPlanDate } from "@/content/demo-account";

export const metadata: Metadata = {
  title: "Voorbeeld: trainingsschema",
  robots: { index: false },
};

export default function DemoTrainingPage() {
  return (
    <section className="container-page py-10 sm:py-14">
      <DemoBanner>Voorbeeld van een trainingsschema in Mijn schema&apos;s, voor een fictieve klant.</DemoBanner>
      <PlanDocument
        content={{ type: "training", plan: sampleTrainingPlanFollowUp }}
        customerName={demoCustomerName}
        generatedAt={demoPlanDate}
        backHref="/voorbeeld/mijn-schemas/schemas"
        preview
        pdfHref="/voorbeeld/pdf/trainingsschema"
      />
    </section>
  );
}

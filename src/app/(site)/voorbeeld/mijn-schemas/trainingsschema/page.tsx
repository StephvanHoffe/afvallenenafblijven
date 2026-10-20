import type { Metadata } from "next";
import { DemoBanner } from "@/components/account/DemoBanner";
import { PlanDocument } from "@/components/plan/PlanDocument";
import { sampleTrainingPlan } from "@/content/sample-plans";
import { demoCustomerName } from "@/content/demo-account";

export const metadata: Metadata = {
  title: "Voorbeeld: trainingsschema",
  robots: { index: false },
};

export default function DemoTrainingPage() {
  return (
    <section className="container-page py-10 sm:py-14">
      <DemoBanner>Voorbeeld van een trainingsschema in Mijn schema&apos;s, voor een fictieve klant.</DemoBanner>
      <PlanDocument
        content={{ type: "training", plan: sampleTrainingPlan }}
        customerName={demoCustomerName}
        generatedAt={new Date("2027-02-03T09:15:00+01:00")}
        backHref="/voorbeeld/mijn-schemas"
        preview
      />
    </section>
  );
}

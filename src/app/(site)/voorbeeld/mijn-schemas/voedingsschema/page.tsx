import type { Metadata } from "next";
import { DemoBanner } from "@/components/account/DemoBanner";
import { PlanDocument } from "@/components/plan/PlanDocument";
import { sampleNutritionPlan, sampleTargets } from "@/content/sample-plans";
import { demoCustomerName } from "@/content/demo-account";

export const metadata: Metadata = {
  title: "Voorbeeld: voedingsschema",
  robots: { index: false },
};

export default function DemoNutritionPage() {
  return (
    <section className="container-page py-10 sm:py-14">
      <DemoBanner>Voorbeeld van een voedingsschema in Mijn schema&apos;s, voor een fictieve klant.</DemoBanner>
      <PlanDocument
        content={{ type: "voeding", plan: sampleNutritionPlan, targets: sampleTargets }}
        customerName={demoCustomerName}
        generatedAt={new Date("2027-02-03T09:14:00+01:00")}
        backHref="/voorbeeld/mijn-schemas"
        preview
      />
    </section>
  );
}

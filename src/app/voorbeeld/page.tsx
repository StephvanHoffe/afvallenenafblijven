import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { CtaBanner } from "@/components/marketing";
import { NutritionPlanView } from "@/components/plan/NutritionPlanView";
import { TrainingPlanView } from "@/components/plan/TrainingPlanView";
import { sampleNutritionPlan, sampleTargets, sampleTrainingPlan } from "@/content/sample-plans";

export const metadata: Metadata = {
  title: "Voorbeeld van een voedings- en trainingsschema",
  description:
    "Bekijk hoe een persoonlijk voedingsschema en trainingsschema van Afvallen & Afblijven eruitziet: dagdoelen, recepten, boodschappenlijst en trainingen.",
  alternates: { canonical: "/voorbeeld" },
};

export default function VoorbeeldPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-cream">
        <div className="container-page py-12 text-center sm:py-16">
          <p className="eyebrow mb-3">Voorbeeldschema</p>
          <h1 className="heading-xl mx-auto max-w-3xl">Zo ziet jouw schema eruit</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            Hieronder zie je een uittreksel van een echt schema. Jouw schema wordt volledig gemaakt op basis van jouw
            antwoorden.
          </p>
          <p className="mx-auto mt-6 inline-flex max-w-2xl items-start gap-2 rounded-2xl border border-brand-200 bg-white px-4 py-3 text-left text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
            Voorbeeld voor een fictieve klant: Sanne, 34 jaar, 168 cm, 78 kg, doel 68 kg, kantoorbaan, traint 3x per week
            thuis met dumbbells, eet alles en lust geen champignons.
          </p>
          <nav aria-label="Voorbeelden" className="no-print mt-8 flex justify-center gap-2">
            <a href="#voeding" className="btn-primary">
              Voedingsschema
            </a>
            <a href="#training" className="btn-secondary">
              Trainingsschema
            </a>
          </nav>
        </div>
      </section>

      <section id="voeding" className="container-page scroll-mt-20 py-12">
        <NutritionPlanView plan={sampleNutritionPlan} targets={sampleTargets} preview />
      </section>

      <div className="container-page">
        <div className="rounded-[var(--radius-card)] bg-brand-900 p-8 text-center text-white">
          <h2 className="heading-md text-white">Zin in een schema dat helemaal over jou gaat?</h2>
          <Link href="/start" className="btn-glow mt-6">
            Start de vragenlijst <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      </div>

      <section id="training" className="container-page scroll-mt-20 py-12">
        <TrainingPlanView plan={sampleTrainingPlan} preview />
      </section>

      <CtaBanner />
    </>
  );
}

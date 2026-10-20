import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { ArrowRight, Download, Info } from "lucide-react";
import { CtaBanner } from "@/components/marketing";
import { NutritionPlanView } from "@/components/plan/NutritionPlanView";
import { TrainingPlanView } from "@/components/plan/TrainingPlanView";
import { samplePlansFor } from "@/content/sample-plans";
import { defineCopy, localePath } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const copy = defineCopy({
  nl: {
    metaTitle: "Voorbeeld van een voedings- en trainingsschema",
    metaDescription:
      "Bekijk hoe een persoonlijk voedingsschema en trainingsschema van Afvallen & Afblijven eruitziet: dagdoelen, recepten, boodschappenlijst en trainingen.",
    eyebrow: "Voorbeeldschema",
    title: "Zo ziet jouw schema eruit",
    intro:
      "Hieronder zie je een uittreksel van een echt schema. Jouw schema wordt volledig gemaakt op basis van jouw antwoorden.",
    persona:
      "Voorbeeld voor een fictieve klant: Sanne, 34 jaar, 168 cm, 78 kg, doel 68 kg, kantoorbaan, traint 3x per week thuis met dumbbells, eet alles en lust geen champignons.",
    examples: "Voorbeelden",
    nutrition: "Voedingsschema",
    training: "Trainingsschema",
    download: "Download het voorbeeld als PDF",
    ctaTitle: "Zin in een schema dat helemaal over jou gaat?",
    start: "Start de vragenlijst",
    accountTitle: "Al je schema's op één plek",
    accountText: "In Mijn schema's vind je je schema's, je check-in en je abonnement. Bekijk hoe dat eruitziet.",
    accountLink: "Bekijk Mijn schema's",
  },
  en: {
    metaTitle: "Example of a nutrition and workout plan",
    metaDescription:
      "See what a personal nutrition plan and workout plan from Afvallen & Afblijven looks like: daily targets, recipes, shopping list and workouts.",
    eyebrow: "Sample plan",
    title: "This is what your plan looks like",
    intro: "Below is an excerpt from a real plan. Your own plan is created entirely from your answers.",
    persona:
      "Example for a fictional customer: Sanne, 34, 168 cm, 78 kg, target 68 kg, office job, trains 3 times a week at home with dumbbells, eats everything and doesn't like mushrooms.",
    examples: "Examples",
    nutrition: "Nutrition plan",
    training: "Workout plan",
    download: "Download the example as a PDF",
    ctaTitle: "Ready for a plan that's all about you?",
    start: "Start the questionnaire",
    accountTitle: "All your plans in one place",
    accountText: "In My plans you'll find your plans, your check-in and your subscription. Take a look at how it works.",
    accountLink: "Explore My plans",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: c.metaTitle, description: c.metaDescription, alternates: alternates(l, "/voorbeeld") };
}

export default async function VoorbeeldPage() {
  const l = await getLocale();
  const c = copy[l];
  const { sampleNutritionPlan, sampleTargets, sampleTrainingPlan } = samplePlansFor(l);
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-cream">
        <div className="container-page py-12 text-center sm:py-16">
          <p className="eyebrow mb-3">{c.eyebrow}</p>
          <h1 className="heading-xl mx-auto max-w-3xl">{c.title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">{c.intro}</p>
          <p className="mx-auto mt-6 inline-flex max-w-2xl items-start gap-2 rounded-2xl border border-brand-200 bg-white px-4 py-3 text-left text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
            {c.persona}
          </p>
          <nav aria-label={c.examples} className="no-print mt-8 flex justify-center gap-2">
            <a href="#voeding" className="btn-primary">
              {c.nutrition}
            </a>
            <a href="#training" className="btn-secondary">
              {c.training}
            </a>
          </nav>
          <p className="no-print mt-4 text-sm">
            {/* PDF-download, geen pagina: daarom een gewone link. */}
            <a
              href={localePath(l, "/voorbeeld/pdf/voorbeeld")}
              className="inline-flex items-center gap-1.5 font-bold text-brand-700 underline underline-offset-2"
            >
              <Download className="size-4" aria-hidden /> {c.download}
            </a>
          </p>
        </div>
      </section>

      <section id="voeding" className="container-page scroll-mt-20 py-12">
        <NutritionPlanView plan={sampleNutritionPlan} targets={sampleTargets} preview />
      </section>

      <div className="container-page">
        <div className="rounded-[var(--radius-card)] bg-brand-900 p-8 text-center text-white">
          <h2 className="heading-md text-white">{c.ctaTitle}</h2>
          <Link href="/start" className="btn-glow mt-6">
            {c.start} <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      </div>

      <section id="training" className="container-page scroll-mt-20 py-12">
        <TrainingPlanView plan={sampleTrainingPlan} preview />
      </section>

      <section className="container-page pb-4">
        <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="heading-md">{c.accountTitle}</h2>
            <p className="mt-1 text-muted">{c.accountText}</p>
          </div>
          <Link href="/voorbeeld/mijn-schemas" className="btn-secondary">
            {c.accountLink} <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}

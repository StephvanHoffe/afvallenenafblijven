import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { CtaBanner } from "@/components/marketing";
import { knowledgeCategories, knowledgePages, type KnowledgeCategory } from "@/content/knowledge";
import { defineCopy } from "@/i18n/config";
import Link from "@/i18n/Link";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const PATH = "/kennis";
const ORDER: KnowledgeCategory[] = ["rekenhulpen", "voeding", "recepten", "bewegen", "afvallen"];

const copy = defineCopy({
  nl: {
    metaTitle: "Kennisbank: rekenhulpen, voeding, recepten en training",
    metaDescription:
      "Gratis rekenhulpen en heldere artikelen over calorieën, eiwit, BMI, gezonde recepten, wandelen en krachttraining. Zonder hypes, met getallen die kloppen.",
    eyebrow: "Kennisbank",
    title: "Alles over gezond afvallen,",
    accent: "zonder hypes",
    intro:
      "Gratis rekenhulpen en heldere uitleg over voeding, recepten en bewegen. Met dezelfde formules en voedingswaarden die we gebruiken in onze persoonlijke schema's.",
  },
  en: {
    metaTitle: "Knowledge base: calculators, nutrition, recipes and training",
    metaDescription:
      "Free calculators and clear articles about calories, protein, BMI, healthy recipes, walking and strength training. No hype, just numbers that add up.",
    eyebrow: "Knowledge base",
    title: "Everything about healthy weight loss,",
    accent: "without the hype",
    intro:
      "Free calculators and clear explanations about nutrition, recipes and exercise. Using the same formulas and nutritional values as in our personal plans.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH) };
}

export default async function KennisPage() {
  const l = await getLocale();
  const c = copy[l];
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-cream pt-10 pb-10 sm:pt-14">
        <div className="container-page max-w-3xl">
          <p className="eyebrow mb-3">{c.eyebrow}</p>
          <h1 className="heading-xl">
            {c.title} <span className="text-brand-600">{c.accent}</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">{c.intro}</p>
        </div>
      </section>
      <div className="container-page space-y-12 py-12">
        {ORDER.map((cat) => {
          const pages = knowledgePages.filter((k) => k.category === cat);
          if (pages.length === 0) return null;
          return (
            <section key={cat} className="space-y-4">
              <h2 className="heading-md">{knowledgeCategories[cat][l]}</h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pages.map((k) => (
                  <li key={k.path}>
                    <Link href={k.path} className="card group flex h-full flex-col gap-2 p-5 transition hover:border-brand-300">
                      <span className="flex items-center justify-between gap-3 text-lg font-extrabold">
                        {k.title[l]}
                        <ArrowRight className="size-5 shrink-0 text-brand-600 transition group-hover:translate-x-0.5" aria-hidden />
                      </span>
                      <span className="text-muted">{k.summary[l]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <CtaBanner />
    </>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { Quiz } from "@/components/quiz/Quiz";
import { DEFAULT_DURATION, isDurationId, isProductId } from "@/config/pricing";
import { site } from "@/config/site";
import { defineCopy } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { goalOptions } from "@/lib/intake";
import { launchOfferActive } from "@/lib/launch";

const copy = defineCopy({
  nl: {
    title: "Start je persoonlijke plan",
    description:
      "Beantwoord een paar vragen en ontvang binnen enkele minuten je persoonlijke voedings- en/of trainingsschema.",
  },
  en: {
    title: "Start your personal plan",
    description: "Answer a few questions and receive your personal nutrition and/or workout plan within minutes.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return { title: copy[l].title, description: copy[l].description, alternates: alternates(l, "/start") };
}

export default function StartPage({ searchParams }: PageProps<"/[lang]/start">) {
  return (
    <section className="container-page py-10 sm:py-14">
      <Suspense fallback={<QuizSkeleton />}>
        <QuizLoader searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function QuizLoader({ searchParams }: Pick<PageProps<"/[lang]/start">, "searchParams">) {
  const sp = await searchParams;
  const plan = typeof sp.plan === "string" && isProductId(sp.plan) ? sp.plan : null;
  const duration = typeof sp.looptijd === "string" && isDurationId(sp.looptijd) ? sp.looptijd : DEFAULT_DURATION;
  const goal = typeof sp.doel === "string" && sp.doel in goalOptions ? (sp.doel as keyof typeof goalOptions) : null;
  const launch = { active: await launchOfferActive(), percentOff: site.launchOffer.percentOff };
  return (
    <Quiz
      key={`${plan ?? "geen"}-${duration}-${goal ?? ""}`}
      initialProduct={plan}
      initialDuration={duration}
      initialGoal={goal}
      startAtPlan={sp.stap === "plan"}
      launch={launch}
    />
  );
}

function QuizSkeleton() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-6" aria-hidden>
      <div className="h-2 rounded-full bg-brand-100" />
      <div className="h-10 w-3/4 rounded-2xl bg-line" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-3xl bg-white" />
        ))}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { Quiz } from "@/components/quiz/Quiz";
import { DEFAULT_DURATION, isDurationId, isProductId } from "@/config/pricing";
import { site } from "@/config/site";
import { launchOfferActive } from "@/lib/launch";

export const metadata: Metadata = {
  title: "Start je persoonlijke plan",
  description:
    "Beantwoord een paar vragen en ontvang binnen enkele minuten je persoonlijke voedings- en/of trainingsschema.",
  alternates: { canonical: "/start" },
};

export default function StartPage({ searchParams }: PageProps<"/start">) {
  return (
    <section className="container-page py-10 sm:py-14">
      <Suspense fallback={<QuizSkeleton />}>
        <QuizLoader searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function QuizLoader({ searchParams }: Pick<PageProps<"/start">, "searchParams">) {
  const sp = await searchParams;
  const plan = typeof sp.plan === "string" && isProductId(sp.plan) ? sp.plan : null;
  const duration = typeof sp.looptijd === "string" && isDurationId(sp.looptijd) ? sp.looptijd : DEFAULT_DURATION;
  const launch = { active: await launchOfferActive(), percentOff: site.launchOffer.percentOff };
  return (
    <Quiz
      key={`${plan ?? "geen"}-${duration}`}
      initialProduct={plan}
      initialDuration={duration}
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

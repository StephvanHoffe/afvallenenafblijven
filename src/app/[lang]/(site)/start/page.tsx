import type { Metadata } from "next";
import { Suspense } from "react";
import { Quiz, type QuizResume } from "@/components/quiz/Quiz";
import { DEFAULT_DURATION, isDurationId, isProductId } from "@/config/pricing";
import { defineCopy } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { goalOptions, intakeSchema } from "@/lib/intake";
import { isDatabaseConfigured } from "@/lib/db";
import { normalizeCode } from "@/lib/discounts";
import { resumableIntake } from "@/lib/repo";
import { currentPromotion } from "@/lib/promotion";

const copy = defineCopy({
  nl: {
    title: "Start je persoonlijke plan",
    description:
      "Beantwoord een paar vragen en ontvang binnen 2 uur je persoonlijke voedings- en/of trainingsschema.",
  },
  en: {
    title: "Start your personal plan",
    description: "Answer a few questions and receive your personal nutrition and/or workout plan within 2 hours.",
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
  const promo = await currentPromotion(await getLocale());
  const code = typeof sp.code === "string" ? normalizeCode(sp.code) || null : null;
  const resume = typeof sp.hervat === "string" ? await loadResume(sp.hervat) : null;
  return (
    <Quiz
      key={`${plan ?? "geen"}-${duration}-${goal ?? ""}-${resume ? "hervat" : ""}`}
      initialProduct={plan}
      initialDuration={duration}
      initialGoal={goal}
      startAtPlan={sp.stap === "plan"}
      durationPreset={typeof sp.looptijd === "string" && isDurationId(sp.looptijd)}
      promo={promo}
      initialCode={code ?? resume?.code ?? null}
      resume={resume?.quiz ?? null}
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

/** Een begonnen bestelling uit de herinneringsmail (?hervat=), als die nog geldig is. */
async function loadResume(id: string): Promise<{ quiz: QuizResume; code: string | null } | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const row = await resumableIntake(id);
    if (!row) return null;
    const intake = intakeSchema.safeParse(row.data);
    if (!intake.success) return null;
    return {
      quiz: {
        intake: intake.data,
        name: row.name,
        email: row.email,
        duration: row.duration && isDurationId(row.duration) ? row.duration : null,
      },
      code: row.discount_code,
    };
  } catch {
    return null;
  }
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { NutritionPlanView } from "@/components/plan/NutritionPlanView";
import { TrainingPlanView } from "@/components/plan/TrainingPlanView";
import { PrintButton } from "@/components/plan/PrintButton";
import { currentCustomer } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getPlan } from "@/lib/repo";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Mijn schema",
  robots: { index: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function SchemaPage({ params }: PageProps<"/schema/[id]">) {
  return (
    <section className="container-page py-10 sm:py-14">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white" aria-hidden />}>
        <PlanContent params={params} />
      </Suspense>
    </section>
  );
}

async function PlanContent({ params }: Pick<PageProps<"/schema/[id]">, "params">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const customer = await currentCustomer();
  if (!customer) redirect("/inloggen");
  const plan = await getPlan(id);
  if (!plan || plan.customer_id !== customer.id) notFound();
  if (plan.status !== "ready" || !plan.content) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="heading-lg">Je schema wordt gemaakt</h1>
        <p className="mt-3 text-muted">Dit duurt meestal een paar minuten. Je ontvangt een e-mail zodra het klaar is.</p>
        <Link href="/account" className="btn-secondary mt-6">
          Terug naar Mijn schema&apos;s
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link href="/account" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Mijn schema&apos;s
        </Link>
        <PrintButton />
      </div>
      <p className="mb-4 text-sm text-muted">
        Persoonlijk schema voor {customer.name}
        {plan.generated_at ? `, gemaakt op ${formatDate(plan.generated_at)}` : ""} · {site.name}
      </p>
      {plan.content.type === "voeding" ? (
        <NutritionPlanView plan={plan.content.plan} targets={plan.content.targets} />
      ) : (
        <TrainingPlanView plan={plan.content.plan} />
      )}
      <p className="mt-12 rounded-2xl bg-sand p-4 text-xs leading-relaxed text-muted">
        Dit schema is persoonlijk leefstijladvies op basis van jouw antwoorden en is gemaakt met behulp van AI. Het is
        geen medisch advies en geen vervanging voor begeleiding door een arts, diëtist of fysiotherapeut. Heb je
        klachten, een medische aandoening of twijfel? Overleg dan eerst met je huisarts. Lees bij allergieën altijd de
        etiketten.
      </p>
    </div>
  );
}

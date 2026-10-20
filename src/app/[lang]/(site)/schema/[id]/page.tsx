import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PlanDocument } from "@/components/plan/PlanDocument";
import { defineCopy, localePath } from "@/i18n/config";
import { getLocale } from "@/i18n/server";
import { currentCustomer } from "@/lib/auth";
import { getPlan, weeklyLogsForOrder } from "@/lib/repo";
import { adjustmentsFor } from "@/lib/weekly";

const copy = defineCopy({
  nl: {
    title: "Mijn schema",
    generating: "Je schema wordt gemaakt",
    generatingText: "Dit duurt meestal een paar minuten. Je ontvangt een e-mail zodra het klaar is.",
    back: "Terug naar Mijn schema's",
  },
  en: {
    title: "My plan",
    generating: "Your plan is being created",
    generatingText: "This usually takes a few minutes. You'll receive an email as soon as it's ready.",
    back: "Back to My plans",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return {
    title: copy[l].title,
    robots: { index: false },
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function SchemaPage({ params }: PageProps<"/[lang]/schema/[id]">) {
  return (
    <section className="container-page py-10 sm:py-14">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white" aria-hidden />}>
        <PlanContent params={params} />
      </Suspense>
    </section>
  );
}

async function PlanContent({ params }: Pick<PageProps<"/[lang]/schema/[id]">, "params">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const l = await getLocale();
  const c = copy[l];
  const customer = await currentCustomer();
  if (!customer) redirect(localePath(l, "/inloggen"));
  const plan = await getPlan(id);
  if (!plan || plan.customer_id !== customer.id) notFound();
  if (plan.status !== "ready" || !plan.content) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="heading-lg">{c.generating}</h1>
        <p className="mt-3 text-muted">{c.generatingText}</p>
        <Link href="/account/schemas" className="btn-secondary mt-6">
          {c.back}
        </Link>
      </div>
    );
  }

  const weekly = (await weeklyLogsForOrder(plan.order_id)).map((w) => ({ ...w, date: w.created_at }));
  return (
    <PlanDocument
      adjustments={adjustmentsFor(weekly, plan.seq, plan.type)}
      content={plan.content}
      customerName={customer.name}
      generatedAt={plan.generated_at}
      pdfHref={`/schema/${plan.id}/pdf`}
      shoppingPdfHref={plan.content.type === "voeding" ? `/schema/${plan.id}/pdf?deel=boodschappen` : undefined}
      storageKey={`afb-boodschappen-${plan.id}`}
      l={l}
    />
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PlanDocument } from "@/components/plan/PlanDocument";
import { currentCustomer } from "@/lib/auth";
import { getPlan } from "@/lib/repo";

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
        <p className="mt-3 text-muted">
          Dit duurt meestal een paar minuten. Je ontvangt een e-mail zodra het klaar is.
        </p>
        <Link href="/account/schemas" className="btn-secondary mt-6">
          Terug naar Mijn schema&apos;s
        </Link>
      </div>
    );
  }

  return (
    <PlanDocument
      content={plan.content}
      customerName={customer.name}
      generatedAt={plan.generated_at}
      pdfHref={`/schema/${plan.id}/pdf`}
      shoppingPdfHref={plan.content.type === "voeding" ? `/schema/${plan.id}/pdf?deel=boodschappen` : undefined}
      storageKey={`afb-boodschappen-${plan.id}`}
    />
  );
}

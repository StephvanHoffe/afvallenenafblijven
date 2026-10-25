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
import { formatDayDate } from "@/lib/format";
import { startsLater } from "@/lib/schedule";
import { CalendarCheck } from "lucide-react";

const copy = defineCopy({
  nl: {
    title: "Mijn schema",
    generating: "Je schema wordt gemaakt",
    generatingText: "Binnen 2 uur staat het voor je klaar. Je ontvangt dan een e-mail.",
    back: "Terug naar Mijn schema's",
    upcoming: (start: string) => `Dit schema start op ${start}. Tot die tijd volg je je huidige schema.`,
    upcomingShopping: "Doe alvast je boodschappen met de boodschappenlijst van dit schema.",
  },
  en: {
    title: "My plan",
    generating: "Your plan is being created",
    generatingText: "It will be ready for you within 2 hours. We'll send you an email when it is.",
    back: "Back to My plans",
    upcoming: (start: string) => `This plan starts on ${start}. Until then, keep following your current plan.`,
    upcomingShopping: "You can already do your shopping with this plan's shopping list.",
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
  // Nog niet vrijgegeven (gepland binnen 2 uur): de klant ziet "wordt gemaakt".
  if (plan.status !== "ready" || !plan.content || !plan.released_at) {
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
  // Staat het schema al klaar voor de volgende periode, dan zeggen we wanneer het start.
  const upcoming = startsLater(plan.starts_at);
  return (
    <>
      {upcoming && (
        <p role="note" className="mb-6 flex gap-3 rounded-[var(--radius-card)] border-2 border-lime-glow bg-[#f6fbe8] p-4 text-[0.9375rem] sm:p-5">
          <CalendarCheck className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
          <span>
            <strong>{c.upcoming(formatDayDate(plan.starts_at, l))}</strong>
            {plan.content.type === "voeding" ? ` ${c.upcomingShopping}` : ""}
          </span>
        </p>
      )}
      <PlanDocument
      adjustments={adjustmentsFor(weekly, plan.seq, plan.type)}
      content={plan.content}
      customerName={customer.name}
      generatedAt={plan.released_at}
      pdfHref={`/schema/${plan.id}/pdf`}
      shoppingPdfHref={plan.content.type === "voeding" ? `/schema/${plan.id}/pdf?deel=boodschappen` : undefined}
      storageKey={`afb-boodschappen-${plan.id}`}
      l={l}
    />
    </>
  );
}

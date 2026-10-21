import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowLeft, CircleCheck, RotateCw, Send } from "lucide-react";
import { approvePlan, resendPlanEmail, retryPlan } from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { NeedsDatabase, Notice, Panel, PlanDelivery, PlanStatusBadge } from "@/components/beheer/ui";
import { PlanDocument } from "@/components/plan/PlanDocument";
import { adminData, adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { deliveryDeadline } from "@/lib/delivery";
import { formatDateTime } from "@/lib/format";
import { intakeLabels } from "@/i18n/options";

export const metadata: Metadata = { title: "Schema" };

export default function SchemaPage({ params, searchParams }: PageProps<"/beheer/schemas/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <PlanDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PlanDetail({ params, searchParams }: PageProps<"/beheer/schemas/[id]">) {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [plan, approval] = await Promise.all([adminData().plan(id), adminData().approvalRequired()]);
  if (!plan) notFound();
  const here = `/beheer/schemas/${plan.id}`;
  const waiting = plan.status === "ready" && !plan.releasedAt;
  const labels = intakeLabels("nl");
  const allergies = [...plan.allergies.map((a) => labels.allergy[a]), ...(plan.otherAllergies ? [plan.otherAllergies] : [])];
  const facts: [string, React.ReactNode][] = [
    ["Klant", <Link key="k" href={`/beheer/klanten/${plan.customerId}`} className="font-semibold hover:underline">{plan.customerName}</Link>],
    ["Status", <span key="s"><PlanStatusBadge status={plan.status} attempts={plan.attempts} /><PlanDelivery plan={plan} approval={approval} /></span>],
    ["Aangemaakt", formatDateTime(plan.createdAt)],
    ["Klaar", plan.generatedAt ? formatDateTime(plan.generatedAt) : "–"],
    ["Klant verwacht het uiterlijk", plan.releasedAt ? "–" : formatDateTime(deliveryDeadline(plan.createdAt))],
    ["Pogingen", `${plan.attempts} van 5`],
  ];

  return (
    <>
      <Link href="/beheer/schemas" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Schema&apos;s
      </Link>
      <Notice code={typeof sp.melding === "string" ? sp.melding : undefined} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {plan.type === "voeding" ? "Voedingsschema" : "Trainingsschema"} · periode {plan.seq}
        </h1>
        <div className="flex flex-wrap gap-2">
          {waiting && approval && !plan.approvedAt && (
            <form action={approvePlan}>
              <input type="hidden" name="plan" value={plan.id} />
              <input type="hidden" name="terug" value={here} />
              <SubmitButton className="btn-primary !px-3.5 !py-2 text-sm">
                <CircleCheck className="size-4" aria-hidden /> Goedkeuren
              </SubmitButton>
            </form>
          )}
          {waiting && (
            <form action={approvePlan}>
              <input type="hidden" name="plan" value={plan.id} />
              <input type="hidden" name="nu" value="1" />
              <input type="hidden" name="terug" value={here} />
              <SubmitButton className="btn-secondary !px-3.5 !py-2 text-sm">
                <Send className="size-4" aria-hidden /> Nu naar de klant
              </SubmitButton>
            </form>
          )}
          {plan.status === "ready" && plan.releasedAt && (
            <form action={resendPlanEmail}>
              <input type="hidden" name="plan" value={plan.id} />
              <input type="hidden" name="terug" value={here} />
              <SubmitButton className="btn-secondary !px-3.5 !py-2 text-sm">
                <Send className="size-4" aria-hidden /> Mail opnieuw sturen
              </SubmitButton>
            </form>
          )}
          {plan.status !== "generating" && (
            <form action={retryPlan}>
              <input type="hidden" name="plan" value={plan.id} />
              <input type="hidden" name="terug" value={here} />
              <SubmitButton className="btn-secondary !px-3.5 !py-2 text-sm">
                <RotateCw className="size-4" aria-hidden /> Opnieuw maken
              </SubmitButton>
            </form>
          )}
        </div>
      </div>
      <Panel className="mb-6">
        <dl className="grid gap-4 p-5 text-sm sm:grid-cols-3 lg:grid-cols-6">
          {facts.map(([k, v]) => (
            <div key={k}>
              <dt className="text-muted">{k}</dt>
              <dd className="mt-0.5">{v}</dd>
            </div>
          ))}
        </dl>
        {plan.type === "voeding" && (
          <p className="border-t border-line px-5 py-3 text-sm">
            <span className="text-muted">Allergieën en intoleranties: </span>
            <strong>{allergies.length ? allergies.join(", ") : "geen opgegeven"}</strong>
            {plan.dislikes && (
              <>
                <span className="text-muted"> · Lust niet: </span>
                {plan.dislikes}
              </>
            )}
            {plan.diet && plan.diet !== "alles" && (
              <>
                <span className="text-muted"> · Eetpatroon: </span>
                {labels.diet[plan.diet]}
              </>
            )}
          </p>
        )}
        {plan.error && <p className="border-t border-line px-5 py-3 text-sm text-accent-600">Laatste fout: {plan.error}</p>}
      </Panel>
      {plan.content ? (
        <div className="rounded-2xl border border-line bg-cream p-5 sm:p-8">
          <PlanDocument
            content={plan.content}
            customerName={plan.customerName}
            generatedAt={plan.generatedAt}
            backHref="/beheer/schemas"
            backLabel="Schema's"
            preview={isDemoMode()}
            pdfHref={`/beheer/schemas/${plan.id}/pdf`}
            shoppingPdfHref={plan.content.type === "voeding" ? `/beheer/schemas/${plan.id}/pdf?deel=boodschappen` : undefined}
          />
        </div>
      ) : (
        <p className="rounded-2xl border border-line bg-white p-8 text-center text-muted">Dit schema heeft nog geen inhoud.</p>
      )}
    </>
  );
}

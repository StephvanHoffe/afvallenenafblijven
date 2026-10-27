import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { Suspense } from "react";
import { connection } from "next/server";
import { CircleCheck, RotateCw } from "lucide-react";
import { approvePlan, retryPlan } from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { EmptyRow, FilterTabs, NeedsDatabase, Notice, PageTitle, Panel, PlanDelivery, PlanStatusBadge, table } from "@/components/beheer/ui";
import { adminData, adminDataAvailable, type AdminPlanFilter } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Schema's" };
// Voor "Opnieuw maken" en een nieuwe periode starten: het schema wordt direct gemaakt (kan meer dan 5 minuten duren).
export const maxDuration = 800;

const FILTERS: AdminPlanFilter[] = ["ready", "gepland", "goedkeuren", "generating", "pending", "failed"];

export default function SchemasPage({ searchParams }: PageProps<"/beheer/schemas">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <Plans searchParams={searchParams} />
    </Suspense>
  );
}

async function Plans({ searchParams }: Pick<PageProps<"/beheer/schemas">, "searchParams">) {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const sp = await searchParams;
  const status = FILTERS.find((s) => s === sp.status);
  const [rows, approval] = await Promise.all([adminData().plans(status), adminData().approvalRequired()]);
  const here = status ? `/beheer/schemas?status=${status}` : "/beheer/schemas";

  return (
    <>
      <Notice code={typeof sp.melding === "string" ? sp.melding : undefined} />
      <PageTitle
        title="Schema's"
        intro={`Alle gemaakte schema's. Een nieuw schema gaat op een willekeurig moment binnen 2 uur naar de klant${approval ? ", nadat jij het hebt goedgekeurd" : ""}. Mislukte schema's worden automatisch opnieuw geprobeerd (maximaal 5 keer, steeds iets later).`}
      >
        <FilterTabs
          base="/beheer/schemas"
          current={status}
          options={[
            { label: "Alle" },
            { value: "ready", label: "Klaar" },
            { value: "gepland", label: "Nog niet bij klant" },
            ...(approval ? [{ value: "goedkeuren", label: "Goedkeuren" }] : []),
            { value: "generating", label: "Wordt gemaakt" },
            { value: "pending", label: "In wachtrij" },
            { value: "failed", label: "Mislukt" },
          ]}
        />
      </PageTitle>
      <Panel>
        <div className={table.wrap}>
          <table className={table.table}>
            <thead>
              <tr>
                <th className={table.th}>Schema</th>
                <th className={table.th}>Klant</th>
                <th className={table.th}>Status</th>
                <th className={table.th}>Aangemaakt</th>
                <th className={table.th}>
                  <span className="sr-only">Acties</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={5}>Geen schema&apos;s.</EmptyRow>}
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-sand/50">
                  <td className={table.td}>
                    <Link href={`/beheer/schemas/${p.id}`} className="font-semibold hover:underline">
                      {p.type === "voeding" ? "Voeding" : "Training"} · periode {p.seq}
                    </Link>
                    {p.error && <span className="block max-w-xs truncate text-xs text-accent-600">{p.error}</span>}
                  </td>
                  <td className={table.td}>
                    <Link href={`/beheer/klanten/${p.customerId}`} className="hover:underline">
                      {p.customerName}
                    </Link>
                  </td>
                  <td className={table.td}>
                    <PlanStatusBadge status={p.status} attempts={p.attempts} />
                    <PlanDelivery plan={p} approval={approval} />
                  </td>
                  <td className={`${table.td} ${table.num}`}>{formatDate(p.createdAt)}</td>
                  <td className={`${table.td} text-right`}>
                    {approval && p.status === "ready" && !p.releasedAt && !p.approvedAt && (
                      <form action={approvePlan}>
                        <input type="hidden" name="plan" value={p.id} />
                        <input type="hidden" name="terug" value={here} />
                        <SubmitButton className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                          <CircleCheck className="size-3.5" aria-hidden /> Goedkeuren
                        </SubmitButton>
                      </form>
                    )}
                    {p.status === "failed" && (
                      <form action={retryPlan}>
                        <input type="hidden" name="plan" value={p.id} />
                        <input type="hidden" name="terug" value={here} />
                        <SubmitButton className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                          <RotateCw className="size-3.5" aria-hidden /> Opnieuw maken
                        </SubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

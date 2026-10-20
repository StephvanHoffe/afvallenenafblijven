import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { Suspense } from "react";
import { connection } from "next/server";
import { RotateCw } from "lucide-react";
import { retryPlan } from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { EmptyRow, FilterTabs, NeedsDatabase, Notice, PageTitle, Panel, PlanStatusBadge, table } from "@/components/beheer/ui";
import { adminData, adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { formatDate } from "@/lib/format";
import type { PlanStatus } from "@/lib/repo";

export const metadata: Metadata = { title: "Schema's" };

const STATUSES: PlanStatus[] = ["ready", "generating", "pending", "failed"];

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
  const status = STATUSES.find((s) => s === sp.status);
  const rows = await adminData().plans(status);
  const here = status ? `/beheer/schemas?status=${status}` : "/beheer/schemas";

  return (
    <>
      <Notice code={typeof sp.melding === "string" ? sp.melding : undefined} />
      <PageTitle title="Schema's" intro="Alle gemaakte schema's. Mislukte schema's worden dagelijks automatisch opnieuw geprobeerd (maximaal 5 keer).">
        <FilterTabs
          base="/beheer/schemas"
          current={status}
          options={[
            { label: "Alle" },
            { value: "ready", label: "Klaar" },
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
                <th className={table.th}>Gemaild</th>
                <th className={table.th}>
                  <span className="sr-only">Acties</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={6}>Geen schema&apos;s.</EmptyRow>}
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
                  </td>
                  <td className={`${table.td} ${table.num}`}>{formatDate(p.createdAt)}</td>
                  <td className={`${table.td} ${table.num}`}>{p.emailedAt ? formatDate(p.emailedAt) : "–"}</td>
                  <td className={`${table.td} text-right`}>
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

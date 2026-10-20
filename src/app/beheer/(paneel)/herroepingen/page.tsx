import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { markWithdrawalHandled } from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Badge, EmptyRow, NeedsDatabase, Notice, PageTitle, Panel, table } from "@/components/beheer/ui";
import { adminData, adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Herroepingen" };

export default function HerroepingenPage({ searchParams }: PageProps<"/beheer/herroepingen">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <Withdrawals searchParams={searchParams} />
    </Suspense>
  );
}

async function Withdrawals({ searchParams }: Pick<PageProps<"/beheer/herroepingen">, "searchParams">) {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const [rows, sp] = await Promise.all([adminData().withdrawals(), searchParams]);

  return (
    <>
      <Notice code={typeof sp.melding === "string" ? sp.melding : undefined} />
      <PageTitle
        title="Herroepingen"
        intro="Verklaringen via de herroepingsfunctie op de website. De klant heeft direct een ontvangstbevestiging gekregen. Beoordeel of het herroepingsrecht nog gold, betaal zo nodig terug in Stripe en laat het de klant weten."
      />
      <Panel>
        <div className={table.wrap}>
          <table className={table.table}>
            <thead>
              <tr>
                <th className={table.th}>Ontvangen</th>
                <th className={table.th}>Klant</th>
                <th className={table.th}>Bestelling</th>
                <th className={table.th}>Toelichting</th>
                <th className={table.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={5}>Geen herroepingen ontvangen.</EmptyRow>}
              {rows.map((w) => (
                <tr key={w.id}>
                  <td className={`${table.td} ${table.num}`}>{formatDate(w.createdAt)}</td>
                  <td className={table.td}>
                    <span className="font-semibold">{w.name}</span>
                    <span className="block text-xs text-muted">{w.email}</span>
                  </td>
                  <td className={table.td}>{w.orderReference}</td>
                  <td className={`${table.td} max-w-xs text-muted`}>{w.message ?? "–"}</td>
                  <td className={table.td}>
                    {w.handledAt ? (
                      <Badge tone="ok">Afgehandeld {formatDate(w.handledAt)}</Badge>
                    ) : (
                      <form action={markWithdrawalHandled}>
                        <input type="hidden" name="herroeping" value={w.id} />
                        <input type="hidden" name="terug" value="/beheer/herroepingen" />
                        <SubmitButton className="btn-secondary !px-3 !py-1.5 text-xs">Markeer als afgehandeld</SubmitButton>
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

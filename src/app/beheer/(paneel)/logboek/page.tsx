import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { Suspense } from "react";
import { connection } from "next/server";
import { EmptyRow, NeedsDatabase, PageTitle, Panel, table } from "@/components/beheer/ui";
import { adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { adminLog } from "@/lib/admin/insights";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Logboek" };

export default function LogboekPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <Log />
    </Suspense>
  );
}

async function Log() {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const rows = await adminLog(300);

  return (
    <>
      <PageTitle
        title="Logboek"
        intro="Alles wat in het beheer is gedaan: opzeggingen, terugbetalingen, aangepaste mails, kortingscodes, exports en instellingen. Wordt 24 maanden bewaard."
      />
      <Panel>
        <div className={table.wrap}>
          <table className={table.table}>
            <thead>
              <tr>
                <th className={table.th}>Moment</th>
                <th className={table.th}>Actie</th>
                <th className={table.th}>Details</th>
                <th className={table.th}>Klant</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={4}>Nog niets gedaan in het beheer.</EmptyRow>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className={`${table.td} ${table.num} whitespace-nowrap`}>{formatDateTime(r.createdAt)}</td>
                  <td className={`${table.td} font-semibold`}>{r.action}</td>
                  <td className={`${table.td} max-w-md break-words text-muted`}>{r.details ?? "–"}</td>
                  <td className={table.td}>
                    {r.customerId ? (
                      <Link href={`/beheer/klanten/${r.customerId}`} className="font-semibold text-brand-700 hover:underline">
                        Bekijk klant
                      </Link>
                    ) : (
                      "–"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-3 text-xs text-muted">
          Automatische acties (schema&apos;s maken, mails versturen) staan niet hier maar in de schema-lijst en het e-maillog.
        </p>
      </Panel>
    </>
  );
}

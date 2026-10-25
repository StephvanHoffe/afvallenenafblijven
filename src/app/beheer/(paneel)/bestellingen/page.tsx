import { describeCampaign } from "@/lib/campaign";
import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Badge, EmptyRow, FilterTabs, NeedsDatabase, Notice, OrderStatusBadge, PageTitle, Panel, planName, table } from "@/components/beheer/ui";
import { adminData, adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { euro, formatDate } from "@/lib/format";
import type { OrderStatus } from "@/lib/repo";
import { cancelReasonLabel } from "@/lib/cancel-reasons";
import { exportHref } from "@/lib/admin/export";
import { Download } from "lucide-react";

export const metadata: Metadata = { title: "Bestellingen" };

const STATUSES: OrderStatus[] = ["active", "past_due", "canceled", "completed"];

export default function BestellingenPage({ searchParams }: PageProps<"/beheer/bestellingen">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <Orders searchParams={searchParams} />
    </Suspense>
  );
}

async function Orders({ searchParams }: Pick<PageProps<"/beheer/bestellingen">, "searchParams">) {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status);
  const rows = await adminData().orders(status);

  return (
    <>
      <Notice code={typeof sp.melding === "string" ? sp.melding : undefined} />
      <PageTitle title="Bestellingen" intro="Abonnementen en losse aankopen. Betalingen staan ook in Mollie; facturen vind je bij de klant onder Betalingen.">
        <a href={exportHref("bestellingen", { status })} className="btn-secondary !px-3.5 !py-2 text-sm">
          <Download className="size-4" aria-hidden /> Exporteer (CSV)
        </a>
        <FilterTabs
          base="/beheer/bestellingen"
          current={status}
          options={[
            { label: "Alle" },
            { value: "active", label: "Actief" },
            { value: "past_due", label: "Betaling mislukt" },
            { value: "canceled", label: "Beëindigd" },
            { value: "completed", label: "Los schema" },
          ]}
        />
      </PageTitle>
      <Panel>
        <div className={table.wrap}>
          <table className={table.table}>
            <thead>
              <tr>
                <th className={table.th}>Bestelling</th>
                <th className={table.th}>Klant</th>
                <th className={table.th}>Plan · bron</th>
                <th className={table.th}>Status</th>
                <th className={`${table.th} text-right`}>Eerste betaling</th>
                <th className={`${table.th} text-right`}>Per maand</th>
                <th className={table.th}>Datum</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={7}>Geen bestellingen.</EmptyRow>}
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-sand/50">
                  <td className={`${table.td} font-mono text-xs`}>#{o.reference}</td>
                  <td className={table.td}>
                    <Link href={`/beheer/klanten/${o.customerId}`} className="font-semibold hover:underline">
                      {o.customerName}
                    </Link>
                    <span className="block text-xs text-muted">{o.customerEmail}</span>
                  </td>
                  <td className={table.td}>
                    {planName(o.product, o.duration)}
                    {o.campaign && <span className="block text-xs text-muted">{describeCampaign(o.campaign)}</span>}
                    {o.discountCode && (
                      <span className="mt-1 inline-block">
                        <Badge tone="info">Code {o.discountCode}</Badge>
                      </span>
                    )}
                  </td>
                  <td className={table.td}>
                    <OrderStatusBadge status={o.status} cancelAt={o.cancelAt} />
                    {(o.cancelReason || o.cancelComment) && (
                      <span className="mt-1 block max-w-48 text-xs text-muted" title={o.cancelComment ?? undefined}>
                        {cancelReasonLabel(o.cancelReason)}
                      </span>
                    )}
                  </td>
                  <td className={`${table.td} text-right ${table.num}`}>
                    {euro(o.amountCents)}
                    {o.refundedCents > 0 && <span className="block text-xs font-semibold text-accent-600">{euro(o.refundedCents)} terug</span>}
                  </td>
                  <td className={`${table.td} text-right ${table.num}`}>{o.monthlyCents ? euro(o.monthlyCents) : "–"}</td>
                  <td className={`${table.td} ${table.num}`}>{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

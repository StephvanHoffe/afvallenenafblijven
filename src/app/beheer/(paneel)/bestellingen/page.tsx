import { describeCampaign } from "@/lib/campaign";
import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { Suspense } from "react";
import { connection } from "next/server";
import { EmptyRow, FilterTabs, NeedsDatabase, Notice, OrderStatusBadge, PageTitle, Panel, planName, table } from "@/components/beheer/ui";
import { adminData, adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { euro, formatDate } from "@/lib/format";
import type { OrderStatus } from "@/lib/repo";

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
      <PageTitle title="Bestellingen" intro="Abonnementen en losse aankopen. Betalingen en facturen staan in Stripe.">
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
                  </td>
                  <td className={table.td}>
                    <OrderStatusBadge status={o.status} cancelAt={o.cancelAt} />
                  </td>
                  <td className={`${table.td} text-right ${table.num}`}>{euro(o.amountCents)}</td>
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

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowRight, CircleAlert } from "lucide-react";
import { OrdersChart } from "@/components/beheer/OrdersChart";
import { NeedsDatabase, Notice, OrderStatusBadge, Panel, StatTile, planName, table } from "@/components/beheer/ui";
import { durations, products } from "@/config/pricing";
import { adminData, adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { euro, formatDate, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Overzicht" };

export default function OverzichtPage({ searchParams }: PageProps<"/beheer">) {
  return (
    <Suspense fallback={<Loading />}>
      <Overview searchParams={searchParams} />
    </Suspense>
  );
}

async function Overview({ searchParams }: Pick<PageProps<"/beheer">, "searchParams">) {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const [o, sp] = await Promise.all([adminData().overview(), searchParams]);
  const conversion = o.checkoutStarts30 > 0 ? Math.round((o.newOrders30 / o.checkoutStarts30) * 100) : null;
  const attention = o.plansFailed + o.openWithdrawals;
  const mixTotal = o.productMix.reduce((s, m) => s + m.count, 0);

  return (
    <>
      <Notice code={typeof sp.melding === "string" ? sp.melding : undefined} />
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Overzicht</h1>
        <p className="mt-1 text-[0.9375rem] text-muted">Abonnementen, omzet en schema&apos;s in één oogopslag.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Terugkerende omzet per maand"
          value={euro(o.mrrCents)}
          hint={`${o.activeSubscriptions} actieve abonnementen, incl. btw`}
        />
        <StatTile
          label="Nieuwe bestellingen"
          value={formatNumber(o.newOrders30)}
          hint={`Laatste 30 dagen · ${euro(o.firstPayments30Cents)} eerste betalingen`}
        />
        <StatTile
          label="Conversie afrekenen"
          value={conversion === null ? "–" : `${conversion}%`}
          hint={`${o.newOrders30} van ${o.checkoutStarts30} gestarte betalingen (30 dagen)`}
        />
        <StatTile
          label="Aandacht nodig"
          value={formatNumber(attention)}
          tone={attention > 0 ? "warn" : "default"}
          hint={`${o.plansFailed} mislukte schema's · ${o.openWithdrawals} open herroepingen`}
        />
      </div>

      {attention > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {o.plansFailed > 0 && (
            <Link href="/beheer/schemas?status=failed" className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3.5 py-1.5 text-sm font-bold text-accent-600">
              <CircleAlert className="size-4" aria-hidden /> {o.plansFailed} mislukte schema&apos;s bekijken
            </Link>
          )}
          {o.openWithdrawals > 0 && (
            <Link href="/beheer/herroepingen" className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-1.5 text-sm font-bold text-amber-800">
              <CircleAlert className="size-4" aria-hidden /> {o.openWithdrawals} herroeping{o.openWithdrawals === 1 ? "" : "en"} afhandelen
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Nieuwe bestellingen per dag (laatste 30 dagen)">
          <div className="p-5">
            <OrdersChart data={o.ordersPerDay} />
          </div>
        </Panel>
        <Panel title="Actieve abonnementen per plan">
          <ul className="divide-y divide-line">
            {o.productMix.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted">Nog geen actieve abonnementen.</li>}
            {o.productMix.map((m) => (
              <li key={`${m.product}-${m.duration}`} className="px-5 py-3">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold">
                    {products[m.product].shortName} · {m.duration === "1m" ? "per maand" : `min. ${durations[m.duration].label}`}
                  </span>
                  <span className="font-bold tabular-nums">{m.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-brand-50" aria-hidden>
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${(m.count / mixTotal) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-3 border-t border-line p-5 text-sm">
            <div>
              <p className="text-muted">Schema&apos;s gemaakt (30 dagen)</p>
              <p className="text-lg font-extrabold tabular-nums">{o.plansReady30}</p>
            </div>
            <div>
              <p className="text-muted">Opgezegd, loopt nog</p>
              <p className="text-lg font-extrabold tabular-nums">{o.pendingCancellations}</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Laatste bestellingen"
        className="mt-6"
        action={
          <Link href="/beheer/bestellingen" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700">
            Alles <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      >
        <div className={table.wrap}>
          <table className={table.table}>
            <thead>
              <tr>
                <th className={table.th}>Klant</th>
                <th className={table.th}>Plan</th>
                <th className={table.th}>Status</th>
                <th className={`${table.th} text-right`}>Per maand</th>
                <th className={table.th}>Datum</th>
              </tr>
            </thead>
            <tbody>
              {o.recentOrders.map((r) => (
                <tr key={r.id} className="hover:bg-sand/50">
                  <td className={table.td}>
                    <Link href={`/beheer/klanten/${r.customerId}`} className="font-semibold hover:underline">
                      {r.customerName}
                    </Link>
                    <span className="block text-xs text-muted">{r.customerEmail}</span>
                  </td>
                  <td className={table.td}>{planName(r.product, r.duration)}</td>
                  <td className={table.td}>
                    <OrderStatusBadge status={r.status} cancelAt={r.cancelAt} />
                  </td>
                  <td className={`${table.td} text-right ${table.num}`}>{r.monthlyCents ? euro(r.monthlyCents) : "–"}</td>
                  <td className={`${table.td} ${table.num}`}>{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-8 w-48 rounded-xl bg-line" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-white" />
    </div>
  );
}

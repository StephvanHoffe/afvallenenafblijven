import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { ColumnChart } from "@/components/beheer/Charts";
import { EmptyRow, Meter, NeedsDatabase, PageTitle, Panel, StatTile, pct, table } from "@/components/beheer/ui";
import { durations, products } from "@/config/pricing";
import { adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { analyticsReport } from "@/lib/admin/analytics-report";
import { catalogEntry } from "@/lib/admin/mail-catalog";
import { cancelReasonLabel } from "@/lib/cancel-reasons";
import { euro, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Analyse" };

export default function AnalysePage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <Analyse />
    </Suspense>
  );
}

const monthLabel = (key: string, long = false) =>
  new Intl.DateTimeFormat("nl-NL", long ? { month: "long", year: "numeric" } : { month: "short" }).format(new Date(`${key}-15T12:00:00`));

function Fact({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="text-lg font-extrabold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

async function Analyse() {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const r = await analyticsReport();
  const k = r.kpis;
  const mixMax = Math.max(1, ...r.mix.map((m) => m.count));
  const reasonsTotal = r.cancelReasons.reduce((s, c) => s + c.count, 0);
  const reasonsMax = Math.max(1, ...r.cancelReasons.map((c) => c.count));
  const cohortCols = Array.from({ length: 12 }, (_, i) => i);

  return (
    <>
      <PageTitle title="Analyse" intro="Omzet, abonnementen, behoud en hoe klanten hun schema gebruiken." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Terugkerende omzet (MRR)" value={euro(k.mrrCents)} hint={`${formatNumber(k.activeSubs)} actieve abonnementen, incl. btw`} />
        <StatTile label="Gemiddeld per abonnee" value={k.arpuCents === null ? "–" : euro(k.arpuCents)} hint="Per maand (ARPU)" />
        <StatTile
          label="Opzeggingen (30 dagen)"
          value={k.churn30 === null ? "–" : pct(k.churn30, 1, 1)}
          tone={k.churn30 !== null && k.churn30 > 0.1 ? "warn" : "default"}
          hint="Aandeel abonnementen dat in 30 dagen stopte"
        />
        <StatTile
          label="Waarde per klant (LTV)"
          value={k.ltvCents === null ? "–" : euro(k.ltvCents)}
          hint={k.avgLifetimeMonths === null ? "Nog te weinig opzeggingen om te schatten" : `Gem. ${formatNumber(k.avgLifetimeMonths, 1)} maanden × ARPU`}
        />
        <StatTile label="Omzet (30 dagen)" value={euro(k.revenue30Cents)} hint={r.paymentsTracked ? "Ontvangen betalingen" : "Geschat uit de abonnementen"} />
        <StatTile
          label="Terugbetaald (30 dagen)"
          value={euro(k.refunds30Cents)}
          hint={`${formatNumber(k.guaranteeRequests30)} garantie-aanvra${k.guaranteeRequests30 === 1 ? "ag" : "gen"}`}
        />
        <StatTile label="Nieuwe klanten (30 dagen)" value={formatNumber(k.newCustomers30)} />
        <StatTile
          label="Conversie (30 dagen)"
          value={k.conversion30 === null ? "–" : pct(k.conversion30, 1, 1)}
          hint={`Bestellingen per bezoek · ${formatNumber(k.visits30)} bezoeken`}
        />
      </div>

      {!r.paymentsTracked && (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Er zijn nog geen betalingen vastgelegd, dus de omzet is een schatting op basis van de abonnementen. Betalingen komen binnen via
          de Mollie-webhook; die werkt zodra de website op een openbaar adres staat (zie README).
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Omzet per maand (incl. btw)">
          <div className="p-5">
            <ColumnChart
              title="Omzet per maand"
              unit="omzet"
              format="euro"
              labelEvery={1}
              points={r.months.map((m) => ({ key: m.month, label: monthLabel(m.month), longLabel: monthLabel(m.month, true), value: m.revenueCents - m.refundsCents }))}
            />
          </div>
          <p className="border-t border-line px-5 py-3 text-xs text-muted">Na aftrek van terugbetalingen.{r.months[0]?.estimated ? " Geschat." : ""}</p>
        </Panel>
        <Panel title="Terugkerende omzet (MRR) aan het eind van de maand">
          <div className="p-5">
            <ColumnChart
              title="MRR per maand"
              unit="MRR"
              format="euro"
              labelEvery={1}
              points={r.months.map((m) => ({ key: m.month, label: monthLabel(m.month), longLabel: monthLabel(m.month, true), value: m.mrrCents }))}
            />
          </div>
        </Panel>
      </div>

      <Panel title="Abonnementen per maand" className="mt-6">
        <div className={table.wrap}>
          <table className={table.table}>
            <thead>
              <tr>
                <th className={table.th}>Maand</th>
                <th className={`${table.th} text-right`}>Nieuw</th>
                <th className={`${table.th} text-right`}>Beëindigd</th>
                <th className={`${table.th} text-right`}>Netto</th>
                <th className={`${table.th} text-right`}>Actief (eind)</th>
                <th className={`${table.th} text-right`}>Losse schema&apos;s</th>
                <th className={`${table.th} text-right`}>Omzet</th>
              </tr>
            </thead>
            <tbody>
              {[...r.months].reverse().map((m) => (
                <tr key={m.month}>
                  <td className={`${table.td} font-semibold capitalize`}>{monthLabel(m.month, true)}</td>
                  <td className={`${table.td} ${table.num} text-right`}>{formatNumber(m.newSubs)}</td>
                  <td className={`${table.td} ${table.num} text-right`}>{formatNumber(m.endedSubs)}</td>
                  <td className={`${table.td} ${table.num} text-right font-bold ${m.newSubs - m.endedSubs < 0 ? "text-accent-600" : ""}`}>
                    {m.newSubs - m.endedSubs > 0 ? "+" : ""}
                    {formatNumber(m.newSubs - m.endedSubs)}
                  </td>
                  <td className={`${table.td} ${table.num} text-right`}>{formatNumber(m.activeEnd)}</td>
                  <td className={`${table.td} ${table.num} text-right`}>{formatNumber(m.oneOffs)}</td>
                  <td className={`${table.td} ${table.num} text-right`}>{euro(m.revenueCents - m.refundsCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Behoud per startmaand (cohorten)" className="mt-6">
        <div className={table.wrap}>
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead>
              <tr>
                <th className={table.th}>Gestart in</th>
                <th className={`${table.th} text-right`}>Klanten</th>
                {cohortCols.map((c) => (
                  <th key={c} className={`${table.th} text-center`}>
                    M{c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...r.cohorts].reverse().map((c) => (
                <tr key={c.month}>
                  <td className={`${table.td} font-semibold capitalize`}>{monthLabel(c.month, true)}</td>
                  <td className={`${table.td} ${table.num} text-right`}>{formatNumber(c.size)}</td>
                  {cohortCols.map((i) => {
                    const v = c.retention[i];
                    return (
                      <td key={i} className="border-b border-line p-0.5 text-center">
                        {v === null || c.size === 0 ? (
                          <span className="block py-2 text-xs text-muted/50">·</span>
                        ) : (
                          <span
                            className={`block rounded-[4px] py-2 text-xs font-bold tabular-nums ${v > 0.55 ? "text-white" : "text-ink"}`}
                            style={{ background: `rgba(28, 122, 72, ${0.08 + v * 0.92})` }}
                            title={`${monthLabel(c.month, true)}, na ${i} maanden: ${pct(v, 1)} nog actief`}
                          >
                            {pct(v, 1)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-3 text-xs text-muted">
          Aandeel van de klanten die in die maand hun eerste abonnement startten, dat na 0, 1, 2, … maanden nog een actief abonnement heeft.
          Let op de daling na 3 maanden: dan loopt de minimale looptijd van de meeste abonnementen af.
        </p>
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Verkochte plannen (12 maanden)">
          <ul className="divide-y divide-line">
            {r.mix.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted">Nog geen bestellingen.</li>}
            {r.mix.map((m) => (
              <li key={`${m.product}-${m.duration}`} className="px-5 py-3">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold">
                    {products[m.product].shortName} · {m.duration === "eenmalig" ? "los" : m.duration === "1m" ? "per maand" : `min. ${durations[m.duration].label}`}
                  </span>
                  <span className="font-bold tabular-nums">{formatNumber(m.count)}</span>
                </div>
                <div className="mt-1.5">
                  <Meter value={m.count} max={mixMax} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Waarom zeggen klanten op?">
          <ul className="divide-y divide-line">
            {r.cancelReasons.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted">Nog geen opzeggingen met een reden.</li>}
            {r.cancelReasons.map((c) => (
              <li key={c.reason} className="px-5 py-3">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold">{cancelReasonLabel(c.reason)}</span>
                  <span className="tabular-nums">
                    <span className="font-bold">{formatNumber(c.count)}</span> <span className="text-muted">({pct(c.count, reasonsTotal)})</span>
                  </span>
                </div>
                <div className="mt-1.5">
                  <Meter value={c.count} max={reasonsMax} />
                </div>
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-5 py-3 text-xs text-muted">Uit het opzegformulier in Mijn schema&apos;s (de reden is optioneel). Toelichtingen staan bij Feedback.</p>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Betrokkenheid">
          <div className="grid grid-cols-2 gap-4 p-5">
            <Fact label="Check-ins (90 dagen)" value={formatNumber(r.engagement.checkins90)} hint={`${pct(r.engagement.checkinsOnTime90, r.engagement.checkins90)} op tijd (vóór maandag)`} />
            <Fact label="Check-in staat open" value={formatNumber(r.engagement.checkinsOpen)} hint={`${formatNumber(r.engagement.checkinsOverdue)} verlopen`} />
            <Fact
              label="Weegmomenten (30 dagen)"
              value={formatNumber(r.engagement.weekly30)}
              hint={k.activeSubs ? `${formatNumber(r.engagement.weekly30 / k.activeSubs, 1)} per abonnee` : undefined}
            />
            <Fact label="Herinneringen uitgezet" value={formatNumber(r.engagement.weeklyOptOut)} hint="Weegmoment-mails" />
            <Fact
              label="Gekoppelde apps"
              value={formatNumber(r.engagement.healthConnections.reduce((s, h) => s + h.count, 0))}
              hint={r.engagement.healthConnections.map((h) => `${h.provider}: ${h.count}`).join(" · ") || "Nog geen koppelingen"}
            />
          </div>
        </Panel>
        <Panel title="Resultaten van klanten (afvallen)">
          <div className="grid grid-cols-2 gap-4 p-5">
            <Fact label="Klanten met metingen" value={formatNumber(r.results.customers)} />
            <Fact
              label="Gemiddelde verandering"
              value={r.results.avgChangeKg === null ? "–" : `${r.results.avgChangeKg > 0 ? "+" : ""}${formatNumber(r.results.avgChangeKg, 1)} kg`}
              hint={r.results.avgWeeks === null ? undefined : `Na gemiddeld ${formatNumber(r.results.avgWeeks, 1)} weken`}
            />
            <Fact label="Viel af" value={r.results.lostShare === null ? "–" : pct(r.results.lostShare, 1)} hint="Laatste weging lager dan bij de start" />
            <Fact label="Streefgewicht bereikt" value={formatNumber(r.results.reachedTarget)} />
          </div>
          <p className="border-t border-line px-5 py-3 text-xs text-muted">
            Alleen voor intern gebruik. Gebruik deze cijfers niet als belofte in advertenties zonder onderbouwing (zie de disclaimers).
          </p>
        </Panel>
        <Panel title="Schema's (30 dagen)">
          <div className="grid grid-cols-2 gap-4 p-5">
            <Fact label="Gemaakt" value={formatNumber(r.plans.generated30)} hint={`${formatNumber(r.plans.failed)} definitief mislukt (alle tijd)`} />
            <Fact
              label="Duur per schema"
              value={r.plans.avgGenerateMinutes === null ? "–" : `${formatNumber(r.plans.avgGenerateMinutes, 1)} min`}
              hint={r.plans.avgAttempts === null ? undefined : `${formatNumber(r.plans.avgAttempts, 2)} pogingen gemiddeld`}
            />
            <Fact
              label="Bij de klant na"
              value={r.plans.avgDeliveryMinutes === null ? "–" : `${formatNumber(r.plans.avgDeliveryMinutes)} min`}
              hint="Gemiddeld, vanaf betaling of check-in"
            />
            <Fact
              label="Jouw beoordeling"
              value={r.plans.avgRating === null ? "–" : `${formatNumber(r.plans.avgRating, 1)} / 5`}
              hint={`${formatNumber(r.plans.rated)} beoordeeld`}
            />
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="E-mails (30 dagen)">
          <div className={table.wrap}>
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead>
                <tr>
                  <th className={table.th}>Mail</th>
                  <th className={`${table.th} text-right`}>Verstuurd</th>
                  <th className={`${table.th} text-right`}>Mislukt</th>
                </tr>
              </thead>
              <tbody>
                {r.emails.length === 0 && <EmptyRow colSpan={3}>Nog geen e-mails verstuurd.</EmptyRow>}
                {r.emails.map((e) => (
                  <tr key={e.kind}>
                    <td className={`${table.td} font-semibold`}>{e.kind === "admin" ? "Meldingen aan jou" : (catalogEntry(e.kind)?.label ?? e.kind)}</td>
                    <td className={`${table.td} ${table.num} text-right`}>{formatNumber(e.sent)}</td>
                    <td className={`${table.td} ${table.num} text-right ${e.failed ? "font-bold text-accent-600" : ""}`}>{formatNumber(e.failed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Kortingscodes">
          <div className={table.wrap}>
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead>
                <tr>
                  <th className={table.th}>Code</th>
                  <th className={`${table.th} text-right`}>Bestellingen</th>
                  <th className={`${table.th} text-right`}>Eerste betalingen</th>
                </tr>
              </thead>
              <tbody>
                {r.discounts.length === 0 && <EmptyRow colSpan={3}>Nog geen bestellingen met een kortingscode.</EmptyRow>}
                {r.discounts.map((d) => (
                  <tr key={d.code}>
                    <td className={`${table.td} font-mono font-semibold`}>{d.code}</td>
                    <td className={`${table.td} ${table.num} text-right`}>{formatNumber(d.orders)}</td>
                    <td className={`${table.td} ${table.num} text-right`}>{euro(d.revenueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}

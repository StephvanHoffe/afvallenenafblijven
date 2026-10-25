import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Mail, TriangleAlert } from "lucide-react";
import { sendCheckoutReminderNow } from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { ColumnChart, Heatmap } from "@/components/beheer/Charts";
import { Badge, EmptyRow, Meter, NeedsDatabase, Notice, PageTitle, Panel, QueryTabs, StatTile, pct, table } from "@/components/beheer/ui";
import { durations, isDurationId, isProductId, products } from "@/config/pricing";
import { adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { funnelReport, type FunnelBreakdownRow } from "@/lib/admin/funnel-report";
import { checkoutReminderSettings } from "@/lib/settings";
import { describeCampaign } from "@/lib/campaign";
import { formatDateTime, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Funnel" };

const RANGES = [7, 30, 90];

export default function FunnelPage({ searchParams }: PageProps<"/beheer/funnel">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <Funnel searchParams={searchParams} />
    </Suspense>
  );
}

const planLabel = (product: string | null, duration: string | null) => {
  const p = product && isProductId(product) ? products[product].shortName : (product ?? "?");
  const d = duration && isDurationId(duration) ? (duration === "eenmalig" ? "los" : duration === "1m" ? "per maand" : `min. ${durations[duration].label}`) : "";
  return d ? `${p} · ${d}` : p;
};

function BreakdownTable({ title, rows, labelFor }: { title: string; rows: FunnelBreakdownRow[]; labelFor: (key: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.visits));
  return (
    <Panel title={title}>
      <div className={table.wrap}>
        <table className="w-full min-w-[30rem] text-left text-sm">
          <thead>
            <tr>
              <th className={table.th}>&nbsp;</th>
              <th className={`${table.th} text-right`}>Bezoeken</th>
              <th className={`${table.th} text-right`}>Vragenlijst</th>
              <th className={`${table.th} text-right`}>Betaald</th>
              <th className={`${table.th} text-right`}>Conversie</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={5}>Nog geen bezoeken.</EmptyRow>}
            {rows.map((r) => (
              <tr key={r.key || "geen"}>
                <td className={`${table.td} w-[40%]`}>
                  <span className="font-semibold">{labelFor(r.key)}</span>
                  <span className="mt-1 block">
                    <Meter value={r.visits} max={max} />
                  </span>
                </td>
                <td className={`${table.td} ${table.num} text-right`}>{formatNumber(r.visits)}</td>
                <td className={`${table.td} ${table.num} text-right`}>{pct(r.quiz, r.visits)}</td>
                <td className={`${table.td} ${table.num} text-right`}>{formatNumber(r.orders)}</td>
                <td className={`${table.td} ${table.num} text-right font-bold`}>{pct(r.orders, r.visits, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

async function Funnel({ searchParams }: Pick<PageProps<"/beheer/funnel">, "searchParams">) {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const sp = await searchParams;
  const days = RANGES.find((d) => String(d) === sp.dagen) ?? 30;
  const source = typeof sp.bron === "string" ? (sp.bron === "direct" ? "" : sp.bron) : null;
  const device = typeof sp.apparaat === "string" && ["mobiel", "tablet", "desktop"].includes(sp.apparaat) ? sp.apparaat : null;
  const [r, reminder] = await Promise.all([
    funnelReport({ days, source, device }),
    isDemoMode() ? Promise.resolve({ enabled: true, delayHours: 3 }) : checkoutReminderSettings(),
  ]);
  const params = { dagen: String(days), bron: typeof sp.bron === "string" ? sp.bron : undefined, apparaat: device ?? undefined };
  const here = `/beheer/funnel?${new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString()}`;
  const top = r.stages[0]?.count ?? 0;
  // Grootste afhaakmoment tussen twee opeenvolgende stappen.
  const drops = r.stages.slice(1).map((s, i) => ({ key: s.key, lost: r.stages[i].count - s.count, rate: r.stages[i].count ? 1 - s.count / r.stages[i].count : 0 }));
  const worst = drops.filter((d) => d.key !== "visits").sort((a, b) => b.lost - a.lost)[0];
  const purchases = r.stages.find((s) => s.key === "purchase")?.count ?? 0;
  const stepMax = Math.max(1, ...r.steps.map((s) => s.reached));
  const leftMax = Math.max(1, ...r.steps.map((s) => s.leftHere));
  const sourceLabel = (k: string) => (k === "" ? "Direct / geen campagne" : k);
  const fmtDay = (iso: string, long = false) =>
    new Intl.DateTimeFormat("nl-NL", long ? { weekday: "long", day: "numeric", month: "long" } : { day: "numeric", month: "short" }).format(new Date(`${iso}T12:00:00`));

  return (
    <>
      <Notice code={typeof sp.melding === "string" ? sp.melding : undefined} />
      <PageTitle
        title="Funnel"
        intro="Waar en wanneer bezoekers afhaken, van eerste bezoek tot betaling. Anoniem gemeten, zonder cookies en zonder persoonsgegevens; bezoekers met Do Not Track tellen niet mee."
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <QueryTabs base="/beheer/funnel" param="dagen" current={String(days)} params={params} label="Periode" options={RANGES.map((d) => ({ value: String(d), label: `${d} dagen` }))} />
        <QueryTabs
          base="/beheer/funnel"
          param="apparaat"
          current={device}
          params={params}
          label="Apparaat"
          options={[{ label: "Alle apparaten" }, { value: "mobiel", label: "Mobiel" }, { value: "desktop", label: "Desktop" }, { value: "tablet", label: "Tablet" }]}
        />
        <QueryTabs
          base="/beheer/funnel"
          param="bron"
          current={typeof sp.bron === "string" ? sp.bron : null}
          params={params}
          label="Bron"
          options={[{ label: "Alle bronnen" }, ...r.sources.map((s) => ({ value: s, label: s })), { value: "direct", label: "Direct" }]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Bezoeken" value={formatNumber(top)} hint={`Laatste ${days} dagen`} />
        <StatTile label="Conversie bezoek → betaald" value={pct(purchases, top, 1)} hint={`${formatNumber(purchases)} betaald (gemeten) · ${formatNumber(r.ordersTotal)} bestellingen in totaal`} />
        <StatTile
          label="Tijd tot betalen"
          value={r.medianMinutesToOrder === null ? "–" : `${r.medianMinutesToOrder} min`}
          hint="Mediaan, van eerste bezoek tot betaling"
        />
        <StatTile
          label="Niet afgeronde betalingen"
          value={formatNumber(r.abandoned.length)}
          tone={r.abandoned.length > 0 ? "warn" : "default"}
          hint={reminder.enabled ? `Herinnering aan (na ${reminder.delayHours} uur, met toestemming)` : "Herinnering staat uit (zie Instellingen)"}
        />
      </div>

      <Panel title="Van bezoek tot betaling" className="mt-6">
        <ol className="divide-y divide-line">
          {r.stages.map((s, i) => {
            const prev = i > 0 ? r.stages[i - 1].count : null;
            const isWorst = worst && worst.key === s.key && worst.lost > 0;
            return (
              <li key={s.key} className={`grid gap-2 px-5 py-3 sm:grid-cols-[14rem_minmax(0,1fr)_14rem] sm:items-center ${isWorst ? "bg-accent-50/50" : ""}`}>
                <div>
                  <p className="font-semibold">
                    {i + 1}. {s.label}
                  </p>
                  <p className="text-xs text-muted">{s.hint}</p>
                </div>
                <div title={`${formatNumber(s.count)} (${pct(s.count, top, 1)} van de bezoeken)`}>
                  <Meter value={s.count} max={top} />
                </div>
                <div className="flex items-baseline justify-between gap-3 text-sm sm:justify-end">
                  <span className="text-lg font-extrabold tabular-nums">{formatNumber(s.count)}</span>
                  <span className="tabular-nums text-muted">{pct(s.count, top, 1)}</span>
                  {prev !== null && (
                    <span className={`tabular-nums ${isWorst ? "font-bold text-accent-600" : "text-muted"}`}>
                      {prev > 0 ? (prev > s.count ? `−${formatNumber(prev - s.count)} (${pct(prev - s.count, prev)})` : "niemand afgehaakt") : "–"}
                    </span>
                  )}
                </div>
                {isWorst && (
                  <p className="flex items-center gap-1.5 text-xs font-bold text-accent-600 sm:col-span-3">
                    <TriangleAlert className="size-3.5" aria-hidden /> Grootste afhaakmoment: hier vallen de meeste bezoekers af.
                  </p>
                )}
              </li>
            );
          })}
        </ol>
        <p className="border-t border-line px-5 py-3 text-xs text-muted">
          Per bezoek (één tabblad) tellen we elke stap één keer. &quot;−&quot; is het aantal en aandeel dat na de vorige stap afhaakte.
        </p>
      </Panel>

      <Panel title="Waar haken ze af in de vragenlijst?" className="mt-6">
        <div className={table.wrap}>
          <table className={table.table}>
            <thead>
              <tr>
                <th className={table.th}>Vraag</th>
                <th className={table.th}>Bereikt</th>
                <th className={`${table.th} text-right`}>Aantal</th>
                <th className={table.th}>Hier gestopt</th>
                <th className={`${table.th} text-right`}>Aantal</th>
                <th className={`${table.th} text-right`}>Van bereikt</th>
              </tr>
            </thead>
            <tbody>
              {r.steps.map((s) => (
                <tr key={s.step}>
                  <td className={`${table.td} font-semibold`}>{s.label}</td>
                  <td className={`${table.td} w-[18%]`}>
                    <Meter value={s.reached} max={stepMax} />
                  </td>
                  <td className={`${table.td} ${table.num} text-right`}>{formatNumber(s.reached)}</td>
                  <td className={`${table.td} w-[18%]`}>
                    <Meter value={s.leftHere} max={leftMax} tone="warn" />
                  </td>
                  <td className={`${table.td} ${table.num} text-right`}>{formatNumber(s.leftHere)}</td>
                  <td className={`${table.td} ${table.num} text-right font-bold`}>{pct(s.leftHere, s.reached)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-3 text-xs text-muted">
          &quot;Hier gestopt&quot;: de laatste vraag die een bezoeker zag, zonder te betalen. Niet elke vraag geldt voor iedereen (training-vragen alleen bij training en de bundel, tempo alleen bij afvallen). Bij &quot;Plannen en afrekenen&quot; tellen ook bezoekers die afhaakten op de betaalpagina van Stripe.
        </p>
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BreakdownTable title="Per bron (utm_source)" rows={r.bySource} labelFor={sourceLabel} />
        <BreakdownTable title="Per apparaat" rows={r.byDevice} labelFor={(k) => k.charAt(0).toUpperCase() + k.slice(1)} />
        <BreakdownTable title="Per landingspagina (eerste pagina)" rows={r.byLanding} labelFor={(k) => k} />
        <Panel title="Per plan: van betaalpagina naar betaald">
          <div className={table.wrap}>
            <table className="w-full min-w-[30rem] text-left text-sm">
              <thead>
                <tr>
                  <th className={table.th}>Plan</th>
                  <th className={`${table.th} text-right`}>Betaalpagina</th>
                  <th className={`${table.th} text-right`}>Betaald</th>
                  <th className={`${table.th} text-right`}>Afgerond</th>
                </tr>
              </thead>
              <tbody>
                {r.byPlan.length === 0 && <EmptyRow colSpan={4}>Nog geen betalingen gestart.</EmptyRow>}
                {r.byPlan.map((p) => (
                  <tr key={`${p.product}-${p.duration}`}>
                    <td className={`${table.td} font-semibold`}>{planLabel(p.product, p.duration)}</td>
                    <td className={`${table.td} ${table.num} text-right`}>{formatNumber(p.checkouts)}</td>
                    <td className={`${table.td} ${table.num} text-right`}>{formatNumber(p.orders)}</td>
                    <td className={`${table.td} ${table.num} text-right font-bold`}>{pct(p.orders, p.checkouts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-5 py-3 text-xs text-muted">Afgerond: aandeel dat na het openen van de betaalpagina ook echt betaalde.</p>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Bezoeken per dag">
          <div className="p-5">
            <ColumnChart
              title="Bezoeken per dag"
              unit="bezoeken"
              points={r.perDay.map((d) => ({ key: d.date, label: fmtDay(d.date), longLabel: fmtDay(d.date, true), value: d.visits }))}
            />
          </div>
        </Panel>
        <Panel title="Bestellingen per dag">
          <div className="p-5">
            <ColumnChart
              title="Bestellingen per dag"
              unit="bestellingen"
              points={r.perDay.map((d) => ({ key: d.date, label: fmtDay(d.date), longLabel: fmtDay(d.date, true), value: d.orders }))}
            />
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Wanneer komen bezoekers? (Nederlandse tijd)">
          <div className="p-5">
            <Heatmap cells={r.heatmap} measure="visits" unit="bezoeken" secondary={{ key: "orders", unit: "bestellingen" }} />
          </div>
        </Panel>
        <Panel title="Wanneer wordt er besteld?">
          <div className="p-5">
            <Heatmap cells={r.heatmap} measure="orders" unit="bestellingen" secondary={{ key: "visits", unit: "bezoeken" }} />
          </div>
          <p className="border-t border-line px-5 py-3 text-xs text-muted">Handig om advertenties en e-mails te plannen op de momenten dat mensen bestellen.</p>
        </Panel>
      </div>

      <div id="afgehaakt" className="mt-6 scroll-mt-6">
        <Panel
          title={`Niet afgeronde betalingen (laatste ${days} dagen)`}
          action={
            <Link href="/beheer/instellingen#herinnering" className="text-sm font-bold text-brand-700">
              Herinnering instellen
            </Link>
          }
        >
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th className={table.th}>Bezoeker</th>
                  <th className={table.th}>Plan</th>
                  <th className={table.th}>Gestart</th>
                  <th className={table.th}>Bron</th>
                  <th className={table.th}>E-mail toegestaan</th>
                  <th className={table.th}>
                    <span className="sr-only">Acties</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {r.abandoned.length === 0 && <EmptyRow colSpan={6}>Geen niet-afgeronde betalingen.</EmptyRow>}
                {r.abandoned.map((a) => (
                  <tr key={a.id}>
                    <td className={table.td}>
                      <span className="font-semibold">{a.name}</span>
                      <span className="block text-xs text-muted">{a.email}</span>
                    </td>
                    <td className={table.td}>
                      {planLabel(a.product, a.duration)}
                      {a.discountCode && <span className="block text-xs text-muted">Code {a.discountCode}</span>}
                    </td>
                    <td className={`${table.td} ${table.num}`}>{formatDateTime(a.createdAt)}</td>
                    <td className={table.td}>{describeCampaign(a.campaign) ?? <span className="text-muted">–</span>}</td>
                    <td className={table.td}>
                      {a.marketing ? <Badge tone="ok">Ja</Badge> : <Badge tone="muted">Nee</Badge>}
                      {a.remindedAt && <span className="block text-xs text-muted">Herinnerd {formatDateTime(a.remindedAt)}</span>}
                    </td>
                    <td className={`${table.td} text-right`}>
                      {a.marketing && !a.remindedAt && (
                        <form action={sendCheckoutReminderNow}>
                          <input type="hidden" name="intake" value={a.id} />
                          <input type="hidden" name="terug" value={here} />
                          <SubmitButton className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                            <Mail className="size-3.5" aria-hidden /> Herinnering sturen
                          </SubmitButton>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-5 py-3 text-xs text-muted">
            Iemand die de betaalpagina opende maar niet betaalde. Een herinnering mag alleen als de bezoeker toestemming gaf voor e-mail (vinkje bij
            het afrekenen). De link in de mail opent de vragenlijst met de eerder ingevulde antwoorden (7 dagen geldig). Gegevens van wie niet bestelt,
            worden na 30 dagen verwijderd.
          </p>
        </Panel>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Radio } from "lucide-react";
import { ColumnChart, Heatmap } from "@/components/beheer/Charts";
import { EmptyRow, Meter, NeedsDatabase, PageTitle, Panel, QueryTabs, StatTile, pct, table } from "@/components/beheer/ui";
import { adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { CHANNEL_LABELS } from "@/lib/admin/channels";
import { visitorsReport, type VisitorKpis, type VisitorSegmentRow } from "@/lib/admin/visitors-report";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Bezoekers" };

const RANGES = [7, 30, 90];

export default function BezoekersPage({ searchParams }: PageProps<"/beheer/bezoekers">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <Visitors searchParams={searchParams} />
    </Suspense>
  );
}

/** "2 min 14 s" of "48 s". */
function duration(seconds: number | null): string {
  if (seconds === null) return "–";
  const s = Math.round(seconds);
  return s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`;
}

/** Verschil met de vorige periode: procenten voor aantallen, procentpunten voor percentages. */
function change(cur: number | null, prev: number | null, kind: "count" | "rate" | "seconds", days: number): string {
  const label = `t.o.v. de ${days} dagen ervoor`;
  if (cur === null || prev === null) return `Nog geen vergelijking ${label}`;
  if (kind === "rate") {
    const pp = (cur - prev) * 100;
    return `${pp >= 0 ? "+" : "−"}${formatNumber(Math.abs(pp), 1)} procentpunt ${label}`;
  }
  if (prev === 0) return cur > 0 ? `Nieuw ${label}` : `Gelijk ${label}`;
  const p = ((cur - prev) / prev) * 100;
  return `${p >= 0 ? "+" : "−"}${formatNumber(Math.abs(p), 0)}% ${label}`;
}

function SegmentTable({
  title,
  rows,
  labelFor,
  note,
}: {
  title: string;
  rows: VisitorSegmentRow[];
  labelFor: (key: string) => string;
  note?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.visits));
  return (
    <Panel title={title}>
      <div className={table.wrap}>
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr>
              <th className={table.th}>&nbsp;</th>
              <th className={`${table.th} text-right`}>Bezoeken</th>
              <th className={`${table.th} text-right`}>Bounce</th>
              <th className={`${table.th} text-right`}>Gem. duur</th>
              <th className={`${table.th} text-right`}>Vragenlijst</th>
              <th className={`${table.th} text-right`}>Conversie</th>
            </tr>
          </thead>
          <tbody>
            {rows.every((r) => r.visits === 0) && <EmptyRow colSpan={6}>Nog geen bezoeken.</EmptyRow>}
            {rows
              .filter((r) => r.visits > 0)
              .map((r) => (
                <tr key={r.key}>
                  <td className={`${table.td} w-[38%]`}>
                    <span className="font-semibold break-words">{labelFor(r.key)}</span>
                    <span className="mt-1 block">
                      <Meter value={r.visits} max={max} />
                    </span>
                  </td>
                  <td className={`${table.td} ${table.num} text-right`}>{formatNumber(r.visits)}</td>
                  <td className={`${table.td} ${table.num} text-right`}>{pct(r.bounces, r.visits)}</td>
                  <td className={`${table.td} ${table.num} text-right`}>{duration(r.avgSeconds)}</td>
                  <td className={`${table.td} ${table.num} text-right`}>{pct(r.toStart, r.visits)}</td>
                  <td className={`${table.td} ${table.num} text-right font-bold`}>{pct(r.purchases, r.visits, 1)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {note && <p className="border-t border-line px-5 py-3 text-xs text-muted">{note}</p>}
    </Panel>
  );
}

const DEVICE_LABELS: Record<string, string> = { mobiel: "Mobiel", desktop: "Computer", tablet: "Tablet", onbekend: "Onbekend" };

async function Visitors({ searchParams }: Pick<PageProps<"/beheer/bezoekers">, "searchParams">) {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const sp = await searchParams;
  const days = RANGES.find((d) => String(d) === sp.dagen) ?? 30;
  const r = await visitorsReport({ days });
  const k: VisitorKpis = r.kpis;
  const p: VisitorKpis = r.previous;
  const fmtDay = (iso: string, long = false) =>
    new Intl.DateTimeFormat("nl-NL", long ? { weekday: "long", day: "numeric", month: "long" } : { day: "numeric", month: "short" }).format(
      new Date(`${iso}T12:00:00`),
    );
  const exitMax = Math.max(1, ...r.pages.map((x) => x.exits));

  return (
    <>
      <PageTitle
        title="Bezoekers"
        intro="Hoeveel mensen de website bezoeken, wat ze bekijken, hoe lang, waar ze vandaan komen en waar ze weer weggaan."
      >
        <QueryTabs
          base="/beheer/bezoekers"
          param="dagen"
          current={String(days)}
          label="Periode"
          options={RANGES.map((d) => ({ value: String(d), label: `${d} dagen` }))}
        />
      </PageTitle>

      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-white px-5 py-3.5 text-sm">
        <span className="inline-flex items-center gap-2 font-bold">
          <Radio className={`size-4 ${r.live.visitors > 0 ? "text-brand-600" : "text-muted"}`} aria-hidden />
          {formatNumber(r.live.visitors)} {r.live.visitors === 1 ? "bezoeker" : "bezoekers"} in de laatste 30 minuten
        </span>
        {r.live.pages.length > 0 && (
          <span className="text-muted">
            Nu op: {r.live.pages.map((x) => `${x.path} (${formatNumber(x.visitors)})`).join(", ")}
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Bezoeken" value={formatNumber(k.visits)} hint={change(k.visits, p.visits, "count", days)} />
        <StatTile label="Paginaweergaven" value={formatNumber(k.pageviews)} hint={change(k.pageviews, p.pageviews, "count", days)} />
        <StatTile
          label="Pagina's per bezoek"
          value={k.pagesPerVisit === null ? "–" : formatNumber(k.pagesPerVisit, 1)}
          hint={change(k.pagesPerVisit, p.pagesPerVisit, "count", days)}
        />
        <StatTile
          label="Bouncepercentage"
          value={k.bounceRate === null ? "–" : pct(k.bounceRate, 1)}
          tone={k.bounceRate !== null && k.bounceRate > 0.6 ? "warn" : "default"}
          hint={`Eén pagina en weg · ${change(k.bounceRate, p.bounceRate, "rate", days)}`}
        />
        <StatTile label="Gemiddelde bezoekduur" value={duration(k.avgSeconds)} hint={change(k.avgSeconds, p.avgSeconds, "seconds", days)} />
        <StatTile
          label="Naar de vragenlijst"
          value={k.startShare === null ? "–" : pct(k.startShare, 1)}
          hint={change(k.startShare, p.startShare, "rate", days)}
        />
        <StatTile
          label="Conversie bezoek → betaald"
          value={k.conversion === null ? "–" : pct(k.conversion, 1, 1)}
          hint={change(k.conversion, p.conversion, "rate", days)}
        />
        <StatTile label="Op mobiel" value={k.mobileShare === null ? "–" : pct(k.mobileShare, 1)} hint="Aandeel van de bezoeken" />
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
        <Panel title="Paginaweergaven per dag">
          <div className="p-5">
            <ColumnChart
              title="Paginaweergaven per dag"
              unit="paginaweergaven"
              points={r.perDay.map((d) => ({ key: d.date, label: fmtDay(d.date), longLabel: fmtDay(d.date, true), value: d.pageviews }))}
            />
          </div>
        </Panel>
      </div>

      <Panel title="Pagina's" className="mt-6">
        <div className={table.wrap}>
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead>
              <tr>
                <th className={table.th}>Pagina</th>
                <th className={`${table.th} text-right`}>Weergaven</th>
                <th className={`${table.th} text-right`}>Bezoeken</th>
                <th className={`${table.th} text-right`}>Gem. tijd</th>
                <th className={`${table.th} text-right`}>Instap</th>
                <th className={table.th}>Verlaten hier</th>
              </tr>
            </thead>
            <tbody>
              {r.pages.length === 0 && <EmptyRow colSpan={6}>Nog geen paginaweergaven.</EmptyRow>}
              {r.pages.map((x) => (
                <tr key={x.path}>
                  <td className={`${table.td} font-mono text-xs break-all`}>{x.path}</td>
                  <td className={`${table.td} ${table.num} text-right`}>{formatNumber(x.views)}</td>
                  <td className={`${table.td} ${table.num} text-right`}>{formatNumber(x.visits)}</td>
                  <td className={`${table.td} ${table.num} text-right`}>{duration(x.avgSeconds)}</td>
                  <td className={`${table.td} ${table.num} text-right`}>{formatNumber(x.entries)}</td>
                  <td className={`${table.td} w-44`}>
                    <span className="flex items-baseline justify-between gap-2 tabular-nums">
                      <span>{formatNumber(x.exits)}</span>
                      <span className="text-xs text-muted">{pct(x.exits, x.views)} van de weergaven</span>
                    </span>
                    <span className="mt-1 block">
                      <Meter value={x.exits} max={exitMax} tone="warn" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-3 text-xs text-muted">
          Instap: zoveel bezoeken begonnen op deze pagina. Verlaten hier: de laatste pagina van het bezoek. Een hoog percentage op /prijzen of /start
          is een signaal om die pagina te verbeteren; op /bedankt is het normaal.
        </p>
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <SegmentTable
          title="Kanalen"
          rows={r.channels}
          labelFor={(key) => CHANNEL_LABELS[key as keyof typeof CHANNEL_LABELS] ?? key}
          note="Campagnes herkennen we aan de utm-gegevens in de link, de rest aan de website waarvandaan het bezoek kwam. Zonder herkomst telt een bezoek als direct."
        />
        <SegmentTable title="Instappagina's" rows={r.entries} labelFor={(key) => key} note="De eerste pagina van een bezoek. Vergelijk hier je landingspagina's." />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Verwijzende websites">
          <div className={table.wrap}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className={table.th}>Website</th>
                  <th className={`${table.th} text-right`}>Bezoeken</th>
                  <th className={`${table.th} text-right`}>Betaald</th>
                </tr>
              </thead>
              <tbody>
                {r.referrers.length === 0 && <EmptyRow colSpan={3}>Nog geen bezoeken via andere websites.</EmptyRow>}
                {r.referrers.map((x) => (
                  <tr key={x.host}>
                    <td className={`${table.td} font-semibold`}>{x.host}</td>
                    <td className={`${table.td} ${table.num} text-right`}>{formatNumber(x.visits)}</td>
                    <td className={`${table.td} ${table.num} text-right`}>{formatNumber(x.purchases)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Campagnes">
          <div className={table.wrap}>
            <table className="w-full min-w-[30rem] text-left text-sm">
              <thead>
                <tr>
                  <th className={table.th}>Campagne</th>
                  <th className={table.th}>Bron</th>
                  <th className={`${table.th} text-right`}>Bezoeken</th>
                  <th className={`${table.th} text-right`}>Betaald</th>
                  <th className={`${table.th} text-right`}>Conversie</th>
                </tr>
              </thead>
              <tbody>
                {r.campaigns.length === 0 && <EmptyRow colSpan={5}>Nog geen bezoeken via een campagnelink.</EmptyRow>}
                {r.campaigns.map((x) => (
                  <tr key={x.campaign}>
                    <td className={`${table.td} font-semibold break-all`}>{x.campaign}</td>
                    <td className={table.td}>{x.source ?? "–"}</td>
                    <td className={`${table.td} ${table.num} text-right`}>{formatNumber(x.visits)}</td>
                    <td className={`${table.td} ${table.num} text-right`}>{formatNumber(x.purchases)}</td>
                    <td className={`${table.td} ${table.num} text-right font-bold`}>{pct(x.purchases, x.visits, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <SegmentTable title="Apparaten" rows={r.devices} labelFor={(key) => DEVICE_LABELS[key] ?? key} />
        <SegmentTable title="Taal van de website" rows={r.languages} labelFor={(key) => (key === "en" ? "Engels (/en)" : "Nederlands")} />
      </div>

      <Panel title="Wanneer komen bezoekers? (Nederlandse tijd)" className="mt-6">
        <div className="p-5">
          <Heatmap cells={r.heatmap} measure="visits" unit="bezoeken" secondary={{ key: "orders", unit: "betaald" }} />
        </div>
      </Panel>

      <p className="mt-6 text-xs text-muted">
        Eigen meting zonder cookies: een willekeurig bezoeknummer per tabblad, geen IP-adressen, en niets bij Do Not Track of Global Privacy Control.
        Bots en zoekmachines tellen niet mee. Tijd op een pagina telt alleen terwijl de pagina zichtbaar openstaat. Mijn schema&apos;s en het beheer
        worden niet gemeten.
      </p>
    </>
  );
}

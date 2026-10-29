import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowRight, Radio } from "lucide-react";
import { ColumnChart, Heatmap } from "@/components/beheer/Charts";
import { Badge, EmptyRow, Meter, NeedsDatabase, PageTitle, Panel, QueryTabs, StatTile, duration, pct, table } from "@/components/beheer/ui";
import { adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { CHANNEL_LABELS } from "@/lib/admin/channels";
import { cityName, countryName, regionName } from "@/lib/admin/places";
import { visitorsReport, type RecentVisit, type VisitorKpis, type VisitorSegmentRow } from "@/lib/admin/visitors-report";
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
  empty = "Nog geen bezoeken.",
}: {
  title: string;
  rows: VisitorSegmentRow[];
  labelFor: (key: string) => string;
  note?: string;
  empty?: string;
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
            {rows.every((r) => r.visits === 0) && <EmptyRow colSpan={6}>{empty}</EmptyRow>}
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

/** Een rubriek van de pagina, met een korte uitleg. */
function Section({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted">{intro}</p>
      <div className="mt-4 space-y-6">{children}</div>
    </div>
  );
}

/** Een route als reeks pagina's met pijltjes ertussen. */
function Route({ steps, more }: { steps: string[]; more?: boolean }) {
  return (
    <span className="flex flex-wrap items-center gap-1">
      {steps.map((s, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ArrowRight className="size-3.5 shrink-0 text-muted" aria-label="dan" />}
          <span className="rounded-md bg-sand px-1.5 py-0.5 font-mono text-xs break-all">{s}</span>
        </span>
      ))}
      {more && (
        <span className="flex items-center gap-1 text-xs text-muted">
          <ArrowRight className="size-3.5 shrink-0" aria-label="dan" />…
        </span>
      )}
    </span>
  );
}

const DEVICE_LABELS: Record<string, string> = { mobiel: "Mobiel", desktop: "Computer", tablet: "Tablet", onbekend: "Onbekend" };

function placeOf(v: Pick<RecentVisit, "city" | "region" | "country">): string {
  const region = v.country && v.region ? regionName(v.country, v.region) : null;
  // Antwerpen in de provincie Antwerpen: de provincie dan niet nog eens noemen.
  const parts = [v.city ? cityName(v.city, v.country) : null, region && region !== v.city ? region : null].filter(Boolean);
  if (parts.length) return parts.join(", ");
  return v.country ? countryName(v.country) : "Plaats onbekend";
}

function originOf(v: RecentVisit): string {
  if (v.campaign) return `Campagne ${v.campaign}${v.source ? ` (${v.source})` : ""}`;
  if (v.source) return `Advertentie of link via ${v.source}`;
  if (v.referrer) return `Via ${v.referrer}`;
  return CHANNEL_LABELS[v.channel];
}

const timeFormat = new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

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
  const timedVisits = r.durations.reduce((s, d) => s + d.visits, 0);
  const durationMax = Math.max(1, ...r.durations.map((d) => d.visits));
  const pathMax = Math.max(1, ...r.paths.map((x) => x.visits));
  const noPlaces = r.countries.every((c) => c.key === "" || c.visits === 0);

  return (
    <>
      <PageTitle
        title="Bezoekers"
        intro="Waar bezoekers vandaan komen, hoe lang ze blijven, waar ze op de website zitten en waar ze weer weggaan."
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

      <Section title="Waar komen ze vandaan?" intro="Via welk kanaal, welke website of advertentie, en uit welk land, welke provincie en welke stad.">
        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
          <SegmentTable
            title="Kanalen"
            rows={r.channels}
            labelFor={(key) => CHANNEL_LABELS[key as keyof typeof CHANNEL_LABELS] ?? key}
            note="Campagnes herkennen we aan de utm-gegevens in de link of aan het klik-ID van Google, Microsoft of TikTok Ads, de rest aan de website waarvandaan het bezoek kwam. Zonder herkomst telt een bezoek als direct."
          />
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
        </div>

        <Panel title="Campagnes en advertenties">
          <div className={table.wrap}>
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr>
                  <th className={table.th}>Campagne</th>
                  <th className={table.th}>Bron · medium</th>
                  <th className={table.th}>Advertentie</th>
                  <th className={`${table.th} text-right`}>Bezoeken</th>
                  <th className={`${table.th} text-right`}>Gem. duur</th>
                  <th className={`${table.th} text-right`}>Vragenlijst</th>
                  <th className={`${table.th} text-right`}>Betaald</th>
                  <th className={`${table.th} text-right`}>Conversie</th>
                </tr>
              </thead>
              <tbody>
                {r.campaigns.length === 0 && <EmptyRow colSpan={8}>Nog geen bezoeken via een campagnelink of advertentie.</EmptyRow>}
                {r.campaigns.map((x, i) => (
                  <tr key={i}>
                    <td className={`${table.td} font-semibold break-all`}>{x.campaign}</td>
                    <td className={table.td}>{[x.source, x.medium].filter(Boolean).join(" · ") || "–"}</td>
                    <td className={`${table.td} break-all`}>{x.content ?? "–"}</td>
                    <td className={`${table.td} ${table.num} text-right`}>{formatNumber(x.visits)}</td>
                    <td className={`${table.td} ${table.num} text-right`}>{duration(x.avgSeconds)}</td>
                    <td className={`${table.td} ${table.num} text-right`}>{pct(x.toStart, x.visits)}</td>
                    <td className={`${table.td} ${table.num} text-right`}>{formatNumber(x.purchases)}</td>
                    <td className={`${table.td} ${table.num} text-right font-bold`}>{pct(x.purchases, x.visits, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-5 py-3 text-xs text-muted">
            Uit de link: utm_campaign, utm_source, utm_medium en utm_content (de advertentie of variant). Geef elke advertentie een eigen utm_content,
            dan zie je hier welke het best werkt.
          </p>
        </Panel>

        {noPlaces && (
          <p className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
            De plaats meten we sinds deze versie van de website, en alleen op Vercel. Bezoeken van daarvoor (of op je eigen computer) staan onder
            &quot;Onbekend&quot;.
          </p>
        )}
        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
          <SegmentTable title="Landen" rows={r.countries} labelFor={(key) => countryName(key || null)} />
          <SegmentTable
            title="Provincies en regio's"
            rows={r.regions}
            labelFor={(key) => {
              const [country, region] = key.split("-");
              return regionName(country, region);
            }}
            empty="Nog geen bezoeken met een bekende provincie."
          />
        </div>
        <SegmentTable
          title="Steden"
          rows={r.cities}
          labelFor={(key) => {
            const [city, country] = key.split("|");
            return cityName(city, country || null);
          }}
          empty="Nog geen bezoeken met een bekende stad."
          note="De plaats leidt Vercel af uit het IP-adres op het moment van het bezoek; het IP-adres zelf bewaren we niet. Een stad is een benadering: bij mobiel internet is het vaak de plaats van de provider."
        />
      </Section>

      <Section title="Hoe lang blijven ze?" intro="Hoe lang de website zichtbaar openstond, per bezoek. Een tabblad op de achtergrond telt niet mee.">
        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
          <Panel title="Bezoekduur">
            <ul className="divide-y divide-line">
              {timedVisits === 0 && <li className="px-5 py-8 text-center text-sm text-muted">Nog geen bezoeken met een tijdmeting.</li>}
              {timedVisits > 0 &&
                r.durations.map((d) => (
                  <li key={d.label} className="px-5 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                      <span className="font-semibold">{d.label}</span>
                      <span className="tabular-nums">
                        <span className="font-bold">{formatNumber(d.visits)}</span> <span className="text-muted">({pct(d.visits, timedVisits)})</span>
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <Meter value={d.visits} max={durationMax} />
                    </div>
                    {d.visits > 0 && (
                      <p className="mt-1 text-xs text-muted">
                        {pct(d.toStart, d.visits)} naar de vragenlijst · {formatNumber(d.purchases)} betaald
                      </p>
                    )}
                  </li>
                ))}
            </ul>
          </Panel>
          <SegmentTable title="Apparaten" rows={r.devices} labelFor={(key) => DEVICE_LABELS[key] ?? key} />
        </div>
        <SegmentTable title="Taal van de website" rows={r.languages} labelFor={(key) => (key === "en" ? "Engels (/en)" : "Nederlands")} />
      </Section>

      <Section title="Waar zitten ze op de website?" intro="Welke pagina's ze bekijken, hoe lang en hoe ver ze scrollen, welke route ze nemen en waar ze weggaan.">
        <Panel title="Pagina's">
          <div className={table.wrap}>
            <table className="w-full min-w-[58rem] text-left text-sm">
              <thead>
                <tr>
                  <th className={table.th}>Pagina</th>
                  <th className={`${table.th} text-right`}>Weergaven</th>
                  <th className={`${table.th} text-right`}>Bezoeken</th>
                  <th className={`${table.th} text-right`}>Gem. tijd</th>
                  <th className={table.th}>Gescrold</th>
                  <th className={`${table.th} text-right`}>Instap</th>
                  <th className={table.th}>Verlaten hier</th>
                </tr>
              </thead>
              <tbody>
                {r.pages.length === 0 && <EmptyRow colSpan={7}>Nog geen paginaweergaven.</EmptyRow>}
                {r.pages.map((x) => (
                  <tr key={x.path}>
                    <td className={`${table.td} font-mono text-xs break-all`}>{x.path}</td>
                    <td className={`${table.td} ${table.num} text-right`}>{formatNumber(x.views)}</td>
                    <td className={`${table.td} ${table.num} text-right`}>{formatNumber(x.visits)}</td>
                    <td className={`${table.td} ${table.num} text-right`}>{duration(x.avgSeconds)}</td>
                    <td className={`${table.td} w-40`}>
                      {x.scroll === null ? (
                        <span className="text-muted">–</span>
                      ) : (
                        <>
                          <span className="flex items-baseline justify-between gap-2 tabular-nums">
                            <span>{formatNumber(x.scroll)}%</span>
                            {x.bottomShare !== null && <span className="text-xs text-muted">{pct(x.bottomShare, 1)} onderaan</span>}
                          </span>
                          <span className="mt-1 block">
                            <Meter value={x.scroll} max={100} />
                          </span>
                        </>
                      )}
                    </td>
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
            Gescrold: gemiddeld hoe ver bezoekers op de pagina kwamen (100% = helemaal onderaan), en hoeveel er (bijna) onderaan kwamen. Instap: zoveel
            bezoeken begonnen op deze pagina. Verlaten hier: de laatste pagina van het bezoek. Een hoog percentage op /prijzen of /start is een signaal om
            die pagina te verbeteren; op /bedankt is het normaal.
          </p>
        </Panel>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
          <Panel title="Routes door de website">
            <ul className="divide-y divide-line">
              {r.paths.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted">Nog geen bezoeken.</li>}
              {r.paths.map((x, i) => (
                <li key={i} className="px-5 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5 text-sm">
                    <Route steps={x.steps} more={x.more} />
                    <span className="font-bold tabular-nums">{formatNumber(x.visits)}</span>
                  </div>
                  <div className="mt-1.5">
                    <Meter value={x.visits} max={pathMax} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {pct(x.toStart, x.visits)} naar de vragenlijst · {formatNumber(x.purchases)} betaald
                  </p>
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-5 py-3 text-xs text-muted">
              De eerste pagina&apos;s van een bezoek, in volgorde. Een route met één pagina is een bounce of een bezoek dat daar bleef hangen.
            </p>
          </Panel>
          <SegmentTable title="Instappagina's" rows={r.entries} labelFor={(key) => key} note="De eerste pagina van een bezoek. Vergelijk hier je landingspagina's." />
        </div>
      </Section>

      <Section title="Recente bezoeken" intro="De laatste 30 bezoeken: waar ze vandaan kwamen en welke pagina's ze bekeken, met de tijd en hoe ver ze scrolden.">
        <Panel>
          <ul className="divide-y divide-line">
            {r.recent.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted">Nog geen bezoeken.</li>}
            {r.recent.map((v, i) => (
              <li key={i}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-start gap-3 px-5 py-3 text-sm hover:bg-sand/40 [&::-webkit-details-marker]:hidden">
                    <span className="grid min-w-0 flex-1 gap-x-4 gap-y-0.5 md:grid-cols-[8.5rem_minmax(0,1fr)_auto] md:items-center">
                      <span className="text-muted tabular-nums">{timeFormat.format(v.startedAt)}</span>
                      <span className="min-w-0">
                        <span className="font-semibold">{placeOf(v)}</span>
                        <span className="text-muted">
                          {" "}
                          · {originOf(v)} · {DEVICE_LABELS[v.device ?? "onbekend"] ?? v.device}
                          {v.locale === "en" ? " · Engels" : ""}
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-2 tabular-nums md:justify-end">
                        {formatNumber(v.pages.length)} {v.pages.length === 1 ? "pagina" : "pagina's"} · {duration(v.seconds)}
                        {v.purchase ? <Badge tone="ok">Betaald</Badge> : v.reachedStart ? <Badge tone="info">Vragenlijst</Badge> : null}
                      </span>
                    </span>
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted transition-transform group-open:rotate-90" aria-hidden />
                  </summary>
                  <ol className="space-y-1.5 border-t border-line bg-sand/30 px-5 py-3 text-sm">
                    {v.pages.map((pg, j) => (
                      <li key={j} className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <span className="font-mono text-xs break-all">
                          <span className="mr-2 text-muted">{j + 1}.</span>
                          {pg.path}
                        </span>
                        <span className="text-xs text-muted tabular-nums">
                          {duration(pg.seconds)}
                          {pg.scroll !== null ? ` · ${formatNumber(pg.scroll)}% gescrold` : ""}
                        </span>
                      </li>
                    ))}
                  </ol>
                </details>
              </li>
            ))}
          </ul>
        </Panel>
      </Section>

      <Section title="Wanneer komen ze?" intro="Per weekdag en uur, in Nederlandse tijd.">
        <Panel>
          <div className="p-5">
            <Heatmap cells={r.heatmap} measure="visits" unit="bezoeken" secondary={{ key: "orders", unit: "betaald" }} />
          </div>
        </Panel>
      </Section>

      <p className="mt-6 text-xs text-muted">
        Eigen meting zonder cookies: een willekeurig bezoeknummer per tabblad, geen IP-adressen, en niets bij Do Not Track of Global Privacy Control.
        Bots en zoekmachines tellen niet mee. Tijd op een pagina telt alleen terwijl de pagina zichtbaar openstaat. Mijn schema&apos;s en het beheer
        worden niet gemeten.
      </p>
    </>
  );
}

import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowRight, CircleCheck, EyeOff, Info, Lightbulb, Sparkles } from "lucide-react";
import { hideOpportunity, requestAiAdvice, showAllOpportunities } from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Badge, NeedsDatabase, Notice, PageTitle, Panel, QueryTabs, StatTile } from "@/components/beheer/ui";
import { adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import {
  AREA_LABELS,
  aiAdvice,
  buildOpportunities,
  hiddenOpportunities,
  opportunityInput,
  type Kans,
  type KansArea,
  type KansImpact,
} from "@/lib/admin/opportunities";
import { formatDateTime, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Kansen" };

/** Het advies van Claude kan een minuut duren. */
export const maxDuration = 300;

export default function KansenPage({ searchParams }: PageProps<"/beheer/kansen">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <Opportunities searchParams={searchParams} />
    </Suspense>
  );
}

const IMPACT: Record<KansImpact, { tone: "bad" | "warn" | "muted"; label: string }> = {
  hoog: { tone: "bad", label: "Veel impact" },
  middel: { tone: "warn", label: "Gemiddelde impact" },
  laag: { tone: "muted", label: "Kleine verbetering" },
};

function KansCard({ kans, back }: { kans: Kans; back: string }) {
  const impact = IMPACT[kans.impact];
  return (
    <article className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={impact.tone}>{impact.label}</Badge>
        <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-muted">{AREA_LABELS[kans.area]}</span>
      </div>
      <h3 className="mt-2.5 text-[1.0625rem] leading-snug font-bold">{kans.title}</h3>
      <p className="mt-1.5 text-[0.9375rem]">{kans.finding}</p>
      {kans.actions.length > 0 && (
        <>
          <p className="mt-3 text-xs font-bold tracking-wide text-muted uppercase">Wat kun je doen</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-[0.9375rem]">
            {kans.actions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-sm">
        <span className="text-xs text-muted">Gebaseerd op: {kans.basis}</span>
        <span className="flex flex-wrap items-center gap-4">
          {kans.link && (
            <Link href={kans.link.href} className="inline-flex items-center gap-1 font-bold text-brand-700 hover:underline">
              {kans.link.label} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          )}
          <form action={hideOpportunity}>
            <input type="hidden" name="kans" value={kans.id} />
            <input type="hidden" name="titel" value={kans.title} />
            <input type="hidden" name="terug" value={back} />
            <SubmitButton className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink">
              <EyeOff className="size-3.5" aria-hidden /> Verbergen (30 dagen)
            </SubmitButton>
          </form>
        </span>
      </div>
    </article>
  );
}

async function Opportunities({ searchParams }: Pick<PageProps<"/beheer/kansen">, "searchParams">) {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const sp = await searchParams;
  const [input, hidden, advice] = await Promise.all([opportunityInput(), hiddenOpportunities(), aiAdvice()]);
  const { kansen: all, strengths, dataNote } = buildOpportunities(input);
  const visible = all.filter((k) => !hidden[k.id]);
  const hiddenCount = all.length - visible.length;
  const areas = [...new Set(visible.map((k) => k.area))];
  const area = areas.find((a) => a === sp.gebied) ?? null;
  const shown = area ? visible.filter((k) => k.area === area) : visible;
  const here = area ? `/beheer/kansen?gebied=${area}` : "/beheer/kansen";
  const count = (impact: KansImpact) => visible.filter((k) => k.impact === impact).length;

  return (
    <>
      <Notice code={typeof sp.melding === "string" ? sp.melding : undefined} />
      <PageTitle
        title="Kansen"
        intro="Tips en verbeteringen op basis van alles wat binnenkomt: funnel, bezoekers, omzet en behoud, feedback, e-mails en kortingscodes. Elke keer dat je deze pagina opent opnieuw berekend; de belangrijkste staan bovenaan."
      />

      {dataNote && (
        <p className="mb-6 flex items-start gap-2 rounded-2xl border border-line bg-white px-5 py-3.5 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden /> {dataNote}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Veel impact" value={formatNumber(count("hoog"))} tone={count("hoog") > 0 ? "warn" : "default"} hint="Pak deze als eerste op" />
        <StatTile label="Gemiddelde impact" value={formatNumber(count("middel"))} />
        <StatTile label="Kleine verbeteringen" value={formatNumber(count("laag"))} />
        <StatTile label="Gaat goed" value={formatNumber(strengths.length)} hint="Zie onderaan" />
      </div>

      {areas.length > 1 && (
        <div className="mt-6">
          <QueryTabs
            base="/beheer/kansen"
            param="gebied"
            current={area}
            label="Onderwerp"
            options={[{ label: `Alle (${visible.length})` }, ...areas.map((a) => ({ value: a, label: `${AREA_LABELS[a as KansArea]} (${visible.filter((k) => k.area === a).length})` }))]}
          />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {shown.length === 0 && (
          <p className="rounded-2xl border border-line bg-white p-8 text-center text-muted xl:col-span-2">
            Geen kansen op dit moment. {hiddenCount > 0 ? "Een deel is verborgen." : "Kom over een paar dagen terug als er meer gegevens zijn."}
          </p>
        )}
        {shown.map((k) => (
          <KansCard key={k.id} kans={k} back={here} />
        ))}
      </div>

      {hiddenCount > 0 && (
        <form action={showAllOpportunities} className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
          <input type="hidden" name="terug" value={here} />
          {formatNumber(hiddenCount)} {hiddenCount === 1 ? "kans is" : "kansen zijn"} verborgen.
          <SubmitButton className="font-semibold text-brand-700 hover:underline">Toon ze weer</SubmitButton>
        </form>
      )}

      <Panel title="Meedenken met Claude" className="mt-8">
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <p className="max-w-2xl text-sm text-muted">
              Claude bekijkt dezelfde cijfers in samenhang en geeft 5 tot 8 concrete verbeteringen, met hoe je meet of ze werken. Er gaan alleen
              opgetelde cijfers mee (geen namen, e-mailadressen of letterlijke opmerkingen van klanten). Duurt ongeveer een minuut; dit kost een paar
              cent aan API-tegoed.
            </p>
            <form action={requestAiAdvice}>
              <input type="hidden" name="terug" value="/beheer/kansen" />
              <SubmitButton className="btn-primary !px-4 !py-2.5 text-sm">
                <Sparkles className="size-4" aria-hidden /> {advice ? "Vraag nieuw advies" : "Vraag advies"}
              </SubmitButton>
            </form>
          </div>
          {advice ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-brand-50 p-4 text-[0.9375rem]">
                <p className="flex items-start gap-2 font-semibold text-brand-900">
                  <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden /> {advice.summary}
                </p>
                <p className="mt-1 text-xs text-muted">Gemaakt op {formatDateTime(new Date(advice.at))}. Cijfers veranderen; vraag af en toe nieuw advies.</p>
              </div>
              <ol className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {advice.items.map((item, idx) => (
                  <li key={`${idx}-${item.title}`} className="rounded-2xl border border-line p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={IMPACT[item.impact].tone}>{IMPACT[item.impact].label}</Badge>
                      <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-muted">{AREA_LABELS[item.area]}</span>
                    </div>
                    <h3 className="mt-2.5 font-bold">
                      {idx + 1}. {item.title}
                    </h3>
                    <p className="mt-1.5 text-[0.9375rem]">{item.why}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.9375rem]">
                      {item.actions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                    <p className="mt-3 border-t border-line pt-3 text-xs text-muted">Meten: {item.measure}</p>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-muted">
                Advies van software: controleer het zelf voordat je iets aanpast, zeker bij teksten over gezondheid, resultaten en prijzen.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">Nog geen advies gevraagd.</p>
          )}
        </div>
      </Panel>

      {strengths.length > 0 && (
        <Panel title="Gaat goed" className="mt-6">
          <ul className="divide-y divide-line">
            {strengths.map((k) => (
              <li key={k.id} className="flex items-start gap-3 px-5 py-3.5 text-sm">
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
                <span>
                  <span className="font-semibold">{k.title}</span>
                  <span className="block text-muted">
                    {k.finding} <span className="text-xs">({k.basis})</span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}

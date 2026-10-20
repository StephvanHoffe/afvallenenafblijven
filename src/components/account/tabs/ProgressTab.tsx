import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { accountHref } from "@/components/account/AccountShell";
import { AnswersGrid, BmiScale, GoalMeter, StatTile } from "@/components/account/charts/Indicators";
import { ColumnChart } from "@/components/account/charts/ColumnChart";
import { TimeChart } from "@/components/account/charts/TimeChart";
import { Section } from "@/components/account/shared";
import { WeightChartFor, changeIsGood, signedKg } from "@/components/account/tabs/OverviewTab";
import { products } from "@/config/pricing";
import type { AccountView } from "@/lib/account-types";
import { formatDate, formatNumber } from "@/lib/format";
import { buildProgress } from "@/lib/progress";

export function ProgressTab({ view, base }: { view: AccountView; base: string }) {
  const p = buildProgress(view);
  const hasNutrition = view.orders.some((o) => products[o.product].includes.includes("voeding"));
  const waistChange = p.waist.length > 1 ? Math.round((p.waist.at(-1)!.v - p.waist[0].v) * 10) / 10 : null;

  if (!view.intake && view.checkins.length === 0) {
    return <p className="card p-6 text-muted">Zodra je je eerste schema hebt, zie je hier je voortgang.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Bij de start" value={p.startKg !== null ? `${formatNumber(p.startKg, 1)} kg` : "–"} sub={view.startedAt ? formatDate(view.startedAt) : undefined} />
        <StatTile
          label="Nu"
          value={p.currentKg !== null ? `${formatNumber(p.currentKg, 1)} kg` : "–"}
          sub={p.currentAt ? `gemeten op ${formatDate(new Date(p.currentAt))}` : undefined}
        />
        <StatTile label="Verschil" value={p.changeKg !== null ? signedKg(p.changeKg) : "–"} tone={changeIsGood(p) ? "good" : "default"} sub={p.goalLabel ?? undefined} />
        {waistChange !== null ? (
          <StatTile label="Taille" value={`${waistChange > 0 ? "+" : waistChange < 0 ? "−" : "±"}${formatNumber(Math.abs(waistChange), 1)} cm`} sub={`nu ${formatNumber(p.waist.at(-1)!.v, 1)} cm`} tone={waistChange < 0 && p.direction === "down" ? "good" : "default"} />
        ) : (
          <StatTile
            label={p.toGoKg !== null ? "Tot je streefgewicht" : "Check-ins"}
            value={p.toGoKg !== null ? (p.toGoKg === 0 ? "Bereikt!" : `${formatNumber(p.toGoKg, 1)} kg`) : String(view.checkins.length)}
            tone={p.toGoKg === 0 ? "good" : "default"}
          />
        )}
      </div>

      <Section
        title="Je gewicht"
        intro={`Je startgewicht uit de vragenlijst en je gewicht bij elke check-in${p.projection.length > 1 ? ", naast het verwachte verloop van je plan bij de start" : ""}.`}
      >
        {p.goalShare !== null && p.startKg !== null && p.currentKg !== null && p.targetKg !== null && (
          <div className="mb-6">
            <GoalMeter startKg={p.startKg} currentKg={p.currentKg} targetKg={p.targetKg} share={p.goalShare} />
          </div>
        )}
        <WeightChartFor progress={p} />
        {p.projectedGoalAt && p.toGoKg !== 0 && (
          <p className="mt-3 text-sm text-muted">
            Volgens je plan bij de start haal je je streefgewicht rond <strong className="text-ink">{formatDate(new Date(p.projectedGoalAt))}</strong>.
            Afvallen gaat niet in een rechte lijn; schommelingen van een kilo zijn normaal.
          </p>
        )}
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-bold text-brand-700">Alle metingen als tabel</summary>
          <div className="mt-3 overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[22rem] text-left">
              <thead className="bg-sand text-xs font-bold tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-2">Datum</th>
                  <th className="px-4 py-2">Moment</th>
                  <th className="px-4 py-2 text-right">Gewicht</th>
                  <th className="px-4 py-2 text-right">T.o.v. start</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {p.weights.map((w) => (
                  <tr key={w.t}>
                    <td className="px-4 py-2 whitespace-nowrap">{formatDate(new Date(w.t))}</td>
                    <td className="px-4 py-2">{w.label}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatNumber(w.v, 1)} kg</td>
                    <td className="px-4 py-2 text-right tabular-nums">{p.startKg !== null ? signedKg(Math.round((w.v - p.startKg) * 10) / 10) : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Taille-omtrek" intro="Zegt vaak meer dan de weegschaal, zeker als je ook traint.">
          {p.waist.length > 1 ? (
            <TimeChart
              compact
              height={200}
              unit="cm"
              measured={{ label: "Je taille", points: p.waist }}
              description={`Je taille-omtrek: van ${formatNumber(p.waist[0].v, 1)} cm naar ${formatNumber(p.waist.at(-1)!.v, 1)} cm.`}
            />
          ) : p.waist.length === 1 ? (
            <p className="text-[0.9375rem]">
              <strong className="text-2xl font-extrabold">{formatNumber(p.waist[0].v, 1)} cm</strong>
              <span className="mt-1 block text-sm text-muted">Gemeten bij je check-in. Na je volgende meting zie je hier een grafiek.</span>
            </p>
          ) : (
            <p className="text-sm text-muted">Vul bij je volgende check-in je taille-omtrek in om ook die te volgen.</p>
          )}
        </Section>
        <Section title="BMI" intro="Berekend uit je lengte en gewicht.">
          {p.bmiNow !== null ? <BmiScale start={p.bmiStart} now={p.bmiNow} /> : <p className="text-sm text-muted">Nog niet beschikbaar.</p>}
        </Section>
      </div>

      {hasNutrition && view.targets.length > 0 && (
        <Section title="Je caloriedoel per periode" intro="Na elke check-in stellen we je dagdoel bij op je nieuwe gewicht en je voortgang.">
          {view.targets.length > 1 ? (
            <ColumnChart
              unit="kcal per dag"
              description={`Caloriedoel per periode: ${view.targets.map((t) => `periode ${t.seq} ${t.calories} kcal`).join(", ")}.`}
              columns={view.targets.map((t) => ({
                label: `Periode ${t.seq}`,
                value: t.calories,
                detail: `${t.proteinG} g eiwit · ${t.carbsG} g koolhydraten · ${t.fatG} g vet`,
              }))}
            />
          ) : (
            <p className="text-[0.9375rem]">
              <strong className="text-2xl font-extrabold">{formatNumber(view.targets[0].calories)} kcal</strong> per dag
              <span className="mt-1 block text-sm text-muted">Na je eerste check-in zie je hier hoe je dagdoel meebeweegt.</span>
            </p>
          )}
        </Section>
      )}

      <Section
        title="Hoe ging het?"
        intro="Je antwoorden uit elke check-in. Hiermee stemmen we je volgende schema af."
        action={
          <Link href={accountHref(base, "check-in")} className="inline-flex items-center gap-1 text-sm font-bold text-brand-700">
            Naar de check-in <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      >
        {view.checkins.length > 0 ? (
          <AnswersGrid checkins={view.checkins} />
        ) : (
          <p className="text-sm text-muted">Na je eerste check-in zie je hier hoe het ging: energie, slaap, honger en hoe goed het schema lukte.</p>
        )}
      </Section>
    </div>
  );
}

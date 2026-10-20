import Link from "next/link";
import { ArrowRight, Download, Scale, SlidersHorizontal, Sparkles } from "lucide-react";
import { accountHref } from "@/components/account/AccountShell";
import { PlanStatusRefresher } from "@/components/account/PlanStatusRefresher";
import { GoalMeter, StatTile } from "@/components/account/charts/Indicators";
import { TimeChart } from "@/components/account/charts/TimeChart";
import { Section, nextPlanText } from "@/components/account/shared";
import { PlanCards, currentPeriod } from "@/components/account/tabs/PlanCards";
import { weeklyOrder } from "@/components/account/tabs/WeeklySection";
import { site } from "@/config/site";
import type { AccountNotice, AccountView } from "@/lib/account-types";
import { formatDate, formatNumber } from "@/lib/format";
import { buildProgress, type Progress } from "@/lib/progress";

export function signedKg(n: number): string {
  return `${n > 0 ? "+" : n < 0 ? "−" : "±"}${formatNumber(Math.abs(n), 1)} kg`;
}

/** Goed nieuws in groen: afvallen bij een afvaldoel, aankomen bij sterker worden. */
export function changeIsGood(p: Progress): boolean {
  if (p.changeKg === null || p.changeKg === 0) return false;
  return p.direction === "down" ? p.changeKg < 0 : p.direction === "up" ? p.changeKg > 0 : Math.abs(p.changeKg) <= 1;
}

export function WeightChartFor({ progress, compact = false }: { progress: Progress; compact?: boolean }) {
  if (progress.weights.length === 0) return null;
  return (
    <TimeChart
      compact={compact}
      height={compact ? 200 : 280}
      unit="kg"
      measured={{ label: "Je gewicht", points: progress.weights }}
      projection={progress.projection.length > 1 ? { label: "Verwacht verloop bij de start", points: progress.projection } : undefined}
      reference={progress.targetKg !== null ? { v: progress.targetKg, label: "Streefgewicht" } : undefined}
      description={`Je gewicht: van ${formatNumber(progress.startKg ?? 0, 1)} kg bij de start naar ${formatNumber(progress.currentKg ?? 0, 1)} kg nu${
        progress.targetKg !== null ? `, streefgewicht ${formatNumber(progress.targetKg, 1)} kg` : ""
      }.`}
    />
  );
}

export function OverviewTab({ view, base, demo, notice }: { view: AccountView; base: string; demo: boolean; notice: AccountNotice }) {
  const progress = buildProgress(view);
  const activeSubs = view.orders.filter((o) => o.manageable && (o.status === "active" || o.status === "past_due"));
  const mainSub = activeSubs[0] ?? null;
  const openCheckin = activeSubs.find((o) => o.checkin?.status === "open" || o.checkin?.status === "overdue")?.checkin ?? null;
  const { latestSeq, current } = currentPeriod(view.plans);
  const busy = current.some((p) => p.status !== "ready" && !p.failed);
  const next = nextPlanText(mainSub?.checkin ?? null);
  const allPdfHref = demo ? "/voorbeeld/pdf/alles" : `/account/pdf?periode=${latestSeq}`;
  const weekly = weeklyOrder(view)?.weekly ?? null;
  const lastChange = [...view.weekly]
    .reverse()
    .find((l) => l.seq === latestSeq && l.adjustment && (l.adjustment.kcal !== 0 || l.adjustment.training));

  return (
    <div className="space-y-6">
      {busy && !demo && <PlanStatusRefresher />}

      {notice === "checkin" && (
        <div role="status" className="rounded-[var(--radius-card)] border-2 border-brand-200 bg-brand-50 p-6">
          <h2 className="text-lg font-bold">Dank je, je check-in is binnen!</h2>
          <p className="mt-1 text-[0.9375rem]">
            We maken nu je nieuwe schema, afgestemd op je antwoorden. Dat duurt een paar minuten; deze pagina ververst vanzelf
            en je krijgt een e-mail zodra het klaar is.
          </p>
        </div>
      )}

      {openCheckin && notice !== "checkin" && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border-2 border-lime-glow bg-[#f6fbe8] p-5 sm:p-6">
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 size-6 shrink-0 text-brand-600" aria-hidden />
            <div>
              <h2 className="text-lg font-extrabold">
                {openCheckin.status === "overdue" ? "Je nieuwe schema wacht op je check-in" : "Tijd voor je check-in!"}
              </h2>
              <p className="mt-1 text-[0.9375rem]">
                Vul hem in (2 minuten), dan maken we direct je schema voor periode {openCheckin.seq}, afgestemd op hoe het ging.
              </p>
            </div>
          </div>
          <Link href={accountHref(base, "check-in")} className="btn-primary !py-2.5 text-sm">
            Check-in invullen <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      )}

      {!openCheckin && weekly?.status === "open" && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border-2 border-brand-200 bg-brand-50 p-5 sm:p-6">
          <div className="flex gap-3">
            <Scale className="mt-0.5 size-6 shrink-0 text-brand-600" aria-hidden />
            <div>
              <h2 className="text-lg font-extrabold">Weegmoment week {weekly.week}: hoe gaat het?</h2>
              <p className="mt-1 text-[0.9375rem]">
                Vul je gewicht in (1 minuut). Wijkt je voortgang af, dan sturen we je schema meteen bij.
              </p>
            </div>
          </div>
          <Link href={`${accountHref(base, "check-in")}#weegmoment`} className="btn-primary !py-2.5 text-sm">
            Weegmoment invullen <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      )}

      {/* Kerncijfers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Je gewicht nu"
          value={progress.currentKg !== null ? `${formatNumber(progress.currentKg, 1)} kg` : "–"}
          sub={progress.currentAt ? `gemeten op ${formatDate(new Date(progress.currentAt))}` : undefined}
        />
        <StatTile
          label="Sinds de start"
          value={progress.changeKg !== null ? signedKg(progress.changeKg) : "–"}
          sub={progress.startKg !== null ? `start: ${formatNumber(progress.startKg, 1)} kg` : undefined}
          tone={changeIsGood(progress) ? "good" : "default"}
        />
        <StatTile
          label={progress.toGoKg !== null ? "Tot je streefgewicht" : "Je doel"}
          value={progress.toGoKg !== null ? (progress.toGoKg === 0 ? "Bereikt!" : `${formatNumber(progress.toGoKg, 1)} kg`) : (progress.goalLabel ?? "–")}
          sub={progress.targetKg !== null ? `doel: ${formatNumber(progress.targetKg, 1)} kg` : undefined}
          tone={progress.toGoKg === 0 ? "good" : "default"}
        />
        <StatTile label="Volgend schema" value={mainSub ? next.title.replace(/ \(vanaf.*\)$/, "") : "–"} sub={mainSub?.checkin ? `periode ${mainSub.checkin.seq}` : undefined} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Section
          title="Je gewicht"
          intro="Je startgewicht en je gewicht bij elke check-in."
          action={
            <Link href={accountHref(base, "voortgang")} className="inline-flex items-center gap-1 text-sm font-bold text-brand-700">
              Alle voortgang <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        >
          {progress.goalShare !== null && progress.startKg !== null && progress.currentKg !== null && progress.targetKg !== null && (
            <div className="mb-5">
              <GoalMeter startKg={progress.startKg} currentKg={progress.currentKg} targetKg={progress.targetKg} share={progress.goalShare} />
            </div>
          )}
          {progress.weights.length > 0 ? (
            <WeightChartFor progress={progress} compact />
          ) : (
            <p className="text-sm text-muted">Na je eerste check-in zie je hier hoe je gewicht verloopt.</p>
          )}
        </Section>

        <Section
          title={latestSeq > 1 ? `Je schema's · periode ${latestSeq}` : "Je schema's"}
          action={
            <Link href={accountHref(base, "schemas")} className="inline-flex items-center gap-1 text-sm font-bold text-brand-700">
              Alle schema&apos;s <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        >
          <PlanCards plans={current} compact />
          {current.some((p) => p.status === "ready") && (
            <a href={allPdfHref} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">
              <Download className="size-4" aria-hidden /> {current.length > 1 ? "Alles downloaden als één PDF" : "Download als PDF"}
            </a>
          )}
          {lastChange?.adjustment && (
            <Link
              href={accountHref(base, "schemas")}
              className="mt-4 flex items-start gap-2 rounded-2xl bg-brand-50 p-3 text-sm hover:bg-brand-100"
            >
              <SlidersHorizontal className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
              <span>
                <strong>Bijgestuurd na weegmoment week {lastChange.week}:</strong>{" "}
                {[
                  lastChange.adjustment.kcal
                    ? `${lastChange.adjustment.kcal > 0 ? "+" : "−"}${Math.abs(lastChange.adjustment.kcal)} kcal per dag`
                    : null,
                  lastChange.adjustment.training ? `trainingen ${lastChange.adjustment.training}` : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </Link>
          )}
          {mainSub && <p className="mt-4 border-t border-line pt-4 text-sm text-muted">{next.text}</p>}
        </Section>
      </div>

      <section className="rounded-[var(--radius-card)] bg-sand p-6">
        <h2 className="text-lg font-bold">Hulp nodig?</h2>
        <p className="mt-1 text-[0.9375rem] text-muted">
          Bekijk de{" "}
          <Link href="/contact#veelgestelde-vragen" className="font-semibold text-brand-700 underline">
            veelgestelde vragen
          </Link>{" "}
          of{" "}
          <Link href="/contact" className="font-semibold text-brand-700 underline">
            neem contact op
          </Link>
          . We reageren binnen {site.responseTimeDays} werkdagen.
        </p>
      </section>
    </div>
  );
}

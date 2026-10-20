import Link from "@/i18n/Link";
import { ArrowRight, Download, Scale, SlidersHorizontal, Sparkles } from "lucide-react";
import { accountHref } from "@/components/account/AccountShell";
import { PlanStatusRefresher } from "@/components/account/PlanStatusRefresher";
import { HealthOverviewCard } from "@/components/account/health/HealthOverviewCard";
import { GoalMeter, StatTile } from "@/components/account/charts/Indicators";
import { TimeChart } from "@/components/account/charts/TimeChart";
import { Section, nextPlanText } from "@/components/account/shared";
import { PlanCards, currentPeriod } from "@/components/account/tabs/PlanCards";
import { weeklyOrder } from "@/components/account/tabs/WeeklySection";
import { site } from "@/config/site";
import { defineCopy, localePath, type Locale } from "@/i18n/config";
import type { AccountNotice, AccountView } from "@/lib/account-types";
import { formatDate, formatNumber } from "@/lib/format";
import { buildProgress, type Progress } from "@/lib/progress";
import type { TrainingDirection } from "@/lib/weekly";

const copy = defineCopy({
  nl: {
    yourWeight: "Je gewicht",
    expected: "Verwacht verloop bij de start",
    target: "Streefgewicht",
    chartDescription: (start: string, now: string, target: string | null) =>
      `Je gewicht: van ${start} kg bij de start naar ${now} kg nu${target !== null ? `, streefgewicht ${target} kg` : ""}.`,
    checkinDoneTitle: "Dank je, je check-in is binnen!",
    checkinDoneText:
      "We maken nu je nieuwe schema, afgestemd op je antwoorden. Dat duurt een paar minuten; deze pagina ververst vanzelf en je krijgt een e-mail zodra het klaar is.",
    overdueTitle: "Je nieuwe schema wacht op je check-in",
    openTitle: "Tijd voor je check-in!",
    openText: (seq: number) => `Vul hem in (2 minuten), dan maken we direct je schema voor periode ${seq}, afgestemd op hoe het ging.`,
    openCta: "Check-in invullen",
    weeklyTitle: (week: number) => `Weegmoment week ${week}: hoe gaat het?`,
    weeklyText: "Vul je gewicht in (1 minuut). Wijkt je voortgang af, dan sturen we je schema meteen bij.",
    weeklyCta: "Weegmoment invullen",
    weightNow: "Je gewicht nu",
    measuredOn: (date: string) => `gemeten op ${date}`,
    sinceStart: "Sinds de start",
    startSub: (kg: string) => `start: ${kg} kg`,
    toTarget: "Tot je streefgewicht",
    yourGoal: "Je doel",
    reached: "Bereikt!",
    goalSub: (kg: string) => `doel: ${kg} kg`,
    nextPlan: "Volgend schema",
    periodSub: (seq: number) => `periode ${seq}`,
    weightIntro: "Je startgewicht en je gewicht bij elke check-in.",
    allProgress: "Alle voortgang",
    noWeights: "Na je eerste check-in zie je hier hoe je gewicht verloopt.",
    plansPeriod: (seq: number) => `Je schema's · periode ${seq}`,
    plans: "Je schema's",
    allPlans: "Alle schema's",
    downloadAll: "Alles downloaden als één PDF",
    download: "Download als PDF",
    adjustedAfter: (week: number) => `Bijgestuurd na weegmoment week ${week}:`,
    kcalPerDay: (kcal: string) => `${kcal} kcal per dag`,
    workouts: (dir: TrainingDirection) => `trainingen ${dir}`,
    helpTitle: "Hulp nodig?",
    helpBefore: "Bekijk de",
    faq: "veelgestelde vragen",
    or: "of",
    contact: "neem contact op",
    respond: (days: number) => `. We reageren binnen ${days} werkdagen.`,
  },
  en: {
    yourWeight: "Your weight",
    expected: "Expected progress (as planned at the start)",
    target: "Target weight",
    chartDescription: (start: string, now: string, target: string | null) =>
      `Your weight: from ${start} kg at the start to ${now} kg now${target !== null ? `, target weight ${target} kg` : ""}.`,
    checkinDoneTitle: "Thank you, your check-in is in!",
    checkinDoneText:
      "We're now creating your new plan, tailored to your answers. This takes a few minutes; this page refreshes automatically and you'll get an email as soon as it's ready.",
    overdueTitle: "Your new plan is waiting for your check-in",
    openTitle: "Time for your check-in!",
    openText: (seq: number) => `Fill it in (2 minutes) and we'll create your plan for period ${seq} straight away, tailored to how things went.`,
    openCta: "Complete check-in",
    weeklyTitle: (week: number) => `Weekly weigh-in, week ${week}: how's it going?`,
    weeklyText: "Enter your weight (1 minute). If your progress is off track, we'll adjust your plan straight away.",
    weeklyCta: "Complete weigh-in",
    weightNow: "Your weight now",
    measuredOn: (date: string) => `measured on ${date}`,
    sinceStart: "Since the start",
    startSub: (kg: string) => `start: ${kg} kg`,
    toTarget: "To your target weight",
    yourGoal: "Your goal",
    reached: "Reached!",
    goalSub: (kg: string) => `target: ${kg} kg`,
    nextPlan: "Next plan",
    periodSub: (seq: number) => `period ${seq}`,
    weightIntro: "Your starting weight and your weight at each check-in.",
    allProgress: "All progress",
    noWeights: "After your first check-in, you'll see how your weight is changing here.",
    plansPeriod: (seq: number) => `Your plans · period ${seq}`,
    plans: "Your plans",
    allPlans: "All plans",
    downloadAll: "Download everything as one PDF",
    download: "Download as PDF",
    adjustedAfter: (week: number) => `Adjusted after weigh-in week ${week}:`,
    kcalPerDay: (kcal: string) => `${kcal} kcal per day`,
    workouts: (dir: TrainingDirection) => `workouts ${{ zwaarder: "harder", lichter: "lighter", eenvoudiger: "simpler" }[dir]}`,
    helpTitle: "Need help?",
    helpBefore: "Check the",
    faq: "frequently asked questions",
    or: "or",
    contact: "get in touch",
    respond: (days: number) => `. We respond within ${days} working days.`,
  },
});

export function signedKg(n: number, l: Locale = "nl"): string {
  return `${n > 0 ? "+" : n < 0 ? "−" : "±"}${formatNumber(Math.abs(n), 1, l)} kg`;
}

/** Goed nieuws in groen: afvallen bij een afvaldoel, aankomen bij sterker worden. */
export function changeIsGood(p: Progress): boolean {
  if (p.changeKg === null || p.changeKg === 0) return false;
  return p.direction === "down" ? p.changeKg < 0 : p.direction === "up" ? p.changeKg > 0 : Math.abs(p.changeKg) <= 1;
}

export function WeightChartFor({ progress, l, compact = false }: { progress: Progress; l: Locale; compact?: boolean }) {
  if (progress.weights.length === 0) return null;
  const c = copy[l];
  return (
    <TimeChart
      compact={compact}
      height={compact ? 200 : 280}
      unit="kg"
      measured={{ label: c.yourWeight, points: progress.weights }}
      projection={progress.projection.length > 1 ? { label: c.expected, points: progress.projection } : undefined}
      reference={progress.targetKg !== null ? { v: progress.targetKg, label: c.target } : undefined}
      description={c.chartDescription(
        formatNumber(progress.startKg ?? 0, 1, l),
        formatNumber(progress.currentKg ?? 0, 1, l),
        progress.targetKg !== null ? formatNumber(progress.targetKg, 1, l) : null,
      )}
    />
  );
}

export function OverviewTab({ view, base, demo, notice, l }: { view: AccountView; base: string; demo: boolean; notice: AccountNotice; l: Locale }) {
  const c = copy[l];
  const progress = buildProgress(view, l);
  const activeSubs = view.orders.filter((o) => o.manageable && (o.status === "active" || o.status === "past_due"));
  const mainSub = activeSubs[0] ?? null;
  const openCheckin = activeSubs.find((o) => o.checkin?.status === "open" || o.checkin?.status === "overdue")?.checkin ?? null;
  const { latestSeq, current } = currentPeriod(view.plans);
  const busy = current.some((p) => p.status !== "ready" && !p.failed);
  const next = nextPlanText(mainSub?.checkin ?? null, l);
  const allPdfHref = localePath(l, demo ? "/voorbeeld/pdf/alles" : `/account/pdf?periode=${latestSeq}`);
  const weekly = weeklyOrder(view)?.weekly ?? null;
  const lastChange = [...view.weekly]
    .reverse()
    .find((w) => w.seq === latestSeq && w.adjustment && (w.adjustment.kcal !== 0 || w.adjustment.training));

  return (
    <div className="space-y-6">
      {busy && !demo && <PlanStatusRefresher />}

      {notice === "checkin" && (
        <div role="status" className="rounded-[var(--radius-card)] border-2 border-brand-200 bg-brand-50 p-6">
          <h2 className="text-lg font-bold">{c.checkinDoneTitle}</h2>
          <p className="mt-1 text-[0.9375rem]">{c.checkinDoneText}</p>
        </div>
      )}

      {openCheckin && notice !== "checkin" && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border-2 border-lime-glow bg-[#f6fbe8] p-5 sm:p-6">
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 size-6 shrink-0 text-brand-600" aria-hidden />
            <div>
              <h2 className="text-lg font-extrabold">{openCheckin.status === "overdue" ? c.overdueTitle : c.openTitle}</h2>
              <p className="mt-1 text-[0.9375rem]">{c.openText(openCheckin.seq)}</p>
            </div>
          </div>
          <Link href={accountHref(base, "check-in")} className="btn-primary !py-2.5 text-sm">
            {c.openCta} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      )}

      {!openCheckin && weekly?.status === "open" && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border-2 border-brand-200 bg-brand-50 p-5 sm:p-6">
          <div className="flex gap-3">
            <Scale className="mt-0.5 size-6 shrink-0 text-brand-600" aria-hidden />
            <div>
              <h2 className="text-lg font-extrabold">{c.weeklyTitle(weekly.week)}</h2>
              <p className="mt-1 text-[0.9375rem]">{c.weeklyText}</p>
            </div>
          </div>
          <Link href={`${accountHref(base, "check-in")}#weegmoment`} className="btn-primary !py-2.5 text-sm">
            {c.weeklyCta} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      )}

      {/* Kerncijfers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={c.weightNow}
          value={progress.currentKg !== null ? `${formatNumber(progress.currentKg, 1, l)} kg` : "–"}
          sub={progress.currentAt ? c.measuredOn(formatDate(new Date(progress.currentAt), l)) : undefined}
        />
        <StatTile
          label={c.sinceStart}
          value={progress.changeKg !== null ? signedKg(progress.changeKg, l) : "–"}
          sub={progress.startKg !== null ? c.startSub(formatNumber(progress.startKg, 1, l)) : undefined}
          tone={changeIsGood(progress) ? "good" : "default"}
        />
        <StatTile
          label={progress.toGoKg !== null ? c.toTarget : c.yourGoal}
          value={progress.toGoKg !== null ? (progress.toGoKg === 0 ? c.reached : `${formatNumber(progress.toGoKg, 1, l)} kg`) : (progress.goalLabel ?? "–")}
          sub={progress.targetKg !== null ? c.goalSub(formatNumber(progress.targetKg, 1, l)) : undefined}
          tone={progress.toGoKg === 0 ? "good" : "default"}
        />
        <StatTile
          label={c.nextPlan}
          value={mainSub ? next.title.replace(/ \((vanaf|from) .*\)$/, "") : "–"}
          sub={mainSub?.checkin ? c.periodSub(mainSub.checkin.seq) : undefined}
        />
      </div>

      {view.health && (
        <HealthOverviewCard
          health={view.health}
          progressHref={accountHref(base, "voortgang")}
          connectHref={`${accountHref(base, "gegevens")}#koppelingen`}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Section
          title={c.yourWeight}
          intro={c.weightIntro}
          action={
            <Link href={accountHref(base, "voortgang")} className="inline-flex items-center gap-1 text-sm font-bold text-brand-700">
              {c.allProgress} <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        >
          {progress.goalShare !== null && progress.startKg !== null && progress.currentKg !== null && progress.targetKg !== null && (
            <div className="mb-5">
              <GoalMeter startKg={progress.startKg} currentKg={progress.currentKg} targetKg={progress.targetKg} share={progress.goalShare} l={l} />
            </div>
          )}
          {progress.weights.length > 0 ? <WeightChartFor progress={progress} l={l} compact /> : <p className="text-sm text-muted">{c.noWeights}</p>}
        </Section>

        <Section
          title={latestSeq > 1 ? c.plansPeriod(latestSeq) : c.plans}
          action={
            <Link href={accountHref(base, "schemas")} className="inline-flex items-center gap-1 text-sm font-bold text-brand-700">
              {c.allPlans} <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        >
          <PlanCards plans={current} l={l} compact />
          {current.some((p) => p.status === "ready") && (
            <a href={allPdfHref} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline">
              <Download className="size-4" aria-hidden /> {current.length > 1 ? c.downloadAll : c.download}
            </a>
          )}
          {lastChange?.adjustment && (
            <Link
              href={accountHref(base, "schemas")}
              className="mt-4 flex items-start gap-2 rounded-2xl bg-brand-50 p-3 text-sm hover:bg-brand-100"
            >
              <SlidersHorizontal className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
              <span>
                <strong>{c.adjustedAfter(lastChange.week)}</strong>{" "}
                {[
                  lastChange.adjustment.kcal
                    ? c.kcalPerDay(`${lastChange.adjustment.kcal > 0 ? "+" : "−"}${Math.abs(lastChange.adjustment.kcal)}`)
                    : null,
                  lastChange.adjustment.training ? c.workouts(lastChange.adjustment.training) : null,
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
        <h2 className="text-lg font-bold">{c.helpTitle}</h2>
        <p className="mt-1 text-[0.9375rem] text-muted">
          {c.helpBefore}{" "}
          <Link href="/contact#veelgestelde-vragen" className="font-semibold text-brand-700 underline">
            {c.faq}
          </Link>{" "}
          {c.or}{" "}
          <Link href="/contact" className="font-semibold text-brand-700 underline">
            {c.contact}
          </Link>
          {c.respond(site.responseTimeDays)}
        </p>
      </section>
    </div>
  );
}

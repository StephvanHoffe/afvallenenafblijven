import { healthSuggestion } from "@/lib/health/suggest";
import { latestPeriodStart } from "@/lib/progress";
import Link from "@/i18n/Link";
import { Bell, BellOff, CircleCheck, Loader2, Scale } from "lucide-react";
import { setWeeklyReminderPreference } from "@/app/[lang]/(site)/account/actions";
import { WeeklyForm } from "@/app/[lang]/(site)/account/WeeklyForm";
import { DemoButton } from "@/components/account/DemoButton";
import { PlanStatusRefresher } from "@/components/account/PlanStatusRefresher";
import { defineCopy, type Locale } from "@/i18n/config";
import { checkinLabel } from "@/i18n/options";
import type { AccountNotice, AccountView, DashboardOrder } from "@/lib/account-types";
import { formatDate, formatNumber } from "@/lib/format";
import type { TrainingDirection, WeeklyLog } from "@/lib/weekly";

const copy = defineCopy({
  nl: {
    saved: (week: number, kg: string) => `Weegmoment week ${week} opgeslagen: ${kg} kg`,
    pending: "We werken je aanwijzingen uit; dat duurt ongeveer een halve minuut.",
    alsoBefore: "De aanpassingen staan ook bovenaan je",
    alsoLink: "schema's",
    alsoAfter: "en in de PDF.",
    title: (week: number | null) => `Weegmoment${week ? ` week ${week}` : ""}`,
    intro: "Elke week een korte meting tussen de check-ins. Wijkt je voortgang af, dan sturen we je schema meteen bij.",
    period: (seq: number) => `Periode ${seq}`,
    checkinFirst: "Deze periode is bijna voorbij: vul nu je check-in in. Daarna gaan de weegmomenten van je nieuwe periode van start.",
    none: "Er is op dit moment geen weegmoment. Met een lopend schema kun je elke week je gewicht en hoe het gaat doorgeven.",
    nextBefore: "Je volgende weegmoment is vanaf",
    lastTime: (kg: string) => ` Vorige keer: ${kg} kg.`,
    allDone: "Je hebt alle weegmomenten van deze periode ingevuld.",
    checkinOpensBefore: "Je check-in opent op",
    reminder: "Herinnering per e-mail:",
    on: "aan",
    off: "uit",
    turnOff: "Zet uit",
    turnOn: "Zet aan",
    historyTitle: "Je weegmomenten",
    moment: "Moment",
    date: "Datum",
    weight: "Gewicht",
    hunger: "Honger",
    training: "Training",
    adjusted: "Bijgestuurd",
    periodWeek: (seq: number, week: number) => `Periode ${seq}, week ${week}`,
    trainingDir: (dir: TrainingDirection) => `training ${dir}`,
    busy: "Bezig…",
    onTrack: "Op koers",
  },
  en: {
    saved: (week: number, kg: string) => `Weigh-in for week ${week} saved: ${kg} kg`,
    pending: "We're working out your adjustments; this takes about half a minute.",
    alsoBefore: "The changes are also shown at the top of your",
    alsoLink: "plans",
    alsoAfter: "and in the PDF.",
    title: (week: number | null) => `Weekly weigh-in${week ? `, week ${week}` : ""}`,
    intro: "A quick check every week between check-ins. If your progress is off track, we'll adjust your plan straight away.",
    period: (seq: number) => `Period ${seq}`,
    checkinFirst: "This period is almost over: complete your check-in now. After that, the weekly weigh-ins for your new period begin.",
    none: "There's no weekly weigh-in right now. With an active plan, you can share your weight and how things are going every week.",
    nextBefore: "Your next weekly weigh-in opens on",
    lastTime: (kg: string) => ` Last time: ${kg} kg.`,
    allDone: "You've completed all the weekly weigh-ins for this period.",
    checkinOpensBefore: "Your check-in opens on",
    reminder: "Email reminder:",
    on: "on",
    off: "off",
    turnOff: "Turn off",
    turnOn: "Turn on",
    historyTitle: "Your weekly weigh-ins",
    moment: "Weigh-in",
    date: "Date",
    weight: "Weight",
    hunger: "Hunger",
    training: "Training",
    adjusted: "Adjusted",
    periodWeek: (seq: number, week: number) => `Period ${seq}, week ${week}`,
    trainingDir: (dir: TrainingDirection) => `training ${{ zwaarder: "harder", lichter: "lighter", eenvoudiger: "simpler" }[dir]}`,
    busy: "In progress…",
    onTrack: "On track",
  },
});

/** De bestelling waarvoor het weegmoment geldt: het lopende abonnement, of anders een los schema. */
export function weeklyOrder(view: AccountView): DashboardOrder | null {
  return view.orders.find((o) => o.weekly && o.manageable) ?? view.orders.find((o) => o.weekly) ?? null;
}

/** Wat er na een weegmoment is gebeurd, in een paar regels. */
export function WeeklyResult({ log, base, l }: { log: WeeklyLog; base: string; l: Locale }) {
  const c = copy[l];
  const a = log.adjustment;
  const pending = log.status !== "ready";
  const changed = Boolean(a && (a.kcal !== 0 || a.training));
  return (
    <div role="status" className={`rounded-2xl p-4 sm:p-5 ${changed ? "border-2 border-brand-200 bg-brand-50" : "bg-sand"}`}>
      <p className="flex items-center gap-2 font-extrabold">
        <CircleCheck className="size-5 text-brand-600" aria-hidden /> {c.saved(log.week, formatNumber(log.data.weightKg, 1, l))}
      </p>
      <p className="mt-1 text-[0.9375rem]">{a?.message}</p>
      {a?.nutritionReason && <p className="mt-2 text-sm">{a.nutritionReason}</p>}
      {a?.trainingReason && <p className="mt-1 text-sm">{a.trainingReason}</p>}
      {pending ? (
        <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
          <Loader2 className="size-4 animate-spin" aria-hidden /> {c.pending}
        </p>
      ) : (
        changed && (
          <ul className="mt-3 space-y-1.5 text-[0.9375rem]">
            {a?.nutrition?.swaps.map((s) => (
              <li key={s.meal + s.change}>
                <strong>{s.meal}:</strong> {s.change}
              </li>
            ))}
            {a?.trainingPlan?.changes.map((x) => (
              <li key={x.exercise + x.change}>
                <strong>{x.exercise}:</strong> {x.change}
              </li>
            ))}
          </ul>
        )
      )}
      {changed && !pending && (
        <p className="mt-3 text-sm">
          {c.alsoBefore}{" "}
          <Link href={`${base}/schemas`} className="font-semibold text-brand-700 underline">
            {c.alsoLink}
          </Link>{" "}
          {c.alsoAfter}
        </p>
      )}
    </div>
  );
}

export function WeeklySection({ view, base, demo, notice, l }: { view: AccountView; base: string; demo: boolean; notice: AccountNotice; l: Locale }) {
  const c = copy[l];
  const order = weeklyOrder(view);
  const w = order?.weekly ?? null;
  const periodLogs = w ? view.weekly.filter((x) => x.seq === w.seq) : [];
  const latest = periodLogs.at(-1) ?? null;
  const pending = periodLogs.some((x) => x.status !== "ready");
  const checkin = order?.checkin ?? null;

  return (
    <section id="weegmoment" className="card scroll-mt-24 p-6 sm:p-8">
      {pending && !demo && <PlanStatusRefresher />}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="heading-md flex items-center gap-2">
            <Scale className="size-6 text-brand-600" aria-hidden /> {c.title(w ? w.week : null)}
          </h2>
          <p className="mt-1 text-sm text-muted">{c.intro}</p>
        </div>
        {w && <span className="rounded-full bg-sand px-3 py-1 text-xs font-bold">{c.period(w.seq)}</span>}
      </div>

      {notice === "weegmoment" && latest && (
        <div className="mt-5">
          <WeeklyResult log={latest} base={base} l={l} />
        </div>
      )}

      <div className="mt-5">
        {!order || !w ? (
          <p className="text-[0.9375rem] text-muted">{checkin?.status === "open" || checkin?.status === "overdue" ? c.checkinFirst : c.none}</p>
        ) : w.status === "open" ? (
          notice === "weegmoment" ? null : (
            <WeeklyForm
              orderId={order.id}
              seq={w.seq}
              week={w.week}
              product={order.product}
              lastWeightKg={order.lastWeightKg}
              demo={demo}
              suggestion={healthSuggestion(view.health, l, "week", latestPeriodStart(view))}
            />
          )
        ) : w.status === "upcoming" ? (
          <p className="text-[0.9375rem]">
            {c.nextBefore} <strong>{formatDate(w.opensAt, l)}</strong>.
            {latest && notice !== "weegmoment" ? c.lastTime(formatNumber(latest.data.weightKg, 1, l)) : ""}
          </p>
        ) : (
          <p className="text-[0.9375rem]">
            {c.allDone}
            {checkin ? (
              <>
                {" "}
                {c.checkinOpensBefore} <strong>{formatDate(checkin.opensAt, l)}</strong>.
              </>
            ) : null}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm">
        <p className="flex items-center gap-2 text-muted">
          {view.weeklyReminders ? <Bell className="size-4" aria-hidden /> : <BellOff className="size-4" aria-hidden />}
          {c.reminder} <strong className="text-ink">{view.weeklyReminders ? c.on : c.off}</strong>
        </p>
        {demo ? (
          <DemoButton className="font-bold text-brand-700 hover:underline">{view.weeklyReminders ? c.turnOff : c.turnOn}</DemoButton>
        ) : (
          <form action={setWeeklyReminderPreference}>
            <input type="hidden" name="aan" value={view.weeklyReminders ? "0" : "1"} />
            <button type="submit" className="font-bold text-brand-700 hover:underline">
              {view.weeklyReminders ? c.turnOff : c.turnOn}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

/** Tabel met alle weegmomenten en wat er toen is bijgestuurd. */
export function WeeklyHistory({ logs, l }: { logs: WeeklyLog[]; l: Locale }) {
  if (logs.length === 0) return null;
  const c = copy[l];
  const rows = [...logs].reverse();
  const answer = (v: string | undefined) => (v == null ? "–" : checkinLabel(l, v));
  return (
    <section>
      <h2 className="heading-md mb-4">{c.historyTitle}</h2>
      <div className="relative overflow-x-auto rounded-[var(--radius-card)] border border-line bg-white">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="bg-sand text-xs font-bold tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-2.5">{c.moment}</th>
              <th className="px-4 py-2.5">{c.date}</th>
              <th className="px-4 py-2.5 text-right">{c.weight}</th>
              <th className="px-4 py-2.5">{c.hunger}</th>
              <th className="px-4 py-2.5">{c.training}</th>
              <th className="px-4 py-2.5">{c.adjusted}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((x) => {
              const a = x.adjustment;
              const changes = [a?.kcal ? `${a.kcal > 0 ? "+" : "−"}${Math.abs(a.kcal)} kcal` : null, a?.training ? c.trainingDir(a.training) : null].filter(Boolean);
              return (
                <tr key={`${x.seq}-${x.week}`}>
                  <td className="px-4 py-2.5 font-semibold whitespace-nowrap">{c.periodWeek(x.seq, x.week)}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(x.date, l)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatNumber(x.data.weightKg, 1, l)} kg</td>
                  <td className="px-4 py-2.5">{answer(x.data.hunger)}</td>
                  <td className="px-4 py-2.5">{answer(x.data.difficulty ?? x.data.trainingAdherence)}</td>
                  <td className="px-4 py-2.5">{x.status !== "ready" ? c.busy : changes.length ? changes.join(", ") : c.onTrack}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

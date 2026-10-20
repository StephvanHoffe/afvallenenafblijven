import Link from "next/link";
import { Bell, BellOff, CircleCheck, Loader2, Scale } from "lucide-react";
import { setWeeklyReminderPreference } from "@/app/(site)/account/actions";
import { WeeklyForm } from "@/app/(site)/account/WeeklyForm";
import { DemoButton } from "@/components/account/DemoButton";
import { PlanStatusRefresher } from "@/components/account/PlanStatusRefresher";
import type { AccountNotice, AccountView, DashboardOrder } from "@/lib/account-types";
import { formatDate, formatNumber } from "@/lib/format";
import type { WeeklyLog } from "@/lib/weekly";

/** De bestelling waarvoor het weegmoment geldt: het lopende abonnement, of anders een los schema. */
export function weeklyOrder(view: AccountView): DashboardOrder | null {
  return view.orders.find((o) => o.weekly && o.manageable) ?? view.orders.find((o) => o.weekly) ?? null;
}

/** Wat er na een weegmoment is gebeurd, in een paar regels. */
export function WeeklyResult({ log, base }: { log: WeeklyLog; base: string }) {
  const a = log.adjustment;
  const pending = log.status !== "ready";
  const changed = Boolean(a && (a.kcal !== 0 || a.training));
  return (
    <div role="status" className={`rounded-2xl p-4 sm:p-5 ${changed ? "border-2 border-brand-200 bg-brand-50" : "bg-sand"}`}>
      <p className="flex items-center gap-2 font-extrabold">
        <CircleCheck className="size-5 text-brand-600" aria-hidden /> Weegmoment week {log.week} opgeslagen: {formatNumber(log.data.weightKg, 1)} kg
      </p>
      <p className="mt-1 text-[0.9375rem]">{a?.message}</p>
      {a?.nutritionReason && <p className="mt-2 text-sm">{a.nutritionReason}</p>}
      {a?.trainingReason && <p className="mt-1 text-sm">{a.trainingReason}</p>}
      {pending ? (
        <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
          <Loader2 className="size-4 animate-spin" aria-hidden /> We werken je aanwijzingen uit; dat duurt ongeveer een halve minuut.
        </p>
      ) : (
        changed && (
          <ul className="mt-3 space-y-1.5 text-[0.9375rem]">
            {a?.nutrition?.swaps.map((s) => (
              <li key={s.meal + s.change}>
                <strong>{s.meal}:</strong> {s.change}
              </li>
            ))}
            {a?.trainingPlan?.changes.map((c) => (
              <li key={c.exercise + c.change}>
                <strong>{c.exercise}:</strong> {c.change}
              </li>
            ))}
          </ul>
        )
      )}
      {changed && !pending && (
        <p className="mt-3 text-sm">
          De aanpassingen staan ook bovenaan je{" "}
          <Link href={`${base}/schemas`} className="font-semibold text-brand-700 underline">
            schema&apos;s
          </Link>{" "}
          en in de PDF.
        </p>
      )}
    </div>
  );
}

export function WeeklySection({ view, base, demo, notice }: { view: AccountView; base: string; demo: boolean; notice: AccountNotice }) {
  const order = weeklyOrder(view);
  const w = order?.weekly ?? null;
  const periodLogs = w ? view.weekly.filter((l) => l.seq === w.seq) : [];
  const latest = periodLogs.at(-1) ?? null;
  const pending = periodLogs.some((l) => l.status !== "ready");
  const checkin = order?.checkin ?? null;

  return (
    <section id="weegmoment" className="card scroll-mt-24 p-6 sm:p-8">
      {pending && !demo && <PlanStatusRefresher />}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="heading-md flex items-center gap-2">
            <Scale className="size-6 text-brand-600" aria-hidden /> Weegmoment{w ? ` week ${w.week}` : ""}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Elke week een korte meting tussen de check-ins. Wijkt je voortgang af, dan sturen we je schema meteen bij.
          </p>
        </div>
        {w && <span className="rounded-full bg-sand px-3 py-1 text-xs font-bold">Periode {w.seq}</span>}
      </div>

      {notice === "weegmoment" && latest && (
        <div className="mt-5">
          <WeeklyResult log={latest} base={base} />
        </div>
      )}

      <div className="mt-5">
        {!order || !w ? (
          <p className="text-[0.9375rem] text-muted">
            {checkin?.status === "open" || checkin?.status === "overdue"
              ? "Deze periode is bijna voorbij: vul nu je check-in in. Daarna gaan de weegmomenten van je nieuwe periode van start."
              : "Er is op dit moment geen weegmoment. Met een lopend schema kun je elke week je gewicht en hoe het gaat doorgeven."}
          </p>
        ) : w.status === "open" ? (
          notice === "weegmoment" ? null : (
            <WeeklyForm orderId={order.id} seq={w.seq} week={w.week} product={order.product} lastWeightKg={order.lastWeightKg} demo={demo} />
          )
        ) : w.status === "upcoming" ? (
          <p className="text-[0.9375rem]">
            Je volgende weegmoment is vanaf <strong>{formatDate(w.opensAt)}</strong>.
            {latest && notice !== "weegmoment" ? ` Vorige keer: ${formatNumber(latest.data.weightKg, 1)} kg.` : ""}
          </p>
        ) : (
          <p className="text-[0.9375rem]">
            Je hebt alle weegmomenten van deze periode ingevuld.
            {checkin ? (
              <>
                {" "}
                Je check-in opent op <strong>{formatDate(checkin.opensAt)}</strong>.
              </>
            ) : null}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm">
        <p className="flex items-center gap-2 text-muted">
          {view.weeklyReminders ? <Bell className="size-4" aria-hidden /> : <BellOff className="size-4" aria-hidden />}
          Herinnering per e-mail: <strong className="text-ink">{view.weeklyReminders ? "aan" : "uit"}</strong>
        </p>
        {demo ? (
          <DemoButton className="font-bold text-brand-700 hover:underline">{view.weeklyReminders ? "Zet uit" : "Zet aan"}</DemoButton>
        ) : (
          <form action={setWeeklyReminderPreference}>
            <input type="hidden" name="aan" value={view.weeklyReminders ? "0" : "1"} />
            <button type="submit" className="font-bold text-brand-700 hover:underline">
              {view.weeklyReminders ? "Zet uit" : "Zet aan"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

/** Tabel met alle weegmomenten en wat er toen is bijgestuurd. */
export function WeeklyHistory({ logs }: { logs: WeeklyLog[] }) {
  if (logs.length === 0) return null;
  const rows = [...logs].reverse();
  return (
    <section>
      <h2 className="heading-md mb-4">Je weegmomenten</h2>
      <div className="relative overflow-x-auto rounded-[var(--radius-card)] border border-line bg-white">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="bg-sand text-xs font-bold tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-2.5">Moment</th>
              <th className="px-4 py-2.5">Datum</th>
              <th className="px-4 py-2.5 text-right">Gewicht</th>
              <th className="px-4 py-2.5">Honger</th>
              <th className="px-4 py-2.5">Training</th>
              <th className="px-4 py-2.5">Bijgestuurd</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((l) => {
              const a = l.adjustment;
              const changes = [a?.kcal ? `${a.kcal > 0 ? "+" : "−"}${Math.abs(a.kcal)} kcal` : null, a?.training ? `training ${a.training}` : null].filter(Boolean);
              return (
                <tr key={`${l.seq}-${l.week}`}>
                  <td className="px-4 py-2.5 font-semibold whitespace-nowrap">
                    Periode {l.seq}, week {l.week}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(l.date)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatNumber(l.data.weightKg, 1)} kg</td>
                  <td className="px-4 py-2.5">{l.data.hunger ?? "–"}</td>
                  <td className="px-4 py-2.5">{l.data.difficulty ?? l.data.trainingAdherence ?? "–"}</td>
                  <td className="px-4 py-2.5">{l.status !== "ready" ? "Bezig…" : changes.length ? changes.join(", ") : "Op koers"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

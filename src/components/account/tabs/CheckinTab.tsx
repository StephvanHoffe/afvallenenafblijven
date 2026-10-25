import { healthSuggestion } from "@/lib/health/suggest";
import { latestPeriodStart } from "@/lib/progress";
import { CheckinForm } from "@/app/[lang]/(site)/account/CheckinForm";
import { productFor } from "@/config/pricing";
import { WeeklyHistory, WeeklySection } from "@/components/account/tabs/WeeklySection";
import { defineCopy, type Locale } from "@/i18n/config";
import type { AccountNotice, AccountView } from "@/lib/account-types";
import { describeCheckin } from "@/lib/checkin";
import { formatDate, formatDayDate } from "@/lib/format";

const copy = defineCopy({
  nl: {
    title: "Check-in",
    none: "Je hebt op dit moment geen lopend abonnement met een check-in. Met een abonnement vul je aan het einde van elke periode een korte check-in in, en maken we daarop je nieuwe schema.",
    titleFor: (seq: number) => `Check-in voor periode ${seq}`,
    opensDated: (opens: string, advised: string, start: string) =>
      `Je check-in opent op ${opens}. Vul hem uiterlijk ${advised} in, dan staat je nieuwe schema met boodschappenlijst op tijd klaar voor ${start}, en kun je in het weekend je boodschappen doen. Je krijgt een e-mail zodra hij opent.`,
    timing:
      "Waarom niet eerder? We maken je nieuwe schema bewust pas vlak voor de nieuwe periode, zodat het aansluit op hoe het nu met je gaat.",
    why: "Je nieuwe schema maken we pas na je check-in. Zo past het precies bij je voortgang: meer of minder eten, zwaarder of lichter trainen, of overstappen op op gewicht blijven als je je doel hebt bereikt.",
    preview: "Bekijk hoe de check-in eruitziet",
    submitted: "Je check-in is ontvangen. Je nieuwe schema wordt gemaakt.",
    overdue: "Je nieuwe periode is begonnen. Vul je check-in in, dan staat je nieuwe schema binnen 2 uur klaar; tot die tijd volg je je huidige schema.",
    open: (advised: string, start: string) =>
      `Je nieuwe periode start op ${start}. Vul je check-in uiterlijk ${advised} in, dan staat je nieuwe schema met boodschappenlijst op tijd klaar voor je boodschappen. Het nieuwe schema start op ${start}; tot die tijd volg je je huidige schema.`,
    duration: "Het kost je ongeveer 2 minuten.",
    history: "Je eerdere check-ins",
    forPeriod: (seq: number) => `Voor periode ${seq}`,
  },
  en: {
    title: "Check-in",
    none: "You don't currently have an active subscription with a check-in. With a subscription, you complete a short check-in at the end of each period, and we use it to create your new plan.",
    titleFor: (seq: number) => `Check-in for period ${seq}`,
    opensDated: (opens: string, advised: string, start: string) =>
      `Your check-in opens on ${opens}. Fill it in by ${advised}, and your new plan with shopping list will be ready in time for ${start}, so you can do your shopping at the weekend. We'll email you as soon as it opens.`,
    timing:
      "Why not earlier? We deliberately create your new plan just before the new period, so it matches how you're doing right now.",
    why: "We only create your new plan after your check-in. That way it matches your progress exactly: eating more or less, training harder or lighter, or switching to maintaining your weight once you've reached your goal.",
    preview: "See what the check-in looks like",
    submitted: "We've received your check-in. Your new plan is being created.",
    overdue: "Your new period has started. Complete your check-in and your new plan will be ready within 2 hours; until then, keep following your current plan.",
    open: (advised: string, start: string) =>
      `Your new period starts on ${start}. Fill in your check-in by ${advised}, and your new plan with shopping list will be ready in time for your shopping. The new plan starts on ${start}; until then, keep following your current plan.`,
    duration: "It takes about 2 minutes.",
    history: "Your previous check-ins",
    forPeriod: (seq: number) => `For period ${seq}`,
  },
});

export function CheckinTab({ view, base, demo, notice, l }: { view: AccountView; base: string; demo: boolean; notice: AccountNotice; l: Locale }) {
  const t = copy[l];
  const withCheckin = view.orders.filter((o) => o.manageable && (o.status === "active" || o.status === "past_due") && o.checkin);
  const history = [...view.checkins].reverse();
  const suggestion = healthSuggestion(view.health, l, "period", latestPeriodStart(view));

  return (
    <div className="space-y-8">
      <WeeklySection view={view} base={base} demo={demo} notice={notice} l={l} />

      {withCheckin.length === 0 && (
        <section className="card p-6 sm:p-8">
          <h2 className="heading-md">{t.title}</h2>
          <p className="mt-2 text-muted">{t.none}</p>
        </section>
      )}

      {withCheckin.map((o) => {
        const c = o.checkin!;
        return (
          <section key={o.id} id="check-in" className="card scroll-mt-24 p-6 sm:p-8">
            <h2 className="heading-md">{t.titleFor(c.seq)}</h2>
            {withCheckin.length > 1 && <p className="mt-1 text-sm font-semibold text-muted">{productFor(o.product, l).name}</p>}
            {c.status === "upcoming" ? (
              <div className="mt-3 space-y-2 text-[0.9375rem] text-muted">
                <p>{t.opensDated(formatDayDate(c.opensAt, l), formatDayDate(c.advisedBy, l), formatDayDate(c.dueAt, l))}</p>
                <p>{t.why}</p>
                <p>{t.timing}</p>
                {demo && (
                  <details className="pt-2">
                    <summary className="cursor-pointer font-bold text-brand-700">{t.preview}</summary>
                    <div className="mt-4 text-ink">
                      <CheckinForm orderId={o.id} seq={c.seq} product={o.product} lastWeightKg={o.lastWeightKg} demo suggestion={suggestion} />
                    </div>
                  </details>
                )}
              </div>
            ) : c.status === "submitted" ? (
              <p className="mt-3 text-[0.9375rem] text-muted">{t.submitted}</p>
            ) : (
              <>
                <p className="mt-2 mb-6 text-muted">
                  {c.status === "overdue" ? t.overdue : t.open(formatDayDate(c.advisedBy, l), formatDayDate(c.dueAt, l))} {t.duration}
                </p>
                <CheckinForm orderId={o.id} seq={c.seq} product={o.product} lastWeightKg={o.lastWeightKg} demo={demo} suggestion={suggestion} />
              </>
            )}
          </section>
        );
      })}

      <WeeklyHistory logs={view.weekly} l={l} />

      {history.length > 0 && (
        <section>
          <h2 className="heading-md mb-4">{t.history}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {history.map((ci) => (
              <article key={ci.date.toString()} className="card p-5">
                <p className="font-extrabold">{ci.seq ? t.forPeriod(ci.seq) : t.title}</p>
                <p className="text-sm text-muted">{formatDate(ci.date, l)}</p>
                <dl className="mt-3 grid grid-cols-[9.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                  {describeCheckin(ci.data, l).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-muted">{k}</dt>
                      <dd className="break-words">{v}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

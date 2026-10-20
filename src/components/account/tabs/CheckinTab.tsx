import { CheckinForm } from "@/app/(site)/account/CheckinForm";
import { products } from "@/config/pricing";
import type { AccountView } from "@/lib/account-types";
import { describeCheckin } from "@/lib/checkin";
import { formatDate } from "@/lib/format";

export function CheckinTab({ view, demo }: { view: AccountView; demo: boolean }) {
  const withCheckin = view.orders.filter((o) => o.manageable && (o.status === "active" || o.status === "past_due") && o.checkin);
  const history = [...view.checkins].reverse();

  return (
    <div className="space-y-8">
      {withCheckin.length === 0 && (
        <section className="card p-6 sm:p-8">
          <h2 className="heading-md">Check-in</h2>
          <p className="mt-2 text-muted">
            Je hebt op dit moment geen lopend abonnement met een check-in. Met een abonnement vul je aan het einde van elke
            periode een korte check-in in, en maken we daarop je nieuwe schema.
          </p>
        </section>
      )}

      {withCheckin.map((o) => {
        const c = o.checkin!;
        return (
          <section key={o.id} id="check-in" className="card scroll-mt-24 p-6 sm:p-8">
            <h2 className="heading-md">Check-in voor periode {c.seq}</h2>
            {withCheckin.length > 1 && <p className="mt-1 text-sm font-semibold text-muted">{products[o.product].name}</p>}
            {c.status === "upcoming" ? (
              <div className="mt-3 space-y-2 text-[0.9375rem] text-muted">
                <p>
                  Je check-in opent op <strong className="text-ink">{formatDate(c.opensAt)}</strong>, een paar dagen voor het
                  einde van je huidige periode. Je krijgt dan een e-mail.
                </p>
                <p>
                  Je nieuwe schema maken we pas na je check-in. Zo past het precies bij je voortgang: meer of minder eten,
                  zwaarder of lichter trainen, of overstappen op op gewicht blijven als je je doel hebt bereikt.
                </p>
              </div>
            ) : c.status === "submitted" ? (
              <p className="mt-3 text-[0.9375rem] text-muted">Je check-in is ontvangen. Je nieuwe schema wordt gemaakt.</p>
            ) : (
              <>
                <p className="mt-2 mb-6 text-muted">
                  {c.status === "overdue"
                    ? "Je huidige periode is voorbij. Vul je check-in in, dan maken we direct je nieuwe schema."
                    : `Je huidige periode loopt tot ${formatDate(c.dueAt)}. Vul je check-in in, dan maken we direct je nieuwe schema.`}{" "}
                  Het kost je ongeveer 2 minuten.
                </p>
                <CheckinForm orderId={o.id} seq={c.seq} product={o.product} lastWeightKg={o.lastWeightKg} demo={demo} />
              </>
            )}
          </section>
        );
      })}

      {history.length > 0 && (
        <section>
          <h2 className="heading-md mb-4">Je eerdere check-ins</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {history.map((ci) => (
              <article key={ci.date.toString()} className="card p-5">
                <p className="font-extrabold">{ci.seq ? `Voor periode ${ci.seq}` : "Check-in"}</p>
                <p className="text-sm text-muted">{formatDate(ci.date)}</p>
                <dl className="mt-3 grid grid-cols-[9.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                  {describeCheckin(ci.data).map(([k, v]) => (
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

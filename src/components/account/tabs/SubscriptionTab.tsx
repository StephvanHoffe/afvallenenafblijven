import Link from "next/link";
import { cancelSubscription, openBillingPortal, undoCancellation } from "@/app/(site)/account/actions";
import { DemoButton } from "@/components/account/DemoButton";
import { Pill, orderStatus } from "@/components/account/shared";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { durations, products } from "@/config/pricing";
import { site } from "@/config/site";
import type { AccountNotice, AccountView } from "@/lib/account-types";
import { formatDate } from "@/lib/format";

export function SubscriptionTab({ view, demo, notice }: { view: AccountView; demo: boolean; notice: AccountNotice }) {
  const activeSubs = view.orders.filter((o) => o.manageable && (o.status === "active" || o.status === "past_due"));
  const wantsCancel = notice === "opzeggen";

  return (
    <div className="space-y-6">
      {notice === "opgezegd" && (
        <div role="status" className="rounded-[var(--radius-card)] border-2 border-brand-200 bg-brand-50 p-6">
          <h2 className="text-lg font-bold">Je abonnement is opgezegd</h2>
          <p className="mt-1 text-[0.9375rem]">We hebben je een bevestiging per e-mail gestuurd. Hieronder zie je tot wanneer het nog loopt.</p>
        </div>
      )}
      {wantsCancel && activeSubs.length > 0 && (
        <div className="rounded-[var(--radius-card)] border-2 border-accent-200 bg-accent-50 p-6">
          <h2 className="text-lg font-bold">Abonnement opzeggen</h2>
          <p className="mt-1 text-[0.9375rem]">
            Klik op &quot;Bevestig opzeggen&quot; bij je abonnement hieronder. Je houdt toegang tot je schema&apos;s en ontvangt
            een bevestiging per e-mail.
          </p>
        </div>
      )}

      <section>
        <h2 className="heading-md mb-4">Abonnementen & bestellingen</h2>
        {view.orders.length === 0 && <p className="card p-6 text-muted">Je hebt nog geen bestellingen.</p>}
        <ul className="space-y-3">
          {view.orders.map((o) => {
            const status = orderStatus(o);
            return (
              <li key={o.id} className="card flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="space-y-1">
                  <p className="font-bold">
                    {products[o.product].name} ·{" "}
                    {o.duration === "eenmalig" ? "los schema" : o.duration === "1m" ? "per maand" : `minimaal ${durations[o.duration].label}`}
                  </p>
                  <p className="text-sm text-muted">
                    Besteld op {formatDate(o.createdAt)} · Bestelnummer {o.reference}
                  </p>
                  {o.manageable && o.status === "active" && !o.cancelAt && (
                    <p className="text-sm text-muted">
                      Maandelijks via automatische incasso
                      {o.commitmentEndsAt ? `, minimale looptijd tot ${formatDate(o.commitmentEndsAt)}` : ""}
                    </p>
                  )}
                  <Pill tone={status.tone}>{status.text}</Pill>
                </div>
                {o.manageable && (o.status === "active" || o.status === "past_due") && (
                  <div className="flex flex-wrap items-start gap-2">
                    {demo ? (
                      <DemoButton className="btn-secondary !px-4 !py-2.5 text-sm">Betaalgegevens & facturen</DemoButton>
                    ) : (
                      <form action={openBillingPortal}>
                        <SubmitButton className="btn-secondary !px-4 !py-2.5 text-sm">Betaalgegevens & facturen</SubmitButton>
                      </form>
                    )}
                    {o.cancelAt ? (
                      demo ? (
                        <DemoButton className="btn-secondary !px-4 !py-2.5 text-sm">Opzegging intrekken</DemoButton>
                      ) : (
                        <form action={undoCancellation}>
                          <input type="hidden" name="order" value={o.id} />
                          <SubmitButton className="btn-secondary !px-4 !py-2.5 text-sm">Opzegging intrekken</SubmitButton>
                        </form>
                      )
                    ) : (
                      <details className="group" open={wantsCancel}>
                        <summary
                          className={`${wantsCancel ? "btn-primary" : "btn-secondary"} cursor-pointer list-none !px-4 !py-2.5 text-sm [&::-webkit-details-marker]:hidden`}
                        >
                          Opzeggen
                        </summary>
                        <div className="mt-2 max-w-xs rounded-2xl bg-sand p-3 text-sm">
                          <p className="mb-2">
                            {o.commitmentEndsAt
                              ? `Je abonnement stopt aan het einde van de minimale looptijd (${formatDate(o.commitmentEndsAt)}).`
                              : "Je abonnement stopt aan het einde van de lopende maand."}{" "}
                            Je houdt toegang tot je schema&apos;s.
                          </p>
                          {demo ? (
                            <DemoButton className="btn-primary w-full !py-2.5 text-sm">Bevestig opzeggen</DemoButton>
                          ) : (
                            <form action={cancelSubscription}>
                              <input type="hidden" name="order" value={o.id} />
                              <SubmitButton className="btn-primary w-full !py-2.5 text-sm">Bevestig opzeggen</SubmitButton>
                            </form>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-sm text-muted">
          Wil je je bestelling herroepen? Gebruik dan de{" "}
          <Link href="/herroepen" className="font-semibold underline">
            herroepingsfunctie
          </Link>
          .
        </p>
      </section>

      <section className="rounded-[var(--radius-card)] bg-sand p-6">
        <h2 className="text-lg font-bold">Vragen over betalen of opzeggen?</h2>
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

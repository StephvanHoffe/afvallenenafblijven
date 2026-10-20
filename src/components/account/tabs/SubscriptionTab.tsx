import Link from "@/i18n/Link";
import { cancelSubscription, openBillingPortal, undoCancellation } from "@/app/[lang]/(site)/account/actions";
import { DemoButton } from "@/components/account/DemoButton";
import { Pill, orderStatus } from "@/components/account/shared";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { durationFor, productFor } from "@/config/pricing";
import { site } from "@/config/site";
import { defineCopy, type Locale } from "@/i18n/config";
import type { AccountNotice, AccountView } from "@/lib/account-types";
import { formatDate } from "@/lib/format";

const copy = defineCopy({
  nl: {
    cancelledTitle: "Je abonnement is opgezegd",
    cancelledText: "We hebben je een bevestiging per e-mail gestuurd. Hieronder zie je tot wanneer het nog loopt.",
    cancelTitle: "Abonnement opzeggen",
    cancelText:
      "Klik op \"Bevestig opzeggen\" bij je abonnement hieronder. Je houdt toegang tot je schema's en ontvangt een bevestiging per e-mail.",
    ordersTitle: "Abonnementen & bestellingen",
    noOrders: "Je hebt nog geen bestellingen.",
    oneOff: "los schema",
    monthly: "per maand",
    minimum: (label: string) => `minimaal ${label}`,
    ordered: (date: string, ref: string) => `Besteld op ${date} · Bestelnummer ${ref}`,
    debit: "Maandelijks via automatische incasso",
    commitment: (date: string) => `, minimale looptijd tot ${date}`,
    billing: "Betaalgegevens & facturen",
    undo: "Opzegging intrekken",
    cancel: "Opzeggen",
    endsAtCommitment: (date: string) => `Je abonnement stopt aan het einde van de minimale looptijd (${date}).`,
    endsAtMonth: "Je abonnement stopt aan het einde van de lopende maand.",
    keepAccess: "Je houdt toegang tot je schema's.",
    confirm: "Bevestig opzeggen",
    withdrawBefore: "Wil je je bestelling herroepen? Gebruik dan de",
    withdrawLink: "herroepingsfunctie",
    questionsTitle: "Vragen over betalen of opzeggen?",
    helpBefore: "Bekijk de",
    faq: "veelgestelde vragen",
    or: "of",
    contact: "neem contact op",
    respond: (days: number) => `. We reageren binnen ${days} werkdagen.`,
  },
  en: {
    cancelledTitle: "Your subscription has been cancelled",
    cancelledText: "We've sent you a confirmation by email. Below you can see how long it will still run.",
    cancelTitle: "Cancel subscription",
    cancelText:
      "Click \"Confirm cancellation\" next to your subscription below. You'll keep access to your plans and receive a confirmation by email.",
    ordersTitle: "Subscriptions & orders",
    noOrders: "You don't have any orders yet.",
    oneOff: "one-off plan",
    monthly: "monthly",
    minimum: (label: string) => `minimum ${label}`,
    ordered: (date: string, ref: string) => `Ordered on ${date} · Order number ${ref}`,
    debit: "Monthly by direct debit",
    commitment: (date: string) => `, minimum term until ${date}`,
    billing: "Payment details & invoices",
    undo: "Undo cancellation",
    cancel: "Cancel",
    endsAtCommitment: (date: string) => `Your subscription will end at the end of the minimum term (${date}).`,
    endsAtMonth: "Your subscription will end at the end of the current month.",
    keepAccess: "You'll keep access to your plans.",
    confirm: "Confirm cancellation",
    withdrawBefore: "Want to withdraw from your order? Use the",
    withdrawLink: "withdrawal function",
    questionsTitle: "Questions about payment or cancelling?",
    helpBefore: "Check the",
    faq: "frequently asked questions",
    or: "or",
    contact: "get in touch",
    respond: (days: number) => `. We respond within ${days} working days.`,
  },
});

export function SubscriptionTab({ view, demo, notice, l }: { view: AccountView; demo: boolean; notice: AccountNotice; l: Locale }) {
  const c = copy[l];
  const activeSubs = view.orders.filter((o) => o.manageable && (o.status === "active" || o.status === "past_due"));
  const wantsCancel = notice === "opzeggen";

  return (
    <div className="space-y-6">
      {notice === "opgezegd" && (
        <div role="status" className="rounded-[var(--radius-card)] border-2 border-brand-200 bg-brand-50 p-6">
          <h2 className="text-lg font-bold">{c.cancelledTitle}</h2>
          <p className="mt-1 text-[0.9375rem]">{c.cancelledText}</p>
        </div>
      )}
      {wantsCancel && activeSubs.length > 0 && (
        <div className="rounded-[var(--radius-card)] border-2 border-accent-200 bg-accent-50 p-6">
          <h2 className="text-lg font-bold">{c.cancelTitle}</h2>
          <p className="mt-1 text-[0.9375rem]">{c.cancelText}</p>
        </div>
      )}

      <section>
        <h2 className="heading-md mb-4">{c.ordersTitle}</h2>
        {view.orders.length === 0 && <p className="card p-6 text-muted">{c.noOrders}</p>}
        <ul className="space-y-3">
          {view.orders.map((o) => {
            const status = orderStatus(o, l);
            return (
              <li key={o.id} className="card flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="space-y-1">
                  <p className="font-bold">
                    {productFor(o.product, l).name} ·{" "}
                    {o.duration === "eenmalig" ? c.oneOff : o.duration === "1m" ? c.monthly : c.minimum(durationFor(o.duration, l).label)}
                  </p>
                  <p className="text-sm text-muted">{c.ordered(formatDate(o.createdAt, l), o.reference)}</p>
                  {o.manageable && o.status === "active" && !o.cancelAt && (
                    <p className="text-sm text-muted">
                      {c.debit}
                      {o.commitmentEndsAt ? c.commitment(formatDate(o.commitmentEndsAt, l)) : ""}
                    </p>
                  )}
                  <Pill tone={status.tone}>{status.text}</Pill>
                </div>
                {o.manageable && (o.status === "active" || o.status === "past_due") && (
                  <div className="flex flex-wrap items-start gap-2">
                    {demo ? (
                      <DemoButton className="btn-secondary !px-4 !py-2.5 text-sm">{c.billing}</DemoButton>
                    ) : (
                      <form action={openBillingPortal}>
                        <SubmitButton className="btn-secondary !px-4 !py-2.5 text-sm">{c.billing}</SubmitButton>
                      </form>
                    )}
                    {o.cancelAt ? (
                      demo ? (
                        <DemoButton className="btn-secondary !px-4 !py-2.5 text-sm">{c.undo}</DemoButton>
                      ) : (
                        <form action={undoCancellation}>
                          <input type="hidden" name="order" value={o.id} />
                          <SubmitButton className="btn-secondary !px-4 !py-2.5 text-sm">{c.undo}</SubmitButton>
                        </form>
                      )
                    ) : (
                      <details className="group" open={wantsCancel}>
                        <summary
                          className={`${wantsCancel ? "btn-primary" : "btn-secondary"} cursor-pointer list-none !px-4 !py-2.5 text-sm [&::-webkit-details-marker]:hidden`}
                        >
                          {c.cancel}
                        </summary>
                        <div className="mt-2 max-w-xs rounded-2xl bg-sand p-3 text-sm">
                          <p className="mb-2">
                            {o.commitmentEndsAt ? c.endsAtCommitment(formatDate(o.commitmentEndsAt, l)) : c.endsAtMonth} {c.keepAccess}
                          </p>
                          {demo ? (
                            <DemoButton className="btn-primary w-full !py-2.5 text-sm">{c.confirm}</DemoButton>
                          ) : (
                            <form action={cancelSubscription}>
                              <input type="hidden" name="order" value={o.id} />
                              <SubmitButton className="btn-primary w-full !py-2.5 text-sm">{c.confirm}</SubmitButton>
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
          {c.withdrawBefore}{" "}
          <Link href="/herroepen" className="font-semibold underline">
            {c.withdrawLink}
          </Link>
          .
        </p>
      </section>

      <section className="rounded-[var(--radius-card)] bg-sand p-6">
        <h2 className="text-lg font-bold">{c.questionsTitle}</h2>
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

import Link from "@/i18n/Link";
import { cancelSubscription, openBillingPortal, undoCancellation } from "@/app/[lang]/(site)/account/actions";
import { GuaranteeForm } from "@/app/[lang]/(site)/account/GuaranteeForm";
import { accountHref } from "@/components/account/AccountShell";
import { DemoButton } from "@/components/account/DemoButton";
import { Pill, orderStatus } from "@/components/account/shared";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { durationFor, productFor } from "@/config/pricing";
import { site } from "@/config/site";
import { defineCopy, type Locale } from "@/i18n/config";
import type { AccountNotice, AccountView } from "@/lib/account-types";
import { euro, formatDate } from "@/lib/format";
import { CANCEL_REASONS, cancelReasonLabel } from "@/lib/cancel-reasons";

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
    billing: "Betaalmethode wijzigen",
    paymentsBefore: "Je betalingen en facturen vind je onder",
    paymentsLink: "Betalingen",
    undo: "Opzegging intrekken",
    cancel: "Opzeggen",
    endsAtCommitment: (date: string) => `Je abonnement stopt aan het einde van de minimale looptijd (${date}).`,
    endsAtMonth: "Je abonnement stopt aan het einde van de lopende maand.",
    keepAccess: "Je houdt toegang tot je schema's.",
    confirm: "Bevestig opzeggen",
    reasonLabel: "Waarom stop je? (optioneel)",
    reasonNone: "Zeg ik liever niet",
    commentLabel: "Wil je nog iets kwijt? (optioneel)",
    commentPlaceholder: "Wat kunnen we beter doen?",
    withdrawBefore: "Wil je je bestelling herroepen? Gebruik dan de",
    withdrawLink: "herroepingsfunctie",
    questionsTitle: "Vragen over betalen of opzeggen?",
    helpBefore: "Bekijk de",
    faq: "veelgestelde vragen",
    or: "of",
    contact: "neem contact op",
    respond: (days: number) => `. We reageren binnen ${days} werkdagen.`,
    guaranteeTitle: "Niet tevreden? Geld-terug-garantie",
    guaranteeText: (date: string, amount: string, subscription: boolean) =>
      `Tot en met ${date} kun je je ${subscription ? "eerste betaling" : "betaling"} van ${amount} volledig terugvragen, zonder opgaaf van reden.${subscription ? " Je abonnement stopt dan direct." : ""}`,
    guaranteeAction: "Garantie aanvragen",
    guaranteeExample: (days: number) => `Voorbeeld: zo ziet dit eruit in de eerste ${days} dagen na je aankoop.`,
    guaranteeRequested: (date: string, days: number) =>
      `Je hebt op ${date} je eerste betaling teruggevraagd onder de garantie. We betalen binnen ${days} werkdagen terug en laten het je weten.`,
    guaranteeHandled: (date: string) => `Je garantie-aanvraag is op ${date} afgehandeld en je eerste betaling is terugbetaald.`,
    guaranteeTerms: "Lees de voorwaarden",
    requestedTitle: "Je garantie-aanvraag is ontvangen",
    requestedText: (days: number) =>
      `We hebben je een bevestiging per e-mail gestuurd en betalen je eerste betaling binnen ${days} werkdagen terug.`,
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
    billing: "Change payment method",
    paymentsBefore: "You'll find your payments and invoices under",
    paymentsLink: "Payments",
    undo: "Undo cancellation",
    cancel: "Cancel",
    endsAtCommitment: (date: string) => `Your subscription will end at the end of the minimum term (${date}).`,
    endsAtMonth: "Your subscription will end at the end of the current month.",
    keepAccess: "You'll keep access to your plans.",
    confirm: "Confirm cancellation",
    reasonLabel: "Why are you stopping? (optional)",
    reasonNone: "I'd rather not say",
    commentLabel: "Anything else you'd like to share? (optional)",
    commentPlaceholder: "What could we do better?",
    withdrawBefore: "Want to withdraw from your order? Use the",
    withdrawLink: "withdrawal function",
    questionsTitle: "Questions about payment or cancelling?",
    helpBefore: "Check the",
    faq: "frequently asked questions",
    or: "or",
    contact: "get in touch",
    respond: (days: number) => `. We respond within ${days} working days.`,
    guaranteeTitle: "Not satisfied? Money-back guarantee",
    guaranteeText: (date: string, amount: string, subscription: boolean) =>
      `Until and including ${date}, you can get your ${subscription ? "first payment" : "payment"} of ${amount} back in full, no reason needed.${subscription ? " Your subscription will then end straight away." : ""}`,
    guaranteeAction: "Request the guarantee",
    guaranteeExample: (days: number) => `Example: this is what you'll see in the first ${days} days after your purchase.`,
    guaranteeRequested: (date: string, days: number) =>
      `On ${date}, you asked for your first payment back under the guarantee. We'll refund it within ${days} working days and let you know.`,
    guaranteeHandled: (date: string) => `Your guarantee request was handled on ${date} and your first payment has been refunded.`,
    guaranteeTerms: "Read the terms",
    requestedTitle: "Your guarantee request has been received",
    requestedText: (days: number) => `We've sent you a confirmation by email and will refund your first payment within ${days} working days.`,
  },
});

export function SubscriptionTab({
  view,
  base,
  demo,
  notice,
  l,
}: {
  view: AccountView;
  base: string;
  demo: boolean;
  notice: AccountNotice;
  l: Locale;
}) {
  const c = copy[l];
  const activeSubs = view.orders.filter((o) => o.manageable && (o.status === "active" || o.status === "past_due"));
  const wantsCancel = notice === "opzeggen";
  const g = view.guarantee;

  return (
    <div className="space-y-6">
      {notice === "opgezegd" && (
        <div role="status" className="rounded-[var(--radius-card)] border-2 border-brand-200 bg-brand-50 p-6">
          <h2 className="text-lg font-bold">{c.cancelledTitle}</h2>
          <p className="mt-1 text-[0.9375rem]">{c.cancelledText}</p>
        </div>
      )}
      {notice === "garantie" && (
        <div role="status" className="rounded-[var(--radius-card)] border-2 border-brand-200 bg-brand-50 p-6">
          <h2 className="text-lg font-bold">{c.requestedTitle}</h2>
          <p className="mt-1 text-[0.9375rem]">{c.requestedText(site.responseTimeDays)}</p>
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
                          <form action={demo ? undefined : cancelSubscription} className="space-y-2">
                            <input type="hidden" name="order" value={o.id} />
                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold">{c.reasonLabel}</span>
                              <select name="reden" defaultValue="" className="input !py-2 text-sm">
                                <option value="">{c.reasonNone}</option>
                                {CANCEL_REASONS.map((r) => (
                                  <option key={r} value={r}>
                                    {cancelReasonLabel(r, l)}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold">{c.commentLabel}</span>
                              <textarea name="toelichting" rows={2} maxLength={1000} className="input !py-2 text-sm" placeholder={c.commentPlaceholder} />
                            </label>
                            {demo ? (
                              <DemoButton className="btn-primary w-full !py-2.5 text-sm">{c.confirm}</DemoButton>
                            ) : (
                              <SubmitButton className="btn-primary w-full !py-2.5 text-sm">{c.confirm}</SubmitButton>
                            )}
                          </form>
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
          {c.paymentsBefore}{" "}
          <Link href={accountHref(base, "betalingen")} className="font-semibold underline">
            {c.paymentsLink}
          </Link>
          . {c.withdrawBefore}{" "}
          <Link href="/herroepen" className="font-semibold underline">
            {c.withdrawLink}
          </Link>
          .
        </p>
      </section>

      {g && (
        <section id="garantie" className="scroll-mt-24 rounded-[var(--radius-card)] border border-line p-5 text-sm">
          {demo && g.open && <p className="mb-2 text-xs font-semibold text-muted">{c.guaranteeExample(site.guarantee.days)}</p>}
          <h2 className="font-bold">{c.guaranteeTitle}</h2>
          {g.handledAt ? (
            <p className="mt-1 text-muted">{c.guaranteeHandled(formatDate(g.handledAt, l))}</p>
          ) : g.requestedAt ? (
            <p className="mt-1 text-muted">{c.guaranteeRequested(formatDate(g.requestedAt, l), site.responseTimeDays)}</p>
          ) : (
            <>
              <p className="mt-1 text-muted">
                {c.guaranteeText(formatDate(g.deadline, l), euro(g.amountCents, l), g.subscription)}{" "}
                <Link href="/algemene-voorwaarden#garantie" className="underline">
                  {c.guaranteeTerms}
                </Link>
                .
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer font-semibold text-brand-700 underline [&::-webkit-details-marker]:hidden">
                  {c.guaranteeAction}
                </summary>
                <div className="mt-3 max-w-lg">
                  <GuaranteeForm orderId={g.orderId} amount={euro(g.amountCents, l)} subscription={g.subscription} demo={demo} />
                </div>
              </details>
            </>
          )}
        </section>
      )}

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

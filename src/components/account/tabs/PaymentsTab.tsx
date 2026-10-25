import { CalendarClock, Download } from "lucide-react";
import Link from "@/i18n/Link";
import { changePaymentMethod } from "@/app/[lang]/(site)/account/actions";
import { DemoButton } from "@/components/account/DemoButton";
import { Pill } from "@/components/account/shared";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { productFor, vatPercent } from "@/config/pricing";
import { site } from "@/config/site";
import { defineCopy, localePath, type Locale } from "@/i18n/config";
import type { AccountNotice, AccountView, PaymentView } from "@/lib/account-types";
import { euro, formatDate } from "@/lib/format";

const copy = defineCopy({
  nl: {
    invoiceErrorTitle: "De factuur kon niet worden geopend",
    invoiceErrorText: "Probeer het over een paar minuten opnieuw. Lukt het dan nog niet, mail ons en we sturen hem toe.",
    pastDueTitle: "Een afschrijving is niet gelukt",
    pastDueText:
      "Onze betaalpartner Mollie probeert het de komende dagen automatisch opnieuw. Controleer of er genoeg saldo op je rekening staat, of geef een andere rekening op.",
    methodNote: "Je bevestigt je nieuwe rekening met een betaling van € 0,01 via iDEAL | Wero of Bancontact. Die cent krijg je direct terug.",
    methodChangedTitle: "Bedankt, je nieuwe betaalmethode wordt verwerkt",
    methodChangedText: "Is de bevestiging van € 0,01 gelukt, dan schrijven we je volgende maanden af van je nieuwe rekening. De cent storten we direct terug.",
    methodErrorTitle: "Betaalmethode wijzigen lukte niet",
    methodErrorText: "We konden de betaalpagina niet openen. Probeer het over een paar minuten opnieuw, of mail ons:",
    nextTitle: "Volgende afschrijving",
    nextAmount: (amount: string, date: string) => `${amount} rond ${date}`,
    nextDate: (date: string) => `Rond ${date}`,
    nextNote: (product: string) => `${product} · via automatische incasso`,
    changeMethod: "Betaalmethode wijzigen",
    listTitle: "Betalingen & facturen",
    empty: "Je hebt nog geen betalingen. Na je eerste betaling vind je hier de factuur.",
    firstMonth: "eerste maand",
    month: (n: number) => `maand ${n}`,
    oneOff: "los schema",
    payment: "Betaling",
    refund: "Terugbetaling",
    paid: "Betaald",
    refunded: "Teruggestort",
    order: (ref: string) => `Bestelnummer ${ref}`,
    invoice: "Factuur",
    invoiceLabel: (date: string) => `Factuur van ${date} downloaden (pdf)`,
    creditNote: "Creditnota",
    creditLabel: (date: string) => `Creditnota van ${date} downloaden (pdf)`,
    noInvoice: "Geen factuur",
    note: (vat: number) =>
      `Alle bedragen zijn inclusief ${vat}% btw; de factuur laat zien hoeveel btw erin zit. Een incasso staat hier zodra hij gelukt is, meestal binnen een paar werkdagen. Een terugbetaling staat meestal binnen een paar werkdagen op je rekening.`,
    questionsTitle: "Vragen over een betaling?",
    questionsBefore: "Klopt er iets niet, of heb je een factuur op een andere naam nodig?",
    contact: "Neem contact op",
    respond: (days: number) => `, we reageren binnen ${days} werkdagen.`,
  },
  en: {
    invoiceErrorTitle: "The invoice couldn't be opened",
    invoiceErrorText: "Please try again in a few minutes. If it still doesn't work, email us and we'll send it to you.",
    pastDueTitle: "A payment didn't go through",
    pastDueText:
      "Our payment partner Mollie will automatically try again over the next few days. Check that there's enough money in your account, or enter a different account.",
    methodNote: "You confirm your new account with a payment of €0.01 via iDEAL | Wero or Bancontact. You'll get that cent back straight away.",
    methodChangedTitle: "Thank you, your new payment method is being processed",
    methodChangedText: "Once the €0.01 confirmation has gone through, we'll collect your next months from your new account. We'll refund the cent straight away.",
    methodErrorTitle: "Changing your payment method didn't work",
    methodErrorText: "We couldn't open the payment page. Please try again in a few minutes, or email us:",
    nextTitle: "Next payment",
    nextAmount: (amount: string, date: string) => `${amount} around ${date}`,
    nextDate: (date: string) => `Around ${date}`,
    nextNote: (product: string) => `${product} · by direct debit`,
    changeMethod: "Change payment method",
    listTitle: "Payments & invoices",
    empty: "You don't have any payments yet. After your first payment, you'll find the invoice here.",
    firstMonth: "first month",
    month: (n: number) => `month ${n}`,
    oneOff: "one-off plan",
    payment: "Payment",
    refund: "Refund",
    paid: "Paid",
    refunded: "Refunded",
    order: (ref: string) => `Order number ${ref}`,
    invoice: "Invoice",
    invoiceLabel: (date: string) => `Download the invoice of ${date} (pdf)`,
    creditNote: "Credit note",
    creditLabel: (date: string) => `Download the credit note of ${date} (pdf)`,
    noInvoice: "No invoice",
    note: (vat: number) =>
      `All amounts include ${vat}% VAT; the invoice shows how much VAT is included. A direct debit appears here once it has gone through, usually within a few working days. A refund usually reaches your account within a few working days.`,
    questionsTitle: "Questions about a payment?",
    questionsBefore: "Is something not right, or do you need an invoice in a different name?",
    contact: "Get in touch",
    respond: (days: number) => `, we respond within ${days} working days.`,
  },
});

function describe(p: PaymentView, l: Locale): string {
  const c = copy[l];
  const product = p.product ? productFor(p.product, l).name : null;
  if (p.kind === "refund") return product ? `${c.refund} · ${product}` : c.refund;
  if (!product) return c.payment;
  if (p.duration === "eenmalig") return `${product} · ${c.oneOff}`;
  return p.month ? `${product} · ${p.month === 1 ? c.firstMonth : c.month(p.month)}` : product;
}

/** Tabblad Betalingen: alle betalingen en terugbetalingen met de factuur, en de volgende afschrijving. */
export function PaymentsTab({ view, demo, notice, l }: { view: AccountView; demo: boolean; notice: AccountNotice; l: Locale }) {
  const c = copy[l];
  const upcoming = view.orders.filter((o) => o.nextPayment);
  const pastDue = view.orders.some((o) => o.manageable && o.status === "past_due");
  const canChange = view.orders.some((o) => o.manageable && (o.status === "active" || o.status === "past_due"));

  const changeButton = (primary: boolean) =>
    demo ? (
      <DemoButton className={`${primary ? "btn-primary" : "btn-secondary"} !px-4 !py-2.5 text-sm`}>{c.changeMethod}</DemoButton>
    ) : (
      <form action={changePaymentMethod}>
        <input type="hidden" name="terug" value="/account/betalingen" />
        <SubmitButton className={`${primary ? "btn-primary" : "btn-secondary"} !px-4 !py-2.5 text-sm`}>{c.changeMethod}</SubmitButton>
      </form>
    );

  return (
    <div className="space-y-6">
      {notice === "factuur-fout" && (
        <div role="alert" className="rounded-[var(--radius-card)] border-2 border-accent-200 bg-accent-50 p-6">
          <h2 className="text-lg font-bold">{c.invoiceErrorTitle}</h2>
          <p className="mt-1 text-[0.9375rem]">
            {c.invoiceErrorText}{" "}
            <a href={`mailto:${site.company.email}`} className="font-semibold underline">
              {site.company.email}
            </a>
          </p>
        </div>
      )}
      {(notice === "betaalmethode" || notice === "betaalmethode-fout") && (
        <div
          role="status"
          className={`rounded-[var(--radius-card)] border-2 p-6 ${notice === "betaalmethode" ? "border-brand-200 bg-brand-50" : "border-accent-200 bg-accent-50"}`}
        >
          <h2 className="text-lg font-bold">{notice === "betaalmethode" ? c.methodChangedTitle : c.methodErrorTitle}</h2>
          <p className="mt-1 text-[0.9375rem]">
            {notice === "betaalmethode" ? (
              c.methodChangedText
            ) : (
              <>
                {c.methodErrorText}{" "}
                <a href={`mailto:${site.company.email}`} className="font-semibold underline">
                  {site.company.email}
                </a>
              </>
            )}
          </p>
        </div>
      )}
      {pastDue && (
        <div role="status" className="rounded-[var(--radius-card)] border-2 border-accent-200 bg-accent-50 p-6">
          <h2 className="text-lg font-bold">{c.pastDueTitle}</h2>
          <p className="mt-1 mb-4 text-[0.9375rem]">{c.pastDueText}</p>
          {changeButton(true)}
          <p className="mt-3 text-sm text-muted">{c.methodNote}</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2">
          {upcoming.map((o) => (
            <div key={o.id} className="card flex flex-col gap-3 p-5">
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 size-6 shrink-0 text-brand-600" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-muted">{c.nextTitle}</p>
                  <p className="text-lg font-bold">
                    {o.nextPayment!.amountCents !== null
                      ? c.nextAmount(euro(o.nextPayment!.amountCents, l), formatDate(o.nextPayment!.date, l))
                      : c.nextDate(formatDate(o.nextPayment!.date, l))}
                  </p>
                  <p className="text-sm text-muted">{c.nextNote(productFor(o.product, l).name)}</p>
                </div>
              </div>
              {!pastDue && <div>{changeButton(false)}</div>}
            </div>
          ))}
        </section>
      )}
      {upcoming.length === 0 && canChange && !pastDue && <div>{changeButton(false)}</div>}
      {canChange && !pastDue && <p className="-mt-3 text-sm text-muted">{c.methodNote}</p>}

      <section>
        <h2 className="heading-md mb-4">{c.listTitle}</h2>
        {view.payments.length === 0 ? (
          <p className="card p-6 text-muted">{c.empty}</p>
        ) : (
          <ul className="card divide-y divide-line">
            {view.payments.map((p) => {
              const refund = p.kind === "refund";
              const amount = refund ? `− ${euro(-p.amountCents, l)}` : euro(p.amountCents, l);
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4 sm:px-5">
                  <div className="min-w-0">
                    <p className="font-bold">{describe(p, l)}</p>
                    <p className="text-sm text-muted">
                      {formatDate(p.date, l)}
                      {p.orderReference && <> · {c.order(p.orderReference)}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold tabular-nums">{amount}</p>
                      <Pill tone={refund ? "muted" : "ok"}>{refund ? c.refunded : c.paid}</Pill>
                    </div>
                    {p.invoiceHref ? (
                      demo ? (
                        <DemoButton className="btn-secondary !px-3.5 !py-2 text-sm">
                          <Download className="size-4" aria-hidden /> {refund ? c.creditNote : c.invoice}
                        </DemoButton>
                      ) : (
                        <a
                          href={localePath(l, p.invoiceHref)}
                          className="btn-secondary !px-3.5 !py-2 text-sm"
                          aria-label={(refund ? c.creditLabel : c.invoiceLabel)(formatDate(p.date, l))}
                        >
                          <Download className="size-4" aria-hidden /> {refund ? c.creditNote : c.invoice}
                        </a>
                      )
                    ) : (
                      <span className="w-[6.75rem] text-center text-xs text-muted">{refund ? "" : c.noInvoice}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-sm text-muted">{c.note(vatPercent)}</p>
      </section>

      <section className="rounded-[var(--radius-card)] bg-sand p-6">
        <h2 className="text-lg font-bold">{c.questionsTitle}</h2>
        <p className="mt-1 text-[0.9375rem] text-muted">
          {c.questionsBefore}{" "}
          <Link href="/contact" className="font-semibold text-brand-700 underline">
            {c.contact}
          </Link>
          {c.respond(site.responseTimeDays)}
        </p>
      </section>
    </div>
  );
}

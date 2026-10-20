"use client";

import { useActionState, useState } from "react";
import { CircleCheck } from "lucide-react";
import { submitWithdrawal, type WithdrawalState } from "@/app/[lang]/(site)/herroepen/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { defineCopy, intlLocale } from "@/i18n/config";
import { useLocale } from "@/i18n/client";

const copy = defineCopy({
  nl: {
    received: "Je herroeping is ontvangen",
    receivedOn: "Ontvangen op",
    reference: "kenmerk",
    sentTo: (email: string) => `We hebben een ontvangstbevestiging met de inhoud van je herroeping gestuurd naar ${email}.`,
    open: "Overeenkomst hier herroepen",
    name: "Naam",
    email: "E-mailadres (hierheen sturen we de bevestiging)",
    order: "Welke overeenkomst? (bestelnummer, of product en besteldatum)",
    orderPlaceholder: "Bijv. 3F2A9C1B of 'Bundel 3 maanden, besteld op 5 januari'",
    message: "Toelichting (optioneel)",
    next: "Volgende: controleren",
    statement: "Hierbij herroep ik de overeenkomst voor:",
    nameLine: "Naam",
    emailLine: "E-mail",
    messageLine: "Toelichting",
    edit: "Aanpassen",
    confirm: "Herroeping bevestigen",
  },
  en: {
    received: "Your withdrawal has been received",
    receivedOn: "Received on",
    reference: "reference",
    sentTo: (email: string) =>
      `We have sent an acknowledgement of receipt with the content of your withdrawal to ${email}.`,
    open: "Withdraw from the contract here",
    name: "Name",
    email: "Email address (we'll send the confirmation here)",
    order: "Which contract? (order number, or product and order date)",
    orderPlaceholder: "E.g. 3F2A9C1B or 'Bundle 3 months, ordered on 5 January'",
    message: "Comments (optional)",
    next: "Next: review",
    statement: "I hereby withdraw from the contract for:",
    nameLine: "Name",
    emailLine: "Email",
    messageLine: "Comments",
    edit: "Edit",
    confirm: "Confirm withdrawal",
  },
});

/**
 * Herroepingsfunctie in twee stappen: eerst de gegevens invullen, daarna
 * uitdrukkelijk bevestigen. Daarna sturen we een ontvangstbevestiging per e-mail.
 */
export function WithdrawalForm() {
  const l = useLocale();
  const c = copy[l];
  const [state, action] = useActionState<WithdrawalState, FormData>(submitWithdrawal, {});
  const [values, setValues] = useState({ name: "", email: "", orderReference: "", message: "" });
  const [reviewing, setReviewing] = useState(false);
  const [open, setOpen] = useState(false);

  if (state.ok && state.receipt) {
    const when = new Intl.DateTimeFormat(intlLocale(l), { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Amsterdam" }).format(
      new Date(state.receipt.receivedAt),
    );
    return (
      <div role="status" className="space-y-3">
        <CircleCheck className="size-12 text-brand-600" aria-hidden />
        <h2 className="heading-md">{c.received}</h2>
        <p>
          {c.receivedOn} <strong>{when}</strong> · {c.reference} <strong>{state.receipt.id}</strong>.
        </p>
        <p className="text-muted">{c.sentTo(values.email)}</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary w-full text-lg">
        {c.open}
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {Object.entries(values).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {!reviewing ? (
        <>
          <label className="block">
            <span className="label">{c.name}</span>
            <input required className="input" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} autoComplete="name" />
          </label>
          <label className="block">
            <span className="label">{c.email}</span>
            <input
              required
              type="email"
              className="input"
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="label">{c.order}</span>
            <input
              required
              className="input"
              value={values.orderReference}
              onChange={(e) => setValues({ ...values, orderReference: e.target.value })}
              placeholder={c.orderPlaceholder}
            />
          </label>
          <label className="block">
            <span className="label">{c.message}</span>
            <textarea rows={3} className="input" value={values.message} onChange={(e) => setValues({ ...values, message: e.target.value })} />
          </label>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => {
              if (values.name.trim() && /^\S+@\S+\.\S+$/.test(values.email) && values.orderReference.trim()) setReviewing(true);
            }}
          >
            {c.next}
          </button>
        </>
      ) : (
        <>
          <div className="rounded-2xl bg-sand p-4 text-[0.9375rem]">
            <p>
              {c.statement} <strong>{values.orderReference}</strong>
            </p>
            <p className="mt-2">
              {c.nameLine}: {values.name}
              <br />
              {c.emailLine}: {values.email}
              {values.message && (
                <>
                  <br />
                  {c.messageLine}: {values.message}
                </>
              )}
            </p>
          </div>
          {state.message && <p role="alert" className="text-sm font-semibold text-accent-600">{state.message}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" className="btn-secondary" onClick={() => setReviewing(false)}>
              {c.edit}
            </button>
            <SubmitButton className="btn-primary flex-1">{c.confirm}</SubmitButton>
          </div>
        </>
      )}
    </form>
  );
}

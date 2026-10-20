"use client";

import { useActionState, useState } from "react";
import { CircleCheck } from "lucide-react";
import { submitWithdrawal, type WithdrawalState } from "@/app/(site)/herroepen/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";

/**
 * Herroepingsfunctie in twee stappen: eerst de gegevens invullen, daarna
 * uitdrukkelijk bevestigen. Daarna sturen we een ontvangstbevestiging per e-mail.
 */
export function WithdrawalForm() {
  const [state, action] = useActionState<WithdrawalState, FormData>(submitWithdrawal, {});
  const [values, setValues] = useState({ name: "", email: "", orderReference: "", message: "" });
  const [reviewing, setReviewing] = useState(false);
  const [open, setOpen] = useState(false);

  if (state.ok && state.receipt) {
    const when = new Intl.DateTimeFormat("nl-NL", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Amsterdam" }).format(
      new Date(state.receipt.receivedAt),
    );
    return (
      <div role="status" className="space-y-3">
        <CircleCheck className="size-12 text-brand-600" aria-hidden />
        <h2 className="heading-md">Je herroeping is ontvangen</h2>
        <p>
          Ontvangen op <strong>{when}</strong> · kenmerk <strong>{state.receipt.id}</strong>.
        </p>
        <p className="text-muted">
          We hebben een ontvangstbevestiging met de inhoud van je herroeping gestuurd naar {values.email}.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary w-full text-lg">
        Overeenkomst hier herroepen
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
            <span className="label">Naam</span>
            <input required className="input" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} autoComplete="name" />
          </label>
          <label className="block">
            <span className="label">E-mailadres (hierheen sturen we de bevestiging)</span>
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
            <span className="label">Welke overeenkomst? (bestelnummer, of product en besteldatum)</span>
            <input
              required
              className="input"
              value={values.orderReference}
              onChange={(e) => setValues({ ...values, orderReference: e.target.value })}
              placeholder="Bijv. 3F2A9C1B of 'Bundel 3 maanden, besteld op 5 januari'"
            />
          </label>
          <label className="block">
            <span className="label">Toelichting (optioneel)</span>
            <textarea rows={3} className="input" value={values.message} onChange={(e) => setValues({ ...values, message: e.target.value })} />
          </label>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => {
              if (values.name.trim() && /^\S+@\S+\.\S+$/.test(values.email) && values.orderReference.trim()) setReviewing(true);
            }}
          >
            Volgende: controleren
          </button>
        </>
      ) : (
        <>
          <div className="rounded-2xl bg-sand p-4 text-[0.9375rem]">
            <p>
              Hierbij herroep ik de overeenkomst voor: <strong>{values.orderReference}</strong>
            </p>
            <p className="mt-2">
              Naam: {values.name}
              <br />
              E-mail: {values.email}
              {values.message && (
                <>
                  <br />
                  Toelichting: {values.message}
                </>
              )}
            </p>
          </div>
          {state.message && <p role="alert" className="text-sm font-semibold text-accent-600">{state.message}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" className="btn-secondary" onClick={() => setReviewing(false)}>
              Aanpassen
            </button>
            <SubmitButton className="btn-primary flex-1">Herroeping bevestigen</SubmitButton>
          </div>
        </>
      )}
    </form>
  );
}

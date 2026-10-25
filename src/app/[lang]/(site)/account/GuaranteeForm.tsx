"use client";

import { startTransition, useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { requestGuarantee } from "@/app/[lang]/(site)/account/actions";
import { FormStatus, type FormState } from "@/components/forms/FormStatus";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";

const copy = defineCopy({
  nl: {
    demoSent: "Voorbeeld: in je eigen omgeving leggen we je aanvraag nu vast en krijg je een bevestiging per e-mail.",
    reason: "Wat paste er niet? (optioneel, helpt ons beter te worden)",
    confirm: (amount: string) => `Ik wil mijn eerste betaling van ${amount} terug. Mijn abonnement stopt daarmee direct.`,
    confirmOneOff: (amount: string) => `Ik wil mijn betaling van ${amount} terug.`,
    submit: "Geld terugvragen",
  },
  en: {
    demoSent: "Example: in your own account, we'd now record your request and send you a confirmation by email.",
    reason: "What didn't work for you? (optional, helps us improve)",
    confirm: (amount: string) => `I want my first payment of ${amount} back. This ends my subscription straight away.`,
    confirmOneOff: (amount: string) => `I want my payment of ${amount} back.`,
    submit: "Request a refund",
  },
});

/** Aanvraag onder de tevredenheidsgarantie, met een uitdrukkelijke bevestiging. */
export function GuaranteeForm({
  orderId,
  amount,
  subscription,
  demo = false,
}: {
  orderId: string;
  /** Het terug te betalen bedrag, al opgemaakt. */
  amount: string;
  subscription: boolean;
  demo?: boolean;
}) {
  const c = copy[useLocale()];
  const [state, action, pending] = useActionState<FormState, FormData>(requestGuarantee, {});
  const [demoSent, setDemoSent] = useState(false);

  if (demoSent) return <FormStatus state={{ ok: true, message: c.demoSent }} />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (demo) {
          setDemoSent(true);
          return;
        }
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-3"
    >
      <input type="hidden" name="order" value={orderId} />
      <label className="block">
        <span className="label">{c.reason}</span>
        <textarea name="reden" rows={2} maxLength={1000} className="input" />
      </label>
      <label className="flex items-start gap-3">
        <input type="checkbox" name="bevestig" value="ja" required className="mt-0.5 size-5 shrink-0 accent-brand-600" />
        <span>{subscription ? c.confirm(amount) : c.confirmOneOff(amount)}</span>
      </label>
      <FormStatus state={state} />
      <button type="submit" disabled={pending} className="btn-secondary !px-4 !py-2.5 text-sm">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {c.submit}
      </button>
    </form>
  );
}

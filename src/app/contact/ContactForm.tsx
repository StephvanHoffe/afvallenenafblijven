"use client";

import { useActionState } from "react";
import { sendContact } from "@/app/contact/actions";
import { FormStatus, type FormState } from "@/components/forms/FormStatus";
import { SubmitButton } from "@/components/forms/SubmitButton";

export function ContactForm() {
  const [state, action] = useActionState<FormState, FormData>(sendContact, {});
  if (state.ok) return <FormStatus state={state} />;
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Naam</span>
          <input name="name" required className="input" autoComplete="name" />
        </label>
        <label className="block">
          <span className="label">E-mailadres</span>
          <input name="email" type="email" required className="input" autoComplete="email" />
        </label>
      </div>
      <label className="block">
        <span className="label">Onderwerp (optioneel)</span>
        <input name="subject" className="input" />
      </label>
      <label className="block">
        <span className="label">Bericht</span>
        <textarea name="message" required rows={6} className="input" />
      </label>
      <label className="hidden" aria-hidden>
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <p className="text-sm text-muted">
        We gebruiken je gegevens alleen om je vraag te beantwoorden. Zie ons privacybeleid.
      </p>
      <FormStatus state={state} />
      <SubmitButton>Verstuur bericht</SubmitButton>
    </form>
  );
}

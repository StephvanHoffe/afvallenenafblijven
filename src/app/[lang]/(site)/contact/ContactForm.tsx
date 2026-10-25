"use client";

import { useActionState } from "react";
import { sendContact } from "@/app/[lang]/(site)/contact/actions";
import { FormStatus, type FormState } from "@/components/forms/FormStatus";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";

const copy = defineCopy({
  nl: {
    name: "Naam",
    email: "E-mailadres",
    subject: "Onderwerp (optioneel)",
    message: "Bericht",
    privacy: "We gebruiken je gegevens alleen om je vraag te beantwoorden. Zie ons privacybeleid.",
    send: "Verstuur bericht",
  },
  en: {
    name: "Name",
    email: "Email address",
    subject: "Subject (optional)",
    message: "Message",
    privacy: "We only use your details to answer your question. See our privacy policy.",
    send: "Send message",
  },
});

export function ContactForm() {
  const c = copy[useLocale()];
  const [state, action] = useActionState<FormState, FormData>(sendContact, {});
  if (state.ok) return <FormStatus state={state} />;
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">{c.name}</span>
          <input name="name" required className="input" autoComplete="name" />
        </label>
        <label className="block">
          <span className="label">{c.email}</span>
          <input name="email" type="email" required className="input" autoComplete="email" />
        </label>
      </div>
      <label className="block">
        <span className="label">{c.subject}</span>
        <input name="subject" className="input" />
      </label>
      <label className="block">
        <span className="label">{c.message}</span>
        <textarea name="message" required rows={6} className="input" />
      </label>
      <label className="hidden" aria-hidden>
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <p className="text-sm text-muted">{c.privacy}</p>
      <FormStatus state={state} />
      <SubmitButton>{c.send}</SubmitButton>
    </form>
  );
}

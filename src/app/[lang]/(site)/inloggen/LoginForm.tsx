"use client";

import { useActionState } from "react";
import { requestLoginLink } from "@/app/[lang]/(site)/inloggen/actions";
import { FormStatus, type FormState } from "@/components/forms/FormStatus";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";

const copy = defineCopy({
  nl: {
    email: "E-mailadres waarmee je hebt besteld",
    emailPlaceholder: "jij@voorbeeld.nl",
    reason: "Waarom zeg je op? (optioneel)",
    reasonPlaceholder: "Je feedback helpt ons beter te worden",
    cancel: "Abonnement opzeggen",
    send: "Stuur mij een inloglink",
  },
  en: {
    email: "Email address you ordered with",
    emailPlaceholder: "you@example.com",
    reason: "Why are you cancelling? (optional)",
    reasonPlaceholder: "Your feedback helps us improve",
    cancel: "Cancel subscription",
    send: "Send me a login link",
  },
});

export function LoginForm({ purpose = "inloggen" }: { purpose?: "inloggen" | "opzeggen" }) {
  const c = copy[useLocale()];
  const [state, action] = useActionState<FormState, FormData>(requestLoginLink, {});
  if (state.ok) return <FormStatus state={state} />;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="doel" value={purpose} />
      <label className="block">
        <span className="label">{c.email}</span>
        <input name="email" type="email" required className="input" autoComplete="email" placeholder={c.emailPlaceholder} />
      </label>
      {purpose === "opzeggen" && (
        <label className="block">
          <span className="label">{c.reason}</span>
          <textarea name="reden" rows={3} className="input" placeholder={c.reasonPlaceholder} />
        </label>
      )}
      <FormStatus state={state} />
      <SubmitButton className="btn-primary w-full">{purpose === "opzeggen" ? c.cancel : c.send}</SubmitButton>
    </form>
  );
}

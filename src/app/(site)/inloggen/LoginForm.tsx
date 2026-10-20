"use client";

import { useActionState } from "react";
import { requestLoginLink } from "@/app/(site)/inloggen/actions";
import { FormStatus, type FormState } from "@/components/forms/FormStatus";
import { SubmitButton } from "@/components/forms/SubmitButton";

export function LoginForm({ purpose = "inloggen" }: { purpose?: "inloggen" | "opzeggen" }) {
  const [state, action] = useActionState<FormState, FormData>(requestLoginLink, {});
  if (state.ok) return <FormStatus state={state} />;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="doel" value={purpose} />
      <label className="block">
        <span className="label">E-mailadres waarmee je hebt besteld</span>
        <input name="email" type="email" required className="input" autoComplete="email" placeholder="jij@voorbeeld.nl" />
      </label>
      {purpose === "opzeggen" && (
        <label className="block">
          <span className="label">Waarom zeg je op? (optioneel)</span>
          <textarea name="reden" rows={3} className="input" placeholder="Je feedback helpt ons beter te worden" />
        </label>
      )}
      <FormStatus state={state} />
      <SubmitButton className="btn-primary w-full">
        {purpose === "opzeggen" ? "Abonnement opzeggen" : "Stuur mij een inloglink"}
      </SubmitButton>
    </form>
  );
}

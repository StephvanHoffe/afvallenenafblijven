"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { changeAdminPassword, type PasswordState } from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";

/** Eigen beheerwachtwoord kiezen (eerste keer) of het wachtwoord wijzigen. */
export function PasswordForm({ first, minLength }: { first: boolean; minLength: number }) {
  const [state, action] = useActionState<PasswordState, FormData>(changeAdminPassword, {});
  return (
    <form action={action} className="space-y-4">
      {!first && (
        <label className="block">
          <span className="label">Huidig wachtwoord</span>
          <input name="huidig" type="password" required autoComplete="current-password" className="input" />
        </label>
      )}
      <label className="block">
        <span className="label">Nieuw wachtwoord</span>
        <input name="nieuw" type="password" required minLength={minLength} autoComplete="new-password" className="input" />
        <span className="mt-1 block text-xs text-muted">Minimaal {minLength} tekens. Een zin van een paar woorden werkt goed.</span>
      </label>
      <label className="block">
        <span className="label">Herhaal het nieuwe wachtwoord</span>
        <input name="herhaal" type="password" required minLength={minLength} autoComplete="new-password" className="input" />
      </label>
      {state.error && (
        <p role="alert" className="rounded-2xl bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-600">
          {state.error}
        </p>
      )}
      <SubmitButton className="btn-primary w-full">
        <KeyRound className="size-5" aria-hidden /> {first ? "Wachtwoord instellen" : "Wachtwoord wijzigen"}
      </SubmitButton>
    </form>
  );
}

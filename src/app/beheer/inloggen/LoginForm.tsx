"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { adminLogin, type LoginState } from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";

export function AdminLoginForm() {
  const [state, action] = useActionState<LoginState, FormData>(adminLogin, {});
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="label">Wachtwoord</span>
        <input name="wachtwoord" type="password" required autoComplete="current-password" className="input" />
      </label>
      {state.error && (
        <p role="alert" className="rounded-2xl bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-600">
          {state.error}
        </p>
      )}
      <SubmitButton className="btn-primary w-full">
        <KeyRound className="size-5" aria-hidden /> Inloggen
      </SubmitButton>
    </form>
  );
}

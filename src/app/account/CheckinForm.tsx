"use client";

import { useActionState } from "react";
import { submitCheckin } from "@/app/account/actions";
import { FormStatus, type FormState } from "@/components/forms/FormStatus";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { goalOptions } from "@/lib/intake";

function Select({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select name={name} className="input" defaultValue="">
        <option value="">Kies…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CheckinForm() {
  const [state, action] = useActionState<FormState, FormData>(submitCheckin, {});
  if (state.ok) return <FormStatus state={state} />;
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Huidig gewicht (kg)</span>
          <input name="weightKg" inputMode="decimal" className="input" placeholder="74,5" />
        </label>
        <label className="block">
          <span className="label">Doel voor de volgende periode</span>
          <select name="goal" className="input" defaultValue="">
            <option value="">Hetzelfde doel houden</option>
            {(Object.keys(goalOptions) as (keyof typeof goalOptions)[]).map((g) => (
              <option key={g} value={g}>
                {goalOptions[g].label}
              </option>
            ))}
          </select>
        </label>
        <Select name="energy" label="Hoe was je energie?" options={["Laag", "Gemiddeld", "Goed"]} />
        <Select name="hunger" label="Had je honger?" options={["Vaak", "Soms", "Bijna nooit"]} />
        <Select name="difficulty" label="Hoe haalbaar was het schema?" options={["Te zwaar", "Precies goed", "Te makkelijk"]} />
      </div>
      <label className="block">
        <span className="label">Wil je nog iets kwijt? (optioneel)</span>
        <textarea name="comments" rows={3} className="input" placeholder="Bijv. meer variatie in lunches, of liever kortere trainingen" />
      </label>
      <FormStatus state={state} />
      <SubmitButton>Check-in opslaan</SubmitButton>
    </form>
  );
}

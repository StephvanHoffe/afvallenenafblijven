"use client";

import { startTransition, useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { submitWeeklyLog } from "@/app/(site)/account/actions";
import { FormStatus, type FormState } from "@/components/forms/FormStatus";
import { products, type ProductId } from "@/config/pricing";
import { checkinOptions } from "@/lib/checkin";

function Choice({ name, label, options }: { name: string; label: string; options: readonly string[] }) {
  return (
    <fieldset>
      <legend className="label">
        {label} <span className="font-normal text-muted">(optioneel)</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className="cursor-pointer">
            <input type="radio" name={name} value={o} className="peer sr-only" />
            <span className="inline-block rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold transition-colors peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100 hover:border-brand-300">
              {o}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Het wekelijkse weegmoment: alleen het gewicht is verplicht. */
export function WeeklyForm({
  orderId,
  seq,
  week,
  product,
  lastWeightKg,
  demo = false,
}: {
  orderId: string;
  seq: number;
  week: number;
  product: ProductId;
  lastWeightKg?: number | null;
  demo?: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitWeeklyLog, {});
  const [demoSent, setDemoSent] = useState(false);
  const includes = products[product].includes;

  if (demoSent) {
    return (
      <FormStatus
        state={{ ok: true, message: "Voorbeeld: in je eigen omgeving slaan we je weegmoment nu op en sturen we je schema zo nodig meteen bij." }}
      />
    );
  }

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
      className="space-y-5"
    >
      <input type="hidden" name="order" value={orderId} />
      <input type="hidden" name="periode" value={seq} />
      <input type="hidden" name="week" value={week} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Je gewicht nu (kg)</span>
          <input
            name="weightKg"
            inputMode="decimal"
            required
            pattern="[0-9]{2,3}([.,][0-9])?"
            className="input"
            placeholder={lastWeightKg ? String(lastWeightKg).replace(".", ",") : "74,5"}
          />
        </label>
        <label className="block">
          <span className="label">
            Taille-omtrek (cm) <span className="font-normal text-muted">(optioneel)</span>
          </span>
          <input name="waistCm" inputMode="decimal" pattern="[0-9]{2,3}([.,][0-9])?" className="input" placeholder="86" />
        </label>
      </div>
      <Choice name="energy" label="Hoe was je energie deze week?" options={checkinOptions.energy} />
      {includes.includes("voeding") && (
        <>
          <Choice name="nutritionAdherence" label="Hoe goed kon je het voedingsschema volgen?" options={checkinOptions.nutritionAdherence} />
          <Choice name="hunger" label="Had je honger?" options={checkinOptions.hunger} />
        </>
      )}
      {includes.includes("training") && (
        <>
          <Choice name="trainingAdherence" label="Hoeveel trainingen heb je gedaan?" options={checkinOptions.trainingAdherence} />
          <Choice name="difficulty" label="Hoe zwaar voelden de trainingen?" options={checkinOptions.difficulty} />
        </>
      )}
      <label className="block">
        <span className="label">
          Opmerking <span className="font-normal text-muted">(optioneel)</span>
        </span>
        <input name="comments" maxLength={500} className="input" placeholder="Bijv. een drukke week of een verjaardag" />
      </label>
      <FormStatus state={state} />
      <button type="submit" disabled={pending} className="btn-primary w-full !whitespace-normal text-center sm:w-auto">
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
        Opslaan en bijsturen waar nodig
      </button>
    </form>
  );
}

"use client";

import { startTransition, useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { submitWeeklyLog } from "@/app/[lang]/(site)/account/actions";
import { FormStatus, type FormState } from "@/components/forms/FormStatus";
import { products, type ProductId } from "@/config/pricing";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import { checkinChoices } from "@/i18n/options";
import { weightInputValue, type FormSuggestion } from "@/lib/health/suggest";

const copy = defineCopy({
  nl: {
    optional: "(optioneel)",
    demoSent: "Voorbeeld: in je eigen omgeving slaan we je weegmoment nu op en sturen we je schema zo nodig meteen bij.",
    weight: "Je gewicht nu (kg)",
    weightPlaceholder: "74,5",
    waist: "Taille-omtrek (cm)",
    energy: "Hoe was je energie deze week?",
    nutritionAdherence: "Hoe goed kon je het voedingsschema volgen?",
    hunger: "Had je honger?",
    trainingAdherence: "Hoeveel trainingen heb je gedaan?",
    difficulty: "Hoe zwaar voelden de trainingen?",
    comments: "Opmerking",
    commentsPlaceholder: "Bijv. een drukke week of een verjaardag",
    submit: "Opslaan en bijsturen waar nodig",
  },
  en: {
    optional: "(optional)",
    demoSent: "Example: in your own account, we'd now save your weigh-in and adjust your plan straight away if needed.",
    weight: "Your weight now (kg)",
    weightPlaceholder: "74.5",
    waist: "Waist circumference (cm)",
    energy: "How was your energy this week?",
    nutritionAdherence: "How well could you stick to the nutrition plan?",
    hunger: "Were you hungry?",
    trainingAdherence: "How many workouts did you do?",
    difficulty: "How hard did the workouts feel?",
    comments: "Comment",
    commentsPlaceholder: "E.g. a busy week or a birthday",
    submit: "Save and adjust where needed",
  },
});

/** Keuzerondjes; de waarde blijft Nederlands, het label volgt de taal. */
function Choice({
  name,
  label,
  options,
  optional,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  optional: string;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="label">
        {label} <span className="font-normal text-muted">{optional}</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input type="radio" name={name} value={o.value} defaultChecked={o.value === defaultValue} className="peer sr-only" />
            <span className="inline-block rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold transition-colors peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100 hover:border-brand-300">
              {o.label}
            </span>
          </label>
        ))}
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
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
  suggestion,
}: {
  orderId: string;
  seq: number;
  week: number;
  product: ProductId;
  lastWeightKg?: number | null;
  demo?: boolean;
  /** Alvast ingevuld uit gekoppelde gezondheidsapps. */
  suggestion?: FormSuggestion;
}) {
  const l = useLocale();
  const c = copy[l];
  const [state, action, pending] = useActionState<FormState, FormData>(submitWeeklyLog, {});
  const [demoSent, setDemoSent] = useState(false);
  const includes = products[product].includes;

  if (demoSent) {
    return <FormStatus state={{ ok: true, message: c.demoSent }} />;
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
          <span className="label">{c.weight}</span>
          <input
            name="weightKg"
            inputMode="decimal"
            required
            pattern="[0-9]{2,3}([.,][0-9])?"
            className="input"
            placeholder={lastWeightKg ? (l === "en" ? String(lastWeightKg) : String(lastWeightKg).replace(".", ",")) : c.weightPlaceholder}
            defaultValue={suggestion?.weightKg !== undefined ? weightInputValue(suggestion.weightKg, l) : undefined}
          />
          {suggestion?.weightNote && <span className="mt-1 block text-xs font-semibold text-brand-700">{suggestion.weightNote}</span>}
        </label>
        <label className="block">
          <span className="label">
            {c.waist} <span className="font-normal text-muted">{c.optional}</span>
          </span>
          <input name="waistCm" inputMode="decimal" pattern="[0-9]{2,3}([.,][0-9])?" className="input" placeholder="86" />
        </label>
      </div>
      <Choice name="energy" label={c.energy} options={checkinChoices(l, "energy")} optional={c.optional} />
      {includes.includes("voeding") && (
        <>
          <Choice name="nutritionAdherence" label={c.nutritionAdherence} options={checkinChoices(l, "nutritionAdherence")} optional={c.optional} />
          <Choice name="hunger" label={c.hunger} options={checkinChoices(l, "hunger")} optional={c.optional} />
        </>
      )}
      {includes.includes("training") && (
        <>
          <Choice
            name="trainingAdherence"
            label={c.trainingAdherence}
            options={checkinChoices(l, "trainingAdherence")}
            optional={c.optional}
            defaultValue={suggestion?.trainingAdherence}
            hint={suggestion?.trainingNote}
          />
          <Choice name="difficulty" label={c.difficulty} options={checkinChoices(l, "difficulty")} optional={c.optional} />
        </>
      )}
      <label className="block">
        <span className="label">
          {c.comments} <span className="font-normal text-muted">{c.optional}</span>
        </span>
        <input name="comments" maxLength={500} className="input" placeholder={c.commentsPlaceholder} />
      </label>
      <FormStatus state={state} />
      <button type="submit" disabled={pending} className="btn-primary w-full !whitespace-normal text-center sm:w-auto">
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
        {c.submit}
      </button>
    </form>
  );
}

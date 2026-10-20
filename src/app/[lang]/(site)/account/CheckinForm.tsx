"use client";

import { startTransition, useActionState, useState } from "react";
import { Dumbbell, Loader2, Salad, Scale, Target } from "lucide-react";
import { submitCheckin } from "@/app/[lang]/(site)/account/actions";
import { FormStatus, type FormState } from "@/components/forms/FormStatus";
import { products, type ProductId } from "@/config/pricing";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import { checkinChoices, intakeLabels } from "@/i18n/options";
import { weightInputValue, type FormSuggestion } from "@/lib/health/suggest";
import { goalOptions } from "@/lib/intake";

const copy = defineCopy({
  nl: {
    optional: "(optioneel)",
    demoSent: "Voorbeeld: in je eigen omgeving wordt je check-in nu opgeslagen en maken we direct je nieuwe schema.",
    howTitle: "Hoe gaat het?",
    weight: "Je gewicht nu (kg)",
    weightPlaceholder: "74,5",
    weightHint: "Weeg je bij voorkeur 's ochtends, voor het ontbijt.",
    waist: "Taille-omtrek (cm)",
    waistHint: "Ter hoogte van je navel. Laat zien wat de weegschaal mist.",
    energy: "Hoe was je energie?",
    sleep: "Hoe sliep je?",
    nutritionTitle: "Je voedingsschema",
    nutritionAdherence: "Hoe goed kon je het schema volgen?",
    hunger: "Had je honger?",
    liked: "Wat vond je lekker?",
    likedPlaceholder: "Bijv. de kwarkbowl en de roerbak",
    disliked: "Wat wil je anders of niet meer?",
    dislikedPlaceholder: "Bijv. minder vis, snellere lunches",
    trainingTitle: "Je trainingsschema",
    trainingAdherence: "Hoeveel trainingen heb je gedaan?",
    difficulty: "Hoe zwaar voelden de trainingen?",
    trainingDays: "Hoe vaak wil je de komende periode trainen?",
    sameDays: "Net zo vaak als nu",
    perWeek: (n: number) => `${n} keer per week`,
    injuries: "Nieuwe klachten of blessures?",
    injuriesPlaceholder: "Bijv. zeurende knie bij lunges",
    nextTitle: "De komende periode",
    goal: "Je doel",
    sameGoal: "Hetzelfde doel houden",
    comments: "Wil je nog iets kwijt?",
    commentsPlaceholder: "Bijv. een drukke maand op het werk, of je gaat op vakantie",
    submit: "Versturen en mijn nieuwe schema maken",
    privacy: "Je antwoorden gebruiken we alleen om je schema te maken, zoals beschreven in ons privacybeleid.",
  },
  en: {
    optional: "(optional)",
    demoSent: "Example: in your own account, your check-in would now be saved and we'd create your new plan straight away.",
    howTitle: "How are you doing?",
    weight: "Your weight now (kg)",
    weightPlaceholder: "74.5",
    weightHint: "Ideally weigh yourself in the morning, before breakfast.",
    waist: "Waist circumference (cm)",
    waistHint: "Measured at the level of your belly button. It shows what the scales miss.",
    energy: "How was your energy?",
    sleep: "How did you sleep?",
    nutritionTitle: "Your nutrition plan",
    nutritionAdherence: "How well could you stick to the plan?",
    hunger: "Were you hungry?",
    liked: "What did you enjoy?",
    likedPlaceholder: "E.g. the quark bowl and the stir-fry",
    disliked: "What would you like changed or dropped?",
    dislikedPlaceholder: "E.g. less fish, quicker lunches",
    trainingTitle: "Your workout plan",
    trainingAdherence: "How many workouts did you do?",
    difficulty: "How hard did the workouts feel?",
    trainingDays: "How often do you want to train in the coming period?",
    sameDays: "As often as now",
    perWeek: (n: number) => `${n} times a week`,
    injuries: "Any new aches or injuries?",
    injuriesPlaceholder: "E.g. a nagging knee during lunges",
    nextTitle: "The coming period",
    goal: "Your goal",
    sameGoal: "Keep the same goal",
    comments: "Anything else you'd like to tell us?",
    commentsPlaceholder: "E.g. a busy month at work, or you're going on holiday",
    submit: "Submit and create my new plan",
    privacy: "We only use your answers to create your plan, as described in our privacy policy.",
  },
});

/** Keuzerondjes als knoppen; verplicht als `required`. De waarde blijft Nederlands, het label volgt de taal. */
function Choice({
  name,
  label,
  options,
  optional,
  required = true,
  defaultValue,
  hint,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  optional: string;
  required?: boolean;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="label">
        {label}
        {required ? "" : <span className="font-normal text-muted"> {optional}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input type="radio" name={name} value={o.value} required={required} defaultChecked={o.value === defaultValue} className="peer sr-only" />
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

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <h3 className="flex items-center gap-2 font-extrabold">
        {icon} {title}
      </h3>
      {children}
    </section>
  );
}

export function CheckinForm({
  orderId,
  seq,
  product,
  lastWeightKg,
  demo = false,
  suggestion,
}: {
  orderId: string;
  seq: number;
  product: ProductId;
  lastWeightKg?: number | null;
  demo?: boolean;
  /** Alvast ingevuld uit gekoppelde gezondheidsapps. */
  suggestion?: FormSuggestion;
}) {
  const l = useLocale();
  const c = copy[l];
  const [state, action, pending] = useActionState<FormState, FormData>(submitCheckin, {});
  const [demoSent, setDemoSent] = useState(false);
  const includes = products[product].includes;
  const goals = intakeLabels(l).goal;

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
        // Via startTransition blijven de ingevulde antwoorden staan als er iets misgaat.
        startTransition(() => action(data));
      }}
      className="space-y-6"
    >
      <input type="hidden" name="order" value={orderId} />
      <input type="hidden" name="periode" value={seq} />

      <Section icon={<Scale className="size-5 text-brand-600" aria-hidden />} title={c.howTitle}>
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
            <span className="mt-1 block text-xs text-muted">{c.weightHint}</span>
          </label>
          <label className="block">
            <span className="label">
              {c.waist} <span className="font-normal text-muted">{c.optional}</span>
            </span>
            <input name="waistCm" inputMode="decimal" pattern="[0-9]{2,3}([.,][0-9])?" className="input" placeholder="86" />
            <span className="mt-1 block text-xs text-muted">{c.waistHint}</span>
          </label>
        </div>
        <Choice name="energy" label={c.energy} options={checkinChoices(l, "energy")} optional={c.optional} />
        <Choice name="sleep" label={c.sleep} options={checkinChoices(l, "sleep")} optional={c.optional} />
      </Section>

      {includes.includes("voeding") && (
        <Section icon={<Salad className="size-5 text-brand-600" aria-hidden />} title={c.nutritionTitle}>
          <Choice
            name="nutritionAdherence"
            label={c.nutritionAdherence}
            options={checkinChoices(l, "nutritionAdherence")}
            optional={c.optional}
          />
          <Choice name="hunger" label={c.hunger} options={checkinChoices(l, "hunger")} optional={c.optional} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">
                {c.liked} <span className="font-normal text-muted">{c.optional}</span>
              </span>
              <textarea name="likedMeals" rows={2} maxLength={500} className="input" placeholder={c.likedPlaceholder} />
            </label>
            <label className="block">
              <span className="label">
                {c.disliked} <span className="font-normal text-muted">{c.optional}</span>
              </span>
              <textarea name="dislikedMeals" rows={2} maxLength={500} className="input" placeholder={c.dislikedPlaceholder} />
            </label>
          </div>
        </Section>
      )}

      {includes.includes("training") && (
        <Section icon={<Dumbbell className="size-5 text-brand-600" aria-hidden />} title={c.trainingTitle}>
          <Choice
            name="trainingAdherence"
            label={c.trainingAdherence}
            options={checkinChoices(l, "trainingAdherence")}
            optional={c.optional}
            defaultValue={suggestion?.trainingAdherence}
            hint={suggestion?.trainingNote}
          />
          <Choice name="difficulty" label={c.difficulty} options={checkinChoices(l, "difficulty")} optional={c.optional} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">{c.trainingDays}</span>
              <select name="trainingDays" className="input" defaultValue="">
                <option value="">{c.sameDays}</option>
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {c.perWeek(n)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">
                {c.injuries} <span className="font-normal text-muted">{c.optional}</span>
              </span>
              <input name="injuries" maxLength={300} className="input" placeholder={c.injuriesPlaceholder} />
            </label>
          </div>
        </Section>
      )}

      <Section icon={<Target className="size-5 text-brand-600" aria-hidden />} title={c.nextTitle}>
        <label className="block">
          <span className="label">{c.goal}</span>
          <select name="goal" className="input" defaultValue="">
            <option value="">{c.sameGoal}</option>
            {(Object.keys(goalOptions) as (keyof typeof goalOptions)[]).map((g) => (
              <option key={g} value={g}>
                {goals[g].label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">
            {c.comments} <span className="font-normal text-muted">{c.optional}</span>
          </span>
          <textarea name="comments" rows={3} maxLength={1000} className="input" placeholder={c.commentsPlaceholder} />
        </label>
      </Section>

      <FormStatus state={state} />
      <button type="submit" disabled={pending} className="btn-primary w-full !whitespace-normal text-center sm:w-auto">
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
        {c.submit}
      </button>
      <p className="text-xs text-muted">{c.privacy}</p>
    </form>
  );
}

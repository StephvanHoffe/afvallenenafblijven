"use client";

import { startTransition, useActionState, useState } from "react";
import { Dumbbell, Loader2, Salad, Scale, Target } from "lucide-react";
import { submitCheckin } from "@/app/(site)/account/actions";
import { FormStatus, type FormState } from "@/components/forms/FormStatus";
import { products, type ProductId } from "@/config/pricing";
import { checkinOptions } from "@/lib/checkin";
import { goalOptions } from "@/lib/intake";

/** Keuzerondjes als knoppen; verplicht als `required`. */
function Choice({ name, label, options, required = true }: { name: string; label: string; options: readonly string[]; required?: boolean }) {
  return (
    <fieldset>
      <legend className="label">
        {label}
        {required ? "" : <span className="font-normal text-muted"> (optioneel)</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className="cursor-pointer">
            <input type="radio" name={name} value={o} required={required} className="peer sr-only" />
            <span className="inline-block rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold transition-colors peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100 hover:border-brand-300">
              {o}
            </span>
          </label>
        ))}
      </div>
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
}: {
  orderId: string;
  seq: number;
  product: ProductId;
  lastWeightKg?: number | null;
  demo?: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitCheckin, {});
  const [demoSent, setDemoSent] = useState(false);
  const includes = products[product].includes;

  if (demoSent) {
    return (
      <FormStatus
        state={{ ok: true, message: "Voorbeeld: in je eigen omgeving wordt je check-in nu opgeslagen en maken we direct je nieuwe schema." }}
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
        // Via startTransition blijven de ingevulde antwoorden staan als er iets misgaat.
        startTransition(() => action(data));
      }}
      className="space-y-6"
    >
      <input type="hidden" name="order" value={orderId} />
      <input type="hidden" name="periode" value={seq} />

      <Section icon={<Scale className="size-5 text-brand-600" aria-hidden />} title="Hoe gaat het?">
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
            <span className="mt-1 block text-xs text-muted">Weeg je bij voorkeur &apos;s ochtends, voor het ontbijt.</span>
          </label>
          <label className="block">
            <span className="label">
              Taille-omtrek (cm) <span className="font-normal text-muted">(optioneel)</span>
            </span>
            <input name="waistCm" inputMode="decimal" pattern="[0-9]{2,3}([.,][0-9])?" className="input" placeholder="86" />
            <span className="mt-1 block text-xs text-muted">Ter hoogte van je navel. Laat zien wat de weegschaal mist.</span>
          </label>
        </div>
        <Choice name="energy" label="Hoe was je energie?" options={checkinOptions.energy} />
        <Choice name="sleep" label="Hoe sliep je?" options={checkinOptions.sleep} />
      </Section>

      {includes.includes("voeding") && (
        <Section icon={<Salad className="size-5 text-brand-600" aria-hidden />} title="Je voedingsschema">
          <Choice name="nutritionAdherence" label="Hoe goed kon je het schema volgen?" options={checkinOptions.nutritionAdherence} />
          <Choice name="hunger" label="Had je honger?" options={checkinOptions.hunger} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">
                Wat vond je lekker? <span className="font-normal text-muted">(optioneel)</span>
              </span>
              <textarea name="likedMeals" rows={2} maxLength={500} className="input" placeholder="Bijv. de kwarkbowl en de roerbak" />
            </label>
            <label className="block">
              <span className="label">
                Wat wil je anders of niet meer? <span className="font-normal text-muted">(optioneel)</span>
              </span>
              <textarea name="dislikedMeals" rows={2} maxLength={500} className="input" placeholder="Bijv. minder vis, snellere lunches" />
            </label>
          </div>
        </Section>
      )}

      {includes.includes("training") && (
        <Section icon={<Dumbbell className="size-5 text-brand-600" aria-hidden />} title="Je trainingsschema">
          <Choice name="trainingAdherence" label="Hoeveel trainingen heb je gedaan?" options={checkinOptions.trainingAdherence} />
          <Choice name="difficulty" label="Hoe zwaar voelden de trainingen?" options={checkinOptions.difficulty} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">Hoe vaak wil je de komende periode trainen?</span>
              <select name="trainingDays" className="input" defaultValue="">
                <option value="">Net zo vaak als nu</option>
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} keer per week
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">
                Nieuwe klachten of blessures? <span className="font-normal text-muted">(optioneel)</span>
              </span>
              <input name="injuries" maxLength={300} className="input" placeholder="Bijv. zeurende knie bij lunges" />
            </label>
          </div>
        </Section>
      )}

      <Section icon={<Target className="size-5 text-brand-600" aria-hidden />} title="De komende periode">
        <label className="block">
          <span className="label">Je doel</span>
          <select name="goal" className="input" defaultValue="">
            <option value="">Hetzelfde doel houden</option>
            {(Object.keys(goalOptions) as (keyof typeof goalOptions)[]).map((g) => (
              <option key={g} value={g}>
                {goalOptions[g].label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">
            Wil je nog iets kwijt? <span className="font-normal text-muted">(optioneel)</span>
          </span>
          <textarea
            name="comments"
            rows={3}
            maxLength={1000}
            className="input"
            placeholder="Bijv. een drukke maand op het werk, of je gaat op vakantie"
          />
        </label>
      </Section>

      <FormStatus state={state} />
      <button type="submit" disabled={pending} className="btn-primary w-full !whitespace-normal text-center sm:w-auto">
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
        Versturen en mijn nieuwe schema maken
      </button>
      <p className="text-xs text-muted">
        Je antwoorden gebruiken we alleen om je schema te maken, zoals beschreven in ons privacybeleid.
      </p>
    </form>
  );
}

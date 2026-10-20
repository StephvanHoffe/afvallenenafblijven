import Link from "next/link";
import { Dumbbell, HeartPulse, Salad, UserRound } from "lucide-react";
import { accountHref } from "@/components/account/AccountShell";
import { EnergyBars, MacroBar } from "@/components/account/charts/Indicators";
import { Section } from "@/components/account/shared";
import { products } from "@/config/pricing";
import type { AccountView } from "@/lib/account-types";
import { bmi, nutritionTargets } from "@/lib/calculations";
import { formatDate, formatNumber } from "@/lib/format";
import {
  activityOptions,
  allergyOptions,
  budgetOptions,
  conditionOptions,
  cookingTimeOptions,
  dietOptions,
  experienceOptions,
  goalOptions,
  locationOptions,
  paceOptions,
  sexOptions,
  wantsWeightLoss,
} from "@/lib/intake";
import { currentProfile } from "@/lib/progress";

function Facts({ rows }: { rows: [string, string | null | undefined][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k}>
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="font-semibold break-words">{v}</dd>
          </div>
        ))}
    </dl>
  );
}

function Title({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      {icon}
      {children}
    </span>
  );
}

export function DetailsTab({ view, base }: { view: AccountView; base: string }) {
  const start = view.intake;
  const now = currentProfile(view);
  if (!start || !now) {
    return <p className="card p-6 text-muted">We hebben nog geen gegevens van je vragenlijst.</p>;
  }
  const includes = new Set(view.orders.flatMap((o) => products[o.product].includes));
  if (includes.size === 0) products[start.product].includes.forEach((t) => includes.add(t));
  const computed = nutritionTargets(now);
  const latest = view.targets.at(-1);
  const calories = latest?.calories ?? computed.calories;
  const macros = latest ?? computed;
  const injuries = [start.injuries, ...view.checkins.map((c) => c.data.injuries)].filter(Boolean) as string[];
  const conditions = start.conditions.filter((c) => c !== "geen").map((c) => conditionOptions[c]);
  const allergies = [...start.allergies.map((a) => allergyOptions[a]), ...(start.otherAllergies ? [start.otherAllergies] : [])];
  const kg = (n: number) => `${formatNumber(n, 1)} kg`;

  return (
    <div className="space-y-6">
      <p className="text-[0.9375rem] text-muted">
        Dit zijn de gegevens waarop je schema&apos;s zijn gebaseerd: je antwoorden uit de vragenlijst
        {view.startedAt ? ` van ${formatDate(view.startedAt)}` : ""}, bijgewerkt met je check-ins.
      </p>

      <Section title={<Title icon={<UserRound className="size-5 text-brand-600" aria-hidden />}>Over jou</Title>}>
        <Facts
          rows={[
            ["Geslacht", sexOptions[start.sex]],
            ["Leeftijd bij de start", `${start.age} jaar`],
            ["Lengte", `${start.heightCm} cm`],
            ["Gewicht bij de start", kg(start.weightKg)],
            ["Gewicht nu", now.weightKg !== start.weightKg ? kg(now.weightKg) : null],
            ["BMI nu", formatNumber(Math.round(bmi(now.weightKg, now.heightCm) * 10) / 10, 1)],
            ["Doel", goalOptions[now.goal].label + (now.goal !== start.goal ? ` (bij de start: ${goalOptions[start.goal].label.toLowerCase()})` : "")],
            ["Streefgewicht", wantsWeightLoss(now) && start.targetWeightKg ? kg(start.targetWeightKg) : null],
            ["Tempo", wantsWeightLoss(now) ? paceOptions[start.pace].label : null],
            ["Dagelijkse activiteit", activityOptions[start.activity].label],
          ]}
        />
      </Section>

      {includes.has("voeding") && (
        <Section
          title={<Title icon={<Salad className="size-5 text-brand-600" aria-hidden />}>Je dagdoelen</Title>}
          intro="Berekend uit je gewicht, lengte, leeftijd en activiteit, en bijgesteld na je check-ins."
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-bold">Energie per dag</h3>
              <EnergyBars bmr={computed.bmr} tdee={computed.tdee} calories={calories} />
              {computed.tdee > calories && (
                <p className="mt-3 text-sm text-muted">
                  Je eet ongeveer <strong className="text-ink">{formatNumber(computed.tdee - calories)} kcal</strong> per dag minder
                  dan je verbruikt. Zo val je geleidelijk af, zonder crashdieet.
                </p>
              )}
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold">Verdeling van je calorieën</h3>
              <MacroBar proteinG={macros.proteinG} carbsG={macros.carbsG} fatG={macros.fatG} />
              <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-2xl bg-sand p-3">
                  <dt className="text-muted">Water</dt>
                  <dd className="font-extrabold">± {formatNumber(computed.waterL, 1)} l</dd>
                </div>
                <div className="rounded-2xl bg-sand p-3">
                  <dt className="text-muted">Vezels</dt>
                  <dd className="font-extrabold">{computed.fiberG} g</dd>
                </div>
                <div className="rounded-2xl bg-sand p-3">
                  <dt className="text-muted">Stappen</dt>
                  <dd className="font-extrabold">{formatNumber(computed.steps)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {includes.has("voeding") && (
          <Section title={<Title icon={<Salad className="size-5 text-brand-600" aria-hidden />}>Eten</Title>}>
            <Facts
              rows={[
                ["Eetpatroon", dietOptions[start.diet]],
                ["Allergieën en intoleranties", allergies.length ? allergies.join(", ") : "Geen"],
                ["Lust niet", start.dislikes ?? "Niets opgegeven"],
                ["Eetmomenten per dag", String(start.mealsPerDay)],
                ["Kooktijd", cookingTimeOptions[start.cookingTime].label],
                ["Budget", budgetOptions[start.budget]],
              ]}
            />
          </Section>
        )}
        {includes.has("training") && (
          <Section title={<Title icon={<Dumbbell className="size-5 text-brand-600" aria-hidden />}>Trainen</Title>}>
            <Facts
              rows={[
                ["Waar je traint", locationOptions[start.location].label],
                ["Ervaring", experienceOptions[start.experience].label],
                ["Trainingen per week", `${now.trainingDays}x${now.trainingDays !== start.trainingDays ? ` (bij de start ${start.trainingDays}x)` : ""}`],
                ["Tijd per training", `${start.sessionMinutes} minuten`],
                ["Blessures en klachten", injuries.length ? injuries.join("; ") : "Geen opgegeven"],
              ]}
            />
          </Section>
        )}
        <Section title={<Title icon={<HeartPulse className="size-5 text-brand-600" aria-hidden />}>Gezondheid</Title>}>
          <Facts
            rows={[
              ["Medische aandoeningen", conditions.length ? conditions.join(", ") : "Geen"],
              ["Medicatie", start.medication ?? "Geen opgegeven"],
              ["Overleg met arts", conditions.length ? (start.doctorApproval ? "Ja" : "Nee") : null],
              ["Opmerkingen", start.notes],
            ]}
          />
        </Section>
      </div>

      <section className="rounded-[var(--radius-card)] bg-sand p-6 text-[0.9375rem]">
        <h2 className="text-lg font-bold">Klopt er iets niet meer?</h2>
        <p className="mt-1 text-muted">
          Je gewicht, doel, aantal trainingen en nieuwe klachten geef je door bij je{" "}
          <Link href={accountHref(base, "check-in")} className="font-semibold text-brand-700 underline">
            check-in
          </Link>
          . Wil je iets anders aanpassen, zoals je allergieën of eetpatroon, of wil je je gegevens inzien of laten verwijderen?{" "}
          <Link href="/contact" className="font-semibold text-brand-700 underline">
            Neem contact op
          </Link>
          . Lees ook hoe we met je gegevens omgaan in ons{" "}
          <Link href="/privacybeleid" className="font-semibold text-brand-700 underline">
            privacybeleid
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

import { Clock, Droplets, Flame, Footprints, Lightbulb, Repeat, ShoppingCart, Utensils } from "lucide-react";
import type { NutritionTargets } from "@/lib/calculations";
import type { NutritionPlan } from "@/lib/ai/schemas";
import { dayTotals } from "@/lib/ai/plan-math";
import { formatNumber } from "@/lib/format";

function Macro({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-ink/80">
      {label} <span className="font-extrabold text-ink">{formatNumber(Math.round(value))}</span>
      {unit}
    </span>
  );
}

export function TargetsCard({ targets }: { targets: NutritionTargets }) {
  const items = [
    { icon: Flame, label: "Calorieën", value: `${formatNumber(targets.calories)} kcal` },
    { icon: Utensils, label: "Eiwit", value: `${targets.proteinG} g` },
    { icon: Utensils, label: "Koolhydraten", value: `± ${targets.carbsG} g` },
    { icon: Utensils, label: "Vet", value: `± ${targets.fatG} g` },
    { icon: Droplets, label: "Water", value: `± ${formatNumber(targets.waterL, 1)} liter` },
    { icon: Footprints, label: "Stappen", value: formatNumber(targets.steps) },
  ];
  return (
    <div className="avoid-break rounded-[var(--radius-card)] bg-brand-900 p-6 text-white">
      <h2 className="text-lg font-extrabold">Jouw dagdoelen</h2>
      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((i) => (
          <div key={i.label}>
            <dt className="flex items-center gap-1.5 text-sm text-white/70">
              <i.icon className="size-4 text-lime-glow" aria-hidden />
              {i.label}
            </dt>
            <dd className="mt-0.5 text-xl font-extrabold">{i.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function NutritionPlanView({
  plan,
  targets,
  preview = false,
}: {
  plan: NutritionPlan;
  targets: NutritionTargets;
  preview?: boolean;
}) {
  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <h1 className="heading-lg">{plan.title}</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-muted">{plan.intro}</p>
      </header>

      <TargetsCard targets={targets} />

      <section className="avoid-break card p-6">
        <h2 className="heading-md">De kernafspraken</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {plan.principles.map((p) => (
            <li key={p} className="flex gap-3 rounded-2xl bg-brand-50 p-4 text-[0.9375rem]">
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
              {p}
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="Dagen" className="no-print flex flex-wrap gap-2">
        {plan.days.map((d) => (
          <a key={d.day} href={`#dag-${d.day.toLowerCase()}`} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-bold hover:border-brand-400">
            {d.day}
          </a>
        ))}
        <a href="#boodschappen" className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white">
          Boodschappenlijst
        </a>
      </nav>

      {plan.days.map((day, index) => {
        const t = dayTotals(day);
        return (
          <section key={day.day} id={`dag-${day.day.toLowerCase()}`} className={`scroll-mt-24 ${index > 0 ? "print-break" : ""}`}>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 className="heading-md">{day.day}</h2>
              <div className="flex flex-wrap gap-1.5">
                <Macro label="" value={t.kcal} unit=" kcal" />
                <Macro label="E" value={t.proteinG} unit="g" />
                <Macro label="K" value={t.carbsG} unit="g" />
                <Macro label="V" value={t.fatG} unit="g" />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {day.meals.map((meal) => (
                <article key={`${day.day}-${meal.moment}-${meal.name}`} className="avoid-break card flex flex-col p-5">
                  <p className="eyebrow !text-xs">{meal.moment}</p>
                  <h3 className="mt-1 text-lg leading-snug font-bold">{meal.name}</h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-xs font-semibold">
                      <Clock className="size-3.5" aria-hidden /> {meal.prepMinutes} min
                    </span>
                    <Macro label="" value={meal.kcal} unit=" kcal" />
                    <Macro label="Eiwit" value={meal.proteinG} unit="g" />
                    <Macro label="Kh" value={meal.carbsG} unit="g" />
                    <Macro label="Vet" value={meal.fatG} unit="g" />
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                    <div>
                      <h4 className="text-sm font-bold">Ingrediënten</h4>
                      <ul className="mt-1.5 space-y-1 text-sm">
                        {meal.ingredients.map((ing) => (
                          <li key={ing.item} className="flex justify-between gap-3 border-b border-dashed border-line pb-1">
                            <span>{ing.item}</span>
                            <span className="shrink-0 font-semibold text-muted">{ing.amount}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Bereiding</h4>
                      <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-sm text-ink/85">
                        {meal.instructions.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                  <p className="mt-4 flex gap-2 rounded-2xl bg-accent-50 p-3 text-sm">
                    <Repeat className="mt-0.5 size-4 shrink-0 text-accent-600" aria-hidden />
                    <span>
                      <strong>Liever iets anders?</strong> {meal.swap}
                    </span>
                  </p>
                </article>
              ))}
            </div>
            {day.tip && (
              <p className="mt-4 flex gap-2 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-[0.9375rem]">
                <Lightbulb className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
                {day.tip}
              </p>
            )}
          </section>
        );
      })}

      {preview && (
        <p className="rounded-2xl border-2 border-dashed border-brand-300 p-5 text-center font-semibold text-brand-800">
          In je eigen schema vind je hier ook woensdag tot en met zondag, volledig afgestemd op jouw voorkeuren.
        </p>
      )}

      <section className="avoid-break card p-6">
        <h2 className="heading-md">Snackideeën</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {plan.snackIdeas.map((s) => (
            <li key={s.name} className="flex items-center justify-between gap-3 rounded-2xl bg-sand p-4 text-[0.9375rem]">
              <span>{s.name}</span>
              <span className="shrink-0 text-sm font-semibold text-muted">
                {s.kcal} kcal · {s.proteinG} g eiwit
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section id="boodschappen" className="print-break scroll-mt-24 card p-6">
        <h2 className="heading-md flex items-center gap-2">
          <ShoppingCart className="size-6 text-brand-600" aria-hidden /> Boodschappenlijst{preview ? " (uittreksel)" : " voor de week"}
        </h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plan.shoppingList.map((group) => (
            <div key={group.category} className="avoid-break">
              <h3 className="mb-2 font-bold">{group.category}</h3>
              <ul className="space-y-1.5 text-sm">
                {group.items.map((i) => (
                  <li key={i.item} className="flex items-start gap-2">
                    <span className="mt-0.5 size-4 shrink-0 rounded border-2 border-brand-300" aria-hidden />
                    <span className="flex-1">{i.item}</span>
                    <span className="font-semibold text-muted">{i.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="avoid-break grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-bold">Meal prep-tips</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9375rem]">
            {plan.mealPrepTips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-bold">Uit eten of op visite</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9375rem]">
            {plan.eatingOutTips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="avoid-break rounded-[var(--radius-card)] border-2 border-brand-200 bg-brand-50 p-6">
        <h2 className="text-lg font-bold">Bijsturen na 2 weken</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed">{plan.adjustmentGuide}</p>
      </section>
    </div>
  );
}

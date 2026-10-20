import { ChevronDown, Clock, Download, Lightbulb, Repeat } from "lucide-react";
import type { NutritionTargets } from "@/lib/calculations";
import type { NutritionPlan } from "@/lib/ai/schemas";
import { dayTotals } from "@/lib/ai/plan-math";
import { formatNumber } from "@/lib/format";
import { ChangesCard } from "@/components/plan/ChangesCard";
import { PlanTabs } from "@/components/plan/PlanTabs";
import { ShoppingChecklist } from "@/components/plan/ShoppingChecklist";

type Day = NutritionPlan["days"][number];
type Meal = Day["meals"][number];

const recipeId = (day: string, index: number) => `recept-${day.toLowerCase()}-${index + 1}`;

export function TargetsStrip({ targets }: { targets: NutritionTargets }) {
  const items = [
    { label: "Calorieën", value: `${formatNumber(targets.calories)} kcal` },
    { label: "Eiwit", value: `${targets.proteinG} g` },
    { label: "Koolhydraten", value: `± ${targets.carbsG} g` },
    { label: "Vet", value: `± ${targets.fatG} g` },
    { label: "Water", value: `± ${formatNumber(targets.waterL, 1)} l` },
    { label: "Stappen", value: formatNumber(targets.steps) },
  ];
  return (
    <section aria-label="Jouw dagdoelen" className="avoid-break overflow-hidden rounded-[var(--radius-card)] bg-brand-900 text-white">
      <p className="px-5 pt-4 text-xs font-bold tracking-wide text-lime-glow uppercase">Jouw dagdoelen</p>
      <dl className="grid grid-cols-3 gap-y-4 px-5 pt-2 pb-5 sm:grid-cols-6">
        {items.map((i) => (
          <div key={i.label}>
            <dt className="text-xs font-semibold text-white/70">{i.label}</dt>
            <dd className="mt-0.5 text-lg font-extrabold tabular-nums sm:text-xl">{i.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function WeekMenu({ plan, preview }: { plan: NutritionPlan; preview: boolean }) {
  const columns = Math.max(0, ...plan.days.map((d) => d.meals.length));
  const headers = Array.from({ length: columns }, (_, i) => plan.days.find((d) => d.meals[i])?.meals[i].moment ?? "");

  return (
    <div className="space-y-6">
      <p className="text-[0.9375rem] text-muted">Je hele week in één oogopslag. Klik op een gerecht voor het recept.</p>

      {/* Tabel op grotere schermen */}
      <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-line bg-white md:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-sand text-xs font-bold tracking-wide text-muted uppercase">
            <tr>
              <th scope="col" className="w-28 px-4 py-3">
                Dag
              </th>
              {headers.map((h, i) => (
                <th key={`${h}-${i}`} scope="col" className="px-3 py-3">
                  {h}
                </th>
              ))}
              <th scope="col" className="w-24 px-4 py-3 text-right">
                Totaal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {plan.days.map((d, di) => (
              <tr key={`${di}-${d.day}`} className="align-top">
                <th scope="row" className="px-4 py-3.5 font-bold">
                  {d.day}
                </th>
                {headers.map((_, i) => {
                  const m = d.meals[i];
                  return (
                    <td key={i} className="px-3 py-3.5">
                      {m && (
                        <a href={`#${recipeId(d.day, i)}`} className="group block">
                          <span className="leading-snug font-semibold group-hover:text-brand-700 group-hover:underline">{m.name}</span>
                          <span className="mt-0.5 block text-xs text-muted">
                            {m.kcal} kcal · {m.proteinG} g eiwit
                          </span>
                        </a>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-3.5 text-right tabular-nums">
                  <span className="font-bold">{formatNumber(dayTotals(d).kcal)}</span>
                  <span className="block text-xs text-muted">kcal</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lijst per dag op mobiel */}
      <ul className="space-y-3 md:hidden">
        {plan.days.map((d, di) => (
          <li key={`${di}-${d.day}`} className="card p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-extrabold">{d.day}</h3>
              <span className="text-sm font-semibold text-muted tabular-nums">{formatNumber(dayTotals(d).kcal)} kcal</span>
            </div>
            <ul className="mt-2 divide-y divide-line">
              {d.meals.map((m, i) => (
                <li key={`${m.moment}-${i}`}>
                  <a href={`#${recipeId(d.day, i)}`} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block text-xs font-bold tracking-wide text-brand-600 uppercase">{m.moment}</span>
                      <span className="block leading-snug font-semibold">{m.name}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted tabular-nums">{m.kcal} kcal</span>
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {preview && (
        <p className="rounded-2xl border-2 border-dashed border-brand-300 p-4 text-center text-sm font-semibold text-brand-800">
          In je eigen schema staan alle 7 dagen, volledig afgestemd op jouw voorkeuren.
        </p>
      )}

      <section className="avoid-break card p-5 sm:p-6">
        <h2 className="text-lg font-bold">Zo werkt je schema</h2>
        <ol className="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {plan.principles.map((p, i) => (
            <li key={p} className="flex gap-3 text-[0.9375rem]">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-extrabold text-brand-700">
                {i + 1}
              </span>
              {p}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function MealCard({ id, meal }: { id: string; meal: Meal }) {
  return (
    <details id={id} className="group card scroll-mt-28 overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-4 sm:px-5 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-wide text-brand-600 uppercase">{meal.moment}</p>
          <h3 className="mt-0.5 leading-snug font-bold sm:text-lg">{meal.name}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden /> {meal.prepMinutes} min
            </span>
            <span className="tabular-nums">{meal.kcal} kcal</span>
            <span className="tabular-nums">{meal.proteinG} g eiwit</span>
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand transition-transform group-open:rotate-180">
          <ChevronDown className="size-5" aria-hidden />
          <span className="sr-only">Recept tonen of verbergen</span>
        </span>
      </summary>
      <div className="border-t border-line p-4 sm:p-5">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <h4 className="text-sm font-bold">Ingrediënten</h4>
            <ul className="mt-2 space-y-1.5 text-[0.9375rem]">
              {meal.ingredients.map((ing) => (
                <li key={ing.item} className="flex justify-between gap-3 border-b border-dashed border-line pb-1.5">
                  <span>{ing.item}</span>
                  <span className="shrink-0 font-semibold text-muted">{ing.amount}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold">Bereiding</h4>
            <ol className="mt-2 space-y-2 text-[0.9375rem]">
              {meal.instructions.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-extrabold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted">
          Per portie: {meal.kcal} kcal · {meal.proteinG} g eiwit · {meal.carbsG} g koolhydraten · {meal.fatG} g vet
        </p>
        <p className="mt-3 flex gap-2 rounded-2xl bg-accent-50 p-3 text-sm">
          <Repeat className="mt-0.5 size-4 shrink-0 text-accent-600" aria-hidden />
          <span>
            <strong>Liever iets anders?</strong> {meal.swap}
          </span>
        </p>
      </div>
    </details>
  );
}

function DayPanel({ day }: { day: Day }) {
  const t = dayTotals(day);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <h2 className="heading-md">{day.day}</h2>
        <p className="text-sm text-muted tabular-nums">
          <strong className="text-ink">{formatNumber(t.kcal)} kcal</strong> · {t.proteinG} g eiwit · {t.carbsG} g koolhydraten ·{" "}
          {t.fatG} g vet
        </p>
      </div>
      <div className="space-y-3">
        {day.meals.map((meal, i) => (
          <MealCard key={`${i}-${meal.name}`} id={recipeId(day.day, i)} meal={meal} />
        ))}
      </div>
      {day.tip && (
        <p className="mt-4 flex gap-2 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-[0.9375rem]">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
          {day.tip}
        </p>
      )}
    </div>
  );
}

function TipsPanel({ plan }: { plan: NutritionPlan }) {
  return (
    <div className="space-y-5">
      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-bold">Snackideeën</h2>
        <p className="mt-1 text-sm text-muted">Handig als je trek hebt of een maaltijd wilt ruilen.</p>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {plan.snackIdeas.map((s) => (
            <li key={s.name} className="flex items-center justify-between gap-3 rounded-2xl bg-sand px-4 py-3 text-[0.9375rem]">
              <span>{s.name}</span>
              <span className="shrink-0 text-sm font-semibold text-muted">
                {s.kcal} kcal · {s.proteinG} g eiwit
              </span>
            </li>
          ))}
        </ul>
      </section>
      <div className="grid gap-5 md:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-bold">Slim voorbereiden</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9375rem]">
            {plan.mealPrepTips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-bold">Uit eten of op visite</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9375rem]">
            {plan.eatingOutTips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      </div>
      <section className="rounded-[var(--radius-card)] border-2 border-brand-200 bg-brand-50 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Tussentijds bijsturen</h2>
        <p className="mt-2 text-[0.9375rem] leading-relaxed">{plan.adjustmentGuide}</p>
      </section>
    </div>
  );
}

export function NutritionPlanView({
  plan,
  targets,
  preview = false,
  storageKey,
  shoppingPdfHref,
}: {
  plan: NutritionPlan;
  targets: NutritionTargets;
  preview?: boolean;
  /** Sleutel waaronder de afgevinkte boodschappen in de browser worden onthouden. */
  storageKey?: string;
  shoppingPdfHref?: string;
}) {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="heading-lg">{plan.title}</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-muted">{plan.intro}</p>
      </header>

      <TargetsStrip targets={targets} />
      <ChangesCard changes={plan.changes} />

      <PlanTabs
        label="Onderdelen van je voedingsschema"
        tabs={[
          { id: "weekmenu", label: "Weekmenu", content: <WeekMenu plan={plan} preview={preview} /> },
          {
            id: "recepten",
            label: "Recepten per dag",
            content: (
              <PlanTabs
                variant="pills"
                label="Dagen"
                tabs={plan.days.map((d, i) => ({
                  id: `dag-${i + 1}`,
                  label: (
                    <>
                      <span className="sm:hidden">{d.day.slice(0, 2)}</span>
                      <span className="hidden sm:inline">{d.day}</span>
                    </>
                  ),
                  content: <DayPanel day={d} />,
                }))}
              />
            ),
          },
          {
            id: "boodschappen",
            label: "Boodschappen",
            content: (
              <div>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="heading-md">Boodschappenlijst{preview ? " (uittreksel)" : " voor de week"}</h2>
                    <p className="mt-1 text-sm text-muted">Alles voor de hele week, per afdeling. Vink af wat je hebt.</p>
                  </div>
                  {shoppingPdfHref && (
                    <a href={shoppingPdfHref} className="btn-secondary !px-4 !py-2.5 text-sm">
                      <Download className="size-4" aria-hidden /> Als PDF
                    </a>
                  )}
                </div>
                <ShoppingChecklist groups={plan.shoppingList} storageKey={storageKey} />
              </div>
            ),
          },
          { id: "tips", label: "Tips", content: <TipsPanel plan={plan} /> },
        ]}
      />
    </div>
  );
}

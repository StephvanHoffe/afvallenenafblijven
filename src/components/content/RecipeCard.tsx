import { Clock, Leaf, Refrigerator, Users } from "lucide-react";
import { foods } from "@/content/nutrition";
import { recipeNutrition, type Recipe } from "@/content/recipes";
import { intlLocale, type Locale } from "@/i18n/config";

/**
 * Een recept als kaart: naam (H3, dus altijd binnen een H2-sectie), tijd,
 * voedingswaarden per portie, ingrediënten met hoeveelheden en de bereiding.
 * Het anker (#slug) maakt het recept direct te linken, bijv. vanuit het weekmenu.
 */

const labels = {
  nl: {
    minutes: (m: number) => `${m} min`,
    servings: (n: number) => (n === 1 ? "1 portie" : `${n} porties`),
    vegetarian: "Vegetarisch",
    mealPrep: "Geschikt voor meal prep",
    perPortion: "Per portie",
    kcal: "Calorieën",
    protein: "Eiwit",
    carbs: "Koolhydraten",
    fat: "Vet",
    ingredients: "Ingrediënten",
    ingredientsPerPortion: (n: number) => `Hoeveelheden per portie; voor ${n} porties neem je alles ${n} keer.`,
    extras: "Verder",
    method: "Bereiding",
    storage: "Bewaren",
  },
  en: {
    minutes: (m: number) => `${m} min`,
    servings: (n: number) => (n === 1 ? "1 portion" : `${n} portions`),
    vegetarian: "Vegetarian",
    mealPrep: "Good for meal prep",
    perPortion: "Per portion",
    kcal: "Calories",
    protein: "Protein",
    carbs: "Carbs",
    fat: "Fat",
    ingredients: "Ingredients",
    ingredientsPerPortion: (n: number) => `Amounts per portion; for ${n} portions, multiply everything by ${n}.`,
    extras: "Also",
    method: "Method",
    storage: "Storage",
  },
} satisfies Record<Locale, unknown>;

function num(n: number, l: Locale): string {
  return n.toLocaleString(intlLocale(l), { maximumFractionDigits: 1 });
}

export function RecipeCard({ recipe, l }: { recipe: Recipe; l: Locale }) {
  const c = labels[l];
  const n = recipeNutrition(recipe);
  const facts = [
    { label: c.kcal, value: `${num(n.kcal, l)} kcal` },
    { label: c.protein, value: `${num(n.protein, l)} g` },
    { label: c.carbs, value: `${num(n.carbs, l)} g` },
    { label: c.fat, value: `${num(n.fat, l)} g` },
  ];
  return (
    <article id={recipe.slug} className="card scroll-mt-28 p-5 sm:p-6">
      <h3 className="text-xl leading-snug font-extrabold tracking-tight">{recipe.title[l]}</h3>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        <li className="inline-flex items-center gap-1.5">
          <Clock className="size-4 text-brand-600" aria-hidden /> {c.minutes(recipe.minutes)}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Users className="size-4 text-brand-600" aria-hidden /> {c.servings(recipe.servings)}
        </li>
        {recipe.vegetarian && (
          <li className="inline-flex items-center gap-1.5">
            <Leaf className="size-4 text-brand-600" aria-hidden /> {c.vegetarian}
          </li>
        )}
        {recipe.mealPrep && (
          <li className="inline-flex items-center gap-1.5">
            <Refrigerator className="size-4 text-brand-600" aria-hidden /> {c.mealPrep}
          </li>
        )}
      </ul>

      <div className="mt-4">
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {facts.map((f) => (
            <div key={f.label} className="rounded-2xl bg-brand-50 px-3 py-2">
              <dt className="text-xs font-semibold text-muted">{f.label}</dt>
              <dd className="font-extrabold tabular-nums">{f.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-1.5 text-xs text-muted">{c.perPortion}</p>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-[2fr_3fr]">
        <div>
          <h4 className="font-bold">{c.ingredients}</h4>
          {recipe.servings > 1 && <p className="mt-1 text-sm text-muted">{c.ingredientsPerPortion(recipe.servings)}</p>}
          <ul className="mt-2 space-y-1.5">
            {recipe.ingredients.map((x) => (
              <li key={x.food} className="flex gap-2">
                <span className="w-16 shrink-0 font-semibold whitespace-nowrap tabular-nums">
                  {num(x.amount, l)} {foods[x.food].unit}
                </span>
                <span>{x.label[l]}</span>
              </li>
            ))}
          </ul>
          {recipe.extras.length > 0 && (
            <p className="mt-3 text-sm text-muted">
              <span className="font-semibold text-ink">{c.extras}:</span> {recipe.extras.map((e) => e[l]).join(", ")}
            </p>
          )}
        </div>
        <div>
          <h4 className="font-bold">{c.method}</h4>
          <ol className="mt-2 list-decimal space-y-2 pl-5 leading-relaxed marker:font-bold marker:text-brand-600">
            {recipe.steps.map((s) => (
              <li key={s.nl.slice(0, 48)}>{s[l]}</li>
            ))}
          </ol>
        </div>
      </div>

      {recipe.storage && (
        <p className="mt-5 rounded-2xl bg-sand p-3 text-sm leading-relaxed">
          <span className="font-bold">{c.storage}:</span> {recipe.storage[l]}
        </p>
      )}
    </article>
  );
}

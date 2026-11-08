import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLink, ArticleBody, ArticleSchema, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import {
  calorieContext,
  calorieProductBySlug,
  calorieProductForFood,
  calorieProducts,
  fill,
  type CalorieContext,
  type CalorieProduct,
  type Values,
} from "@/content/calorie-products";
import { foods, type FoodKey, type Nutrients } from "@/content/nutrition";
import { defineCopy, type Locale } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";
const RELATED = ["/calorieen", "/caloriebehoefte-berekenen", "/gezonde-snacks", "/eiwitten-per-dag"];

type Params = PageProps<"/[lang]/calorieen/[product]">["params"];

const ui = defineCopy({
  nl: {
    eyebrow: "Calorieën per product",
    valuesIntro: "Per 100 gram (bij dranken per 100 ml) en per gangbare portie. Koolhydraten zijn zonder vezels, zoals op Europese etiketten.",
    amount: "Hoeveelheid",
    per100: (unit: string) => `Per 100 ${unit}`,
    kcal: "Kcal",
    protein: "Eiwit",
    carbs: "Koolhydraten",
    sugars: "Waarvan suikers",
    fat: "Vet",
    fiber: "Vezels",
    valuesNote:
      "Afgeronde gemiddelden van gangbare supermarktproducten; per merk verschilt het wat. Per portie afgerond op 5 kcal en op hele grammen (onder de 10 gram op halve).",
    compareIntro: "Zo verhoudt het zich tot vergelijkbare producten, per gangbare portie en per 100 gram.",
    compareHead: (unit: string) => ["Product", "Portie", "Kcal per portie", "Eiwit per portie", `Kcal per 100 ${unit}`],
    compareNote: "Afgeronde gemiddelden; per merk verschilt het wat.",
    seeAlso: "Bekijk ook",
    hub: "Bekijk de hele calorietabel",
    calc: "Bereken hoeveel calorieën jij per dag nodig hebt",
    planTitle: "Je calorieën op een rij, zonder zelf te rekenen",
    planText:
      "Je persoonlijke voedingsschema wordt automatisch samengesteld op basis van jouw calorie- en eiwitdoel, met een weekmenu, recepten en een boodschappenlijst. Ook producten zoals deze passen erin, in porties die bij jouw doel passen.",
    planCta: "Bekijk het voedingsschema",
  },
  en: {
    eyebrow: "Calories per food",
    valuesIntro: "Per 100 grams (per 100 ml for drinks) and per typical portion. Carbohydrates exclude fibre, as on European labels.",
    amount: "Amount",
    per100: (unit: string) => `Per 100 ${unit}`,
    kcal: "Kcal",
    protein: "Protein",
    carbs: "Carbohydrates",
    sugars: "Of which sugars",
    fat: "Fat",
    fiber: "Fibre",
    valuesNote:
      "Rounded averages of typical supermarket products; they vary a little by brand. Per portion rounded to 5 kcal and to whole grams (below 10 grams to half grams).",
    compareIntro: "This is how it compares with similar foods, per typical portion and per 100 grams.",
    compareHead: (unit: string) => ["Food", "Portion", "Kcal per portion", "Protein per portion", `Kcal per 100 ${unit}`],
    compareNote: "Rounded averages; they vary a little by brand.",
    seeAlso: "See also",
    hub: "See the full calorie table",
    calc: "Work out how many calories you need a day",
    planTitle: "Your calories sorted, without doing the maths",
    planText:
      "Your personal nutrition plan is put together automatically based on your calorie and protein targets, with a weekly menu, recipes and a shopping list. Foods like this one fit in too, in portions that suit your goal.",
    planCta: "See the nutrition plan",
  },
});

export function generateStaticParams() {
  // De talen komen uit de root layout; hier alleen de producten.
  return calorieProducts.map((p) => ({ product: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const [l, { product }] = await Promise.all([getLocale(), params]);
  const p = calorieProductBySlug(product);
  if (!p) notFound();
  return {
    title: pageTitle(p.metaTitle[l]),
    description: fill(p.metaDescription[l], calorieContext(l)),
    alternates: alternates(l, `/calorieen/${p.slug}`),
    openGraph: { type: "article" },
  };
}

/** "Calorieën banaan: hoeveel kcal …?" → ["Calorieën banaan:", "hoeveel kcal …?"] (het tweede deel krijgt de accentkleur). */
function splitTitle(title: string): [string, string | undefined] {
  const m = /^(.+?[:?])\s+(.+)$/.exec(title);
  return m ? [m[1], m[2]] : [title, undefined];
}

/** "1 banaan (zonder schil) · 120 g". */
const portionText = (v: { label: string; amount: string }) => `${v.label} · ${v.amount}`;

function NutrientTable({ food, l, c }: { food: FoodKey; l: Locale; c: CalorieContext }) {
  const t = ui[l];
  const f = foods[food];
  const hasSugars = (f.per100 as Nutrients).sugars !== undefined;
  const cells = (v: Values) => [v.kcal, `${v.protein} g`, `${v.carbs} g`, ...(hasSugars ? [`${v.sugars} g`] : []), `${v.fat} g`, `${v.fiber} g`];
  const head = [t.amount, t.kcal, t.protein, t.carbs, ...(hasSugars ? [t.sugars] : []), t.fat, t.fiber];
  const rows = [[t.per100(f.unit), ...cells(c.per100(food))], ...f.portions.map((_, i) => [portionText(c.portion(food, i)), ...cells(c.portion(food, i))])];
  return <DataTable head={head} rows={rows} minWidth={hasSugars ? "42rem" : "38rem"} />;
}

export default function CalorieProductPage({ params }: { params: Params }) {
  // De parameter wordt binnen de Suspense-grens gelezen: alle producten staan in
  // generateStaticParams en worden volledig vooraf gebouwd; de gedeelde App Shell
  // (Partial Prefetching) blijft zo vrij van adresgegevens.
  return (
    <Suspense fallback={<HeroFallback />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

function HeroFallback() {
  return (
    <section className="bg-gradient-to-b from-brand-50 to-cream pt-10 pb-12 sm:pt-14" aria-hidden>
      <div className="container-page">
        <div className="h-80 max-w-3xl animate-pulse rounded-[1.5rem] bg-white/70" />
      </div>
    </section>
  );
}

async function ProductContent({ params }: { params: Params }) {
  const [l, { product }] = await Promise.all([getLocale(), params]);
  const p = calorieProductBySlug(product);
  if (!p) notFound();
  const t = ui[l];
  const c = calorieContext(l);
  const path = `/calorieen/${p.slug}`;
  const [title, accent] = splitTitle(p.title[l]);
  const compared: FoodKey[] = [p.foods[0], ...p.comparisons];
  const units = new Set(compared.map((k) => foods[k].unit));
  const compareUnit = units.size === 1 ? [...units][0] : "g/ml";
  const otherPages = uniqueProducts(p.comparisons.map(calorieProductForFood)).filter((x) => x.slug !== p.slug);

  return (
    <>
      <ArticleSchema l={l} path={path} title={p.metaTitle[l]} description={fill(p.metaDescription[l], c)} updated={UPDATED} />
      <ContentHero l={l} eyebrow={t.eyebrow} title={title} accent={accent} intro={p.intro[l]} updated={UPDATED} short={fill(p.short[l], c)} />

      <ArticleBody>
        <Section title={p.tableTitle[l]} paragraphs={[t.valuesIntro]}>
          {p.foods.length === 1 ? (
            <NutrientTable food={p.foods[0]} l={l} c={c} />
          ) : (
            p.foods.map((food) => (
              <div key={food} className="space-y-3 pt-2">
                <h3 className="text-xl font-extrabold">{foods[food].name[l]}</h3>
                <NutrientTable food={food} l={l} c={c} />
              </div>
            ))
          )}
          <p className="text-sm text-muted">{t.valuesNote}</p>
        </Section>

        {p.sections[l].map((s) => (
          <Section key={s.title} title={s.title} paragraphs={s.paragraphs?.map((x) => fill(x, c))} bullets={s.bullets?.map((x) => fill(x, c))} />
        ))}

        <Section title={p.compareTitle[l]} paragraphs={[t.compareIntro]}>
          <DataTable
            head={t.compareHead(compareUnit)}
            rows={compared.map((k) => {
              const v = c.portion(k);
              return [foods[k].name[l], portionText(v), v.kcal, `${v.protein} g`, c.per100(k).kcal];
            })}
            note={t.compareNote}
            minWidth="40rem"
          />
          {otherPages.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="text-sm font-bold text-muted">{t.seeAlso}:</span>
              {otherPages.map((x) => (
                <ArrowLink key={x.slug} href={`/calorieen/${x.slug}`}>
                  {x.label[l]}
                </ArrowLink>
              ))}
            </div>
          )}
          <ArrowLink href="/calorieen">{t.hub}</ArrowLink>
        </Section>

        <Section title={p.fit[l].title} paragraphs={p.fit[l].paragraphs?.map((x) => fill(x, c))} bullets={p.fit[l].bullets?.map((x) => fill(x, c))}>
          <ArrowLink href="/caloriebehoefte-berekenen">{t.calc}</ArrowLink>
        </Section>

        <PlanBox title={t.planTitle} text={t.planText} href="/voedingsschema" cta={t.planCta} />
        <RelatedPages l={l} paths={RELATED} />
      </ArticleBody>

      <FaqAndClose l={l} items={p.faq[l].map((f) => ({ q: f.q, a: fill(f.a, c) }))} />
    </>
  );
}

function uniqueProducts(list: (CalorieProduct | undefined)[]): CalorieProduct[] {
  const seen = new Set<string>();
  return list.filter((x): x is CalorieProduct => {
    if (!x || seen.has(x.slug)) return false;
    seen.add(x.slug);
    return true;
  });
}

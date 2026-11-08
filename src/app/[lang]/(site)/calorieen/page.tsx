import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ArrowLink, ArticleBody, ArticleSchema, ContentHero, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { calorieContext, calorieProductForFood, calorieProducts, calorieTableGroups, fill, type CalorieContext, type Fill } from "@/content/calorie-products";
import { foods, type FoodKey } from "@/content/nutrition";
import { defineCopy, type Locale } from "@/i18n/config";
import Link from "@/i18n/Link";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const PATH = "/calorieen";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";
const FOOD_COUNT = Object.keys(foods).length;
const RELATED = ["/caloriebehoefte-berekenen", "/eiwitten-per-dag", "/gezonde-snacks", "/koolhydraten-per-dag"];

const copy = defineCopy<{
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  accent: string;
  intro: string;
  short: Fill;
  howTitle: string;
  howBullets: Fill[];
  jump: string;
  cols: (unit: string) => string[];
  tableNote: string;
  productsTitle: string;
  productsIntro: string;
  perPortion: (portion: string, kcal: string) => string;
  needTitle: string;
  needText: string[];
  calc: string;
  planTitle: string;
  planText: string;
  planCta: string;
  faq: { q: string; a: Fill }[];
}>({
  nl: {
    metaTitle: "Calorietabel: calorieën van voedingsmiddelen per portie",
    metaDescription: `Calorietabel met ${FOOD_COUNT} voedingsmiddelen: kcal en eiwit per portie en kcal per 100 gram. Van fruit, groente en brood tot zuivel, vlees, noten en drankjes.`,
    eyebrow: "Voeding",
    title: "Calorietabel:",
    accent: "calorieën van voedingsmiddelen per portie",
    intro:
      "Hoeveel calorieën zitten er in een banaan, een boterham of een glas wijn? In deze calorietabel vind je de calorieën en het eiwit van veelgegeten producten, per gangbare portie en per 100 gram.",
    short: (c) =>
      `Een banaan heeft ± ${c.portion("banaan").kcal} kcal, een ei ± ${c.portion("ei").kcal} kcal, een snee volkoren brood ± ${c.portion("volkorenBrood").kcal} kcal en een glas pils (${c.portion("bier").amount}) ± ${c.portion("bier").kcal} kcal. Groente heeft de minste calorieën; olie, noten en pindakaas de meeste: 1 eetlepel olijfolie is al ± ${c.portion("olijfolie").kcal} kcal. Alle waarden zijn afgeronde gemiddelden; per merk verschilt het wat.`,
    howTitle: "Zo lees je de calorietabel",
    howBullets: [
      "Per portie: een gangbare hoeveelheid, zoals 1 banaan of 1 snee brood. Met de waarden per 100 gram (bij dranken per 100 ml) kun je vergelijken met het etiket.",
      (c) =>
        `Rijst, pasta en andere granen staan ongekookt in de tabel, tenzij er gekookt bij staat: ${c.portion("rijstOngekookt").amount} ongekookte rijst wordt ± ${c.portion("rijstGekookt").amount} gekookt. Vlees en vis zijn rauw gewogen.`,
      "Koolhydraten tellen we zoals op Europese etiketten: zonder vezels.",
      "Voor de onderstreepte producten is er een eigen pagina, met koolhydraten, suikers, vet en vezels, en tips om het product in je eetpatroon te passen.",
    ],
    jump: "Ga naar",
    cols: (unit) => ["Product", "Portie", "Kcal per portie", "Eiwit per portie", `Kcal per 100 ${unit}`],
    tableNote: "Afgeronde gemiddelden; per merk verschilt het wat. Per portie afgerond op 5 kcal en op hele grammen (onder de 10 gram op halve).",
    productsTitle: "Calorieën per product",
    productsIntro:
      "Voor deze producten is er een eigen pagina, met de volledige voedingswaarde, een vergelijking met vergelijkbare producten en tips om ze in een afvalschema te passen.",
    perPortion: (portion, kcal) => `${portion}: ± ${kcal} kcal`,
    needTitle: "Hoeveel calorieën heb je per dag nodig?",
    needText: [
      "Gemiddeld heeft een volwassen vrouw zo'n 2.000 kcal per dag nodig en een man zo'n 2.500 kcal. Jouw behoefte hangt af van je lengte, gewicht, leeftijd en hoeveel je beweegt. Wil je afvallen, dan eet je wat minder dan je verbruikt; een klein tekort is beter vol te houden dan een groot.",
    ],
    calc: "Bereken je caloriebehoefte",
    planTitle: "Een weekmenu dat al klopt met jouw calorieën",
    planText:
      "Je persoonlijke voedingsschema wordt automatisch samengesteld op basis van jouw calorie- en eiwitdoel. Je krijgt een weekmenu met recepten en een boodschappenlijst, dus je hoeft niets op te zoeken of op te tellen.",
    planCta: "Bekijk het voedingsschema",
    faq: [
      {
        q: "Hoeveel calorieën heb ik per dag nodig?",
        a: "Dat verschilt per persoon. Gemiddeld is het zo'n 2.000 kcal voor vrouwen en 2.500 kcal voor mannen, maar je lengte, gewicht, leeftijd en hoeveel je beweegt maken veel uit. Met de rekenhulp op onze pagina Caloriebehoefte berekenen zie je wat het voor jou is, ook als je wilt afvallen.",
      },
      {
        q: "Hoe nauwkeurig zijn de waarden in de calorietabel?",
        a: "Het zijn afgeronde gemiddelden van gangbare supermarktproducten. Per merk, ras en seizoen verschilt het wat. Voor een verpakt product is het etiket het nauwkeurigst; voor dagelijks gebruik zijn deze waarden ruim voldoende.",
      },
      {
        q: "Moet ik rijst en pasta ongekookt of gekookt wegen?",
        a: (c) =>
          `Het makkelijkst is ongekookt, want dan klopt het met de verpakking. Weeg je gekookt, gebruik dan de waarden voor gekookte rijst of pasta. Als vuistregel: ${c.portion("rijstOngekookt").amount} ongekookte rijst is ± ${c.portion("rijstGekookt").amount} gekookt, en ${c.portion("pastaOngekookt").amount} ongekookte pasta ± ${c.portion("pastaGekookt").amount} gekookt.`,
      },
      {
        q: "Moet ik calorieën tellen om af te vallen?",
        a: "Nee, dat hoeft niet. Afvallen gaat om een klein calorietekort over langere tijd. Tellen kan helpen om inzicht te krijgen in wat je eet, maar het kan ook met vaste porties of een weekmenu dat al op jouw calorieën is afgestemd.",
      },
    ],
  },
  en: {
    metaTitle: "Calorie table: calories in everyday foods per portion",
    metaDescription: `Calorie table with ${FOOD_COUNT} everyday foods: kcal and protein per portion and kcal per 100 grams. From fruit, vegetables and bread to dairy, meat, nuts and drinks.`,
    eyebrow: "Nutrition",
    title: "Calorie table:",
    accent: "calories in everyday foods per portion",
    intro:
      "How many calories are in a banana, a slice of bread or a glass of wine? In this calorie table, you'll find the calories and protein of everyday foods, per typical portion and per 100 grams.",
    short: (c) =>
      `A banana has ± ${c.portion("banaan").kcal} kcal, an egg ± ${c.portion("ei").kcal} kcal, a slice of wholemeal bread ± ${c.portion("volkorenBrood").kcal} kcal and a glass of lager (${c.portion("bier").amount}) ± ${c.portion("bier").kcal} kcal. Vegetables have the fewest calories; oil, nuts and peanut butter the most: 1 tablespoon of olive oil is already ± ${c.portion("olijfolie").kcal} kcal. All values are rounded averages; they vary a little by brand.`,
    howTitle: "How to read the calorie table",
    howBullets: [
      "Per portion: a typical amount, such as 1 banana or 1 slice of bread. With the values per 100 grams (per 100 ml for drinks), you can compare with the label.",
      (c) =>
        `Rice, pasta and other grains are listed uncooked unless it says cooked: ${c.portion("rijstOngekookt").amount} of uncooked rice becomes ± ${c.portion("rijstGekookt").amount} cooked. Meat and fish are weighed raw.`,
      "We count carbohydrates as on European labels: excluding fibre.",
      "The underlined foods have their own page, with carbohydrates, sugars, fat and fibre, and tips on fitting the food into your diet.",
    ],
    jump: "Go to",
    cols: (unit) => ["Food", "Portion", "Kcal per portion", "Protein per portion", `Kcal per 100 ${unit}`],
    tableNote: "Rounded averages; they vary a little by brand. Per portion rounded to 5 kcal and to whole grams (below 10 grams to half grams).",
    productsTitle: "Calories per food",
    productsIntro:
      "These foods have their own page, with the full nutritional values, a comparison with similar foods and tips on fitting them into a weight-loss plan.",
    perPortion: (portion, kcal) => `${portion}: ± ${kcal} kcal`,
    needTitle: "How many calories do you need a day?",
    needText: [
      "On average, an adult woman needs around 2,000 kcal a day and a man around 2,500 kcal. Your needs depend on your height, weight, age and how active you are. To lose weight, you eat a little less than you use; a small deficit is easier to keep up than a large one.",
    ],
    calc: "Calculate your calorie needs",
    planTitle: "A weekly menu that already matches your calories",
    planText:
      "Your personal nutrition plan is put together automatically based on your calorie and protein targets. You get a weekly menu with recipes and a shopping list, so there's nothing to look up or add up.",
    planCta: "See the nutrition plan",
    faq: [
      {
        q: "How many calories do I need a day?",
        a: "That varies from person to person. On average, it's around 2,000 kcal for women and 2,500 kcal for men, but your height, weight, age and how active you are make a big difference. The calculator on our calorie calculator page shows what it is for you, also if you want to lose weight.",
      },
      {
        q: "How accurate are the values in the calorie table?",
        a: "They're rounded averages of typical supermarket products. They vary a little by brand, variety and season. For a packaged product, the label is the most accurate; for everyday use, these values are more than good enough.",
      },
      {
        q: "Should I weigh rice and pasta uncooked or cooked?",
        a: (c) =>
          `Uncooked is easiest, because then it matches the packaging. If you weigh it cooked, use the values for cooked rice or pasta. As a rule of thumb: ${c.portion("rijstOngekookt").amount} of uncooked rice is ± ${c.portion("rijstGekookt").amount} cooked, and ${c.portion("pastaOngekookt").amount} of uncooked pasta ± ${c.portion("pastaGekookt").amount} cooked.`,
      },
      {
        q: "Do I need to count calories to lose weight?",
        a: "No, you don't have to. Losing weight is about a small calorie deficit over a longer period. Counting can help you understand what you eat, but you can also work with fixed portions or a weekly menu that's already matched to your calories.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

/** "Calorieën granen, brood en aardappelen" → "Granen, brood en aardappelen" (voor de snelkoppelingen). */
function groupLabel(title: string): string {
  const rest = title.replace(/^(Calorieën|Calories in) /, "");
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

/** Tabel met dezelfde opmaak als DataTable, maar met links naar de productpagina's. */
function FoodTable({ keys, l, c }: { keys: FoodKey[]; l: Locale; c: CalorieContext }) {
  const t = copy[l];
  const units = new Set(keys.map((k) => foods[k].unit));
  const unit = units.size === 1 ? [...units][0] : "g/ml";
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-white">
        <table className="w-full text-left text-sm" style={{ minWidth: "40rem" }}>
          <thead className="bg-sand text-xs font-bold text-muted uppercase">
            <tr>
              {t.cols(unit).map((h) => (
                <th key={h} scope="col" className="px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {keys.map((k) => {
              const v = c.portion(k);
              const page = calorieProductForFood(k);
              return (
                <tr key={k}>
                  <th scope="row" className="px-4 py-3 font-semibold">
                    {page ? (
                      <Link href={`/calorieen/${page.slug}`} className="text-brand-700 underline">
                        {foods[k].name[l]}
                      </Link>
                    ) : (
                      foods[k].name[l]
                    )}
                  </th>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                    {v.label} · {v.amount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">{v.kcal}</td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">{v.protein} g</td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">{c.per100(k).kcal}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">{t.tableNote}</p>
    </div>
  );
}

export default async function CalorieTablePage() {
  const l = await getLocale();
  const t = copy[l];
  const c = calorieContext(l);
  return (
    <>
      <ArticleSchema l={l} path={PATH} title={t.metaTitle} description={t.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={t.eyebrow} title={t.title} accent={t.accent} intro={t.intro} updated={UPDATED} short={fill(t.short, c)} />

      <ArticleBody>
        <Section title={t.howTitle} bullets={t.howBullets.map((b) => fill(b, c))}>
          <nav aria-label={t.jump} className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-sm font-bold text-muted">{t.jump}:</span>
            {calorieTableGroups.map((g) => (
              <a key={g.id} href={`#${g.id}`} className="rounded-full border border-line bg-white px-3 py-1 text-sm font-semibold transition hover:border-brand-300">
                {groupLabel(g.title[l])}
              </a>
            ))}
          </nav>
        </Section>

        {calorieTableGroups.map((g) => (
          <div key={g.id} id={g.id} className="scroll-mt-24">
            <Section title={g.title[l]} paragraphs={[g.intro[l]]}>
              <FoodTable keys={g.foods} l={l} c={c} />
            </Section>
          </div>
        ))}

        <Section title={t.productsTitle} paragraphs={[t.productsIntro]}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {calorieProducts.map((p) => {
              const v = c.portion(p.foods[0]);
              return (
                <li key={p.slug}>
                  <Link href={`/calorieen/${p.slug}`} className="card flex h-full items-center justify-between gap-3 p-4 transition hover:border-brand-300">
                    <span>
                      <span className="block font-bold">{p.label[l]}</span>
                      <span className="mt-0.5 block text-sm text-muted">{t.perPortion(v.label, v.kcal)}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-brand-600" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title={t.needTitle} paragraphs={t.needText}>
          <ArrowLink href="/caloriebehoefte-berekenen">{t.calc}</ArrowLink>
        </Section>

        <PlanBox title={t.planTitle} text={t.planText} href="/voedingsschema" cta={t.planCta} />
        <RelatedPages l={l} paths={RELATED} />
      </ArticleBody>

      <FaqAndClose l={l} items={t.faq.map((f) => ({ q: f.q, a: fill(f.a, c) }))} />
    </>
  );
}

import type { Metadata } from "next";
import { ArticleBody, ArticleSchema, ArrowLink, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { RecipeCard } from "@/components/content/RecipeCard";
import { foods, nutrientsFor, roundNutrients, sumNutrients, type FoodKey } from "@/content/nutrition";
import { nutritionRange, recipeNutrition, recipesIn } from "@/content/recipes";
import { defineCopy } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { formatNumber } from "@/lib/format";

const PATH = "/recepten/eiwitrijk-ontbijt";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

const RECIPES = recipesIn("ontbijt");
const [KCAL_MIN, KCAL_MAX] = nutritionRange(RECIPES, "kcal");
const [PROTEIN_MIN, PROTEIN_MAX] = nutritionRange(RECIPES, "protein");
const MINUTES_MAX = Math.max(...RECIPES.map((r) => r.minutes));
const MINUTES_MIN = Math.min(...RECIPES.map((r) => r.minutes));
const g = (key: FoodKey, amount: number) => Math.round(nutrientsFor(key, amount).protein);
/** Eiwit in een paar bekende porties, uit de voedingstabel. */
const QUARK_250 = g("kwarkMager", 250);
const EGGS_3 = g("ei", 165);
const BREAD_2 = g("volkorenBrood", 70);
const OATS_40 = Math.round(nutrientsFor("havermout", 40).protein * 2) / 2;

/** Snelle combinaties zonder recept (hoeveelheden in gram of ml). */
const QUICK: { nl: string; en: string; items: [FoodKey, number][] }[] = [
  { nl: "200 g skyr met een appel", en: "200 g skyr with an apple", items: [["skyr", 200], ["appel", 150]] },
  { nl: "250 g magere kwark met een banaan", en: "250 g low-fat quark with a banana", items: [["kwarkMager", 250], ["banaan", 120]] },
  { nl: "200 g hüttenkäse met cherrytomaatjes en 1 snee volkoren brood", en: "200 g cottage cheese with cherry tomatoes and 1 slice of wholemeal bread", items: [["huttenkase", 200], ["cherrytomaat", 100], ["volkorenBrood", 35]] },
  { nl: "2 sneetjes volkoren brood met 2 plakken kaas 30+ en een glas halfvolle melk", en: "2 slices of wholemeal bread with 2 slices of reduced-fat cheese and a glass of semi-skimmed milk", items: [["volkorenBrood", 70], ["kaas30", 40], ["melkHalfvol", 250]] },
];

const copy = defineCopy({
  nl: {
    metaTitle: "Eiwitrijk ontbijt: 8 snelle recepten om af te vallen",
    metaDescription: `Eiwitrijk ontbijt met ${PROTEIN_MIN} tot ${PROTEIN_MAX} gram eiwit: ${RECIPES.length} snelle, gezonde recepten om af te vallen, van kwarkbowl tot omelet, met calorieën per portie.`,
    eyebrow: "Recepten",
    h1: "Eiwitrijk ontbijt:",
    h1Accent: `${RECIPES.length} snelle recepten`,
    intro: `Een ontbijt met genoeg eiwit houdt je langer verzadigd, zodat je minder snel naar iets zoets grijpt. Deze ${RECIPES.length} recepten zijn klaar in ${MINUTES_MIN} tot ${MINUTES_MAX} minuten en passen goed als je wilt afvallen.`,
    short: `Een eiwitrijk ontbijt bevat minimaal zo'n 20 gram eiwit. Dat haal je bijvoorbeeld met 250 gram magere kwark (${QUARK_250} gram eiwit), 3 eieren (${EGGS_3} gram) of skyr met havermout. De ${RECIPES.length} recepten hieronder hebben ${PROTEIN_MIN} tot ${PROTEIN_MAX} gram eiwit en ${KCAL_MIN} tot ${KCAL_MAX} kcal per portie: een gezond ontbijt als je wilt afvallen.`,
    whyTitle: "Waarom een eiwitrijk ontbijt als je wilt afvallen?",
    why: [
      `Eiwit vult beter dan koolhydraten of vet. Toch bevat een gewoon Nederlands ontbijt vaak weinig eiwit: 2 volkoren boterhammen met jam of hagelslag leveren zo'n ${BREAD_2} gram. Dan heb je halverwege de ochtend al snel weer trek.`,
      "Met een eiwitrijk ontbijt verdeel je je eiwit ook beter over de dag. Dat is handig als je afvalt, want je eiwitdoel ligt dan hoger: zo'n 1,6 tot 1,8 gram per kilo lichaamsgewicht. Dat haal je makkelijker als je er bij elke maaltijd een deel van eet.",
    ],
    proteinLink: "Bereken hoeveel eiwit jij per dag nodig hebt",
    healthyTitle: "Gezond ontbijt om af te vallen: waar let je op?",
    healthyBullets: [
      "Minimaal zo'n 20 gram eiwit, uit bijvoorbeeld kwark, skyr, eieren, hüttenkäse of melk.",
      "Vezels uit havermout, volkoren brood en fruit. Die houden je langer verzadigd.",
      "Ongeveer 300 tot 450 kcal, als je per dag rond de 1.500 tot 1.800 kcal eet.",
      "Weinig toegevoegde suiker: kies naturel kwark, skyr of yoghurt en maak het zoet met fruit. Vruchtenyoghurt, ontbijtkoek en veel ontbijtgranen bevatten flink wat suiker.",
      "Iets wat bij je ochtend past. Weinig tijd? Kies een recept van 5 minuten of maak je ontbijt de avond ervoor.",
    ],
    tableTitle: "Eiwitrijk ontbijt: alle recepten op een rij",
    tableHead: ["Recept", "Kcal", "Eiwit", "Tijd"],
    tableNote: "Per portie, afgerond. De recepten staan hieronder.",
    recipesTitle: `${RECIPES.length} eiwitrijke ontbijtrecepten`,
    recipesIntro: "Alle hoeveelheden zijn per portie. Kruiden en specerijen tellen we niet mee in de calorieën.",
    quickTitle: "Snel eiwitrijk ontbijt zonder recept",
    quickIntro: "Geen zin om te koken? Met deze combinaties uit de supermarkt kom je ook aan je eiwit:",
    quickLine: (text: string, kcal: number, protein: string) => `${text}: ${kcal} kcal, ${protein} g eiwit`,
    planTitle: "Een ontbijt dat past bij jouw dag",
    planText:
      "In je persoonlijke voedingsschema krijg je elke dag een ontbijt, lunch, avondeten en tussendoortjes, met hoeveelheden op jouw calorie- en eiwitdoel en een boodschappenlijst. Het schema houdt rekening met wat je lekker vindt en met allergieën.",
    planCta: "Bekijk het voedingsschema",
    faq: [
      {
        q: "Wat is een goed eiwitrijk ontbijt?",
        a: "Een ontbijt met minimaal zo'n 20 gram eiwit, het liefst met wat vezels en fruit erbij. Denk aan een kwarkbowl met havermout en bessen, een omelet met groente en een snee volkoren brood, of overnight oats met skyr.",
      },
      {
        q: "Hoeveel eiwit moet er in je ontbijt zitten?",
        a: "Voor de meeste mensen is 20 tot 40 gram per maaltijd een goede richtlijn. Hoeveel je per dag nodig hebt, hangt af van je gewicht en je doel; als je afvalt is dat zo'n 1,6 tot 1,8 gram per kilo lichaamsgewicht.",
      },
      {
        q: "Is havermout eiwitrijk?",
        a: `Havermout bevat ${foods.havermout.per100.protein} gram eiwit per 100 gram. Een portie van 40 gram geeft dus zo'n ${formatNumber(OATS_40, 1, "nl")} gram. Dat is niet veel; combineer havermout daarom met kwark, skyr of melk.`,
      },
      {
        q: "Wat is een gezond ontbijt om af te vallen?",
        a: "Een ontbijt dat je vult voor niet te veel calorieën: genoeg eiwit, vezels uit volkoren producten of havermout, fruit en weinig toegevoegde suiker. Rond de 300 tot 450 kcal past bij de meeste mensen die afvallen.",
      },
      {
        q: "Kun je een eiwitrijk ontbijt van tevoren maken?",
        a: "Ja. Overnight oats en eiermuffins maak je makkelijk vooruit. Bewaar ze afgedekt in de koelkast en eet ze binnen 2 dagen op. Eiermuffins kun je ook invriezen; verwarm ze dan tot ze door en door heet zijn.",
      },
    ],
  },
  en: {
    metaTitle: "High-protein breakfast: 8 quick recipes for weight loss",
    metaDescription: `High-protein breakfast with ${PROTEIN_MIN} to ${PROTEIN_MAX} grams of protein: ${RECIPES.length} quick, healthy recipes for weight loss, from quark bowls to omelettes, with calories.`,
    eyebrow: "Recipes",
    h1: "High-protein breakfast:",
    h1Accent: `${RECIPES.length} quick recipes`,
    intro: `A breakfast with enough protein keeps you full for longer, so you're less likely to reach for something sweet. These ${RECIPES.length} recipes are ready in ${MINUTES_MIN} to ${MINUTES_MAX} minutes and work well when you want to lose weight.`,
    short: `A high-protein breakfast contains at least around 20 grams of protein. You can get that from, for example, 250 grams of low-fat quark (${QUARK_250} grams of protein), 3 eggs (${EGGS_3} grams) or skyr with oats. The ${RECIPES.length} recipes below have ${PROTEIN_MIN} to ${PROTEIN_MAX} grams of protein and ${KCAL_MIN} to ${KCAL_MAX} kcal per portion: a healthy breakfast when you want to lose weight.`,
    whyTitle: "Why a high-protein breakfast when you want to lose weight?",
    why: [
      `Protein is more filling than carbs or fat. Yet a typical breakfast often contains little protein: 2 slices of wholemeal bread with jam provide around ${BREAD_2} grams. By mid-morning, you're often hungry again.`,
      "A high-protein breakfast also helps you spread your protein over the day. That's useful when you're losing weight, because your protein target is higher: around 1.6 to 1.8 grams per kilo of body weight. It's easier to reach when you eat some of it at every meal.",
    ],
    proteinLink: "Work out how much protein you need a day",
    healthyTitle: "Healthy breakfast for weight loss: what to look for",
    healthyBullets: [
      "At least around 20 grams of protein, from quark, skyr, eggs, cottage cheese or milk, for example.",
      "Fibre from oats, wholemeal bread and fruit. It keeps you full for longer.",
      "Around 300 to 450 kcal, if you eat around 1,500 to 1,800 kcal a day.",
      "Little added sugar: choose plain quark, skyr or yoghurt and sweeten with fruit. Fruit yoghurts, breakfast cakes and many cereals contain quite a lot of sugar.",
      "Something that suits your morning. Short on time? Choose a 5-minute recipe or make breakfast the night before.",
    ],
    tableTitle: "High-protein breakfast: all recipes at a glance",
    tableHead: ["Recipe", "Kcal", "Protein", "Time"],
    tableNote: "Per portion, rounded. The recipes are below.",
    recipesTitle: `${RECIPES.length} high-protein breakfast recipes`,
    recipesIntro: "All amounts are per portion. We don't count herbs and spices in the calories.",
    quickTitle: "Quick high-protein breakfast without a recipe",
    quickIntro: "Don't feel like cooking? These supermarket combinations also get you your protein:",
    quickLine: (text: string, kcal: number, protein: string) => `${text}: ${kcal} kcal, ${protein} g protein`,
    planTitle: "A breakfast that fits your day",
    planText:
      "In your personal nutrition plan, you get a breakfast, lunch, dinner and snacks for every day, with amounts based on your calorie and protein targets and a shopping list. The plan takes into account what you like and any allergies.",
    planCta: "See the nutrition plan",
    faq: [
      {
        q: "What is a good high-protein breakfast?",
        a: "A breakfast with at least around 20 grams of protein, ideally with some fibre and fruit. Think of a quark bowl with oats and berries, an omelette with vegetables and a slice of wholemeal bread, or overnight oats with skyr.",
      },
      {
        q: "How much protein should your breakfast contain?",
        a: "For most people, 20 to 40 grams per meal is a good guideline. How much you need a day depends on your weight and your goal; when you're losing weight, it's around 1.6 to 1.8 grams per kilo of body weight.",
      },
      {
        q: "Are oats high in protein?",
        a: `Oats contain ${foods.havermout.per100.protein} grams of protein per 100 grams. A 40-gram portion gives you around ${formatNumber(OATS_40, 1, "en")} grams. That's not a lot, so combine oats with quark, skyr or milk.`,
      },
      {
        q: "What is a healthy breakfast for weight loss?",
        a: "A breakfast that fills you up without too many calories: enough protein, fibre from wholegrain products or oats, fruit and little added sugar. Around 300 to 450 kcal suits most people who are losing weight.",
      },
      {
        q: "Can you make a high-protein breakfast in advance?",
        a: "Yes. Overnight oats and egg muffins are easy to make ahead. Keep them covered in the fridge and eat them within 2 days. You can also freeze egg muffins; reheat them until piping hot all the way through.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

export default async function EiwitrijkOntbijtPage() {
  const l = await getLocale();
  const c = copy[l];
  const num = (x: number) => formatNumber(x, x % 1 === 0 ? 0 : 1, l);
  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short} />
      <ArticleBody>
        <Section title={c.whyTitle} paragraphs={c.why}>
          <ArrowLink href="/eiwitten-per-dag">{c.proteinLink}</ArrowLink>
        </Section>

        <Section title={c.healthyTitle} bullets={c.healthyBullets} />

        <Section title={c.tableTitle}>
          <DataTable
            head={c.tableHead}
            rows={RECIPES.map((r) => {
              const n = recipeNutrition(r);
              return [r.title[l], `${n.kcal} kcal`, `${num(n.protein)} g`, `${r.minutes} min`];
            })}
            note={c.tableNote}
          />
        </Section>

        <Section title={c.recipesTitle} paragraphs={[c.recipesIntro]}>
          <div className="space-y-6">
            {RECIPES.map((r) => (
              <RecipeCard key={r.slug} recipe={r} l={l} />
            ))}
          </div>
        </Section>

        <Section
          title={c.quickTitle}
          paragraphs={[c.quickIntro]}
          bullets={QUICK.map((q) => {
            const n = roundNutrients(sumNutrients(q.items));
            return c.quickLine(q[l], n.kcal, num(n.protein));
          })}
        />

        <PlanBox title={c.planTitle} text={c.planText} href="/voedingsschema" cta={c.planCta} />
        <RelatedPages l={l} paths={["/recepten/eiwitrijke-lunch", "/recepten/eiwitrijk-avondeten", "/meal-prep", "/eiwitten-per-dag"]} />
      </ArticleBody>
      <FaqAndClose l={l} items={c.faq} />
    </>
  );
}

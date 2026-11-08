import type { Metadata } from "next";
import { ArrowLink, ArticleBody, ArticleSchema, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { foods, nutrientsFor, roundNutrients, sumNutrients, type FoodKey } from "@/content/nutrition";
import { defineCopy, intlLocale, type Locale } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { formatNumber } from "@/lib/format";

const PATH = "/vezels-per-dag";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

/** Gezondheidsraad: ongeveer 14 gram vezels per 1.000 kcal (zoals fiberG in src/lib/calculations.ts). */
const FIBRE_PER_1000_KCAL = 14;
const KCAL_TABLE = [1500, 1800, 2000, 2200, 2500, 2800];
const fibreTarget = (kcal: number) => Math.round((kcal / 1000) * FIBRE_PER_1000_KCAL);

type Row = { key: FoodKey; amount?: number; portion?: Record<Locale, string> };
const TWO_SLICES = { nl: "2 sneetjes", en: "2 slices" };

/** Producten voor de vezeltabel; zonder `amount` geldt de standaardportie uit nutrition.ts. */
const FIBRE_ROWS: Row[] = [
  { key: "havermout" },
  { key: "volkorenBrood", amount: 70, portion: TWO_SLICES },
  { key: "witBrood", amount: 70, portion: TWO_SLICES },
  { key: "volkorenPastaOngekookt" },
  { key: "zilvervliesrijstOngekookt" },
  { key: "linzen" },
  { key: "kikkererwten" },
  { key: "zwarteBonen" },
  { key: "broccoli" },
  { key: "sperziebonen" },
  { key: "wortel" },
  { key: "appel" },
  { key: "peer" },
  { key: "kiwi" },
  { key: "amandelen" },
  { key: "chiazaad" },
];

type Item = { key: FoodKey; amount: number; text?: Record<Locale, string> };
type Moment = "breakfast" | "lunch" | "snack" | "dinner";

/** Voorbeelddag met 30+ gram vezels; alle getallen komen uit nutrition.ts. */
const SAMPLE_DAY: { moment: Moment; items: Item[] }[] = [
  {
    moment: "breakfast",
    items: [
      { key: "havermout", amount: 40 },
      { key: "melkHalfvol", amount: 250 },
      { key: "blauweBessen", amount: 75 },
      { key: "chiazaad", amount: 10 },
    ],
  },
  {
    moment: "lunch",
    items: [
      { key: "volkorenBrood", amount: 70, text: { nl: "2 sneetjes volkoren brood", en: "2 slices of wholemeal bread" } },
      { key: "hummus", amount: 30 },
      { key: "tomaat", amount: 100 },
      { key: "komkommer", amount: 75 },
    ],
  },
  {
    moment: "snack",
    items: [
      { key: "appel", amount: 150, text: { nl: "1 appel", en: "1 apple" } },
      { key: "amandelen", amount: 25 },
    ],
  },
  {
    moment: "dinner",
    items: [
      { key: "volkorenPastaOngekookt", amount: 80 },
      { key: "broccoli", amount: 200 },
      { key: "kipfilet", amount: 125 },
      { key: "tomatenblokjes", amount: 200 },
    ],
  },
];

type Facts = { total: string; at1800: string; lentils: string; beans: string; chickpeas: string; wholemeal: string; white: string };

const copy = defineCopy({
  nl: {
    metaTitle: "Vezels per dag: hoeveel heb je nodig? Met voorbeelddag",
    metaDescription:
      "Hoeveel vezels per dag heb je nodig? Het advies is 30 tot 40 gram. Zie in welke voeding de meeste vezels zitten, waarom ze goed vullen en een voorbeelddag.",
    eyebrow: "Voeding",
    h1: "Vezels per dag:",
    h1Accent: "hoeveel heb je nodig?",
    intro:
      "Vezels houden je spijsvertering op gang en geven een vol gevoel. Maar hoeveel heb je er nodig, en waar zitten ze in? Hier lees je het advies, met een tabel per portie en een voorbeelddag.",
    short: (f: Facts) =>
      `De Gezondheidsraad adviseert ongeveer 14 gram vezels per 1.000 kcal. Voor de meeste volwassenen komt dat neer op 30 tot 40 gram per dag. Je haalt dat met volkoren brood, havermout, peulvruchten, groente en fruit: met de voorbeelddag op deze pagina kom je op zo'n ${f.total} gram.`,
    adviceTitle: "Hoeveel vezels per dag heb je nodig?",
    advice: [
      "De Gezondheidsraad adviseert ongeveer 14 gram vezels per 1.000 kcal die je eet. Voor de meeste volwassenen is dat 30 tot 40 gram per dag. Wie meer eet, heeft dus ook meer vezels nodig.",
      "In onze schema's rekenen we met dezelfde 14 gram per 1.000 kcal. In de tabel zie je wat dat is bij verschillende hoeveelheden calorieën.",
    ],
    tableHead: ["Calorieën per dag", "Vezels per dag"],
    tableNote: "14 gram vezels per 1.000 kcal, afgerond op hele grammen.",
    whyTitle: "Waarom zijn vezels belangrijk?",
    why: [
      "Vezels zijn de delen van plantaardig eten die je lichaam niet zelf kan verteren. Een deel ervan wordt in je dikke darm afgebroken door darmbacteriën.",
      "Vezels zijn goed voor je spijsvertering: ze helpen je ontlasting soepel en regelmatig te houden. Daarnaast geven ze een vol gevoel, waardoor je minder snel trek krijgt.",
      "Vezels zitten alleen in plantaardige producten: volkoren granen, peulvruchten, groente, fruit, noten en zaden. In vlees, vis, eieren en zuivel zitten geen vezels.",
    ],
    weightLossTitle: "Helpen vezels bij afvallen?",
    weightLoss: (f: Facts) => [
      "Vezels laten je niet vanzelf afvallen, maar ze maken het wel makkelijker. Vezelrijke producten vullen goed, dus je houdt het langer vol als je minder calorieën eet.",
      `Een voorbeeld: 2 sneetjes volkoren brood bevatten ${f.wholemeal} gram vezels, 2 sneetjes wit brood ${f.white} gram. Vul je je bord daarnaast met groente en kies je vaker peulvruchten, dan eet je meer volume voor minder calorieën.`,
    ],
    foodsTitle: "Vezelrijke voeding: tabel per portie",
    foodsIntro: "Zo veel vezels zit er in een gewone portie. Peulvruchten, volkoren producten en noten springen eruit.",
    foodsHead: ["Product", "Portie", "Vezels", "Calorieën"],
    foodsNote: "Afgeronde waarden; per merk verschilt het wat.",
    dayTitle: "Voorbeelddag: zo kom je aan 30 gram vezels of meer",
    dayIntro: "Met gewone producten kom je makkelijk aan je vezels. Zo kan een dag eruitzien:",
    dayHead: ["Moment", "Wat je eet", "Vezels"],
    moments: { breakfast: "Ontbijt", lunch: "Lunch", snack: "Tussendoor", dinner: "Avondeten" } as Record<Moment, string>,
    total: "Totaal",
    dayNote: "Een voorbeeld om te laten zien hoe je aan je vezels komt, geen compleet dagmenu. Pasta en vlees zijn ongekookt gewogen.",
    tipsTitle: "Zo eet je meer vezels",
    tips: [
      "Kies volkoren brood, volkoren pasta en zilvervliesrijst in plaats van de witte varianten.",
      "Ontbijt met havermout of muesli zonder toegevoegde suiker.",
      "Eet elke week peulvruchten, zoals linzen, kikkererwten of bonen. Ze passen goed in soep, salade of curry.",
      "Eet elke dag 250 gram groente en 2 stuks fruit, zoals het Voedingscentrum adviseert.",
      "Laat de schil van appels en peren zitten.",
      "Neem als tussendoortje een handje ongezouten noten, of doe een eetlepel chiazaad door je yoghurt.",
    ],
    buildTitle: "Bouw het rustig op en drink genoeg",
    build: [
      "Eet je nu weinig vezels? Bouw het dan rustig op, over een paar weken. Ga je ineens veel meer vezels eten, dan kun je last krijgen van een opgeblazen gevoel, winderigheid of buikkramp.",
      "Drink ook genoeg: vezels nemen vocht op in je darmen. Heb je langere tijd darmklachten, overleg dan met je huisarts.",
    ],
    waterLink: "Hoeveel water per dag moet je drinken?",
    boxTitle: "Genoeg vezels, zonder te tellen",
    boxText:
      "In je persoonlijke voedingsschema rekenen we je calorieën en eiwit voor je uit. Je krijgt een weekmenu met recepten en een boodschappenlijst, met volkoren producten, groente en peulvruchten.",
    boxCta: "Maak mijn persoonlijke plan",
    boxNote: "± 3 minuten · je betaalt pas als je een plan kiest",
    faq: (f: Facts) => [
      {
        q: "Hoeveel vezels per dag heb je nodig?",
        a: "De Gezondheidsraad adviseert ongeveer 14 gram vezels per 1.000 kcal. Voor de meeste volwassenen is dat 30 tot 40 gram per dag.",
      },
      {
        q: "Hoeveel vezels per dag om af te vallen?",
        a: `Daar is geen apart advies voor. Vezels helpen wel, omdat ze goed vullen. In onze schema's rekenen we met 14 gram per 1.000 kcal: bij 1.800 kcal is dat zo'n ${f.at1800} gram per dag.`,
      },
      {
        q: "Kun je te veel vezels eten?",
        a: "Ga je ineens veel meer vezels eten, dan kun je last krijgen van een opgeblazen gevoel, winderigheid of buikkramp. Bouw het daarom rustig op en drink genoeg. Houden klachten aan, overleg dan met je huisarts.",
      },
      {
        q: "Welke voeding bevat de meeste vezels?",
        a: `Peulvruchten zijn koplopers: een portie linzen (150 gram) bevat zo'n ${f.lentils} gram vezels, zwarte bonen ${f.beans} gram en kikkererwten ${f.chickpeas} gram. Ook volkoren producten, havermout, noten en zaden bevatten veel vezels.`,
      },
      {
        q: "Zitten er vezels in vlees of zuivel?",
        a: "Nee. Vezels zitten alleen in plantaardige producten, zoals volkoren granen, peulvruchten, groente, fruit, noten en zaden.",
      },
      {
        q: "Bevat wit brood ook vezels?",
        a: `Ja, maar minder dan volkoren brood. 2 sneetjes wit brood bevatten zo'n ${f.white} gram vezels, 2 sneetjes volkoren brood ${f.wholemeal} gram.`,
      },
    ],
  },
  en: {
    metaTitle: "How much fibre a day? Table and example day",
    metaDescription:
      "How much fibre do you need a day? The advice is 30 to 40 grams. See which foods contain the most fibre, why it fills you up and an example day that gets you there.",
    eyebrow: "Nutrition",
    h1: "How much fibre",
    h1Accent: "do you need a day?",
    intro:
      "Fibre keeps your digestion moving and keeps you feeling full. But how much do you need, and where do you find it? Here's the advice, with a table per portion and an example day.",
    short: (f: Facts) =>
      `The Dutch Health Council advises around 14 grams of fibre per 1,000 kcal. For most adults, that comes to 30 to 40 grams a day. You can get there with wholemeal bread, oats, pulses, vegetables and fruit: the example day on this page gives you around ${f.total} grams.`,
    adviceTitle: "How much fibre a day do you need?",
    advice: [
      "The Dutch Health Council advises around 14 grams of fibre per 1,000 kcal you eat. For most adults, that's 30 to 40 grams a day. So the more you eat, the more fibre you need.",
      "In our plans, we use the same 14 grams per 1,000 kcal. The table shows what that is at different calorie amounts.",
    ],
    tableHead: ["Calories a day", "Fibre a day"],
    tableNote: "14 grams of fibre per 1,000 kcal, rounded to whole grams.",
    whyTitle: "Why is fibre important?",
    why: [
      "Fibre is the part of plant foods that your body can't digest by itself. Some of it is broken down in your large intestine by gut bacteria.",
      "Fibre is good for your digestion: it helps keep your stools soft and regular. It also keeps you feeling full, so you get hungry less quickly.",
      "Fibre is only found in plant foods: wholegrains, pulses, vegetables, fruit, nuts and seeds. Meat, fish, eggs and dairy contain no fibre.",
    ],
    weightLossTitle: "Does fibre help you lose weight?",
    weightLoss: (f: Facts) => [
      "Fibre won't make you lose weight on its own, but it does make it easier. Fibre-rich foods are filling, so it's easier to keep going when you're eating fewer calories.",
      `An example: 2 slices of wholemeal bread contain ${f.wholemeal} grams of fibre, 2 slices of white bread ${f.white} grams. If you also fill your plate with vegetables and choose pulses more often, you eat more volume for fewer calories.`,
    ],
    foodsTitle: "High-fibre foods: table per portion",
    foodsIntro: "This is how much fibre a normal portion contains. Pulses, wholegrain products and nuts stand out.",
    foodsHead: ["Product", "Portion", "Fibre", "Calories"],
    foodsNote: "Rounded values; they vary a little by brand.",
    dayTitle: "Example day: how to reach 30 grams of fibre or more",
    dayIntro: "With ordinary products, it's easy to reach your fibre. This is what a day could look like:",
    dayHead: ["Moment", "What you eat", "Fibre"],
    moments: { breakfast: "Breakfast", lunch: "Lunch", snack: "Snack", dinner: "Dinner" } as Record<Moment, string>,
    total: "Total",
    dayNote: "An example to show how to reach your fibre, not a complete daily menu. Pasta and meat are weighed uncooked.",
    tipsTitle: "How to eat more fibre",
    tips: [
      "Choose wholemeal bread, wholewheat pasta and brown rice instead of the white versions.",
      "Have oats or muesli without added sugar for breakfast.",
      "Eat pulses every week, such as lentils, chickpeas or beans. They work well in soup, salad or curry.",
      "Eat 250 grams of vegetables and 2 pieces of fruit every day, as the Netherlands Nutrition Centre advises.",
      "Leave the skin on apples and pears.",
      "Have a handful of unsalted nuts as a snack, or stir a tablespoon of chia seeds into your yoghurt.",
    ],
    buildTitle: "Build up gradually and drink enough",
    build: [
      "Do you eat little fibre at the moment? Then build it up gradually, over a few weeks. If you suddenly eat much more fibre, you may get bloating, wind or stomach cramps.",
      "Drink enough too: fibre absorbs fluid in your gut. If you have bowel problems for a longer time, talk to your GP.",
    ],
    waterLink: "How much water a day should you drink?",
    boxTitle: "Enough fibre, without counting",
    boxText:
      "In your personal nutrition plan, we work out your calories and protein for you. You get a weekly menu with recipes and a shopping list, with wholegrain products, vegetables and pulses.",
    boxCta: "Create my personal plan",
    boxNote: "About 3 minutes · you only pay once you choose a plan",
    faq: (f: Facts) => [
      {
        q: "How much fibre do you need a day?",
        a: "The Dutch Health Council advises around 14 grams of fibre per 1,000 kcal. For most adults, that's 30 to 40 grams a day.",
      },
      {
        q: "How much fibre a day to lose weight?",
        a: `There's no separate advice for that. Fibre does help, because it's filling. In our plans, we use 14 grams per 1,000 kcal: at 1,800 kcal, that's around ${f.at1800} grams a day.`,
      },
      {
        q: "Can you eat too much fibre?",
        a: "If you suddenly eat much more fibre, you may get bloating, wind or stomach cramps. So build it up gradually and drink enough. If symptoms persist, talk to your GP.",
      },
      {
        q: "Which foods contain the most fibre?",
        a: `Pulses lead the way: a portion of lentils (150 grams) contains around ${f.lentils} grams of fibre, black beans ${f.beans} grams and chickpeas ${f.chickpeas} grams. Wholegrain products, oats, nuts and seeds are also high in fibre.`,
      },
      {
        q: "Is there fibre in meat or dairy?",
        a: "No. Fibre is only found in plant foods, such as wholegrains, pulses, vegetables, fruit, nuts and seeds.",
      },
      {
        q: "Does white bread contain fibre too?",
        a: `Yes, but less than wholemeal bread. 2 slices of white bread contain around ${f.white} grams of fibre, 2 slices of wholemeal bread ${f.wholemeal} grams.`,
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

export default async function VezelsPage() {
  const l = await getLocale();
  const c = copy[l];
  const n = (x: number) => formatNumber(x, 0, l);
  /** Grammen onder 10 kunnen op 0,5 eindigen (zie roundNutrients). */
  const dec = (x: number) => formatNumber(x, Number.isInteger(x) ? 0 : 1, l);
  const fibre = (key: FoodKey, amount: number) => roundNutrients(nutrientsFor(key, amount)).fiber;
  const list = new Intl.ListFormat(intlLocale(l), { type: "conjunction" });

  const dayItems = SAMPLE_DAY.flatMap((m) => m.items.map((i): [FoodKey, number] => [i.key, i.amount]));
  const dayTotal = roundNutrients(sumNutrients(dayItems)).fiber;

  const facts: Facts = {
    total: n(dayTotal),
    at1800: n(fibreTarget(1800)),
    lentils: dec(fibre("linzen", foods.linzen.portions[0].amount)),
    beans: dec(fibre("zwarteBonen", foods.zwarteBonen.portions[0].amount)),
    chickpeas: dec(fibre("kikkererwten", foods.kikkererwten.portions[0].amount)),
    wholemeal: dec(fibre("volkorenBrood", 70)),
    white: dec(fibre("witBrood", 70)),
  };

  const targetRows = KCAL_TABLE.map((kcal) => [`${n(kcal)} kcal`, `${n(fibreTarget(kcal))} g`]);
  const foodRows = FIBRE_ROWS.map(({ key, amount, portion }) => {
    const food = foods[key];
    const size = amount ?? food.portions[0].amount;
    const v = roundNutrients(nutrientsFor(key, size));
    return [food.name[l], `${portion?.[l] ?? food.portions[0].label[l]} · ${n(size)} ${food.unit}`, `${dec(v.fiber)} g`, `${n(v.kcal)} kcal`];
  });
  const dayRows = [
    ...SAMPLE_DAY.map(({ moment, items }) => {
      const text = list.format(items.map((i) => i.text?.[l] ?? `${n(i.amount)} ${foods[i.key].unit} ${foods[i.key].name[l].toLowerCase()}`));
      const total = roundNutrients(sumNutrients(items.map((i): [FoodKey, number] => [i.key, i.amount]))).fiber;
      return [c.moments[moment], text, `${dec(total)} g`];
    }),
    [c.total, "", `± ${n(dayTotal)} g`],
  ];

  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short(facts)} />

      <ArticleBody>
        <Section title={c.adviceTitle} paragraphs={c.advice}>
          <DataTable head={c.tableHead} rows={targetRows} note={c.tableNote} minWidth="18rem" />
        </Section>

        <Section title={c.whyTitle} paragraphs={c.why} />

        <Section title={c.weightLossTitle} paragraphs={c.weightLoss(facts)} />

        <Section title={c.foodsTitle} paragraphs={[c.foodsIntro]}>
          <DataTable head={c.foodsHead} rows={foodRows} note={c.foodsNote} minWidth="34rem" />
        </Section>

        <Section title={c.dayTitle} paragraphs={[c.dayIntro]}>
          <DataTable head={c.dayHead} rows={dayRows} note={c.dayNote} minWidth="36rem" />
        </Section>

        <Section title={c.tipsTitle} bullets={c.tips} />

        <Section title={c.buildTitle} paragraphs={c.build}>
          <ArrowLink href="/hoeveel-water-per-dag">{c.waterLink}</ArrowLink>
        </Section>

        <PlanBox title={c.boxTitle} text={c.boxText} href="/start?doel=afvallen" cta={c.boxCta} note={c.boxNote} />

        <RelatedPages l={l} paths={["/koolhydraten-per-dag", "/hoeveel-water-per-dag", "/gezonde-snacks", "/eiwitten-per-dag"]} />
      </ArticleBody>

      <FaqAndClose l={l} items={c.faq(facts)} />
    </>
  );
}

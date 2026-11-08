import type { Metadata } from "next";
import { SugarCalculator } from "@/components/calculator/SugarCalculator";
import { ArrowLink, ArticleBody, ArticleSchema, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { foods, nutrientsFor, roundNutrients, type FoodKey } from "@/content/nutrition";
import { defineCopy } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { formatNumber } from "@/lib/format";

const PATH = "/hoeveel-suiker-per-dag";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

/** WHO: vrije suikers onder 10 % van de energie, liefst onder 5 %. 1 gram suiker = 4 kcal; een suikerklontje ≈ 4 gram. */
const MAX_SHARE = 0.1;
const IDEAL_SHARE = 0.05;
const GRAMS_PER_CUBE = 4;
const KCAL_TABLE = [1500, 1800, 2000, 2200, 2500];

const sugarLimit = (kcal: number, share: number) => Math.round((kcal * share) / 4);

/** Producten voor de suikertabel (standaardportie uit nutrition.ts) en of het om vrije suikers gaat. */
const SUGAR_ROWS: { key: FoodKey; free: boolean }[] = [
  { key: "cola", free: true },
  { key: "sinaasappelsap", free: true },
  { key: "honing", free: true },
  { key: "pureChocolade", free: true },
  { key: "appel", free: false },
  { key: "banaan", free: false },
  { key: "melkHalfvol", free: false },
  { key: "yoghurtMager", free: false },
];

/** Suiker en calorieën van de standaardportie (de eerste portie in nutrition.ts). */
function perPortion(key: FoodKey) {
  const portion = foods[key].portions[0];
  return roundNutrients(nutrientsFor(key, portion.amount));
}

type Facts = { max: string; ideal: string; maxCubes: string; idealCubes: string; cola: string; colaCubes: string; colaKcal: string; weekKcal: string; honey: string };

const copy = defineCopy({
  nl: {
    metaTitle: "Hoeveel suiker per dag mag je? Advies en rekenhulp",
    metaDescription:
      "Hoeveel suiker per dag mag je? De WHO adviseert minder dan 50 gram bij 2.000 kcal, liefst 25 gram. Bereken je eigen grens en zie waar suiker in zit.",
    eyebrow: "Voeding",
    h1: "Hoeveel suiker per dag",
    h1Accent: "mag je?",
    intro:
      "Suiker zit in veel meer producten dan je denkt. Hoeveel is nog verstandig, en telt de suiker in fruit ook mee? Bereken je eigen grens en lees waar je op let.",
    short: (f: Facts) =>
      `De WHO adviseert om minder dan 10 procent van je energie uit vrije suikers te halen, en liefst minder dan 5 procent. Bij 2.000 kcal per dag is dat minder dan ${f.max} gram, en liefst minder dan ${f.ideal} gram: zo'n ${f.idealCubes} suikerklontjes. Eén blikje cola bevat al ${f.cola} gram.`,
    adviceTitle: "Hoeveel suiker per dag mag je?",
    advice: [
      "De Wereldgezondheidsorganisatie (WHO) adviseert om minder dan 10 procent van je energie uit vrije suikers te halen. Nog beter is minder dan 5 procent. Eén gram suiker levert 4 kcal, en een suikerklontje weegt ongeveer 4 gram.",
      "Hoeveel gram dat is, hangt af van hoeveel calorieën je per dag eet. In de tabel zie je de grens bij verschillende hoeveelheden.",
    ],
    tableHead: ["Calorieën per dag", "Maximaal (10 %)", "Liefst (5 %)"],
    cell: (g: string, cubes: string) => `< ${g} g (≈ ${cubes} klontjes)`,
    tableNote: "Gram vrije suikers per dag. Klontjes naar beneden afgerond, omdat het om een bovengrens gaat.",
    freeTitle: "Wat zijn vrije suikers?",
    freeIntro: "Het advies van de WHO gaat niet over alle suikers, maar over vrije suikers. Dat zijn:",
    freeBullets: [
      "Suiker die wordt toegevoegd: door de fabrikant (in frisdrank, koek of saus) of door jezelf (in je thee of koffie).",
      "De suikers in honing en siroop, zoals stroop, agavesiroop en ahornsiroop.",
      "De suikers in vruchtensap, ook als het vers geperst is of er 'zonder toegevoegde suiker' op staat.",
    ],
    freeOutro:
      "De suikers die van nature in heel fruit, groente en melk zitten, horen er niet bij. Een appel of een glas melk telt dus niet mee voor je suikergrens.",
    labelTitle: "'Waarvan suikers' op het etiket",
    label: [
      "Op het etiket staat bij de koolhydraten 'waarvan suikers'. Dat getal bevat alle suikers: ook de suikers die van nature in het product zitten, zoals melksuiker in yoghurt. Je kunt dus niet direct aflezen hoeveel vrije suikers erin zitten.",
      "Kijk daarom ook naar de ingrediëntenlijst. De ingrediënten staan op volgorde van hoeveelheid: hoe eerder suiker in de lijst staat, hoe meer erin zit. Suiker heeft veel namen, zoals glucosestroop, glucose-fructosestroop, dextrose, fructose, honing, siroop en vruchtensapconcentraat.",
    ],
    hiddenTitle: "Hier zit ongemerkt veel suiker in",
    hiddenIntro: "Suiker zit ook in producten waar je het niet direct van verwacht. Let vooral op:",
    hiddenBullets: [
      "Frisdrank en energiedrankjes.",
      "Vruchtensap, ook zonder toegevoegde suiker.",
      "Yoghurtdrankjes, vruchtenyoghurt en vla.",
      "Ontbijtgranen, cruesli en ontbijtkoek.",
      "Sauzen zoals ketchup, barbecuesaus en zoetzure sauzen.",
      "Koek, snoep, chocolade en gebak.",
    ],
    sugarTableIntro: "Zo veel suiker zit er in een gewone portie. In de laatste kolom zie je of het meetelt voor het WHO-advies.",
    sugarHead: ["Product", "Portie", "Suikers", "Vrije suiker?"],
    yes: "Ja",
    no: "Nee, van nature",
    sugarNote: "Afgeronde waarden; per merk verschilt het wat. 'Suikers' is wat op het etiket staat bij 'waarvan suikers'.",
    weightLossTitle: "Suiker en afvallen",
    weightLoss: (f: Facts) => [
      "Suiker maakt niet meer dik dan andere calorieën. Maar producten met veel suiker leveren vaak veel calorieën zonder dat je er echt vol van raakt. Vooral bij drankjes merk je dat nauwelijks.",
      `Een blikje cola bevat ± ${f.colaKcal} kcal. Drink je er elke dag één, dan is dat zo'n ${f.weekKcal} kcal per week. Als je wilt afvallen, is het schrappen van suikerhoudende drankjes daarom vaak een makkelijke eerste stap.`,
    ],
    waterLink: "Hoeveel water per dag moet je drinken?",
    tipsTitle: "Zo eet je minder suiker",
    tips: [
      "Drink water, thee of koffie zonder suiker in plaats van frisdrank en sap.",
      "Eet heel fruit in plaats van vruchtensap: dan krijg je er ook vezels bij.",
      "Kies naturel yoghurt of kwark en doe er zelf vers fruit bij.",
      "Ontbijt met havermout of muesli zonder toegevoegde suiker in plaats van gezoete ontbijtgranen.",
      "Gebruik je suiker in je thee of koffie? Bouw het stap voor stap af.",
      "Kijk bij sauzen en kant-en-klare producten naar de ingrediëntenlijst.",
    ],
    snacksLink: "Gezonde snacks met calorieën per portie",
    boxTitle: "Gezond eten, zonder zelf te rekenen",
    boxText:
      "In je persoonlijke voedingsschema rekenen we je calorieën en eiwit voor je uit. Je krijgt een weekmenu met recepten en een boodschappenlijst, zodat je precies weet wat je eet.",
    boxCta: "Maak mijn persoonlijke plan",
    boxNote: "± 3 minuten · je betaalt pas als je een plan kiest",
    faq: (f: Facts) => [
      {
        q: "Hoeveel gram suiker per dag mag je?",
        a: `De WHO adviseert minder dan 10 procent van je energie uit vrije suikers, en liefst minder dan 5 procent. Bij 2.000 kcal per dag is dat minder dan ${f.max} gram, en liefst minder dan ${f.ideal} gram.`,
      },
      {
        q: "Hoeveel suikerklontjes per dag mag je?",
        a: `Een suikerklontje weegt ongeveer 4 gram. Bij 2.000 kcal per dag is het maximum zo'n ${f.maxCubes} klontjes, en liefst niet meer dan ${f.idealCubes}. Dat geldt voor alle vrije suikers samen, dus ook voor suiker in frisdrank, koek en saus.`,
      },
      {
        q: "Telt de suiker in fruit mee?",
        a: "De suiker in heel fruit telt niet mee voor het WHO-advies. De suiker in vruchtensap wel, ook als het vers geperst is. Het Voedingscentrum adviseert 2 stuks fruit per dag.",
      },
      {
        q: "Hoeveel suiker zit er in een blikje cola?",
        a: `Een blikje gewone cola (33 cl) bevat ± ${f.cola} gram suiker: zo'n ${f.colaCubes} suikerklontjes.`,
      },
      {
        q: "Is honing gezonder dan suiker?",
        a: `Nee, niet als het om je suikergrens gaat. De suikers in honing tellen net zo goed als vrije suikers. Een theelepel honing bevat ± ${f.honey} gram suiker.`,
      },
      {
        q: "Wat betekent 'waarvan suikers' op het etiket?",
        a: "Dat is de hoeveelheid suikers in het product, inclusief de suikers die er van nature in zitten, zoals melksuiker. Hoeveel suiker er is toegevoegd, zie je aan de ingrediëntenlijst.",
      },
    ],
  },
  en: {
    metaTitle: "How much sugar a day? WHO advice and calculator",
    metaDescription:
      "How much sugar a day is OK? The WHO advises less than 50 grams at 2,000 kcal, ideally 25 grams. Work out your own limit and see where sugar hides.",
    eyebrow: "Nutrition",
    h1: "How much sugar a day",
    h1Accent: "is OK?",
    intro:
      "Sugar is in far more products than you might think. How much is still sensible, and does the sugar in fruit count too? Work out your own limit and read what to look out for.",
    short: (f: Facts) =>
      `The WHO advises getting less than 10 per cent of your energy from free sugars, and ideally less than 5 per cent. At 2,000 kcal a day, that's less than ${f.max} grams, and ideally less than ${f.ideal} grams: around ${f.idealCubes} sugar cubes. One can of cola already contains ${f.cola} grams.`,
    adviceTitle: "How much sugar a day is OK?",
    advice: [
      "The World Health Organization (WHO) advises getting less than 10 per cent of your energy from free sugars. Less than 5 per cent is even better. One gram of sugar provides 4 kcal, and a sugar cube weighs around 4 grams.",
      "How many grams that is depends on how many calories you eat a day. The table shows the limit at different amounts.",
    ],
    tableHead: ["Calories a day", "Maximum (10%)", "Ideally (5%)"],
    cell: (g: string, cubes: string) => `< ${g} g (≈ ${cubes} cubes)`,
    tableNote: "Grams of free sugars a day. Cubes rounded down, because it's an upper limit.",
    freeTitle: "What are free sugars?",
    freeIntro: "The WHO advice isn't about all sugars, but about free sugars. These are:",
    freeBullets: [
      "Sugar that's added: by the manufacturer (in soft drinks, biscuits or sauces) or by you (in your tea or coffee).",
      "The sugars in honey and syrups, such as golden syrup, agave syrup and maple syrup.",
      "The sugars in fruit juice, even if it's freshly squeezed or says 'no added sugar'.",
    ],
    freeOutro:
      "The sugars found naturally in whole fruit, vegetables and milk don't count. So an apple or a glass of milk doesn't count towards your sugar limit.",
    labelTitle: "'Of which sugars' on the label",
    label: [
      "Under carbohydrates, the label says 'of which sugars'. That figure includes all sugars: also those found naturally in the product, such as milk sugar in yoghurt. So you can't read off directly how much free sugar it contains.",
      "That's why you should also look at the ingredients list. Ingredients are listed in order of quantity: the earlier sugar appears, the more there is. Sugar has many names, such as glucose syrup, glucose-fructose syrup, dextrose, fructose, honey, syrup and fruit juice concentrate.",
    ],
    hiddenTitle: "Where sugar hides",
    hiddenIntro: "Sugar is also in products you wouldn't immediately expect. Watch out for:",
    hiddenBullets: [
      "Soft drinks and energy drinks.",
      "Fruit juice, even without added sugar.",
      "Yoghurt drinks, fruit yoghurt and custard.",
      "Breakfast cereals, granola and Dutch spiced cake (ontbijtkoek).",
      "Sauces such as ketchup, barbecue sauce and sweet and sour sauces.",
      "Biscuits, sweets, chocolate and cakes.",
    ],
    sugarTableIntro: "This is how much sugar a normal portion contains. The last column shows whether it counts towards the WHO advice.",
    sugarHead: ["Product", "Portion", "Sugars", "Free sugar?"],
    yes: "Yes",
    no: "No, natural",
    sugarNote: "Rounded values; they vary a little by brand. 'Sugars' is what the label shows under 'of which sugars'.",
    weightLossTitle: "Sugar and weight loss",
    weightLoss: (f: Facts) => [
      "Sugar isn't more fattening than other calories. But products high in sugar often provide a lot of calories without really filling you up. With drinks in particular, you hardly notice.",
      `A can of cola contains around ${f.colaKcal} kcal. If you drink one every day, that's around ${f.weekKcal} kcal a week. If you want to lose weight, cutting out sugary drinks is often an easy first step.`,
    ],
    waterLink: "How much water a day should you drink?",
    tipsTitle: "How to eat less sugar",
    tips: [
      "Drink water, or tea or coffee without sugar, instead of soft drinks and juice.",
      "Eat whole fruit instead of fruit juice: you get fibre with it too.",
      "Choose plain yoghurt or quark and add fresh fruit yourself.",
      "Have oats or muesli without added sugar for breakfast instead of sweetened cereals.",
      "Do you take sugar in your tea or coffee? Cut down step by step.",
      "Check the ingredients list on sauces and ready-made products.",
    ],
    snacksLink: "Healthy snacks with calories per portion",
    boxTitle: "Eat healthily, without doing the maths",
    boxText:
      "In your personal nutrition plan, we work out your calories and protein for you. You get a weekly menu with recipes and a shopping list, so you know exactly what you're eating.",
    boxCta: "Create my personal plan",
    boxNote: "About 3 minutes · you only pay once you choose a plan",
    faq: (f: Facts) => [
      {
        q: "How many grams of sugar a day is OK?",
        a: `The WHO advises getting less than 10 per cent of your energy from free sugars, and ideally less than 5 per cent. At 2,000 kcal a day, that's less than ${f.max} grams, and ideally less than ${f.ideal} grams.`,
      },
      {
        q: "How many sugar cubes a day is OK?",
        a: `A sugar cube weighs around 4 grams. At 2,000 kcal a day, the maximum is around ${f.maxCubes} cubes, and ideally no more than ${f.idealCubes}. That applies to all free sugars together, so also to sugar in soft drinks, biscuits and sauces.`,
      },
      {
        q: "Does the sugar in fruit count?",
        a: "The sugar in whole fruit doesn't count towards the WHO advice. The sugar in fruit juice does, even if it's freshly squeezed. The Netherlands Nutrition Centre advises 2 pieces of fruit a day.",
      },
      {
        q: "How much sugar is in a can of cola?",
        a: `A can of regular cola (33 cl) contains around ${f.cola} grams of sugar: about ${f.colaCubes} sugar cubes.`,
      },
      {
        q: "Is honey healthier than sugar?",
        a: `No, not when it comes to your sugar limit. The sugars in honey count as free sugars too. A teaspoon of honey contains around ${f.honey} grams of sugar.`,
      },
      {
        q: "What does 'of which sugars' on the label mean?",
        a: "That's the amount of sugars in the product, including those found in it naturally, such as milk sugar. You can see how much sugar has been added from the ingredients list.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

export default async function SuikerPage() {
  const l = await getLocale();
  const c = copy[l];
  const n = (x: number, d = 0) => formatNumber(x, d, l);
  /** Grammen onder 10 kunnen op 0,5 eindigen (zie roundNutrients). */
  const dec = (x: number) => formatNumber(x, Number.isInteger(x) ? 0 : 1, l);
  const g = (x: number) => `${dec(x)} g`;
  const cubes = (grams: number) => Math.floor(grams / GRAMS_PER_CUBE);

  const cola = perPortion("cola");
  const colaSugar = cola.sugars ?? 0;
  const max = sugarLimit(2000, MAX_SHARE);
  const ideal = sugarLimit(2000, IDEAL_SHARE);
  const facts: Facts = {
    max: n(max),
    ideal: n(ideal),
    maxCubes: n(cubes(max)),
    idealCubes: n(cubes(ideal)),
    cola: n(colaSugar),
    colaCubes: n(Math.round(colaSugar / GRAMS_PER_CUBE)),
    colaKcal: n(cola.kcal),
    weekKcal: n(Math.round((cola.kcal * 7) / 10) * 10),
    honey: dec(perPortion("honing").sugars ?? 0),
  };

  const limitRows = KCAL_TABLE.map((kcal) => {
    const hi = sugarLimit(kcal, MAX_SHARE);
    const lo = sugarLimit(kcal, IDEAL_SHARE);
    return [`${n(kcal)} kcal`, c.cell(n(hi), n(cubes(hi))), c.cell(n(lo), n(cubes(lo)))];
  });
  const sugarRows = SUGAR_ROWS.map(({ key, free }) => {
    const food = foods[key];
    const portion = food.portions[0];
    return [food.name[l], `${portion.label[l]} · ${n(portion.amount)} ${food.unit}`, g(perPortion(key).sugars ?? 0), free ? c.yes : c.no];
  });

  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short(facts)}>
        <SugarCalculator />
      </ContentHero>

      <ArticleBody>
        <Section title={c.adviceTitle} paragraphs={c.advice}>
          <DataTable head={c.tableHead} rows={limitRows} note={c.tableNote} minWidth="30rem" />
        </Section>

        <Section title={c.freeTitle} paragraphs={[c.freeIntro]} bullets={c.freeBullets}>
          <p className="text-lg leading-relaxed text-muted">{c.freeOutro}</p>
        </Section>

        <Section title={c.labelTitle} paragraphs={c.label} />

        <Section title={c.hiddenTitle} paragraphs={[c.hiddenIntro]} bullets={c.hiddenBullets}>
          <p className="text-lg leading-relaxed text-muted">{c.sugarTableIntro}</p>
          <DataTable head={c.sugarHead} rows={sugarRows} note={c.sugarNote} minWidth="36rem" />
        </Section>

        <Section title={c.weightLossTitle} paragraphs={c.weightLoss(facts)}>
          <ArrowLink href="/hoeveel-water-per-dag">{c.waterLink}</ArrowLink>
        </Section>

        <Section title={c.tipsTitle} bullets={c.tips}>
          <ArrowLink href="/gezonde-snacks">{c.snacksLink}</ArrowLink>
        </Section>

        <PlanBox title={c.boxTitle} text={c.boxText} href="/start?doel=afvallen" cta={c.boxCta} note={c.boxNote} />

        <RelatedPages l={l} paths={["/koolhydraten-per-dag", "/gezonde-snacks", "/hoeveel-water-per-dag", "/caloriebehoefte-berekenen"]} />
      </ArticleBody>

      <FaqAndClose l={l} items={c.faq(facts)} />
    </>
  );
}

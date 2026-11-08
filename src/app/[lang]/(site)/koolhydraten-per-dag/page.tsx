import type { Metadata } from "next";
import { CarbCalculator } from "@/components/calculator/CarbCalculator";
import { ArrowLink, ArticleBody, ArticleSchema, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { foods, nutrientsFor, roundNutrients, type FoodKey } from "@/content/nutrition";
import { defineCopy, type Locale } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { PROTEIN_PER_KG } from "@/lib/calculations";
import { formatNumber } from "@/lib/format";

const PATH = "/koolhydraten-per-dag";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

/** Gezondheidsraad: 40 tot 70 % van de energie uit koolhydraten; 1 gram = 4 kcal. */
const LOW = 0.4;
const MID = 0.55;
const HIGH = 0.7;
const KCAL_TABLE = [1500, 1800, 2000, 2200, 2500, 3000];

/** Rekenvoorbeeld voor "zo doen wij het": 70 kilo, afvallen, 1.600 kcal. */
const EXAMPLE = { kcal: 1600, kg: 70 };

const roundTo = (x: number, step: number) => Math.round(x / step) * step;
const carbGrams = (kcal: number, share: number) => roundTo((kcal * share) / 4, 5);

/**
 * De verdeling zoals in src/lib/calculations.ts (nutritionTargets): eerst eiwit,
 * dan vet (28 % van de energie, minimaal 0,7 g per kilo), de rest koolhydraten
 * (minimaal 50 gram). Hier alleen voor het rekenvoorbeeld op deze pagina.
 */
function planSplit(kcal: number, kg: number) {
  const protein = roundTo(kg * PROTEIN_PER_KG.afvallen, 5);
  const fat = roundTo(Math.max((kcal * 0.28) / 9, kg * 0.7), 5);
  const carbs = Math.max(roundTo((kcal - protein * 4 - fat * 9) / 4, 5), 50);
  return { protein, fat, carbs, carbShare: Math.round(((carbs * 4) / kcal) * 100) };
}

/** Producten voor de tabel; zonder `amount` geldt de standaardportie uit nutrition.ts. */
const PORTION_ROWS: { key: FoodKey; amount?: number; portion?: Record<Locale, string> }[] = [
  { key: "rijstGekookt" },
  { key: "zilvervliesrijstOngekookt" },
  { key: "pastaGekookt" },
  { key: "volkorenPastaOngekookt" },
  { key: "aardappel" },
  { key: "volkorenBrood", amount: 70, portion: { nl: "2 sneetjes", en: "2 slices" } },
  { key: "witBrood", amount: 70, portion: { nl: "2 sneetjes", en: "2 slices" } },
  { key: "havermout" },
  { key: "banaan" },
  { key: "appel" },
];

const copy = defineCopy({
  nl: {
    metaTitle: "Hoeveel koolhydraten per dag? Met gratis rekenhulp",
    metaDescription:
      "Hoeveel koolhydraten per dag heb je nodig? Het advies is 40 tot 70% van je energie. Bereken het gratis met je calorieën, ook als je wilt afvallen.",
    eyebrow: "Voeding",
    h1: "Hoeveel koolhydraten per dag",
    h1Accent: "heb je nodig?",
    intro:
      "Koolhydraten zijn je belangrijkste brandstof, maar hoeveel heb je er eigenlijk nodig? Dat hangt af van hoeveel calorieën je eet. Vul ze hieronder in, of kijk in de tabel.",
    short: (low: string, high: string) =>
      `De Gezondheidsraad adviseert volwassenen om 40 tot 70 procent van hun energie uit koolhydraten te halen. Eén gram koolhydraten levert 4 kcal. Eet je 2.000 kcal per dag, dan komt dat neer op ${low} tot ${high} gram koolhydraten per dag.`,
    tableTitle: "Koolhydraten per dag: tabel per calorieën",
    tableIntro:
      "Zoek op hoeveel calorieën je per dag eet en lees af hoeveel gram koolhydraten daarbij past. Het midden (55 %) is een goed uitgangspunt als je niet weet waar je moet beginnen.",
    tableHead: ["Calorieën per dag", "40 %", "55 % (midden)", "70 %"],
    tableNote: "Gram koolhydraten per dag, afgerond op 5 gram. 1 gram koolhydraten = 4 kcal.",
    weightLossTitle: "Hoeveel koolhydraten per dag om af te vallen?",
    weightLoss: [
      "Om af te vallen eet je minder calorieën dan je verbruikt. Daar is geen vast aantal gram koolhydraten voor nodig: het totaal aan calorieën bepaalt of je afvalt, niet of die uit koolhydraten, vet of eiwit komen.",
      "Wel helpt het om slim te kiezen. Eiwit en vezels geven een vol gevoel, dus geef die een vaste plek. Met koolhydraten vul je de rest aan, het liefst uit volkoren producten, aardappelen, peulvruchten, groente en fruit.",
    ],
    calorieLink: "Bereken eerst je caloriebehoefte",
    planTitle: "Zo verdelen wij het in onze schema's",
    planIntro: "In onze voedingsschema's beginnen we niet bij de koolhydraten, maar bij wat je lichaam het meest nodig heeft:",
    planBullets: [
      "Eerst eiwit: 1,6 tot 2,0 gram per kilo, afhankelijk van je doel. Dat helpt je spieren te behouden als je afvalt.",
      "Dan vet: ongeveer 28 % van je energie.",
      "De rest gaat naar koolhydraten, en nooit minder dan 50 gram per dag.",
    ],
    planExample: (p: { kcal: string; kg: string; protein: string; fat: string; carbs: string; share: string }) =>
      `Een voorbeeld: je weegt ${p.kg} kilo, je wilt afvallen en je caloriedoel is ${p.kcal} kcal. Dan krijg je ${p.protein} gram eiwit en ${p.fat} gram vet. Wat overblijft, is ${p.carbs} gram koolhydraten: zo'n ${p.share} % van je energie, binnen het advies van de Gezondheidsraad.`,
    proteinLink: "Hoeveel eiwitten per dag heb je nodig?",
    lowCarbTitle: "Werkt koolhydraatarm eten beter om af te vallen?",
    lowCarb: [
      "Koolhydraatarm eten werkt om af te vallen ongeveer even goed als andere manieren van eten, als je hetzelfde caloriegebrek hebt. In het begin gaat de weegschaal vaak sneller omlaag, maar dat komt vooral doordat je lichaam vocht kwijtraakt, niet vet.",
      "Kies dus vooral een manier van eten die je lang volhoudt. Vind je het prettig om wat minder koolhydraten te eten, dan kan dat prima. Laat je ze bijna helemaal weg, dan mis je al snel vezels uit volkoren producten, peulvruchten en fruit.",
      "Heb je diabetes of gebruik je medicijnen, overleg dan eerst met je huisarts voordat je veel minder koolhydraten gaat eten.",
    ],
    portionTitle: "Koolhydraten per portie: rijst, pasta, aardappelen en brood",
    portionIntro: "Zo veel koolhydraten zit er in een gewone portie. Volkoren varianten bevatten iets minder koolhydraten en veel meer vezels.",
    portionHead: ["Product", "Portie", "Koolhydraten", "Vezels", "Calorieën"],
    portionNote: "Afgeronde waarden; per merk verschilt het wat. Koolhydraten zonder vezels, zoals op het etiket.",
    chooseTitle: "Welke koolhydraten kies je het best?",
    chooseIntro: "Niet elke bron van koolhydraten is hetzelfde. Kies zo vaak mogelijk voor producten met veel vezels:",
    chooseBullets: [
      "Volkoren brood in plaats van wit brood.",
      "Havermout of muesli zonder toegevoegde suiker in plaats van gezoete ontbijtgranen.",
      "Volkoren pasta, zilvervliesrijst of volkoren couscous in plaats van de witte varianten.",
      "Aardappelen, peulvruchten, groente en fruit.",
      "Frisdrank, sap, snoep en koek liever met mate: daar zitten veel suikers in.",
    ],
    fibreLink: "Hoeveel vezels per dag heb je nodig?",
    sugarLink: "Hoeveel suiker per dag mag je?",
    boxTitle: "Je koolhydraten, zonder te rekenen",
    boxText:
      "In je persoonlijke voedingsschema rekenen we je calorieën, eiwit, vet en koolhydraten voor je uit. Je krijgt een weekmenu met recepten en een boodschappenlijst dat daar precies op uitkomt.",
    boxCta: "Maak mijn persoonlijke plan",
    boxNote: "± 3 minuten · je betaalt pas als je een plan kiest",
    faq: [
      {
        q: "Hoeveel koolhydraten per dag heb ik nodig?",
        a: "De Gezondheidsraad adviseert 40 tot 70 procent van je energie uit koolhydraten. Bij 2.000 kcal per dag is dat 200 tot 350 gram. Bij 1.600 kcal is het 160 tot 280 gram.",
      },
      {
        q: "Hoeveel koolhydraten per dag om af te vallen?",
        a: "Daar is geen vast getal voor: je valt af als je minder calorieën eet dan je verbruikt. In onze schema's komen eerst eiwit en vet, en de rest is voor koolhydraten. Bij 70 kilo en 1.600 kcal is dat ongeveer 165 gram per dag.",
      },
      {
        q: "Wanneer eet je koolhydraatarm?",
        a: "Daar bestaat geen officiële grens voor. Vaak wordt minder dan zo'n 130 gram per dag koolhydraatarm genoemd. Wil je veel minder koolhydraten eten en heb je diabetes of gebruik je medicijnen, overleg dan eerst met je huisarts.",
      },
      {
        q: "Zijn koolhydraten 's avonds slecht als je wilt afvallen?",
        a: "Nee. Voor je gewicht maakt het weinig uit hoe laat je koolhydraten eet. Het gaat om wat je over de hele dag binnenkrijgt.",
      },
      {
        q: "Tellen groente en fruit mee als koolhydraten?",
        a: "Ja, maar groente bevat er weinig. Een portie broccoli van 200 gram heeft zo'n 8 gram koolhydraten, een appel ongeveer 17 gram. Je krijgt er wel veel vezels en vitamines bij.",
      },
      {
        q: "Wat is het verschil tussen koolhydraten en suikers?",
        a: "Suikers zijn een soort koolhydraten. Op het etiket staat bij koolhydraten daarom 'waarvan suikers'. Daaronder vallen ook de suikers die van nature in fruit en melk zitten.",
      },
    ],
  },
  en: {
    metaTitle: "How many carbs a day? With a free calculator",
    metaDescription:
      "How many carbs do you need a day? The advice is 40 to 70% of your energy. Work it out for free from your calories, including when you want to lose weight.",
    eyebrow: "Nutrition",
    h1: "How many carbs a day",
    h1Accent: "do you need?",
    intro:
      "Carbohydrates are your main fuel, but how many do you actually need? That depends on how many calories you eat. Fill them in below, or check the table.",
    short: (low: string, high: string) =>
      `The Dutch Health Council advises adults to get 40 to 70 per cent of their energy from carbohydrates. One gram of carbohydrate provides 4 kcal. If you eat 2,000 kcal a day, that comes to ${low} to ${high} grams of carbs a day.`,
    tableTitle: "Carbs per day: table by calories",
    tableIntro:
      "Find how many calories you eat a day and read off how many grams of carbs fit. The middle (55%) is a good starting point if you don't know where to begin.",
    tableHead: ["Calories a day", "40%", "55% (middle)", "70%"],
    tableNote: "Grams of carbohydrate a day, rounded to 5 grams. 1 gram of carbohydrate = 4 kcal.",
    weightLossTitle: "How many carbs a day to lose weight?",
    weightLoss: [
      "To lose weight, you eat fewer calories than you use. You don't need a fixed number of grams of carbs for that: your total calories decide whether you lose weight, not whether they come from carbs, fat or protein.",
      "Choosing wisely does help. Protein and fibre keep you feeling full, so give them a fixed place. Fill up the rest with carbs, preferably from wholegrain products, potatoes, pulses, vegetables and fruit.",
    ],
    calorieLink: "Calculate your calorie needs first",
    planTitle: "How we split it in our plans",
    planIntro: "In our nutrition plans, we don't start with carbs, but with what your body needs most:",
    planBullets: [
      "Protein first: 1.6 to 2.0 grams per kilo, depending on your goal. That helps you keep your muscle while losing weight.",
      "Then fat: around 28% of your energy.",
      "The rest goes to carbs, and never less than 50 grams a day.",
    ],
    planExample: (p: { kcal: string; kg: string; protein: string; fat: string; carbs: string; share: string }) =>
      `An example: you weigh ${p.kg} kilos, you want to lose weight and your calorie target is ${p.kcal} kcal. You then get ${p.protein} grams of protein and ${p.fat} grams of fat. What's left is ${p.carbs} grams of carbs: around ${p.share}% of your energy, within the Dutch Health Council's advice.`,
    proteinLink: "How much protein do you need a day?",
    lowCarbTitle: "Does low-carb work better for weight loss?",
    lowCarb: [
      "For weight loss, low-carb works about as well as other ways of eating with the same calorie deficit. The scales often drop faster at the start, but that's mainly because your body loses water, not fat.",
      "So above all, choose a way of eating you can keep up. If you like eating a few fewer carbs, that's fine. If you cut them out almost completely, you'll soon miss out on fibre from wholegrains, pulses and fruit.",
      "If you have diabetes or take medication, talk to your GP before you start eating far fewer carbs.",
    ],
    portionTitle: "Carbs per portion: rice, pasta, potatoes and bread",
    portionIntro: "This is how many carbs a normal portion contains. Wholegrain versions contain slightly fewer carbs and much more fibre.",
    portionHead: ["Product", "Portion", "Carbs", "Fibre", "Calories"],
    portionNote: "Rounded values; they vary a little by brand. Carbs excluding fibre, as on the label.",
    chooseTitle: "Which carbs are the best choice?",
    chooseIntro: "Not every source of carbs is the same. Choose products with plenty of fibre as often as you can:",
    chooseBullets: [
      "Wholemeal bread instead of white bread.",
      "Oats or muesli without added sugar instead of sweetened breakfast cereals.",
      "Wholewheat pasta, brown rice or wholewheat couscous instead of the white versions.",
      "Potatoes, pulses, vegetables and fruit.",
      "Soft drinks, juice, sweets and biscuits in moderation: they contain a lot of sugar.",
    ],
    fibreLink: "How much fibre do you need a day?",
    sugarLink: "How much sugar a day is OK?",
    boxTitle: "Your carbs, without the maths",
    boxText:
      "In your personal nutrition plan, we work out your calories, protein, fat and carbs for you. You get a weekly menu with recipes and a shopping list that adds up to exactly that.",
    boxCta: "Create my personal plan",
    boxNote: "About 3 minutes · you only pay once you choose a plan",
    faq: [
      {
        q: "How many carbs do I need a day?",
        a: "The Dutch Health Council advises getting 40 to 70 per cent of your energy from carbohydrates. At 2,000 kcal a day, that's 200 to 350 grams. At 1,600 kcal, it's 160 to 280 grams.",
      },
      {
        q: "How many carbs a day to lose weight?",
        a: "There's no fixed number: you lose weight when you eat fewer calories than you use. In our plans, protein and fat come first, and the rest goes to carbs. At 70 kilos and 1,600 kcal, that's around 165 grams a day.",
      },
      {
        q: "When is a diet low-carb?",
        a: "There's no official limit. Less than around 130 grams a day is often called low-carb. If you want to eat far fewer carbs and you have diabetes or take medication, talk to your GP first.",
      },
      {
        q: "Are carbs in the evening bad when you want to lose weight?",
        a: "No. For your weight, it makes little difference what time you eat your carbs. What counts is what you eat over the whole day.",
      },
      {
        q: "Do vegetables and fruit count as carbs?",
        a: "Yes, but vegetables contain few. A 200-gram portion of broccoli has around 8 grams of carbs, an apple around 17 grams. You do get plenty of fibre and vitamins with them.",
      },
      {
        q: "What's the difference between carbs and sugars?",
        a: "Sugars are a type of carbohydrate. That's why the label says 'of which sugars' under carbohydrates. This also includes the sugars found naturally in fruit and milk.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

export default async function KoolhydratenPage() {
  const l = await getLocale();
  const c = copy[l];
  const n = (x: number) => formatNumber(x, 0, l);
  /** Grammen onder 10 kunnen op 0,5 eindigen (zie roundNutrients). */
  const g = (x: number) => `${formatNumber(x, Number.isInteger(x) ? 0 : 1, l)} g`;

  const split = planSplit(EXAMPLE.kcal, EXAMPLE.kg);
  const kcalRows = KCAL_TABLE.map((kcal) => [`${n(kcal)} kcal`, ...[LOW, MID, HIGH].map((s) => `${n(carbGrams(kcal, s))} g`)]);
  const portionRows = PORTION_ROWS.map(({ key, amount, portion }) => {
    const food = foods[key];
    const size = amount ?? food.portions[0].amount;
    const v = roundNutrients(nutrientsFor(key, size));
    return [food.name[l], `${portion?.[l] ?? food.portions[0].label[l]} · ${n(size)} ${food.unit}`, g(v.carbs), g(v.fiber), `${n(v.kcal)} kcal`];
  });

  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short(n(carbGrams(2000, LOW)), n(carbGrams(2000, HIGH)))}>
        <CarbCalculator />
      </ContentHero>

      <ArticleBody>
        <Section title={c.tableTitle} paragraphs={[c.tableIntro]}>
          <DataTable head={c.tableHead} rows={kcalRows} note={c.tableNote} minWidth="26rem" />
        </Section>

        <Section title={c.weightLossTitle} paragraphs={c.weightLoss}>
          <ArrowLink href="/caloriebehoefte-berekenen">{c.calorieLink}</ArrowLink>
        </Section>

        <Section title={c.planTitle} paragraphs={[c.planIntro]} bullets={c.planBullets}>
          <p className="text-lg leading-relaxed text-muted">
            {c.planExample({
              kcal: n(EXAMPLE.kcal),
              kg: n(EXAMPLE.kg),
              protein: n(split.protein),
              fat: n(split.fat),
              carbs: n(split.carbs),
              share: n(split.carbShare),
            })}
          </p>
          <ArrowLink href="/eiwitten-per-dag">{c.proteinLink}</ArrowLink>
        </Section>

        <Section title={c.lowCarbTitle} paragraphs={c.lowCarb} />

        <Section title={c.portionTitle} paragraphs={[c.portionIntro]}>
          <DataTable head={c.portionHead} rows={portionRows} note={c.portionNote} minWidth="40rem" />
        </Section>

        <Section title={c.chooseTitle} paragraphs={[c.chooseIntro]} bullets={c.chooseBullets}>
          <div className="flex flex-col gap-2">
            <ArrowLink href="/vezels-per-dag">{c.fibreLink}</ArrowLink>
            <ArrowLink href="/hoeveel-suiker-per-dag">{c.sugarLink}</ArrowLink>
          </div>
        </Section>

        <PlanBox title={c.boxTitle} text={c.boxText} href="/start?doel=afvallen" cta={c.boxCta} note={c.boxNote} />

        <RelatedPages l={l} paths={["/caloriebehoefte-berekenen", "/eiwitten-per-dag", "/vezels-per-dag", "/hoeveel-suiker-per-dag"]} />
      </ArticleBody>

      <FaqAndClose l={l} items={c.faq} />
    </>
  );
}

import type { Metadata } from "next";
import { ArrowLink, ArticleBody, ArticleSchema, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { nutrientsFor, roundNutrients, sumNutrients, type FoodKey, type Nutrients } from "@/content/nutrition";
import { defineCopy, type Locale } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { formatNumber } from "@/lib/format";

const PATH = "/gezonde-snacks";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

/** Elke snack is een combinatie van producten uit de gedeelde voedingstabel, met hoeveelheden in gram (of ml). */
const SNACKS = {
  // Eiwitrijk (10 g eiwit of meer)
  skyrBessen: [
    ["skyr", 150],
    ["blauweBessen", 75],
  ],
  eieren: [["ei", 110]],
  edamame: [["edamame", 100]],
  huttenkaseTomaat: [
    ["huttenkase", 100],
    ["cherrytomaat", 100],
  ],
  kwarkKiwi: [
    ["kwarkMager", 150],
    ["kiwi", 75],
  ],
  rijstwafelKip: [
    ["rijstwafel", 16],
    ["kipfiletBeleg", 60],
  ],
  // Onder de 100 kcal
  komkommerHuttenkase: [
    ["komkommer", 150],
    ["huttenkase", 50],
  ],
  tonijnKomkommer: [
    ["tonijn", 60],
    ["komkommer", 150],
  ],
  popcorn: [["popcorn", 20]],
  wortelHummus: [
    ["wortel", 80],
    ["hummus", 15],
  ],
  mandarijnen: [["mandarijn", 140]],
  // Onderweg
  amandelen: [["amandelen", 20]],
  appelPindakaas: [
    ["appel", 150],
    ["pindakaas", 15],
  ],
  kaasDruiven: [
    ["kaas30", 20],
    ["druiven", 100],
  ],
  banaan: [["banaan", 120]],
  // Zoet
  chocoladeAardbeien: [
    ["pureChocolade", 10],
    ["aardbeien", 150],
  ],
  bevrorenDruiven: [["druiven", 100]],
  peerWalnoten: [
    ["peer", 170],
    ["walnoten", 10],
  ],
  // Hartig
  tomaatMozzarella: [
    ["cherrytomaat", 100],
    ["mozzarellaLight", 30],
  ],
  paprikaHummus: [
    ["paprika", 150],
    ["hummus", 30],
  ],
} satisfies Record<string, [FoodKey, number][]>;
type SnackId = keyof typeof SNACKS;

const GROUPS = {
  protein: ["skyrBessen", "eieren", "edamame", "huttenkaseTomaat", "kwarkKiwi", "rijstwafelKip"],
  light: ["komkommerHuttenkase", "tonijnKomkommer", "popcorn", "wortelHummus", "mandarijnen"],
  onTheGo: ["amandelen", "appelPindakaas", "kaasDruiven", "banaan"],
  sweet: ["chocoladeAardbeien", "bevrorenDruiven", "peerWalnoten"],
  savoury: ["tomaatMozzarella", "paprikaHummus"],
} satisfies Record<string, SnackId[]>;
const SNACK_COUNT = Object.values(GROUPS).flat().length;

/** Afgeronde voedingswaarden per snack (kcal op 5, grammen op 0,5). */
const V = Object.fromEntries((Object.keys(SNACKS) as SnackId[]).map((id) => [id, roundNutrients(sumNutrients(SNACKS[id]))])) as Record<SnackId, Nutrients>;

/** Vergelijkingen voor de valkuilen. */
const JUICE = roundNutrients(nutrientsFor("sinaasappelsap", 200));
const ORANGE = roundNutrients(nutrientsFor("sinaasappel", 130));
const RAISINS = roundNutrients(nutrientsFor("rozijnen", 14));
const ALMONDS_25 = roundNutrients(nutrientsFor("amandelen", 25));
const APPLE = roundNutrients(nutrientsFor("appel", 150));

const n = (x: number, l: Locale) => formatNumber(x, Number.isInteger(x) ? 0 : 1, l);
const nl = (x: number) => n(x, "nl");
const en = (x: number) => n(x, "en");

interface SnackCopy {
  name: string;
  portion: string;
}

const copy = defineCopy({
  nl: {
    metaTitle: `Gezonde snacks: ${SNACK_COUNT} eiwitrijke en caloriearme ideeën`,
    metaDescription: `Gezonde snacks om af te vallen: ${SNACK_COUNT} eiwitrijke en caloriearme ideeën met calorieën, eiwit en vezels per portie. Ook voor onderweg, zoet of hartig.`,
    eyebrow: "Voeding",
    h1: "Gezonde snacks:",
    h1Accent: "lekker, eiwitrijk en caloriearm",
    intro: `Een tussendoortje hoort er gewoon bij, ook als je wilt afvallen. Het verschil zit in wat je kiest. Hier vind je ${SNACK_COUNT} gezonde snacks met de calorieën, het eiwit en de vezels per portie: van eiwitrijk tot onder de 100 kcal, voor onderweg en voor als je zin hebt in iets zoets of hartigs.`,
    short: `Een gezonde snack om af te vallen heeft zo'n 100 tot 200 kcal en bevat eiwit of vezels, zodat je er langer vol van zit. Goede keuzes zijn skyr met blauwe bessen (± ${nl(V.skyrBessen.kcal)} kcal, ${nl(V.skyrBessen.protein)} g eiwit), 2 gekookte eieren (± ${nl(V.eieren.kcal)} kcal, ${nl(V.eieren.protein)} g eiwit) of edamame (± ${nl(V.edamame.kcal)} kcal, ${nl(V.edamame.protein)} g eiwit). Wil je onder de 100 kcal blijven, kies dan bijvoorbeeld komkommer met tonijn (± ${nl(V.tonijnKomkommer.kcal)} kcal) of zelf gepofte popcorn (± ${nl(V.popcorn.kcal)} kcal).`,
    values: (kcal: string, protein: string, fiber: string) => `± ${kcal} kcal · ${protein} g eiwit · ${fiber} g vezels`,
    valuesNote: "Alle waarden per portie, afgerond en berekend met gemiddelde voedingswaarden van supermarktproducten; per merk verschilt het wat.",
    snacks: {
      skyrBessen: { name: "Skyr met blauwe bessen", portion: "150 g skyr naturel met een handje blauwe bessen (75 g)" },
      eieren: { name: "2 gekookte eieren", portion: "2 hardgekookte eieren, ook handig om mee te nemen" },
      edamame: { name: "Edamame", portion: "100 g gekookte edamame (sojaboontjes), uit de diepvries" },
      huttenkaseTomaat: { name: "Hüttenkäse met cherrytomaatjes", portion: "100 g hüttenkäse met een handje cherrytomaatjes (100 g) en zwarte peper" },
      kwarkKiwi: { name: "Magere kwark met kiwi", portion: "150 g magere kwark met een kiwi in stukjes" },
      rijstwafelKip: { name: "Rijstwafels met kipfilet", portion: "2 rijstwafels met 4 plakjes kipfilet (60 g)" },
      komkommerHuttenkase: { name: "Komkommer met hüttenkäse", portion: "Een halve komkommer (150 g) in plakken met 50 g hüttenkäse" },
      tonijnKomkommer: { name: "Komkommer met tonijn", portion: "Een halve komkommer (150 g) met een half blikje tonijn in water (60 g)" },
      popcorn: { name: "Zelf gepofte popcorn", portion: "Een kom popcorn (20 g), zelf gepoft zonder boter" },
      wortelHummus: { name: "Wortel met hummus", portion: "1 wortel (80 g) in reepjes met 1 eetlepel hummus (15 g)" },
      mandarijnen: { name: "2 mandarijnen", portion: "2 mandarijnen, samen 140 g zonder schil" },
      amandelen: { name: "Een klein handje amandelen", portion: "20 g ongezouten amandelen" },
      appelPindakaas: { name: "Appel met pindakaas", portion: "1 appel in partjes met 15 g pindakaas (100% pinda)" },
      kaasDruiven: { name: "Kaasblokjes met druiven", portion: "20 g kaas 30+ in blokjes met een handje druiven (100 g)" },
      banaan: { name: "Banaan", portion: "1 banaan (120 g zonder schil): de makkelijkste snack voor in je tas" },
      chocoladeAardbeien: { name: "Pure chocolade met aardbeien", portion: "2 blokjes pure chocolade (10 g, 70%) met 150 g aardbeien" },
      bevrorenDruiven: { name: "Bevroren druiven", portion: "Een handje druiven (100 g), een paar uur in de vriezer: net sorbetijs" },
      peerWalnoten: { name: "Peer met walnoten", portion: "1 peer met 10 g walnoten (een paar halve noten)" },
      tomaatMozzarella: { name: "Cherrytomaatjes met mozzarella", portion: "Een handje cherrytomaatjes (100 g) met 30 g mozzarella light" },
      paprikaHummus: { name: "Paprika met hummus", portion: "1 paprika (150 g) in reepjes met 2 eetlepels hummus (30 g)" },
    } satisfies Record<SnackId, SnackCopy>,
    healthy: {
      title: "Gezonde snacks om af te vallen: waar let je op?",
      paragraphs: [
        "Een snack is niet vanzelf gezond of ongezond. Het gaat erom wat hij je oplevert voor de calorieën die erin zitten. Als je wilt afvallen, kies je een tussendoortje dat je vult en dat past in je dag.",
      ],
      bullets: [
        "Eiwit of vezels: die zorgen dat je er langer vol van zit. Eiwit helpt bovendien je spieren te behouden als je afvalt.",
        "Zo'n 100 tot 200 kcal: genoeg om je trek te stillen, zonder dat het een extra maaltijd wordt.",
        "Weinig toegevoegde suiker: kies naturel zuivel en heel fruit in plaats van koek, repen of sap.",
        "Zo onbewerkt mogelijk: groente, fruit, zuivel, eieren, peulvruchten en ongezouten noten.",
        "Gepland: weet je vooraf wat je neemt, dan grijp je minder snel naar de koektrommel.",
      ],
      after: "Een snack telt gewoon mee in je calorieën voor de dag. Wil je weten hoeveel calorieën er in andere producten zitten? Kijk dan in de calorietabel.",
      cta: "Bekijk de calorietabel",
    },
    protein: {
      title: "Eiwitrijke snacks",
      paragraphs: [
        "Deze snacks hebben 10 gram eiwit of meer per portie, zonder eiwitpoeder of shakes. Handig als je je eiwitdoel wilt halen, want met alleen ontbijt, lunch en avondeten lukt dat niet altijd.",
      ],
      cta: "Bereken hoeveel eiwit je per dag nodig hebt",
    },
    light: {
      title: "Caloriearme snacks onder de 100 kcal",
      paragraphs: [
        "Voor als je trek hebt maar weinig ruimte over hebt in je calorieën. Groente doet hier het meeste werk: veel volume voor weinig calorieën. Combineer het met wat eiwit, zoals hüttenkäse of tonijn, dan vult het beter.",
      ],
    },
    onTheGo: {
      title: "Snacks voor onderweg",
      paragraphs: [
        "Voor in je tas, op je werk of in de auto. Deze snacks kun je makkelijk een paar uur meenemen. Gekookte eieren, edamame en rijstwafels met kipfilet passen ook prima in een bakje.",
        `Let op met noten: ze zijn gezond, maar calorierijk. Een flink handje (25 g) amandelen is al ± ${nl(ALMONDS_25.kcal)} kcal. Weeg het een keer af, dan weet je hoeveel een handje is.`,
      ],
    },
    sweetSavoury: {
      title: "Iets zoets of hartigs",
      paragraphs: [
        "Soms wil je gewoon iets zoets, of juist iets hartigs. Ook dan zijn er keuzes die minder calorieën hebben en beter vullen dan koek, snoep of chips.",
      ],
      sweetTitle: "Zin in iets zoets",
      savouryTitle: "Zin in iets hartigs",
      savouryAfter: "Zoek je meer hartige snacks? Edamame, gekookte eieren, popcorn en komkommer met tonijn of hüttenkäse vind je hierboven.",
    },
    traps: {
      title: "Valkuilen: snacks die gezonder lijken dan ze zijn",
      bullets: [
        `Eiwitrepen: veel repen hebben ongeveer evenveel calorieën als een gewone chocoladereep en bevatten vaak suiker of zoetstoffen. Voor een vergelijkbare hoeveelheid eiwit neem je ook skyr met blauwe bessen (± ${nl(V.skyrBessen.kcal)} kcal, ${nl(V.skyrBessen.protein)} g eiwit).`,
        "\"Gezond\" op de verpakking: muesli-, granola- en fruitrepen, light-koekjes en kant-en-klare smoothies bevatten vaak veel suiker. Kijk op het etiket naar de calorieën per portie en de suikers.",
        `Gedroogd fruit: gezond, maar geconcentreerd. Een doosje rozijnen (14 g) heeft ± ${nl(RAISINS.kcal)} kcal en ${nl(RAISINS.sugars ?? 0)} g suiker, en je eet er makkelijk een paar.`,
        "Sap: daar zit de suiker van het fruit in, maar bijna geen vezels. Een hele sinaasappel heeft minder calorieën en meer vezels, en vult beter. Zie de tabel hieronder.",
      ],
      head: ["Product", "kcal", "Suiker", "Vezels"],
      rows: [
        ["Sinaasappelsap (1 glas, 200 ml)", nl(JUICE.kcal), `${nl(JUICE.sugars ?? 0)} g`, `${nl(JUICE.fiber)} g`],
        ["Sinaasappel (1 stuk, 130 g)", nl(ORANGE.kcal), `${nl(ORANGE.sugars ?? 0)} g`, `${nl(ORANGE.fiber)} g`],
      ],
      cta: "Lees hoeveel suiker per dag oké is",
    },
    evening: {
      title: "Snacken in de avond",
      paragraphs: [
        "'s Avonds op de bank is voor veel mensen het lastigste moment. Vaak is het dan geen honger, maar gewoonte of verveling. Het tijdstip zelf maakt minder uit dan wat en hoeveel je over de hele dag eet.",
      ],
      bullets: [
        `Plan je avondsnack in je dag, bijvoorbeeld magere kwark met kiwi (± ${nl(V.kwarkKiwi.kcal)} kcal, ${nl(V.kwarkKiwi.protein)} g eiwit).`,
        "Schep een portie in een schaaltje in plaats van uit de zak of het pak te eten.",
        "Heb je elke avond veel trek? Kijk dan of je overdag genoeg eet, vooral eiwit en groente.",
        "Een kop thee of tandenpoetsen na je laatste snack kan helpen om de gewoonte te doorbreken.",
      ],
    },
    howMany: {
      title: "Hoeveel tussendoortjes per dag?",
      paragraphs: [
        "Dat is persoonlijk. Voor afvallen maakt het weinig uit of je je calorieën over drie of vijf eetmomenten verdeelt: het gaat om het totaal. Heb je snel trek tussen de maaltijden, dan helpen een of twee geplande snacks. Snack je vooral uit gewoonte, dan zijn drie volwaardige maaltijden misschien makkelijker.",
      ],
    },
    planTitle: "Snacks die passen in je dag",
    planText:
      "In onze vragenlijst kies je of je 3, 4 of 5 keer per dag eet: zonder tussendoortjes, met één of met twee. In je persoonlijke voedingsschema tellen die snacks gewoon mee in je calorie- en eiwitdoel, en je krijgt een weekmenu met recepten en boodschappenlijst.",
    planCta: "Maak mijn persoonlijke plan",
    planNote: "± 3 minuten · je betaalt pas als je een plan kiest",
    faq: [
      {
        q: "Wat is een gezonde snack om af te vallen?",
        a: "Een snack van zo'n 100 tot 200 kcal met eiwit of vezels, zoals skyr met fruit, gekookte eieren, edamame, hüttenkäse met groente of een appel met pindakaas. Die vullen beter dan koek of chips met evenveel calorieën.",
      },
      {
        q: "Hoeveel calorieën mag een snack hebben?",
        a: "Als richtlijn zo'n 100 tot 200 kcal. Wat bij jou past, hangt af van je totale caloriebehoefte en hoeveel eetmomenten je per dag hebt. Een snack telt gewoon mee in je calorieën voor de dag.",
      },
      {
        q: "Wat zijn eiwitrijke snacks zonder eiwitpoeder?",
        a: `Skyr, magere kwark, hüttenkäse, gekookte eieren, edamame, kipfilet op een rijstwafel en tonijn. Met 150 g skyr en een handje blauwe bessen heb je al zo'n ${nl(V.skyrBessen.protein)} g eiwit voor ± ${nl(V.skyrBessen.kcal)} kcal.`,
      },
      {
        q: "Is fruit een gezonde snack als je wilt afvallen?",
        a: `Ja. Fruit bevat vezels en vitamines en relatief weinig calorieën: een appel heeft ± ${nl(APPLE.kcal)} kcal. Eet liever heel fruit dan sap, want dat vult beter.`,
      },
      {
        q: "Zijn noten gezond als snack?",
        a: `Ja, kies dan ongezouten noten. Ze zijn wel calorierijk: een flink handje (25 g) amandelen heeft ± ${nl(ALMONDS_25.kcal)} kcal. Houd het bij een klein handje, of combineer een paar noten met fruit.`,
      },
      {
        q: "Mag je 's avonds snacken als je wilt afvallen?",
        a: `Ja, als het past in je calorieën voor die dag. Het tijdstip is minder belangrijk dan wat en hoeveel je eet. Plan je avondsnack, bijvoorbeeld magere kwark met kiwi (± ${nl(V.kwarkKiwi.kcal)} kcal), en eet uit een schaaltje in plaats van uit de zak.`,
      },
    ],
  },
  en: {
    metaTitle: `Healthy snacks: ${SNACK_COUNT} high-protein, low-calorie ideas`,
    metaDescription: `Healthy snacks for weight loss: ${SNACK_COUNT} high-protein and low-calorie ideas with calories, protein and fibre per portion. Also on the go, sweet or savoury.`,
    eyebrow: "Nutrition",
    h1: "Healthy snacks:",
    h1Accent: "tasty, high-protein and low-calorie",
    intro: `A snack between meals is perfectly normal, even when you want to lose weight. The difference is in what you choose. Here you'll find ${SNACK_COUNT} healthy snacks with the calories, protein and fibre per portion: from high-protein to under 100 kcal, for on the go and for when you fancy something sweet or savoury.`,
    short: `A healthy snack for weight loss has around 100 to 200 kcal and contains protein or fibre, so it keeps you full for longer. Good choices are skyr with blueberries (± ${en(V.skyrBessen.kcal)} kcal, ${en(V.skyrBessen.protein)} g protein), 2 boiled eggs (± ${en(V.eieren.kcal)} kcal, ${en(V.eieren.protein)} g protein) or edamame (± ${en(V.edamame.kcal)} kcal, ${en(V.edamame.protein)} g protein). If you want to stay under 100 kcal, choose cucumber with tuna (± ${en(V.tonijnKomkommer.kcal)} kcal) or home-popped popcorn (± ${en(V.popcorn.kcal)} kcal), for example.`,
    values: (kcal: string, protein: string, fiber: string) => `± ${kcal} kcal · ${protein} g protein · ${fiber} g fibre`,
    valuesNote: "All values per portion, rounded and based on average nutritional values of supermarket products; they vary a little by brand.",
    snacks: {
      skyrBessen: { name: "Skyr with blueberries", portion: "150 g plain skyr with a handful of blueberries (75 g)" },
      eieren: { name: "2 boiled eggs", portion: "2 hard-boiled eggs, easy to take with you too" },
      edamame: { name: "Edamame", portion: "100 g cooked edamame (soya beans), from the freezer" },
      huttenkaseTomaat: { name: "Cottage cheese with cherry tomatoes", portion: "100 g cottage cheese with a handful of cherry tomatoes (100 g) and black pepper" },
      kwarkKiwi: { name: "Low-fat quark with kiwi", portion: "150 g low-fat quark with a chopped kiwi" },
      rijstwafelKip: { name: "Rice cakes with sliced chicken", portion: "2 rice cakes with 4 slices of chicken breast (60 g)" },
      komkommerHuttenkase: { name: "Cucumber with cottage cheese", portion: "Half a cucumber (150 g), sliced, with 50 g cottage cheese" },
      tonijnKomkommer: { name: "Cucumber with tuna", portion: "Half a cucumber (150 g) with half a tin of tuna in water (60 g)" },
      popcorn: { name: "Home-popped popcorn", portion: "A bowl of popcorn (20 g), home-popped without butter" },
      wortelHummus: { name: "Carrot with hummus", portion: "1 carrot (80 g) cut into sticks with 1 tablespoon of hummus (15 g)" },
      mandarijnen: { name: "2 mandarins", portion: "2 mandarins, 140 g together, peeled" },
      amandelen: { name: "A small handful of almonds", portion: "20 g unsalted almonds" },
      appelPindakaas: { name: "Apple with peanut butter", portion: "1 apple in slices with 15 g peanut butter (100% peanuts)" },
      kaasDruiven: { name: "Cheese cubes with grapes", portion: "20 g reduced-fat cheese (30+) in cubes with a handful of grapes (100 g)" },
      banaan: { name: "Banana", portion: "1 banana (120 g peeled): the easiest snack for your bag" },
      chocoladeAardbeien: { name: "Dark chocolate with strawberries", portion: "2 squares of dark chocolate (10 g, 70%) with 150 g strawberries" },
      bevrorenDruiven: { name: "Frozen grapes", portion: "A handful of grapes (100 g), a few hours in the freezer: just like sorbet" },
      peerWalnoten: { name: "Pear with walnuts", portion: "1 pear with 10 g walnuts (a few halves)" },
      tomaatMozzarella: { name: "Cherry tomatoes with mozzarella", portion: "A handful of cherry tomatoes (100 g) with 30 g light mozzarella" },
      paprikaHummus: { name: "Pepper with hummus", portion: "1 pepper (150 g) cut into strips with 2 tablespoons of hummus (30 g)" },
    } satisfies Record<SnackId, SnackCopy>,
    healthy: {
      title: "Healthy snacks for weight loss: what to look for",
      paragraphs: [
        "A snack isn't automatically healthy or unhealthy. What matters is what it gives you for the calories in it. If you want to lose weight, choose a snack that fills you up and fits into your day.",
      ],
      bullets: [
        "Protein or fibre: they keep you full for longer. Protein also helps you keep your muscle while you lose weight.",
        "Around 100 to 200 kcal: enough to take the edge off your hunger, without turning it into an extra meal.",
        "Little added sugar: choose plain dairy and whole fruit instead of biscuits, bars or juice.",
        "As unprocessed as possible: vegetables, fruit, dairy, eggs, pulses and unsalted nuts.",
        "Planned: if you know in advance what you'll have, you're less likely to reach for the biscuit tin.",
      ],
      after: "A snack simply counts towards your calories for the day. Want to know how many calories other foods contain? Check the calorie table.",
      cta: "See the calorie table",
    },
    protein: {
      title: "High-protein snacks",
      paragraphs: [
        "These snacks have 10 grams of protein or more per portion, without protein powder or shakes. Handy if you want to reach your protein target, because breakfast, lunch and dinner alone don't always get you there.",
      ],
      cta: "Work out how much protein you need a day",
    },
    light: {
      title: "Low-calorie snacks under 100 kcal",
      paragraphs: [
        "For when you're hungry but have little room left in your calories. Vegetables do most of the work here: lots of volume for few calories. Combine them with some protein, such as cottage cheese or tuna, and they're more filling.",
      ],
    },
    onTheGo: {
      title: "Snacks on the go",
      paragraphs: [
        "For your bag, at work or in the car. These snacks are easy to take with you for a few hours. Boiled eggs, edamame and rice cakes with sliced chicken also fit nicely in a container.",
        `Be careful with nuts: they're healthy, but high in calories. A generous handful (25 g) of almonds is already ± ${en(ALMONDS_25.kcal)} kcal. Weigh it once, so you know how much a handful is.`,
      ],
    },
    sweetSavoury: {
      title: "Something sweet or savoury",
      paragraphs: [
        "Sometimes you just want something sweet, or something savoury. Even then, there are choices with fewer calories that fill you up better than biscuits, sweets or crisps.",
      ],
      sweetTitle: "Fancy something sweet",
      savouryTitle: "Fancy something savoury",
      savouryAfter: "Looking for more savoury snacks? You'll find edamame, boiled eggs, popcorn and cucumber with tuna or cottage cheese above.",
    },
    traps: {
      title: "Traps: snacks that seem healthier than they are",
      bullets: [
        `Protein bars: many bars have about as many calories as an ordinary chocolate bar and often contain sugar or sweeteners. For a similar amount of protein, you could have skyr with blueberries (± ${en(V.skyrBessen.kcal)} kcal, ${en(V.skyrBessen.protein)} g protein).`,
        "\"Healthy\" on the packaging: muesli, granola and fruit bars, light biscuits and ready-made smoothies often contain a lot of sugar. Check the label for the calories per portion and the sugars.",
        `Dried fruit: healthy, but concentrated. A small box of raisins (14 g) has ± ${en(RAISINS.kcal)} kcal and ${en(RAISINS.sugars ?? 0)} g sugar, and it's easy to eat several.`,
        "Juice: it contains the sugar from the fruit, but hardly any fibre. A whole orange has fewer calories and more fibre, and is more filling. See the table below.",
      ],
      head: ["Product", "kcal", "Sugar", "Fibre"],
      rows: [
        ["Orange juice (1 glass, 200 ml)", en(JUICE.kcal), `${en(JUICE.sugars ?? 0)} g`, `${en(JUICE.fiber)} g`],
        ["Orange (1 whole, 130 g)", en(ORANGE.kcal), `${en(ORANGE.sugars ?? 0)} g`, `${en(ORANGE.fiber)} g`],
      ],
      cta: "Read how much sugar a day is OK",
    },
    evening: {
      title: "Snacking in the evening",
      paragraphs: [
        "The evening on the sofa is the hardest moment for many people. Often it isn't hunger, but habit or boredom. The time itself matters less than what and how much you eat over the whole day.",
      ],
      bullets: [
        `Plan your evening snack into your day, for example low-fat quark with kiwi (± ${en(V.kwarkKiwi.kcal)} kcal, ${en(V.kwarkKiwi.protein)} g protein).`,
        "Put a portion in a bowl instead of eating straight from the bag or packet.",
        "Very hungry every evening? Then check whether you're eating enough during the day, especially protein and vegetables.",
        "A cup of tea, or brushing your teeth after your last snack, can help break the habit.",
      ],
    },
    howMany: {
      title: "How many snacks a day?",
      paragraphs: [
        "That's personal. For weight loss, it makes little difference whether you spread your calories over three or five eating moments: it's the total that counts. If you get hungry quickly between meals, one or two planned snacks help. If you mainly snack out of habit, three proper meals may be easier.",
      ],
    },
    planTitle: "Snacks that fit your day",
    planText:
      "In our questionnaire, you choose whether you eat 3, 4 or 5 times a day: without snacks, with one or with two. In your personal nutrition plan, those snacks simply count towards your calorie and protein targets, and you get a weekly menu with recipes and a shopping list.",
    planCta: "Create my personal plan",
    planNote: "About 3 minutes · you only pay once you choose a plan",
    faq: [
      {
        q: "What is a healthy snack for weight loss?",
        a: "A snack of around 100 to 200 kcal with protein or fibre, such as skyr with fruit, boiled eggs, edamame, cottage cheese with vegetables or an apple with peanut butter. They fill you up better than biscuits or crisps with the same calories.",
      },
      {
        q: "How many calories should a snack have?",
        a: "As a guideline, around 100 to 200 kcal. What suits you depends on your total calorie needs and how many eating moments you have a day. A snack simply counts towards your calories for the day.",
      },
      {
        q: "What are high-protein snacks without protein powder?",
        a: `Skyr, low-fat quark, cottage cheese, boiled eggs, edamame, sliced chicken on a rice cake and tuna. With 150 g skyr and a handful of blueberries, you already have around ${en(V.skyrBessen.protein)} g protein for ± ${en(V.skyrBessen.kcal)} kcal.`,
      },
      {
        q: "Is fruit a healthy snack when you want to lose weight?",
        a: `Yes. Fruit contains fibre and vitamins and relatively few calories: an apple has ± ${en(APPLE.kcal)} kcal. Choose whole fruit over juice, because it's more filling.`,
      },
      {
        q: "Are nuts a healthy snack?",
        a: `Yes, as long as you choose unsalted nuts. They are high in calories, though: a generous handful (25 g) of almonds has ± ${en(ALMONDS_25.kcal)} kcal. Stick to a small handful, or combine a few nuts with fruit.`,
      },
      {
        q: "Can you snack in the evening when you want to lose weight?",
        a: `Yes, as long as it fits your calories for that day. The time matters less than what and how much you eat. Plan your evening snack, for example low-fat quark with kiwi (± ${en(V.kwarkKiwi.kcal)} kcal), and eat from a bowl rather than from the bag.`,
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

/** Kaartjes met per snack de naam, de portie en de voedingswaarden. */
function SnackGrid({ ids, l }: { ids: SnackId[]; l: Locale }) {
  const c = copy[l];
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {ids.map((id) => {
        const s = c.snacks[id];
        const v = V[id];
        return (
          <li key={id} className="card p-4">
            <p className="font-extrabold">{s.name}</p>
            <p className="mt-1 text-muted">{s.portion}</p>
            <p className="mt-2 text-sm font-bold text-brand-700">{c.values(n(v.kcal, l), n(v.protein, l), n(v.fiber, l))}</p>
          </li>
        );
      })}
    </ul>
  );
}

const H3 = "text-xl font-extrabold";

export default async function GezondeSnacksPage() {
  const l = await getLocale();
  const c = copy[l];
  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short} />

      <ArticleBody>
        <Section title={c.healthy.title} paragraphs={c.healthy.paragraphs} bullets={c.healthy.bullets}>
          <p className="text-lg leading-relaxed text-muted">{c.healthy.after}</p>
          <ArrowLink href="/calorieen">{c.healthy.cta}</ArrowLink>
        </Section>

        <Section title={c.protein.title} paragraphs={c.protein.paragraphs}>
          <SnackGrid ids={GROUPS.protein} l={l} />
          <p className="text-sm text-muted">{c.valuesNote}</p>
          <ArrowLink href="/eiwitten-per-dag">{c.protein.cta}</ArrowLink>
        </Section>

        <Section title={c.light.title} paragraphs={c.light.paragraphs}>
          <SnackGrid ids={GROUPS.light} l={l} />
        </Section>

        <Section title={c.onTheGo.title} paragraphs={c.onTheGo.paragraphs}>
          <SnackGrid ids={GROUPS.onTheGo} l={l} />
        </Section>

        <Section title={c.sweetSavoury.title} paragraphs={c.sweetSavoury.paragraphs}>
          <h3 className={`${H3} pt-2`}>{c.sweetSavoury.sweetTitle}</h3>
          <SnackGrid ids={GROUPS.sweet} l={l} />
          <h3 className={`${H3} pt-2`}>{c.sweetSavoury.savouryTitle}</h3>
          <SnackGrid ids={GROUPS.savoury} l={l} />
          <p className="text-lg leading-relaxed text-muted">{c.sweetSavoury.savouryAfter}</p>
        </Section>

        <Section title={c.traps.title} bullets={c.traps.bullets}>
          <DataTable head={c.traps.head} rows={c.traps.rows} />
          <ArrowLink href="/hoeveel-suiker-per-dag">{c.traps.cta}</ArrowLink>
        </Section>

        <Section title={c.evening.title} paragraphs={c.evening.paragraphs} bullets={c.evening.bullets} />

        <Section title={c.howMany.title} paragraphs={c.howMany.paragraphs} />

        <PlanBox title={c.planTitle} text={c.planText} href="/start?doel=afvallen" cta={c.planCta} note={c.planNote} />

        <RelatedPages l={l} paths={["/eiwitten-per-dag", "/calorieen", "/recepten/eiwitrijk-ontbijt", "/hoeveel-suiker-per-dag"]} />
      </ArticleBody>

      <FaqAndClose l={l} items={c.faq} />
    </>
  );
}

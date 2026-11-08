import type { Metadata } from "next";
import { ArrowLink, ArticleBody, ArticleSchema, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { roundNutrients, sumNutrients, type FoodKey } from "@/content/nutrition";
import { defineCopy } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { PROTEIN_PER_KG } from "@/lib/calculations";
import { formatNumber } from "@/lib/format";

const PATH = "/intermittent-fasting";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

/** Voorbeelddag 16:8 (eetvenster 12:00-20:00), met de producten uit de gedeelde voedingstabel. */
const DAY = {
  lunch: [
    ["volkorenBrood", 105],
    ["ei", 110],
    ["kaas30", 20],
    ["tomaat", 100],
    ["komkommer", 75],
  ],
  snack: [
    ["skyr", 150],
    ["blauweBessen", 75],
    ["amandelen", 15],
  ],
  dinner: [
    ["kipfilet", 125],
    ["zilvervliesrijstOngekookt", 75],
    ["wokgroente", 400],
    ["olijfolie", 10],
    ["sojasaus", 15],
  ],
  dessert: [
    ["kwarkMager", 150],
    ["kiwi", 75],
  ],
} satisfies Record<string, [FoodKey, number][]>;
type Meal = keyof typeof DAY;
const MEALS = Object.keys(DAY) as Meal[];
const meal = Object.fromEntries(MEALS.map((m) => [m, roundNutrients(sumNutrients(DAY[m]))])) as Record<Meal, ReturnType<typeof roundNutrients>>;
/** Totaal als som van de afgeronde regels, zodat de tabel klopt als je hem optelt. */
const DAY_KCAL = MEALS.reduce((s, m) => s + meal[m].kcal, 0);
const DAY_PROTEIN = MEALS.reduce((s, m) => s + meal[m].protein, 0);

/** Rekenvoorbeeld eiwit: 70 kilo, afvallen, verdeeld over 3 maaltijden. */
const EXAMPLE_KG = 70;
const PROTEIN_DAY = Math.round((EXAMPLE_KG * PROTEIN_PER_KG.afvallen) / 5) * 5;
const PROTEIN_MEAL = Math.round(PROTEIN_DAY / 3 / 5) * 5;

const copy = defineCopy({
  nl: {
    metaTitle: "Intermittent fasting: werkt het om af te vallen?",
    metaDescription:
      "Intermittent fasting uitgelegd: 16:8, 5:2 en om de dag vasten, of het werkt om af te vallen, voor- en nadelen, voor vrouwen en voor wie het niet geschikt is.",
    eyebrow: "Voeding",
    h1: "Intermittent fasting:",
    h1Accent: "werkt het om af te vallen?",
    intro:
      "Bij intermittent fasting eet je alleen binnen vaste tijden en vast je de rest van de dag. Veel mensen vinden het een fijne structuur, anderen krijgen er vooral honger van. Hier lees je hoe het werkt, wat onderzoek zegt en of het bij jou past.",
    short:
      "Bij intermittent fasting wissel je eten en vasten af: bijvoorbeeld 16 uur niet eten en alles binnen 8 uur (16:8), of 2 dagen per week zo'n 500 tot 600 kcal (5:2). Je valt er vooral mee af doordat je minder eet. In onderzoek vallen mensen met intermittent fasting ongeveer evenveel af als met een gewoon calorietekort van dezelfde grootte. Het werkt dus als het je helpt om minder te eten en je het volhoudt.",
    what: {
      title: "Wat is intermittent fasting?",
      paragraphs: [
        "Intermittent fasting (ook wel periodiek vasten) schrijft niet voor wát je eet, maar wannéér je eet. Je wisselt periodes waarin je eet af met periodes waarin je niets of heel weinig eet. De tijd waarin je eet, heet je eetvenster; daarbuiten vast je.",
        "Tijdens het vasten drink je water, thee of zwarte koffie, zonder suiker. Melk, sap en frisdrank met suiker bevatten calorieën: strikt genomen onderbreek je daarmee je vasten. Vasten klinkt zwaar, maar bij de meeste vormen slaap je een groot deel van de tijd.",
      ],
    },
    forms: {
      title: "De bekendste vormen: 16:8, 5:2 en om de dag vasten",
      head: ["Vorm", "Vasten", "Eten"],
      rows: [
        ["16:8", "16 uur per dag", "binnen 8 uur, bijv. 12:00-20:00"],
        ["14:10", "14 uur per dag", "binnen 10 uur, bijv. 9:00-19:00"],
        ["5:2", "2 dagen per week ± 500-600 kcal", "5 dagen normaal"],
        ["Om de dag vasten", "om de dag niets of ± 500 kcal", "de andere dagen normaal"],
      ],
      bullets: [
        "16:8 is de populairste vorm. Je eet bijvoorbeeld tussen 12:00 en 20:00 en slaat je ontbijt over. Omdat je elke dag hetzelfde ritme hebt, vinden veel mensen dit het makkelijkst. 14:10 is een mildere variant om mee te beginnen.",
        "Bij 5:2 eet je 5 dagen per week zoals gewoonlijk en 2 dagen (niet achter elkaar) heel weinig, zo'n 500 tot 600 kcal.",
        "Om de dag vasten (alternate-day fasting) is de strengste vorm: je wisselt een dag normaal eten af met een dag waarop je niets of heel weinig eet. Voor de meeste mensen is dat lastig vol te houden.",
      ],
      dayTitle: "Zo ziet een dag met het 16:8-dieet eruit",
      dayIntro: (kcal: string, protein: string) =>
        `Een voorbeelddag met een eetvenster van 12:00 tot 20:00, met gewone producten uit de supermarkt. Samen is dat zo'n ${kcal} kcal en ${protein} gram eiwit. Hoeveel jij nodig hebt, hangt af van je lengte, gewicht en hoe actief je bent.`,
      dayHead: ["Tijd en wat je eet", "kcal", "Eiwit"],
      dayRows: {
        fastMorning: "Tot 12:00 · Vasten (sinds 20:00 gisteravond): water, thee of zwarte koffie",
        lunch: "12:00 · Lunch: 3 sneetjes volkoren brood met 2 eieren, 1 plak kaas 30+, tomaat en komkommer",
        snack: "15:30 · Tussendoortje: 150 g skyr met een handje blauwe bessen en 15 g amandelen",
        dinner: "19:00 · Avondeten: wokschotel met 125 g kipfilet, 75 g zilvervliesrijst, 400 g wokgroente, 1 eetlepel olijfolie en sojasaus",
        dessert: "19:45 · Toetje: 150 g magere kwark met een kiwi",
        fastEvening: "20:00 · Eetvenster dicht: tot 12:00 de volgende dag alleen water, thee of zwarte koffie",
        total: "Totaal",
      },
      dayNote: "Afgeronde waarden, berekend met gemiddelde voedingswaarden van supermarktproducten. Kip en rijst zijn rauw en ongekookt gewogen.",
    },
    works: {
      title: "Werkt intermittent fasting om af te vallen?",
      paragraphs: [
        "Ja, maar niet op een magische manier. Je valt af als je minder energie binnenkrijgt dan je verbruikt. Intermittent fasting helpt daarbij vooral doordat je minder eetmomenten hebt: het ontbijt of het snoepen op de bank valt weg, en daarmee vaak een paar honderd kilocalorieën.",
        "In onderzoeken die intermittent fasting vergelijken met een gewoon calorietekort van dezelfde grootte, vallen mensen gemiddeld ongeveer evenveel af. Het eetvenster zelf lijkt dus geen groot extra effect te hebben. Eet je binnen je 8 uur net zoveel als anders op een hele dag, dan val je niet af.",
        "Een kilo lichaamsvet bevat ongeveer 7.700 kcal. Voor een halve kilo per week heb je een tekort nodig van zo'n 550 kcal per dag, met of zonder vasten.",
      ],
      cta: "Bereken hoeveel calorieën je nodig hebt",
    },
    prosCons: {
      title: "Voordelen en nadelen van intermittent fasting",
      prosTitle: "Voordelen",
      pros: [
        "Duidelijke structuur: je weet wanneer je eet en wanneer niet. Dat scheelt keuzes.",
        "Minder eetmomenten: minder kans op tussendoortjes en snaaien, vooral 's avonds.",
        "Grotere maaltijden: omdat je minder vaak eet, kunnen je maaltijden wat ruimer zijn.",
        "Geen speciale producten nodig: het kost niets extra en je kunt gewone maaltijden blijven eten.",
      ],
      consTitle: "Nadelen",
      cons: [
        "Honger: vooral de eerste weken. Sommige mensen hebben ook last van hoofdpijn, prikkelbaarheid of minder concentratie.",
        "Inhalen in je eetvenster: wie veel honger heeft, eet makkelijk meer, waardoor het tekort verdwijnt.",
        "Sociale situaties: een ontbijt met het gezin, een borrel of een etentje past niet altijd in je venster.",
        "Niet voor iedereen: sommige mensen gaan juist meer aan eten denken, of trainen liever niet op een lege maag.",
      ],
    },
    protein: {
      title: "Eiwit en genoeg eten blijven belangrijk",
      paragraphs: (perDay: string, perMeal: string) => [
        `Ook met intermittent fasting tellen wat en hoeveel je eet. Met minder eetmomenten is het lastiger om aan je eiwit te komen. Een vrouw van 70 kilo die wil afvallen, heeft zo'n ${perDay} gram eiwit per dag nodig; verdeeld over 3 maaltijden is dat ongeveer ${perMeal} gram per keer.`,
        "Eet in je eetvenster dus volwaardige maaltijden met eiwit (kwark, eieren, vis, kip, peulvruchten), groente en volkoren producten. Eet ook niet te weinig: een te groot tekort kost spiermassa en houd je moeilijk vol. Krachttraining helpt je spieren te behouden terwijl je afvalt.",
      ],
      cta: "Bereken hoeveel eiwit je nodig hebt",
    },
    women: {
      title: "Intermittent fasting voor vrouwen",
      paragraphs: [
        "Onderzoek naar intermittent fasting duurt meestal kort, en er is weinig onderzoek dat specifiek kijkt naar vrouwen in verschillende levensfases. Wat voor de een goed werkt, hoeft voor de ander niet te werken.",
        "Sommige vrouwen voelen zich er prima bij, anderen merken dat ze slechter slapen, minder energie hebben of prikkelbaar worden. Luister daarom naar je lichaam. Begin rustig, met 12 of 14 uur vasten (12:12 of 14:10), en kijk hoe het gaat voordat je naar 16:8 gaat.",
        "Merk je dat je slechter slaapt, weinig energie hebt of steeds aan eten denkt? Dan past deze manier van eten misschien niet bij jou, en dat is prima. Je kunt net zo goed afvallen met 3 tot 5 eetmomenten verspreid over de dag. Heb je klachten of twijfels, overleg dan met je huisarts.",
      ],
    },
    notFor: {
      title: "Voor wie is intermittent fasting niet geschikt?",
      paragraphs: ["Begin niet aan intermittent fasting zonder overleg met je huisarts als een van deze situaties voor jou geldt:"],
      bullets: [
        "Je bent zwanger of je geeft borstvoeding.",
        "Je hebt (of had) een eetstoornis, of je merkt dat vasten leidt tot eetbuien of veel piekeren over eten.",
        "Je hebt diabetes en gebruikt bloedsuikerverlagende medicijnen, zoals insuline. Vasten kan dan een te lage bloedsuiker geven.",
        "Je bent jonger dan 18 jaar.",
        "Je hebt ondergewicht.",
        "Je gebruikt andere medicijnen of hebt een aandoening en je twijfelt of vasten verstandig is.",
      ],
    },
    start: {
      title: "Zo begin je met intermittent fasting",
      bullets: [
        "Begin klein: eet bijvoorbeeld 12 uur niets ('s avonds na 20:00 niets meer en ontbijten om 8:00) en schuif je eetvenster daarna geleidelijk op.",
        "Kies een venster dat bij je dag past. Eet je graag 's avonds met je gezin, laat je eetvenster dan later beginnen en eindigen.",
        "Drink genoeg. Water, thee en zwarte koffie passen ook tijdens het vasten.",
        "Begin je eetvenster met een eiwitrijke maaltijd met groente: die vult goed.",
        "Compenseer niet: houd je maaltijden normaal van omvang, ook als je veel trek hebt.",
        "Voel je je er niet goed bij of houd je het niet vol? Stop dan gerust. Afvallen lukt ook zonder vasten.",
      ],
    },
    planTitle: "Minder eetmomenten in je voedingsschema",
    planText:
      "In onze vragenlijst kies je zelf of je 3, 4 of 5 keer per dag eet. Kies je 3 eetmomenten, dan krijg je drie maaltijden zonder tussendoortjes, en die passen makkelijker in een korter eetvenster. Hoe laat je eet, bepaal je zelf. We rekenen je calorie- en eiwitdoel voor je uit en je krijgt een weekmenu met recepten en boodschappenlijst.",
    planCta: "Maak mijn persoonlijke plan",
    planNote: "± 3 minuten · je betaalt pas als je een plan kiest",
    faq: [
      {
        q: "Hoeveel kun je afvallen met intermittent fasting?",
        a: "Dat hangt af van je calorietekort, niet van het vasten zelf. Met een tekort van zo'n 550 kcal per dag kom je grofweg op een halve kilo per week. Iedereen is anders: je resultaat hangt af van je lichaam, je startgewicht en hoe goed je het volhoudt.",
      },
      {
        q: "Mag je koffie drinken tijdens het vasten?",
        a: "Ja. Zwarte koffie zonder suiker, thee en water passen in je vasten. Met melk of suiker krijg je calorieën binnen. Een klein scheutje melk maakt voor afvallen weinig uit, maar strikt genomen vast je dan niet meer.",
      },
      {
        q: "Is 16:8 geschikt voor vrouwen?",
        a: "Voor veel vrouwen wel, maar er is weinig onderzoek dat specifiek naar vrouwen kijkt. Begin rustig, met 12 of 14 uur vasten, en let op hoe je slaapt en hoeveel energie je hebt. Ben je zwanger, geef je borstvoeding of heb je een eetstoornis (gehad), overleg dan eerst met je huisarts.",
      },
      {
        q: "Mag je in je eetvenster alles eten?",
        a: "Nee. Calorieën tellen ook binnen je eetvenster. Eet je in 8 uur net zoveel als anders op een hele dag, dan val je niet af. Kies gewone maaltijden met eiwit, groente en volkoren producten.",
      },
      {
        q: "Verlies je spiermassa door intermittent fasting?",
        a: "Bij elk calorietekort verlies je naast vet ook wat spiermassa. Genoeg eiwit en krachttraining helpen om je spieren te behouden; dat geldt ook bij intermittent fasting.",
      },
      {
        q: "Wat is beter: 16:8 of 5:2?",
        a: "Geen van beide werkt duidelijk beter om af te vallen. Kies de vorm die bij je leven past en die je volhoudt. Veel mensen vinden 16:8 makkelijker, omdat je elke dag hetzelfde ritme hebt.",
      },
    ],
  },
  en: {
    metaTitle: "Intermittent fasting: does it work for weight loss?",
    metaDescription:
      "Intermittent fasting explained: 16:8, 5:2 and alternate-day fasting, whether it works for weight loss, pros and cons, for women, and who it isn't suitable for.",
    eyebrow: "Nutrition",
    h1: "Intermittent fasting:",
    h1Accent: "does it work for weight loss?",
    intro:
      "With intermittent fasting, you only eat within set times and fast for the rest of the day. Many people like the structure; others mainly get hungry. Here you can read how it works, what research says and whether it suits you.",
    short:
      "Intermittent fasting means alternating between eating and fasting: for example, not eating for 16 hours and having everything within 8 hours (16:8), or eating around 500 to 600 kcal on 2 days a week (5:2). It mainly helps you lose weight because you eat less. In studies, people on intermittent fasting lose roughly as much weight as with an ordinary calorie deficit of the same size. So it works if it helps you eat less and you can keep it up.",
    what: {
      title: "What is intermittent fasting?",
      paragraphs: [
        "Intermittent fasting doesn't tell you what to eat, but when to eat. You alternate periods of eating with periods of eating nothing or very little. The time in which you eat is called your eating window; outside it, you fast.",
        "While fasting, you drink water, tea or black coffee, without sugar. Milk, juice and sugary soft drinks contain calories: strictly speaking, they break your fast. Fasting sounds tough, but with most forms you sleep through a large part of it.",
      ],
    },
    forms: {
      title: "The best-known forms: 16:8, 5:2 and alternate-day fasting",
      head: ["Form", "Fasting", "Eating"],
      rows: [
        ["16:8", "16 hours a day", "within 8 hours, e.g. 12:00-20:00"],
        ["14:10", "14 hours a day", "within 10 hours, e.g. 9:00-19:00"],
        ["5:2", "2 days a week ± 500-600 kcal", "5 days as normal"],
        ["Alternate-day fasting", "every other day nothing or ± 500 kcal", "the other days as normal"],
      ],
      bullets: [
        "16:8 is the most popular form. You eat between 12:00 and 20:00, for example, and skip breakfast. Because you have the same rhythm every day, many people find this the easiest. 14:10 is a gentler version to start with.",
        "With 5:2, you eat as usual on 5 days a week and very little on 2 days (not back to back), around 500 to 600 kcal.",
        "Alternate-day fasting is the strictest form: you alternate a day of normal eating with a day on which you eat nothing or very little. Most people find this hard to keep up.",
      ],
      dayTitle: "What a day on the 16:8 diet looks like",
      dayIntro: (kcal: string, protein: string) =>
        `An example day with an eating window from 12:00 to 20:00, using ordinary supermarket foods. Together that's around ${kcal} kcal and ${protein} grams of protein. How much you need depends on your height, weight and how active you are.`,
      dayHead: ["Time and what you eat", "kcal", "Protein"],
      dayRows: {
        fastMorning: "Until 12:00 · Fasting (since 20:00 last night): water, tea or black coffee",
        lunch: "12:00 · Lunch: 3 slices of wholemeal bread with 2 eggs, 1 slice of reduced-fat cheese, tomato and cucumber",
        snack: "15:30 · Snack: 150 g skyr with a handful of blueberries and 15 g almonds",
        dinner: "19:00 · Dinner: stir-fry with 125 g chicken breast, 75 g brown rice, 400 g stir-fry vegetables, 1 tablespoon olive oil and soy sauce",
        dessert: "19:45 · Dessert: 150 g low-fat quark with a kiwi",
        fastEvening: "20:00 · Eating window closes: only water, tea or black coffee until 12:00 the next day",
        total: "Total",
      },
      dayNote: "Rounded values, based on average nutritional values of supermarket products. Chicken and rice are weighed raw and uncooked.",
    },
    works: {
      title: "Does intermittent fasting work for weight loss?",
      paragraphs: [
        "Yes, but not in a magical way. You lose weight when you take in less energy than you use. Intermittent fasting mainly helps because you have fewer eating moments: breakfast or snacking on the sofa drops out, and with it often a few hundred kilocalories.",
        "In studies comparing intermittent fasting with an ordinary calorie deficit of the same size, people lose roughly the same amount of weight on average. So the eating window itself doesn't seem to have a big extra effect. If you eat as much in your 8 hours as you normally would in a whole day, you won't lose weight.",
        "A kilo of body fat contains around 7,700 kcal. To lose half a kilo a week, you need a deficit of around 550 kcal a day, with or without fasting.",
      ],
      cta: "Work out how many calories you need",
    },
    prosCons: {
      title: "Pros and cons of intermittent fasting",
      prosTitle: "Pros",
      pros: [
        "Clear structure: you know when you eat and when you don't. That means fewer decisions.",
        "Fewer eating moments: less chance of snacking and grazing, especially in the evening.",
        "Bigger meals: because you eat less often, your meals can be a bit more generous.",
        "No special products needed: it costs nothing extra and you can keep eating ordinary meals.",
      ],
      consTitle: "Cons",
      cons: [
        "Hunger: especially in the first few weeks. Some people also get headaches, feel irritable or find it harder to concentrate.",
        "Making up for it in your eating window: if you're very hungry, it's easy to eat more, and the deficit disappears.",
        "Social situations: breakfast with the family, drinks or a meal out don't always fit your window.",
        "Not for everyone: some people end up thinking about food more, or prefer not to train on an empty stomach.",
      ],
    },
    protein: {
      title: "Protein and eating enough still matter",
      paragraphs: (perDay: string, perMeal: string) => [
        `With intermittent fasting, what and how much you eat still count. With fewer eating moments, it's harder to get enough protein. A 70-kilo woman who wants to lose weight needs around ${perDay} grams of protein a day; spread over 3 meals, that's about ${perMeal} grams each time.`,
        "So eat proper meals in your eating window, with protein (quark, eggs, fish, chicken, pulses), vegetables and wholegrains. Don't eat too little either: too big a deficit costs muscle and is hard to keep up. Strength training helps you keep your muscle while you lose weight.",
      ],
      cta: "Work out how much protein you need",
    },
    women: {
      title: "Intermittent fasting for women",
      paragraphs: [
        "Research on intermittent fasting is usually short-term, and few studies look specifically at women in different stages of life. What works well for one person doesn't have to work for another.",
        "Some women feel fine on it; others notice they sleep worse, have less energy or get irritable. So listen to your body. Start gently, with 12 or 14 hours of fasting (12:12 or 14:10), and see how it goes before moving to 16:8.",
        "Do you notice you're sleeping worse, have little energy or keep thinking about food? Then this way of eating may not suit you, and that's fine. You can lose weight just as well with 3 to 5 eating moments spread over the day. If you have symptoms or doubts, talk to your GP.",
      ],
    },
    notFor: {
      title: "Who is intermittent fasting not suitable for?",
      paragraphs: ["Don't start intermittent fasting without talking to your GP if any of these apply to you:"],
      bullets: [
        "You're pregnant or breastfeeding.",
        "You have (or have had) an eating disorder, or you notice fasting leads to binge eating or worrying a lot about food.",
        "You have diabetes and take blood-sugar-lowering medication, such as insulin. Fasting can then cause low blood sugar.",
        "You're under 18.",
        "You're underweight.",
        "You take other medication or have a health condition and aren't sure whether fasting is sensible.",
      ],
    },
    start: {
      title: "How to start intermittent fasting",
      bullets: [
        "Start small: for example, don't eat for 12 hours (nothing after 20:00 and breakfast at 8:00), then gradually shift your eating window.",
        "Choose a window that fits your day. If you like eating with your family in the evening, let your eating window start and end later.",
        "Drink enough. Water, tea and black coffee are fine while fasting too.",
        "Start your eating window with a high-protein meal with vegetables: it's filling.",
        "Don't compensate: keep your meals a normal size, even if you're very hungry.",
        "Don't feel good on it, or can't keep it up? Then feel free to stop. You can lose weight without fasting too.",
      ],
    },
    planTitle: "Fewer eating moments in your nutrition plan",
    planText:
      "In our questionnaire, you choose whether you eat 3, 4 or 5 times a day. Choose 3 eating moments and you get three meals without snacks, which fit more easily into a shorter eating window. You decide what time you eat. We work out your calorie and protein targets for you, and you get a weekly menu with recipes and a shopping list.",
    planCta: "Create my personal plan",
    planNote: "About 3 minutes · you only pay once you choose a plan",
    faq: [
      {
        q: "How much weight can you lose with intermittent fasting?",
        a: "That depends on your calorie deficit, not on the fasting itself. With a deficit of around 550 kcal a day, you'll lose roughly half a kilo a week. Everyone is different: your results depend on your body, your starting weight and how well you keep it up.",
      },
      {
        q: "Can you drink coffee while fasting?",
        a: "Yes. Black coffee without sugar, tea and water fit into your fast. With milk or sugar, you take in calories. A small splash of milk makes little difference for weight loss, but strictly speaking you're no longer fasting.",
      },
      {
        q: "Is 16:8 suitable for women?",
        a: "For many women it is, but few studies look specifically at women. Start gently, with 12 or 14 hours of fasting, and pay attention to how you sleep and how much energy you have. If you're pregnant, breastfeeding or have (had) an eating disorder, talk to your GP first.",
      },
      {
        q: "Can you eat anything in your eating window?",
        a: "No. Calories count within your eating window too. If you eat as much in 8 hours as you normally would in a whole day, you won't lose weight. Choose ordinary meals with protein, vegetables and wholegrains.",
      },
      {
        q: "Do you lose muscle with intermittent fasting?",
        a: "With any calorie deficit, you lose some muscle as well as fat. Enough protein and strength training help you keep your muscle; that applies to intermittent fasting too.",
      },
      {
        q: "Which is better: 16:8 or 5:2?",
        a: "Neither clearly works better for weight loss. Choose the form that fits your life and that you can keep up. Many people find 16:8 easier, because you have the same rhythm every day.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

const H3 = "text-xl font-extrabold";
const BULLETS = "list-disc space-y-2 pl-6 text-lg leading-relaxed text-muted marker:text-brand-600";

export default async function IntermittentFastingPage() {
  const l = await getLocale();
  const c = copy[l];
  const n = (x: number) => formatNumber(x, Number.isInteger(x) ? 0 : 1, l);
  const r = c.forms.dayRows;
  const dayRows: string[][] = [
    [r.fastMorning, "–", "–"],
    ...MEALS.map((m) => [r[m], n(meal[m].kcal), `${n(meal[m].protein)} g`]),
    [r.fastEvening, "–", "–"],
    [r.total, n(DAY_KCAL), `${n(DAY_PROTEIN)} g`],
  ];
  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short} />

      <ArticleBody>
        <Section title={c.what.title} paragraphs={c.what.paragraphs} />

        <Section title={c.forms.title}>
          <DataTable head={c.forms.head} rows={c.forms.rows} />
          <ul className={BULLETS}>
            {c.forms.bullets.map((b) => (
              <li key={b.slice(0, 48)}>{b}</li>
            ))}
          </ul>
          <h3 className={`${H3} pt-2`}>{c.forms.dayTitle}</h3>
          <p className="text-lg leading-relaxed text-muted">{c.forms.dayIntro(n(DAY_KCAL), n(DAY_PROTEIN))}</p>
          <DataTable head={c.forms.dayHead} rows={dayRows} note={c.forms.dayNote} minWidth="24rem" />
        </Section>

        <Section title={c.works.title} paragraphs={c.works.paragraphs}>
          <ArrowLink href="/caloriebehoefte-berekenen">{c.works.cta}</ArrowLink>
        </Section>

        <Section title={c.prosCons.title}>
          <h3 className={H3}>{c.prosCons.prosTitle}</h3>
          <ul className={BULLETS}>
            {c.prosCons.pros.map((b) => (
              <li key={b.slice(0, 48)}>{b}</li>
            ))}
          </ul>
          <h3 className={`${H3} pt-2`}>{c.prosCons.consTitle}</h3>
          <ul className={BULLETS}>
            {c.prosCons.cons.map((b) => (
              <li key={b.slice(0, 48)}>{b}</li>
            ))}
          </ul>
        </Section>

        <Section title={c.protein.title} paragraphs={c.protein.paragraphs(n(PROTEIN_DAY), n(PROTEIN_MEAL))}>
          <ArrowLink href="/eiwitten-per-dag">{c.protein.cta}</ArrowLink>
        </Section>

        <Section title={c.women.title} paragraphs={c.women.paragraphs} />

        <Section title={c.notFor.title} paragraphs={c.notFor.paragraphs} bullets={c.notFor.bullets} />

        <Section title={c.start.title} bullets={c.start.bullets} />

        <PlanBox title={c.planTitle} text={c.planText} href="/start?doel=afvallen" cta={c.planCta} note={c.planNote} />

        <RelatedPages l={l} paths={["/caloriebehoefte-berekenen", "/eiwitten-per-dag", "/gezonde-snacks", "/gezond-weekmenu"]} />
      </ArticleBody>

      <FaqAndClose l={l} items={c.faq} />
    </>
  );
}

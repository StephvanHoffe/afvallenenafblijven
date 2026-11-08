import type { Metadata } from "next";
import { ArticleBody, ArticleSchema, ArrowLink, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { foods, roundNutrients, sumNutrients, type FoodKey, type Nutrients } from "@/content/nutrition";
import { nutritionRange, recipeBySlug, recipeHref, recipeNutrition, recipesIn, type Recipe } from "@/content/recipes";
import { defineCopy, type Locale } from "@/i18n/config";
import Link from "@/i18n/Link";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { formatNumber } from "@/lib/format";

const PATH = "/gezond-weekmenu";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

type Text = Record<Locale, string>;

/** Eenvoudige tussendoortjes uit de voedingstabel (gram of ml). */
const SNACKS = {
  appel: { name: { nl: "1 appel", en: "1 apple" }, items: [["appel", 150]] },
  banaan: { name: { nl: "1 banaan", en: "1 banana" }, items: [["banaan", 120]] },
  mandarijnen: { name: { nl: "2 mandarijnen", en: "2 mandarins" }, items: [["mandarijn", 140]] },
  skyrAardbeien: { name: { nl: "Skyr (150 g) met aardbeien", en: "Skyr (150 g) with strawberries" }, items: [["skyr", 150], ["aardbeien", 100]] },
  kwarkBessen: { name: { nl: "Magere kwark (150 g) met blauwe bessen", en: "Low-fat quark (150 g) with blueberries" }, items: [["kwarkMager", 150], ["blauweBessen", 75]] },
  huttenkaseKomkommer: { name: { nl: "Hüttenkäse (100 g) met komkommer", en: "Cottage cheese (100 g) with cucumber" }, items: [["huttenkase", 100], ["komkommer", 100]] },
  amandelen: { name: { nl: "Handje amandelen (20 g)", en: "Small handful of almonds (20 g)" }, items: [["amandelen", 20]] },
  edamame: { name: { nl: "Edamame (100 g)", en: "Edamame (100 g)" }, items: [["edamame", 100]] },
  rijstwafelsHummus: { name: { nl: "2 rijstwafels met hummus (30 g)", en: "2 rice cakes with hummus (30 g)" }, items: [["rijstwafel", 16], ["hummus", 30]] },
} satisfies Record<string, { name: Text; items: [FoodKey, number][] }>;
type SnackId = keyof typeof SNACKS;

interface MenuDay {
  day: Text;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: SnackId[];
  tip: Text;
}

/**
 * De voorbeeldweek. Gerechten die twee keer terugkomen, kook je in één keer:
 * wat je binnen 2 dagen eet in de koelkast, de rest in de vriezer.
 */
const WEEK: MenuDay[] = [
  {
    day: { nl: "Maandag", en: "Monday" },
    breakfast: "overnight-oats-skyr-aardbeien",
    lunch: "linzensoep-tomaat-wortel",
    dinner: "chili-con-carne-zwarte-bonen",
    snacks: ["huttenkaseKomkommer", "appel"],
    tip: {
      nl: "De overnight oats en de linzensoep maak je op zondag (zie zondag). Kook vanavond 4 porties chili en vries er 3 in zodra ze zijn afgekoeld: 1 daarvan is voor vrijdag.",
      en: "Make the overnight oats and lentil soup on Sunday (see Sunday). Cook 4 portions of chilli tonight and freeze 3 once they've cooled: 1 of them is for Friday.",
    },
  },
  {
    day: { nl: "Dinsdag", en: "Tuesday" },
    breakfast: "overnight-oats-skyr-aardbeien",
    lunch: "linzensoep-tomaat-wortel",
    dinner: "zalm-oven-krieltjes-sperziebonen",
    snacks: ["skyrAardbeien", "banaan"],
    tip: {
      nl: "Maak vanavond 2 porties couscoussalade met kip, voor woensdag en donderdag.",
      en: "Make 2 portions of couscous salad with chicken tonight, for Wednesday and Thursday.",
    },
  },
  {
    day: { nl: "Woensdag", en: "Wednesday" },
    breakfast: "omelet-spinazie-tomaat-kaas",
    lunch: "couscoussalade-kip-paprika-feta",
    dinner: "curry-tofu-groente-kokosmelk",
    snacks: ["amandelen", "mandarijnen"],
    tip: {
      nl: "Kook vanavond 4 porties curry: 1 voor vandaag, 1 voor morgen en 2 voor de vriezer.",
      en: "Cook 4 portions of curry tonight: 1 for today, 1 for tomorrow and 2 for the freezer.",
    },
  },
  {
    day: { nl: "Donderdag", en: "Thursday" },
    breakfast: "kwarkbowl-blauwe-bessen-walnoten",
    lunch: "couscoussalade-kip-paprika-feta",
    dinner: "curry-tofu-groente-kokosmelk",
    snacks: ["edamame", "appel"],
    tip: {
      nl: "Leg vanavond een portie chili uit de vriezer in de koelkast om te ontdooien. Maak ook 2 porties quinoasalade voor vrijdag en zaterdag.",
      en: "Tonight, move a portion of chilli from the freezer to the fridge to thaw. Also make 2 portions of quinoa salad for Friday and Saturday.",
    },
  },
  {
    day: { nl: "Vrijdag", en: "Friday" },
    breakfast: "ontbijtwrap-roerei-spinazie",
    lunch: "quinoasalade-kikkererwten-edamame-feta",
    dinner: "chili-con-carne-zwarte-bonen",
    snacks: ["skyrAardbeien", "mandarijnen"],
    tip: {
      nl: "Verwarm de ontdooide chili en de rijst tot alles overal gloeiend heet is.",
      en: "Reheat the thawed chilli and rice until everything is piping hot all the way through.",
    },
  },
  {
    day: { nl: "Zaterdag", en: "Saturday" },
    breakfast: "havermoutpannenkoekjes-kwark-bessen",
    lunch: "quinoasalade-kikkererwten-edamame-feta",
    dinner: "kabeljauw-zoete-aardappel-broccoli",
    snacks: ["skyrAardbeien", "appel"],
    tip: {
      nl: "Weekend: tijd voor pannenkoekjes. Koop je kabeljauw uit de diepvries? Laat hem dan een nacht in de koelkast ontdooien.",
      en: "Weekend: time for pancakes. Buying frozen cod? Let it thaw overnight in the fridge.",
    },
  },
  {
    day: { nl: "Zondag", en: "Sunday" },
    breakfast: "volkoren-brood-huttenkase-kipfilet",
    lunch: "bowl-zalm-edamame-zilvervliesrijst",
    dinner: "linzenbolognese-volkoren-pasta",
    snacks: ["kwarkBessen", "rijstwafelsHummus"],
    tip: {
      nl: "Meal prep voor volgende week: maak overnight oats en linzensoep voor maandag en dinsdag. Kook 4 porties linzenbolognese en vries 3 porties saus in.",
      en: "Meal prep for next week: make overnight oats and lentil soup for Monday and Tuesday. Cook 4 portions of lentil bolognese and freeze 3 portions of sauce.",
    },
  },
];

type Moment = "breakfast" | "lunch" | "dinner" | "snack";
interface MenuItem {
  moment: Moment;
  recipe?: Recipe;
  snack?: SnackId;
  nutrition: Nutrients;
}

function snackNutrition(id: SnackId): Nutrients {
  return roundNutrients(sumNutrients(SNACKS[id].items as [FoodKey, number][]));
}

function dayItems(d: MenuDay): MenuItem[] {
  const meal = (moment: Moment, slug: string): MenuItem => {
    const recipe = recipeBySlug(slug);
    return { moment, recipe, nutrition: recipeNutrition(recipe) };
  };
  return [
    meal("breakfast", d.breakfast),
    meal("lunch", d.lunch),
    meal("dinner", d.dinner),
    ...d.snacks.map((snack): MenuItem => ({ moment: "snack", snack, nutrition: snackNutrition(snack) })),
  ];
}

/** Dagtotaal: de som van de (afgeronde) waarden per maaltijd, zodat de optelling op de pagina klopt; eiwit op hele grammen. */
function dayTotal(items: MenuItem[]): { kcal: number; protein: number } {
  const t = items.reduce((sum, x) => ({ kcal: sum.kcal + x.nutrition.kcal, protein: sum.protein + x.nutrition.protein }), { kcal: 0, protein: 0 });
  return { kcal: t.kcal, protein: Math.round(t.protein) };
}

const DAYS = WEEK.map((d) => {
  const items = dayItems(d);
  return { ...d, items, total: dayTotal(items) };
});
const KCAL = DAYS.map((d) => d.total.kcal);
const PROTEIN = DAYS.map((d) => d.total.protein);
const KCAL_MIN = Math.min(...KCAL);
const KCAL_MAX = Math.max(...KCAL);
const KCAL_AVG = Math.round(KCAL.reduce((a, b) => a + b, 0) / KCAL.length / 5) * 5;
const PROTEIN_MIN = Math.min(...PROTEIN);
const PROTEIN_MAX = Math.max(...PROTEIN);
const PROTEIN_AVG = Math.round(PROTEIN.reduce((a, b) => a + b, 0) / PROTEIN.length);
const MEAL_PROTEIN_MIN = Math.min(...DAYS.flatMap((d) => d.items.filter((x) => x.recipe).map((x) => x.nutrition.protein)));
const VEG_DINNERS = WEEK.filter((d) => recipeBySlug(d.dinner).vegetarian).length;
const RANGES = {
  ontbijt: nutritionRange(recipesIn("ontbijt"), "kcal"),
  lunch: nutritionRange(recipesIn("lunch"), "kcal"),
  avondeten: nutritionRange(recipesIn("avondeten"), "kcal"),
};

/* Boodschappenlijst: alle hoeveelheden van de week bij elkaar opgeteld, voor 1 persoon. */
const SHOPPING = new Map<FoodKey, number>();
const add = (key: FoodKey, amount: number) => SHOPPING.set(key, (SHOPPING.get(key) ?? 0) + amount);
for (const d of DAYS) {
  for (const x of d.items) {
    if (x.recipe) x.recipe.ingredients.forEach((ing) => add(ing.food, ing.amount));
    if (x.snack) (SNACKS[x.snack].items as [FoodKey, number][]).forEach(([key, amount]) => add(key, amount));
  }
}

const GROUPS: { title: Text; foods: FoodKey[] }[] = [
  {
    title: { nl: "Groente, fruit en aardappelen", en: "Fruit, vegetables and potatoes" },
    foods: ["broccoli", "komkommer", "tomaat", "cherrytomaat", "spinazie", "paprika", "wortel", "courgette", "sperziebonen", "ui", "champignons", "sla", "wokgroente", "krieltjes", "aardappel", "zoeteAardappel", "banaan", "appel", "mandarijn", "sinaasappel", "aardbeien", "blauweBessen", "peer", "kiwi", "druiven", "watermeloen", "avocado"],
  },
  {
    title: { nl: "Brood, granen en pasta", en: "Bread, grains and pasta" },
    foods: ["volkorenBrood", "witBrood", "volkorenWrap", "havermout", "muesli", "rijstwafel", "zilvervliesrijstOngekookt", "rijstOngekookt", "volkorenPastaOngekookt", "pastaOngekookt", "quinoaOngekookt", "couscousOngekookt", "popcorn"],
  },
  {
    title: { nl: "Zuivel en eieren", en: "Dairy and eggs" },
    foods: ["ei", "kwarkMager", "skyr", "yoghurtMager", "griekseYoghurt", "huttenkase", "melkHalfvol", "kaas30", "feta", "mozzarellaLight"],
  },
  {
    title: { nl: "Vlees, vis en vegetarisch", en: "Meat, fish and vegetarian" },
    foods: ["kipfilet", "kalkoenfilet", "kipfiletBeleg", "rundergehakt", "zalm", "kabeljauw", "tonijn", "garnalen", "tofu", "tempeh"],
  },
  {
    title: { nl: "Peulvruchten, noten en zaden", en: "Pulses, nuts and seeds" },
    foods: ["linzen", "kikkererwten", "zwarteBonen", "edamame", "hummus", "pindakaas", "amandelen", "walnoten", "chiazaad"],
  },
  {
    title: { nl: "Voorraadkast", en: "Store cupboard" },
    foods: ["tomatenblokjes", "kokosmelkLight", "sojasaus", "pesto", "olijfolie", "honing", "pureChocolade", "rozijnen"],
  },
];
const GROUPED = new Set(GROUPS.flatMap((g) => g.foods));
const OTHER = [...SHOPPING.keys()].filter((k) => !GROUPED.has(k));
if (OTHER.length > 0) GROUPS.push({ title: { nl: "Overig", en: "Other" }, foods: OTHER });

/** Producten die je per stuk koopt: [enkelvoud, meervoud] en het gewicht per stuk. */
const PIECES: Partial<Record<FoodKey, { size: number; nl: [string, string]; en: [string, string] }>> = {
  ei: { size: 55, nl: ["ei", "eieren"], en: ["egg", "eggs"] },
  volkorenBrood: { size: 35, nl: ["snee", "sneetjes"], en: ["slice", "slices"] },
  volkorenWrap: { size: 60, nl: ["wrap", "wraps"], en: ["wrap", "wraps"] },
  rijstwafel: { size: 8, nl: ["rijstwafel", "rijstwafels"], en: ["rice cake", "rice cakes"] },
  appel: { size: 150, nl: ["appel", "appels"], en: ["apple", "apples"] },
  banaan: { size: 120, nl: ["banaan", "bananen"], en: ["banana", "bananas"] },
  mandarijn: { size: 70, nl: ["mandarijn", "mandarijnen"], en: ["mandarin", "mandarins"] },
  paprika: { size: 150, nl: ["paprika", "paprika's"], en: ["pepper", "peppers"] },
  ui: { size: 100, nl: ["ui", "uien"], en: ["onion", "onions"] },
  courgette: { size: 250, nl: ["courgette", "courgettes"], en: ["courgette", "courgettes"] },
  tomaat: { size: 100, nl: ["tomaat", "tomaten"], en: ["tomato", "tomatoes"] },
  tomatenblokjes: { size: 400, nl: ["blik (400 g)", "blikken (400 g)"], en: ["tin (400 g)", "tins (400 g)"] },
  olijfolie: { size: 10, nl: ["eetlepel", "eetlepels"], en: ["tablespoon", "tablespoons"] },
};

function shoppingAmount(key: FoodKey, total: number, l: Locale): { main: string; sub?: string } {
  const unit = foods[key].unit;
  const rounded = total < 100 ? Math.ceil(total / 5) * 5 : Math.ceil(total / 10) * 10;
  const grams = `${formatNumber(rounded, 0, l)} ${unit}`;
  const piece = PIECES[key];
  if (!piece) return { main: grams };
  const count = Math.max(1, Math.ceil(total / piece.size - 0.05));
  const [one, many] = piece[l];
  return { main: `${count} ${count === 1 ? one : many}`, sub: key === "tomatenblokjes" || key === "olijfolie" ? undefined : `± ${grams}` };
}

/** Kruiden en extra's uit de recepten van deze week, zonder hoeveelheden en dubbelingen. */
function pantry(l: Locale): string[] {
  const seen = new Map<string, string>();
  for (const d of DAYS) {
    for (const x of d.items) {
      for (const e of x.recipe?.extras ?? []) {
        const base = e[l].replace(/\s*\(.*?\)/g, "").trim();
        for (const part of base.split(/ en | and /)) {
          const name = part.replace(/sap$/, "").replace(/ juice$/, "").trim();
          if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
        }
      }
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, l));
}

const copy = defineCopy({
  nl: {
    metaTitle: "Gezond weekmenu om af te vallen, met boodschappenlijst",
    metaDescription: `Gezond weekmenu om af te vallen: 7 dagen met ontbijt, lunch, avondeten en tussendoortjes, rond de ${formatNumber(KCAL_AVG, 0, "nl")} kcal per dag, met recepten en boodschappenlijst.`,
    eyebrow: "Recepten",
    h1: "Gezond weekmenu",
    h1Accent: "met boodschappenlijst",
    intro:
      "Een voorbeeld van een gezonde week om af te vallen: 7 dagen met ontbijt, lunch, avondeten en tussendoortjes, met de calorieën en het eiwit per dag en een boodschappenlijst voor 1 persoon. Alle recepten staan op de site.",
    short: `Dit voorbeeldweekmenu heeft ${formatNumber(KCAL_MIN, 0, "nl")} tot ${formatNumber(KCAL_MAX, 0, "nl")} kcal en ${PROTEIN_MIN} tot ${PROTEIN_MAX} gram eiwit per dag, met 3 maaltijden en 2 tussendoortjes. Het is een voorbeeld voor iemand die met zo'n ${formatNumber(KCAL_AVG, 0, "nl")} kcal per dag afvalt. Jouw behoefte kan hoger of lager liggen: bereken die eerst en pas de porties daarop aan.`,
    buildTitle: "Zo is dit weekmenu opgebouwd",
    buildBullets: [
      "Elke dag een ontbijt, lunch en avondeten uit onze recepten, plus 2 eenvoudige tussendoortjes.",
      `Gemiddeld ${formatNumber(KCAL_AVG, 0, "nl")} kcal en ${PROTEIN_AVG} gram eiwit per dag. Elke maaltijd bevat minimaal ${MEAL_PROTEIN_MIN} gram eiwit.`,
      "Bij de lunch en het avondeten zit groente; bij het ontbijt en de tussendoortjes vaak fruit.",
      "Een paar gerechten komen twee keer terug. Dat is expres: je kookt ze in één keer en eet ze binnen 2 dagen op, of haalt ze uit de vriezer.",
      `${VEG_DINNERS} van de 7 avondmaaltijden zijn vegetarisch.`,
    ],
    weekTitle: "Het weekmenu: 7 dagen",
    weekIntro: "Klik op een gerecht voor het recept met ingrediënten en bereiding. De calorieën en het eiwit staan per portie.",
    moments: { breakfast: "Ontbijt", lunch: "Lunch", dinner: "Avondeten", snack: "Tussendoortje" } as Record<Moment, string>,
    itemLine: (kcal: string, protein: string) => `${kcal} kcal · ${protein} g eiwit`,
    total: "Totaal",
    tip: "Tip",
    summaryTitle: "Calorieën en eiwit per dag",
    summaryHead: ["Dag", "Calorieën", "Eiwit"],
    average: "Gemiddeld",
    summaryNote: "Opgeteld uit de afgeronde waarden per maaltijd. Kruiden, citroensap en bouillon tellen we niet mee.",
    shoppingTitle: "Weekmenu met boodschappenlijst (1 persoon)",
    shoppingIntro:
      "Alles wat je deze week eet, bij elkaar opgeteld. Vlees, vis, rijst en pasta zijn ongekookt gewogen en peulvruchten uitgelekt. Kook je extra porties voor de vriezer, zoals bij de chili, curry en linzenbolognese, koop dan wat meer.",
    pantryTitle: "Kruiden en basis (heb je vaak al in huis)",
    adjustTitle: "Weekmenu aanpassen aan jouw caloriebehoefte",
    adjust: [
      "Dit menu is een voorbeeld. Hoeveel calorieën jij nodig hebt, hangt af van je lengte, gewicht, leeftijd, geslacht en hoeveel je beweegt. Ben je lang of actief, dan heb je vaak meer nodig; ben je klein en beweeg je weinig, dan soms minder.",
      "Heb je meer nodig? Voeg een tussendoortje toe of maak de portie rijst, pasta, aardappelen of brood wat groter. Heb je minder nodig? Laat een tussendoortje weg. Ga niet zomaar ver onder je behoefte zitten: een groot tekort houd je lastig vol.",
    ],
    calcLink: "Bereken je caloriebehoefte",
    planLink: "Een weekmenu op jouw eigen doel",
    tipsTitle: "Tips voor je weekmenu",
    tips: [
      `Wissel gerust een gerecht om voor een ander recept van dezelfde maaltijd; de calorieën liggen dicht bij elkaar (ontbijt ${RANGES.ontbijt[0]}-${RANGES.ontbijt[1]} kcal, lunch ${RANGES.lunch[0]}-${RANGES.lunch[1]} kcal, avondeten ${RANGES.avondeten[0]}-${RANGES.avondeten[1]} kcal).`,
      "Doe één keer per week grote boodschappen met de lijst. Diepvriesgroente, diepvriesfruit en diepvriesvis zijn handig om in huis te hebben.",
      "Plan op zondag een uurtje voor meal prep. Dat scheelt doordeweeks veel tijd.",
      "Drink vooral water, thee of koffie zonder suiker.",
      "Eet je een keer uit eten of op een feestje? Sla geen maaltijden over om te sparen, maar pak de volgende dag het menu gewoon weer op.",
    ],
    planTitle: "Een weekmenu op jouw calorie- en eiwitdoel",
    planText:
      "Dit weekmenu is een voorbeeld. In je persoonlijke voedingsschema rekenen we je eigen calorie- en eiwitdoel uit en krijg je een weekmenu met recepten, hoeveelheden en een complete boodschappenlijst die daarop zijn afgestemd, met rekening voor wat je lekker vindt, of je vegetarisch eet en allergieën.",
    planCta: "Maak mijn persoonlijke plan",
    faq: [
      {
        q: "Wat is een gezond weekmenu om af te vallen?",
        a: "Een week met 3 maaltijden en 1 of 2 tussendoortjes per dag, met genoeg eiwit, veel groente, volkoren producten en fruit, en een totaal aantal calorieën dat iets onder je behoefte ligt. Dit voorbeeldmenu laat zien hoe dat eruit kan zien.",
      },
      {
        q: "Hoeveel calorieën moet een weekmenu per dag hebben?",
        a: `Dat verschilt per persoon. Dit voorbeeld zit tussen ${formatNumber(KCAL_MIN, 0, "nl")} en ${formatNumber(KCAL_MAX, 0, "nl")} kcal per dag, wat past bij veel vrouwen die afvallen. Mannen en mensen die veel bewegen hebben meestal meer nodig. Bereken je eigen caloriebehoefte en pas de porties daarop aan.`,
      },
      {
        q: "Mag ik maaltijden omwisselen?",
        a: "Ja. Wissel een ontbijt voor een ander ontbijt, een lunch voor een andere lunch en zo verder; de calorieën liggen per maaltijd dicht bij elkaar. Je kunt ook twee dagen omdraaien. Let bij meal prep wel op de 2 dagen in de koelkast.",
      },
      {
        q: "Is dit weekmenu geschikt voor vegetariërs?",
        a: `Niet helemaal: ${VEG_DINNERS} van de 7 avondmaaltijden zijn vegetarisch. Vervang de andere gerechten door vegetarische recepten van de site, zoals de linzenbolognese, de tofu-curry of de shakshuka, of vervang kip door tofu of peulvruchten.`,
      },
      {
        q: "Waarom komen sommige maaltijden twee keer terug?",
        a: "Omdat dat tijd scheelt. Je kookt bijvoorbeeld 4 porties chili of curry in één keer, eet ze binnen 2 dagen op en vriest de rest in. Zo hoef je niet elke dag te koken.",
      },
    ],
  },
  en: {
    metaTitle: "Healthy weekly menu for weight loss, with shopping list",
    metaDescription: `Healthy weekly menu for weight loss: 7 days of breakfast, lunch, dinner and snacks, around ${formatNumber(KCAL_AVG, 0, "en")} kcal a day, with recipes and a shopping list.`,
    eyebrow: "Recipes",
    h1: "Healthy weekly menu",
    h1Accent: "with shopping list",
    intro:
      "An example of a healthy week for weight loss: 7 days of breakfast, lunch, dinner and snacks, with the calories and protein per day and a shopping list for 1 person. All the recipes are on the site.",
    short: `This example weekly menu has ${formatNumber(KCAL_MIN, 0, "en")} to ${formatNumber(KCAL_MAX, 0, "en")} kcal and ${PROTEIN_MIN} to ${PROTEIN_MAX} grams of protein a day, with 3 meals and 2 snacks. It's an example for someone losing weight on around ${formatNumber(KCAL_AVG, 0, "en")} kcal a day. Your needs may be higher or lower: work them out first and adjust the portions.`,
    buildTitle: "How this weekly menu is put together",
    buildBullets: [
      "Every day a breakfast, lunch and dinner from our recipes, plus 2 simple snacks.",
      `On average ${formatNumber(KCAL_AVG, 0, "en")} kcal and ${PROTEIN_AVG} grams of protein a day. Every meal contains at least ${MEAL_PROTEIN_MIN} grams of protein.`,
      "Lunch and dinner include vegetables; breakfast and snacks often include fruit.",
      "A few dishes appear twice. That's deliberate: you cook them in one go and eat them within 2 days, or take them out of the freezer.",
      `${VEG_DINNERS} of the 7 dinners are vegetarian.`,
    ],
    weekTitle: "The weekly menu: 7 days",
    weekIntro: "Click on a dish for the recipe with ingredients and method. Calories and protein are per portion.",
    moments: { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" } as Record<Moment, string>,
    itemLine: (kcal: string, protein: string) => `${kcal} kcal · ${protein} g protein`,
    total: "Total",
    tip: "Tip",
    summaryTitle: "Calories and protein per day",
    summaryHead: ["Day", "Calories", "Protein"],
    average: "Average",
    summaryNote: "Added up from the rounded values per meal. We don't count herbs, lemon juice or stock.",
    shoppingTitle: "Weekly menu shopping list (1 person)",
    shoppingIntro:
      "Everything you eat this week, added up. Meat, fish, rice and pasta are weighed uncooked and pulses drained. If you cook extra portions for the freezer, as with the chilli, curry and lentil bolognese, buy a little more.",
    pantryTitle: "Herbs and basics (you may already have these)",
    adjustTitle: "Adjusting the weekly menu to your calorie needs",
    adjust: [
      "This menu is an example. How many calories you need depends on your height, weight, age, sex and how active you are. If you're tall or active, you often need more; if you're short and not very active, sometimes less.",
      "Need more? Add a snack or make the portion of rice, pasta, potatoes or bread a little bigger. Need less? Leave out a snack. Don't go far below your needs: a large deficit is hard to keep up.",
    ],
    calcLink: "Work out your calorie needs",
    planLink: "A weekly menu for your own goal",
    tipsTitle: "Tips for your weekly menu",
    tips: [
      `Feel free to swap a dish for another recipe of the same meal; the calories are close together (breakfast ${RANGES.ontbijt[0]}-${RANGES.ontbijt[1]} kcal, lunch ${RANGES.lunch[0]}-${RANGES.lunch[1]} kcal, dinner ${RANGES.avondeten[0]}-${RANGES.avondeten[1]} kcal).`,
      "Do one big shop a week with the list. Frozen vegetables, frozen fruit and frozen fish are handy to keep at home.",
      "Set aside an hour on Sunday for meal prep. It saves a lot of time during the week.",
      "Mainly drink water, tea or coffee without sugar.",
      "Eating out or going to a party? Don't skip meals to save up, just pick up the menu again the next day.",
    ],
    planTitle: "A weekly menu based on your calorie and protein targets",
    planText:
      "This weekly menu is an example. In your personal nutrition plan, we work out your own calorie and protein targets and you get a weekly menu with recipes, amounts and a complete shopping list matched to them, taking into account what you like, whether you're vegetarian and any allergies.",
    planCta: "Create my personal plan",
    faq: [
      {
        q: "What is a healthy weekly menu for weight loss?",
        a: "A week with 3 meals and 1 or 2 snacks a day, with enough protein, plenty of vegetables, wholegrain products and fruit, and a total number of calories slightly below your needs. This example menu shows what that can look like.",
      },
      {
        q: "How many calories should a weekly menu have per day?",
        a: `That differs per person. This example is between ${formatNumber(KCAL_MIN, 0, "en")} and ${formatNumber(KCAL_MAX, 0, "en")} kcal a day, which suits many women who are losing weight. Men and people who are very active usually need more. Work out your own calorie needs and adjust the portions.`,
      },
      {
        q: "Can I swap meals around?",
        a: "Yes. Swap a breakfast for another breakfast, a lunch for another lunch and so on; the calories per meal are close together. You can also swap two days. With meal prep, do keep to the 2 days in the fridge.",
      },
      {
        q: "Is this weekly menu suitable for vegetarians?",
        a: `Not entirely: ${VEG_DINNERS} of the 7 dinners are vegetarian. Replace the other dishes with vegetarian recipes from the site, such as the lentil bolognese, the tofu curry or the shakshuka, or swap chicken for tofu or pulses.`,
      },
      {
        q: "Why do some meals appear twice?",
        a: "Because it saves time. For example, you cook 4 portions of chilli or curry in one go, eat them within 2 days and freeze the rest. That way, you don't have to cook every day.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

export default async function GezondWeekmenuPage() {
  const l = await getLocale();
  const c = copy[l];
  const num = (x: number) => formatNumber(x, x % 1 === 0 ? 0 : 1, l);
  const pantryItems = pantry(l);
  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short} />
      <ArticleBody>
        <Section title={c.buildTitle} bullets={c.buildBullets} />

        <Section title={c.weekTitle} paragraphs={[c.weekIntro]}>
          <div className="space-y-6">
            {DAYS.map((d) => (
              <article key={d.day.nl} className="card p-5 sm:p-6">
                <h3 className="text-xl font-extrabold tracking-tight">{d.day[l]}</h3>
                <ul className="mt-3 divide-y divide-line">
                  {d.items.map((x, idx) => (
                    <li key={`${x.moment}-${idx}`} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                      <span>
                        <span className="block text-xs font-bold tracking-wide text-muted uppercase">{c.moments[x.moment]}</span>
                        {x.recipe ? (
                          <Link href={recipeHref(x.recipe)} className="font-semibold text-brand-700 underline">
                            {x.recipe.title[l]}
                          </Link>
                        ) : x.snack ? (
                          <span className="font-semibold">{SNACKS[x.snack].name[l]}</span>
                        ) : null}
                      </span>
                      <span className="text-sm whitespace-nowrap text-muted tabular-nums">{c.itemLine(num(x.nutrition.kcal), num(x.nutrition.protein))}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 flex flex-wrap justify-between gap-x-4 rounded-2xl bg-brand-50 px-3 py-2 font-extrabold">
                  <span>{c.total}</span>
                  <span className="tabular-nums">{c.itemLine(num(d.total.kcal), num(d.total.protein))}</span>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  <span className="font-bold text-ink">{c.tip}:</span> {d.tip[l]}
                </p>
              </article>
            ))}
          </div>
        </Section>

        <Section title={c.summaryTitle}>
          <DataTable
            head={c.summaryHead}
            rows={[
              ...DAYS.map((d) => [d.day[l], `${formatNumber(d.total.kcal, 0, l)} kcal`, `${num(d.total.protein)} g`]),
              [c.average, `${formatNumber(KCAL_AVG, 0, l)} kcal`, `${PROTEIN_AVG} g`],
            ]}
            note={c.summaryNote}
            minWidth="20rem"
          />
        </Section>

        <Section title={c.shoppingTitle} paragraphs={[c.shoppingIntro]}>
          <div className="grid gap-4 sm:grid-cols-2">
            {GROUPS.map((group) => {
              const items = group.foods.filter((k) => SHOPPING.has(k));
              if (items.length === 0) return null;
              return (
                <div key={group.title.nl} className="card p-5">
                  <h3 className="text-lg font-extrabold">{group.title[l]}</h3>
                  <ul className="mt-2 space-y-1.5">
                    {items.map((k) => {
                      const a = shoppingAmount(k, SHOPPING.get(k) ?? 0, l);
                      return (
                        <li key={k} className="flex justify-between gap-3">
                          <span>{foods[k].name[l]}</span>
                          <span className="text-right whitespace-nowrap tabular-nums">
                            <span className="font-semibold">{a.main}</span>
                            {a.sub && <span className="block text-xs text-muted">{a.sub}</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
            {pantryItems.length > 0 && (
              <div className="card p-5 sm:col-span-2">
                <h3 className="text-lg font-extrabold">{c.pantryTitle}</h3>
                <p className="mt-2 leading-relaxed text-muted">{pantryItems.join(", ")}</p>
              </div>
            )}
          </div>
        </Section>

        <Section title={c.adjustTitle} paragraphs={c.adjust}>
          <div className="flex flex-col gap-2">
            <ArrowLink href="/caloriebehoefte-berekenen">{c.calcLink}</ArrowLink>
            <ArrowLink href="/voedingsschema">{c.planLink}</ArrowLink>
          </div>
        </Section>

        <Section title={c.tipsTitle} bullets={c.tips} />

        <PlanBox title={c.planTitle} text={c.planText} href="/voedingsschema" cta={c.planCta} />
        <RelatedPages l={l} paths={["/recepten", "/meal-prep", "/caloriebehoefte-berekenen", "/gezonde-snacks"]} />
      </ArticleBody>
      <FaqAndClose l={l} items={c.faq} />
    </>
  );
}

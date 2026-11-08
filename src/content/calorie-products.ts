import { foods, nutrientsFor, roundNutrients, sumNutrients, type FoodKey, type Nutrients } from "@/content/nutrition";
import { intlLocale, type Locale } from "@/i18n/config";

/**
 * De pagina's "calorieën per product" (/calorieen/<slug>) en de groepen van de
 * calorietabel (/calorieen). Alle getallen komen uit src/content/nutrition.ts:
 * teksten met getallen zijn functies die de waarden via `CalorieContext`
 * opvragen, zodat tabel, kort antwoord en FAQ altijd hetzelfde zeggen.
 */

type L<T> = Record<Locale, T>;

/** Opgemaakte voedingswaarden ("1,5" / "1.5"). */
export interface Values {
  kcal: string;
  protein: string;
  carbs: string;
  sugars: string;
  fat: string;
  fiber: string;
}

/** Een portie uit nutrition.ts, afgerond met roundNutrients en opgemaakt. */
export interface PortionValues extends Values {
  label: string;
  /** "120 g" of "250 ml". */
  amount: string;
  /** De hoeveelheid als getal (gram of ml). */
  grams: number;
}

/** Een product (de eerste portie) of een product met een eigen hoeveelheid. */
type Item = FoodKey | [FoodKey, number];

export interface CalorieContext {
  l: Locale;
  /** Getal in de taal van de pagina, met hooguit één decimaal. */
  n: (x: number) => string;
  /** De waarden per 100 g/ml zoals in nutrition.ts (niet extra afgerond). */
  per100: (key: FoodKey) => Values;
  /** Een portie uit nutrition.ts (standaard de eerste). */
  portion: (key: FoodKey, index?: number) => PortionValues;
  /** Een eigen hoeveelheid van één product, afgerond. */
  at: (key: FoodKey, amount: number) => Values;
  /** Een combinatie van producten, opgeteld en afgerond. */
  sum: (...items: Item[]) => Values;
}

/** Tekst, of een functie die de tekst met de juiste getallen maakt. */
export type Fill = string | ((c: CalorieContext) => string);

export function fill(text: Fill, c: CalorieContext): string {
  return typeof text === "string" ? text : text(c);
}

export function calorieContext(l: Locale): CalorieContext {
  const fmt = new Intl.NumberFormat(intlLocale(l), { maximumFractionDigits: 1 });
  const n = (x: number) => fmt.format(x);
  const values = (v: Nutrients): Values => ({
    kcal: n(v.kcal),
    protein: n(v.protein),
    carbs: n(v.carbs),
    sugars: n(v.sugars ?? 0),
    fat: n(v.fat),
    fiber: n(v.fiber),
  });
  const portionOf = (key: FoodKey, index = 0) => {
    const list = foods[key].portions;
    return list[Math.min(index, list.length - 1)];
  };
  const amountOf = (item: Item): [FoodKey, number] => (typeof item === "string" ? [item, portionOf(item).amount] : item);
  return {
    l,
    n,
    per100: (key) => values(foods[key].per100 as Nutrients),
    portion: (key, index = 0) => {
      const p = portionOf(key, index);
      return { ...values(roundNutrients(nutrientsFor(key, p.amount))), label: p.label[l], amount: `${n(p.amount)} ${foods[key].unit}`, grams: p.amount };
    },
    at: (key, amount) => values(roundNutrients(nutrientsFor(key, amount))),
    sum: (...items) => values(roundNutrients(sumNutrients(items.map(amountOf)))),
  };
}

export interface CalorieSection {
  title: string;
  paragraphs?: Fill[];
  bullets?: Fill[];
}

export interface CalorieFaq {
  q: string;
  a: Fill;
}

export interface CalorieProduct {
  slug: string;
  /** Het hoofdproduct eerst; de andere zijn varianten (bijv. gekookt, alcoholvrij). */
  foods: FoodKey[];
  /** Belangrijkste Nederlandse zoekwoord. */
  keyword: string;
  /** Korte linktekst, bijv. "Calorieën banaan". */
  label: L<string>;
  /** De H1, zoekwoord vooraan. Het deel na de eerste ":" of "?" krijgt de accentkleur. */
  title: L<string>;
  /** Max. 60 tekens. */
  metaTitle: L<string>;
  /** 120 tot 160 tekens. */
  metaDescription: L<Fill>;
  intro: L<string>;
  /** Kort antwoord bovenaan (met getallen). */
  short: L<Fill>;
  /** H2 boven de tabel met voedingswaarden. */
  tableTitle: L<string>;
  /** H2 boven de vergelijkingstabel. */
  compareTitle: L<string>;
  /** Extra H2-secties onder de voedingswaarden. */
  sections: L<CalorieSection[]>;
  /** De sectie "Past … in een afvalschema?". */
  fit: L<CalorieSection>;
  faq: L<CalorieFaq[]>;
  /** 3 tot 4 vergelijkbare producten voor de vergelijkingstabel. */
  comparisons: FoodKey[];
}

/** Gangbare zinnen die op meer pagina's terugkomen. */
const shared = {
  fruitPerDay: {
    nl: "Daar is geen vaste grens voor. Het Voedingscentrum adviseert 2 porties fruit per dag. Wissel bij voorkeur af met ander fruit, zodat je verschillende vitamines en vezels binnenkrijgt.",
    en: "There's no fixed limit. The Netherlands Nutrition Centre recommends 2 portions of fruit a day. Ideally, vary with other fruit so you get a range of vitamins and fibre.",
  },
  oneProduct: {
    nl: "Of je afvalt, hangt af van wat je over de hele dag en week eet en beweegt, niet van één product.",
    en: "Whether you lose weight depends on what you eat and how active you are over the whole day and week, not on one food.",
  },
  alcohol: {
    nl: [
      "Alcohol telt mee in je calorieën, maar vult niet. Daarnaast verlaagt alcohol je remmingen rond eten: na een paar drankjes pak je makkelijker chips, bitterballen of een late snack. Die extra's tellen vaak meer op dan het drankje zelf.",
      "Het advies van de Gezondheidsraad is om geen alcohol te drinken, of in ieder geval niet meer dan één glas per dag.",
    ],
    en: [
      "Alcohol counts towards your calories, but it doesn't fill you up. Alcohol also lowers your inhibitions around food: after a few drinks, it's easier to reach for crisps, bar snacks or a late-night bite. Those extras often add up to more than the drink itself.",
      "The Dutch Health Council advises not drinking alcohol, or at least no more than one glass a day.",
    ],
  },
};

export const calorieProducts: CalorieProduct[] = [
  // ───────────────────────────── Banaan
  {
    slug: "banaan",
    foods: ["banaan"],
    keyword: "calorieën banaan",
    label: { nl: "Calorieën banaan", en: "Calories in a banana" },
    title: { nl: "Calorieën banaan: hoeveel kcal zit er in een banaan?", en: "Calories in a banana: how many kcal does a banana have?" },
    metaTitle: { nl: "Calorieën banaan: hoeveel kcal zit er in een banaan?", en: "Calories in a banana: kcal, carbs and sugar" },
    metaDescription: {
      nl: (c) => {
        const b = c.portion("banaan");
        return `Een banaan (± ${b.amount}) bevat ± ${b.kcal} kcal, ${b.carbs} g koolhydraten en ${b.protein} g eiwit. Met de voedingswaarde per 100 g en tips om hem slim te combineren.`;
      },
      en: (c) => {
        const b = c.portion("banaan");
        return `A banana (± ${b.amount}) contains ± ${b.kcal} kcal, ${b.carbs} g of carbs and ${b.protein} g of protein. With nutrition per 100 g and tips for smart combinations.`;
      },
    },
    intro: {
      nl: "Een banaan is makkelijk mee te nemen, zoet en vult redelijk. Maar hoeveel calorieën zitten erin, en past een banaan als je wilt afvallen? Hier vind je de voedingswaarde per stuk en per 100 gram.",
      en: "A banana is easy to take with you, sweet and fairly filling. But how many calories does it have, and does it fit when you want to lose weight? Here you'll find the nutritional values per banana and per 100 grams.",
    },
    short: {
      nl: (c) => {
        const b = c.portion("banaan");
        return `Een banaan (± ${b.amount} zonder schil) bevat ± ${b.kcal} kcal en ${b.protein} g eiwit. De meeste calorieën komen uit koolhydraten: ${b.carbs} g, waarvan ${b.sugars} g natuurlijke suikers, plus ${b.fiber} g vezels. Per 100 gram is dat ${c.per100("banaan").kcal} kcal.`;
      },
      en: (c) => {
        const b = c.portion("banaan");
        return `A banana (± ${b.amount} peeled) contains ± ${b.kcal} kcal and ${b.protein} g of protein. Most of the calories come from carbohydrates: ${b.carbs} g, of which ${b.sugars} g are natural sugars, plus ${b.fiber} g of fibre. Per 100 grams, that's ${c.per100("banaan").kcal} kcal.`;
      },
    },
    tableTitle: { nl: "Voedingswaarde banaan per 100 gram en per stuk", en: "Banana nutrition per 100 grams and per banana" },
    compareTitle: { nl: "Banaan vergeleken met ander fruit", en: "Bananas compared with other fruit" },
    sections: {
      nl: [
        {
          title: "Hoeveel calorieën heeft een kleine of grote banaan?",
          paragraphs: ["Bananen verschillen nogal in grootte. Gewogen zonder schil kun je het zo inschatten:"],
          bullets: [
            (c) => `Kleine banaan (± 90 g): ± ${c.at("banaan", 90).kcal} kcal`,
            (c) => `Middelgrote banaan (± ${c.portion("banaan").amount}): ± ${c.portion("banaan").kcal} kcal`,
            (c) => `Grote banaan (± 150 g): ± ${c.at("banaan", 150).kcal} kcal`,
          ],
        },
        {
          title: "Rijpe of groene banaan: is er verschil?",
          paragraphs: [
            "In calorieën scheelt het weinig. Wel verandert de samenstelling: een groene banaan bevat nog veel zetmeel, dat tijdens het rijpen grotendeels omzet in suiker. Daardoor smaakt een rijpe banaan zoeter. De waarden op deze pagina gaan uit van een gewone, gele banaan.",
          ],
        },
      ],
      en: [
        {
          title: "How many calories in a small or large banana?",
          paragraphs: ["Bananas vary quite a bit in size. Weighed without the skin, you can estimate it like this:"],
          bullets: [
            (c) => `Small banana (± 90 g): ± ${c.at("banaan", 90).kcal} kcal`,
            (c) => `Medium banana (± ${c.portion("banaan").amount}): ± ${c.portion("banaan").kcal} kcal`,
            (c) => `Large banana (± 150 g): ± ${c.at("banaan", 150).kcal} kcal`,
          ],
        },
        {
          title: "Ripe or green banana: is there a difference?",
          paragraphs: [
            "In calories, there's little difference. The make-up does change: a green banana still contains a lot of starch, most of which turns into sugar as it ripens. That's why a ripe banana tastes sweeter. The values on this page are for an ordinary yellow banana.",
          ],
        },
      ],
    },
    fit: {
      nl: {
        title: "Past een banaan in een afvalschema?",
        paragraphs: [
          "Ja. Als je afvalt, is geen enkel product verboden: het gaat om wat je over de hele dag binnenkrijgt. Een banaan is een handig tussendoortje met vezels, en je hebt er geen voorbereiding voor nodig.",
          "Een banaan bevat vooral koolhydraten en weinig eiwit. Combineer hem daarom met iets eiwitrijks; dan zit je meestal langer vol.",
        ],
        bullets: [
          (c) => {
            const s = c.sum("banaan", ["kwarkMager", c.portion("kwarkMager", 1).grams]);
            return `Banaan met een schaaltje magere kwark (${c.portion("kwarkMager", 1).amount}): samen ± ${s.kcal} kcal en ${s.protein} g eiwit.`;
          },
          "Snijd een halve banaan door je havermout of kwark, in plaats van suiker of honing.",
          "Neem een banaan mee als snelle energie voor of na het sporten.",
          "Bevroren stukjes banaan, gepureerd, zijn een simpel alternatief voor ijs.",
        ],
      },
      en: {
        title: "Does a banana fit into a weight-loss plan?",
        paragraphs: [
          "Yes. When you're losing weight, no food is off limits: what matters is what you eat over the whole day. A banana is a handy snack with fibre, and it needs no preparation.",
          "A banana is mainly carbohydrate with little protein. So combine it with something high in protein; you'll usually stay full for longer.",
        ],
        bullets: [
          (c) => {
            const s = c.sum("banaan", ["kwarkMager", c.portion("kwarkMager", 1).grams]);
            return `Banana with a bowl of low-fat quark (${c.portion("kwarkMager", 1).amount}): ± ${s.kcal} kcal and ${s.protein} g of protein together.`;
          },
          "Slice half a banana into your porridge or quark instead of sugar or honey.",
          "Take a banana with you as quick energy before or after exercise.",
          "Frozen banana pieces, blended, make a simple alternative to ice cream.",
        ],
      },
    },
    faq: {
      nl: [
        {
          q: "Hoeveel calorieën zitten er in een banaan?",
          a: (c) =>
            `Een middelgrote banaan van ± ${c.portion("banaan").amount} zonder schil bevat ± ${c.portion("banaan").kcal} kcal. Per 100 gram is dat ${c.per100("banaan").kcal} kcal. Een kleine banaan zit eronder, een grote erboven.`,
        },
        {
          q: "Is een banaan dikmakend?",
          a: (c) =>
            `Nee, één product maakt je niet dik. Je komt aan als je langere tijd meer calorieën binnenkrijgt dan je verbruikt. Met ± ${c.portion("banaan").kcal} kcal past een banaan prima in een gezond eetpatroon, ook als je afvalt.`,
        },
        {
          q: "Hoeveel suiker zit er in een banaan?",
          a: (c) =>
            `Een banaan van ± ${c.portion("banaan").amount} bevat ± ${c.portion("banaan").sugars} g suikers. Dat zijn natuurlijke suikers uit het fruit, samen met vezels. Het advies om minder suiker te eten gaat vooral over toegevoegde suikers, zoals in frisdrank, koek en snoep.`,
        },
        { q: "Hoeveel bananen per dag mag je eten?", a: `${shared.fruitPerDay.nl} Een banaan telt als één portie.` },
      ],
      en: [
        {
          q: "How many calories are in a banana?",
          a: (c) =>
            `A medium banana of ± ${c.portion("banaan").amount} without the skin contains ± ${c.portion("banaan").kcal} kcal. Per 100 grams, that's ${c.per100("banaan").kcal} kcal. A small banana has less, a large one more.`,
        },
        {
          q: "Are bananas fattening?",
          a: (c) =>
            `No, no single food makes you gain weight. You gain weight when you take in more calories than you use over a longer period. At ± ${c.portion("banaan").kcal} kcal, a banana fits well into a healthy diet, also when you're losing weight.`,
        },
        {
          q: "How much sugar is in a banana?",
          a: (c) =>
            `A banana of ± ${c.portion("banaan").amount} contains ± ${c.portion("banaan").sugars} g of sugars. These are natural sugars from the fruit, along with fibre. The advice to eat less sugar is mainly about added sugars, such as in soft drinks, biscuits and sweets.`,
        },
        { q: "How many bananas can you eat a day?", a: `${shared.fruitPerDay.en} One banana counts as one portion.` },
      ],
    },
    comparisons: ["appel", "mandarijn", "kiwi", "druiven"],
  },

  // ───────────────────────────── Ei
  {
    slug: "ei",
    foods: ["ei"],
    keyword: "hoeveel calorieën in een ei",
    label: { nl: "Calorieën ei", en: "Calories in an egg" },
    title: { nl: "Hoeveel calorieën in een ei? Gekookt, gebakken en per 100 gram", en: "How many calories in an egg? Boiled, fried and per 100 grams" },
    metaTitle: { nl: "Hoeveel calorieën in een ei? Gekookt en gebakken", en: "How many calories in an egg? Boiled and fried" },
    metaDescription: {
      nl: (c) => {
        const e = c.portion("ei");
        return `Een ei (± ${e.amount}) bevat ± ${e.kcal} kcal en ${e.protein} g eiwit. Zie de calorieën van een gekookt ei, gebakken ei en roerei, plus de voedingswaarde per 100 gram.`;
      },
      en: (c) => {
        const e = c.portion("ei");
        return `An egg (± ${e.amount}) contains ± ${e.kcal} kcal and ${e.protein} g of protein. See the calories in boiled eggs, fried eggs and scrambled eggs, plus nutrition per 100 g.`;
      },
    },
    intro: {
      nl: "Eieren zijn goedkoop, snel klaar en zitten vol eiwit. Hoeveel calorieën een ei heeft, hangt vooral af van hoe je het klaarmaakt. Hier vind je de calorieën per ei, gekookt en gebakken, en per 100 gram.",
      en: "Eggs are cheap, quick to cook and full of protein. How many calories an egg has depends mainly on how you cook it. Here you'll find the calories per egg, boiled and fried, and per 100 grams.",
    },
    short: {
      nl: (c) => {
        const e = c.portion("ei");
        return `Een ei (± ${e.amount} zonder schaal) bevat ± ${e.kcal} kcal, ${e.protein} g eiwit en ${e.fat} g vet, en vrijwel geen koolhydraten. Een gekookt ei heeft evenveel calorieën als een rauw ei. Bak je het in een theelepel olie, dan komt er ± ${c.at("olijfolie", 5).kcal} kcal bij.`;
      },
      en: (c) => {
        const e = c.portion("ei");
        return `An egg (± ${e.amount} without the shell) contains ± ${e.kcal} kcal, ${e.protein} g of protein and ${e.fat} g of fat, and almost no carbohydrates. A boiled egg has as many calories as a raw egg. If you fry it in a teaspoon of oil, that adds ± ${c.at("olijfolie", 5).kcal} kcal.`;
      },
    },
    tableTitle: { nl: "Voedingswaarde ei per 100 gram en per stuk", en: "Egg nutrition per 100 grams and per egg" },
    compareTitle: { nl: "Ei vergeleken met andere eiwitrijke producten", en: "Eggs compared with other high-protein foods" },
    sections: {
      nl: [
        {
          title: "Calorieën van een gekookt ei, gebakken ei en roerei",
          paragraphs: ["Het ei zelf verandert niet van calorieën door het te koken of te bakken. Wat je erbij doet, telt wel mee:"],
          bullets: [
            (c) => `Gekookt of gepocheerd ei: ± ${c.portion("ei").kcal} kcal`,
            (c) => `Gebakken ei in 1 theelepel olie (5 g): ± ${c.sum("ei", ["olijfolie", 5]).kcal} kcal`,
            (c) => `Roerei van 2 eieren met een scheutje halfvolle melk (50 ml): ± ${c.sum(["ei", 2 * c.portion("ei").grams], ["melkHalfvol", 50]).kcal} kcal`,
            (c) => `Omelet van 3 eieren, gebakken in 1 theelepel olie: ± ${c.sum(["ei", 3 * c.portion("ei").grams], ["olijfolie", 5]).kcal} kcal`,
          ],
        },
        {
          title: "Het wit en de dooier",
          paragraphs: [
            "Het eiwit (het wit) bestaat vooral uit water en eiwit en bevat vrijwel geen vet. Het vet zit in de dooier, en daarmee ook het grootste deel van de calorieën. Gebruik je alleen het wit, dan eet je minder calorieën, maar ook minder van de vitamines uit de dooier.",
            (c) =>
              `Met ${c.portion("ei").protein} g eiwit per stuk leveren twee eieren al een flink deel van een eiwitrijk ontbijt. Hoeveel eiwit jij per dag nodig hebt, lees je op de pagina over eiwitten per dag.`,
          ],
        },
      ],
      en: [
        {
          title: "Calories in a boiled egg, fried egg and scrambled eggs",
          paragraphs: ["Boiling or frying doesn't change the calories in the egg itself. What you add does count:"],
          bullets: [
            (c) => `Boiled or poached egg: ± ${c.portion("ei").kcal} kcal`,
            (c) => `Fried egg in 1 teaspoon of oil (5 g): ± ${c.sum("ei", ["olijfolie", 5]).kcal} kcal`,
            (c) => `Scrambled eggs from 2 eggs with a splash of semi-skimmed milk (50 ml): ± ${c.sum(["ei", 2 * c.portion("ei").grams], ["melkHalfvol", 50]).kcal} kcal`,
            (c) => `Three-egg omelette, cooked in 1 teaspoon of oil: ± ${c.sum(["ei", 3 * c.portion("ei").grams], ["olijfolie", 5]).kcal} kcal`,
          ],
        },
        {
          title: "The white and the yolk",
          paragraphs: [
            "Egg white is mainly water and protein and contains almost no fat. The fat is in the yolk, and with it most of the calories. If you only use the white, you eat fewer calories, but also fewer of the vitamins from the yolk.",
            (c) =>
              `With ${c.portion("ei").protein} g of protein each, two eggs already give you a good part of a high-protein breakfast. You can read how much protein you need a day on our protein page.`,
          ],
        },
      ],
    },
    fit: {
      nl: {
        title: "Past een ei in een afvalschema?",
        paragraphs: [
          "Zeker. Eieren geven veel eiwit voor weinig calorieën, en eiwit helpt je langer vol te zitten. Ze zijn bovendien goedkoop en in een paar minuten klaar.",
          "Let vooral op wat je erbij eet en hoe je ze bakt: boter, olie, spek en wit brood tellen sneller op dan het ei zelf.",
        ],
        bullets: [
          (c) => {
            const two = c.at("ei", 2 * c.portion("ei").grams);
            return `Twee gekookte eieren als ontbijt of lunch: ± ${two.kcal} kcal en ${two.protein} g eiwit.`;
          },
          (c) => `Bak in een antiaanbakpan met een theelepel olie; elke eetlepel olie extra is ± ${c.portion("olijfolie").kcal} kcal.`,
          "Maak een omelet met veel groente, zoals spinazie, paprika, tomaat of champignons.",
          (c) => `Combineer met een snee volkoren brood (± ${c.portion("volkorenBrood").kcal} kcal) voor een vullend ontbijt.`,
        ],
      },
      en: {
        title: "Do eggs fit into a weight-loss plan?",
        paragraphs: [
          "Definitely. Eggs give you a lot of protein for few calories, and protein helps you stay full for longer. They're also cheap and ready in a few minutes.",
          "Mainly watch what you eat with them and how you fry them: butter, oil, bacon and white bread add up faster than the egg itself.",
        ],
        bullets: [
          (c) => {
            const two = c.at("ei", 2 * c.portion("ei").grams);
            return `Two boiled eggs for breakfast or lunch: ± ${two.kcal} kcal and ${two.protein} g of protein.`;
          },
          (c) => `Fry in a non-stick pan with a teaspoon of oil; every extra tablespoon of oil is ± ${c.portion("olijfolie").kcal} kcal.`,
          "Make an omelette with plenty of vegetables, such as spinach, pepper, tomato or mushrooms.",
          (c) => `Pair with a slice of wholemeal bread (± ${c.portion("volkorenBrood").kcal} kcal) for a filling breakfast.`,
        ],
      },
    },
    faq: {
      nl: [
        {
          q: "Hoeveel calorieën zitten er in een gekookt ei?",
          a: (c) =>
            `Een gekookt ei (± ${c.portion("ei").amount} zonder schaal) bevat ± ${c.portion("ei").kcal} kcal, net zoveel als een rauw ei. Door het koken komt er niets bij.`,
        },
        {
          q: "Hoeveel calorieën hebben 2 eieren?",
          a: (c) => {
            const g = 2 * c.portion("ei").grams;
            const two = c.at("ei", g);
            return `Twee eieren (± ${c.n(g)} g) bevatten samen ± ${two.kcal} kcal en ${two.protein} g eiwit. Bak je ze, tel dan de olie of boter erbij.`;
          },
        },
        {
          q: "Hoeveel eiwit zit er in een ei?",
          a: (c) =>
            `Een ei bevat ± ${c.portion("ei").protein} g eiwit; per 100 gram is dat ${c.per100("ei").protein} g. Het meeste eiwit zit in het wit, maar ook de dooier bevat eiwit.`,
        },
        {
          q: "Hoeveel eieren per dag mag je eten?",
          a: "Voor gezonde mensen is er geen harde grens. Eieren passen in een gevarieerd eetpatroon, afgewisseld met andere eiwitbronnen zoals vis, peulvruchten, kip en zuivel. Heb je een verhoogd cholesterol of twijfel je, overleg dan met je huisarts.",
        },
      ],
      en: [
        {
          q: "How many calories are in a boiled egg?",
          a: (c) =>
            `A boiled egg (± ${c.portion("ei").amount} without the shell) contains ± ${c.portion("ei").kcal} kcal, the same as a raw egg. Boiling adds nothing.`,
        },
        {
          q: "How many calories do 2 eggs have?",
          a: (c) => {
            const g = 2 * c.portion("ei").grams;
            const two = c.at("ei", g);
            return `Two eggs (± ${c.n(g)} g) contain ± ${two.kcal} kcal and ${two.protein} g of protein together. If you fry them, add the oil or butter.`;
          },
        },
        {
          q: "How much protein is in an egg?",
          a: (c) =>
            `An egg contains ± ${c.portion("ei").protein} g of protein; per 100 grams, that's ${c.per100("ei").protein} g. Most of the protein is in the white, but the yolk contains protein too.`,
        },
        {
          q: "How many eggs can you eat a day?",
          a: "For healthy people, there's no hard limit. Eggs fit into a varied diet, alternated with other protein sources such as fish, pulses, chicken and dairy. If you have high cholesterol or you're unsure, talk to your GP.",
        },
      ],
    },
    comparisons: ["kwarkMager", "kaas30", "huttenkase", "kipfiletBeleg"],
  },

  // ───────────────────────────── Appel
  {
    slug: "appel",
    foods: ["appel"],
    keyword: "calorieën appel",
    label: { nl: "Calorieën appel", en: "Calories in an apple" },
    title: { nl: "Calorieën appel: hoeveel kcal zit er in een appel?", en: "Calories in an apple: how many kcal does an apple have?" },
    metaTitle: { nl: "Calorieën appel: hoeveel kcal zit er in een appel?", en: "Calories in an apple: kcal, carbs and fibre" },
    metaDescription: {
      nl: (c) => {
        const a = c.portion("appel");
        return `Een appel (± ${a.amount}) bevat ± ${a.kcal} kcal en ${a.fiber} g vezels. Bekijk de calorieën van een kleine en grote appel, de voedingswaarde per 100 g en slimme combinaties.`;
      },
      en: (c) => {
        const a = c.portion("appel");
        return `An apple (± ${a.amount}) contains ± ${a.kcal} kcal and ${a.fiber} g of fibre. See the calories in a small and a large apple, nutrition per 100 g and smart combinations.`;
      },
    },
    intro: {
      nl: "Een appel is misschien wel het bekendste tussendoortje van Nederland. Hoeveel calorieën zitten erin, en hoe past een appel als je wilt afvallen? Hier vind je de voedingswaarde per stuk en per 100 gram.",
      en: "An apple is perhaps the best-known snack there is. How many calories does it have, and how does an apple fit when you want to lose weight? Here you'll find the nutritional values per apple and per 100 grams.",
    },
    short: {
      nl: (c) => {
        const a = c.portion("appel");
        return `Een appel (± ${a.amount}) bevat ± ${a.kcal} kcal, ${a.carbs} g koolhydraten (waarvan ${a.sugars} g natuurlijke suikers) en ${a.fiber} g vezels. Eiwit en vet zitten er nauwelijks in. Per 100 gram is dat ${c.per100("appel").kcal} kcal.`;
      },
      en: (c) => {
        const a = c.portion("appel");
        return `An apple (± ${a.amount}) contains ± ${a.kcal} kcal, ${a.carbs} g of carbohydrates (of which ${a.sugars} g natural sugars) and ${a.fiber} g of fibre. It has hardly any protein or fat. Per 100 grams, that's ${c.per100("appel").kcal} kcal.`;
      },
    },
    tableTitle: { nl: "Voedingswaarde appel per 100 gram en per stuk", en: "Apple nutrition per 100 grams and per apple" },
    compareTitle: { nl: "Appel vergeleken met ander fruit", en: "Apples compared with other fruit" },
    sections: {
      nl: [
        {
          title: "Calorieën van een kleine, middelgrote en grote appel",
          paragraphs: ["Appels verschillen flink in grootte. Met deze richtwaarden kun je het inschatten:"],
          bullets: [
            (c) => `Kleine appel (± 100 g): ± ${c.at("appel", 100).kcal} kcal`,
            (c) => `Middelgrote appel (± ${c.portion("appel").amount}): ± ${c.portion("appel").kcal} kcal`,
            (c) => `Grote appel (± 200 g): ± ${c.at("appel", 200).kcal} kcal`,
          ],
        },
        {
          title: "Met of zonder schil?",
          paragraphs: ["In calorieën scheelt het nauwelijks. Een flink deel van de vezels zit wel in en vlak onder de schil. Was de appel goed en eet de schil gewoon mee."],
        },
      ],
      en: [
        {
          title: "Calories in a small, medium and large apple",
          paragraphs: ["Apples vary a lot in size. You can estimate it with these guide values:"],
          bullets: [
            (c) => `Small apple (± 100 g): ± ${c.at("appel", 100).kcal} kcal`,
            (c) => `Medium apple (± ${c.portion("appel").amount}): ± ${c.portion("appel").kcal} kcal`,
            (c) => `Large apple (± 200 g): ± ${c.at("appel", 200).kcal} kcal`,
          ],
        },
        {
          title: "With or without the skin?",
          paragraphs: ["In calories, it makes hardly any difference. A good part of the fibre is in and just under the skin, though. Wash the apple well and simply eat the skin too."],
        },
      ],
    },
    fit: {
      nl: {
        title: "Past een appel in een afvalschema?",
        paragraphs: [
          "Ja, een appel is een prima tussendoortje: weinig calorieën, en je bent er even mee bezig. De vezels helpen om je een vol gevoel te geven.",
          "Appelsap is iets anders: daarin zitten de suikers wel, maar de vezels grotendeels niet, en een glas drink je zo weg.",
        ],
        bullets: [
          (c) => `Appel met een dun laagje pindakaas (${c.portion("pindakaas").amount}): samen ± ${c.sum("appel", "pindakaas").kcal} kcal.`,
          (c) => `Appel met een handje amandelen (${c.portion("amandelen").amount}): samen ± ${c.sum("appel", "amandelen").kcal} kcal, met wat eiwit en vet om langer vol te zitten.`,
          "In blokjes door je kwark, skyr of havermout, met wat kaneel.",
          "Neem er een mee voor onderweg, in plaats van een koek uit de automaat.",
        ],
      },
      en: {
        title: "Does an apple fit into a weight-loss plan?",
        paragraphs: [
          "Yes, an apple is a great snack: few calories, and it takes a while to eat. The fibre helps you feel full.",
          "Apple juice is a different story: it has the sugars, but mostly not the fibre, and you drink a glass in no time.",
        ],
        bullets: [
          (c) => `Apple with a thin layer of peanut butter (${c.portion("pindakaas").amount}): ± ${c.sum("appel", "pindakaas").kcal} kcal together.`,
          (c) => `Apple with a handful of almonds (${c.portion("amandelen").amount}): ± ${c.sum("appel", "amandelen").kcal} kcal together, with some protein and fat to keep you full for longer.`,
          "Diced into your quark, skyr or porridge, with a little cinnamon.",
          "Take one with you when you're out, instead of a biscuit from the vending machine.",
        ],
      },
    },
    faq: {
      nl: [
        {
          q: "Hoeveel calorieën zitten er in een appel?",
          a: (c) =>
            `Een middelgrote appel van ± ${c.portion("appel").amount} bevat ± ${c.portion("appel").kcal} kcal. Per 100 gram is dat ${c.per100("appel").kcal} kcal.`,
        },
        {
          q: "Hoeveel suiker zit er in een appel?",
          a: (c) =>
            `Een appel van ± ${c.portion("appel").amount} bevat ± ${c.portion("appel").sugars} g suikers. Dat zijn natuurlijke suikers, samen met vezels. Het advies om minder suiker te eten gaat vooral over toegevoegde suikers.`,
        },
        { q: "Is een appel goed als je wilt afvallen?", a: `Een appel past goed in een afvalschema: weinig calorieën en veel volume. ${shared.oneProduct.nl}` },
        { q: "Hoeveel appels per dag mag je eten?", a: `${shared.fruitPerDay.nl} Een appel telt als één portie.` },
      ],
      en: [
        {
          q: "How many calories are in an apple?",
          a: (c) => `A medium apple of ± ${c.portion("appel").amount} contains ± ${c.portion("appel").kcal} kcal. Per 100 grams, that's ${c.per100("appel").kcal} kcal.`,
        },
        {
          q: "How much sugar is in an apple?",
          a: (c) =>
            `An apple of ± ${c.portion("appel").amount} contains ± ${c.portion("appel").sugars} g of sugars. These are natural sugars, along with fibre. The advice to eat less sugar is mainly about added sugars.`,
        },
        { q: "Are apples good for weight loss?", a: `An apple fits well into a weight-loss plan: few calories and plenty of volume. ${shared.oneProduct.en}` },
        { q: "How many apples can you eat a day?", a: `${shared.fruitPerDay.en} One apple counts as one portion.` },
      ],
    },
    comparisons: ["banaan", "peer", "sinaasappel", "mandarijn"],
  },

  // ───────────────────────────── Bier
  {
    slug: "bier",
    foods: ["bier", "bier00"],
    keyword: "calorieën bier",
    label: { nl: "Calorieën bier", en: "Calories in beer" },
    title: { nl: "Calorieën bier: hoeveel kcal zit er in een biertje?", en: "Calories in beer: how many kcal are in a beer?" },
    metaTitle: { nl: "Calorieën bier: per glas, flesje en alcoholvrij", en: "Calories in beer: per glass, bottle and alcohol-free" },
    metaDescription: {
      nl: (c) =>
        `Een glas pils bevat ± ${c.portion("bier").kcal} kcal, een flesje ± ${c.portion("bier", 1).kcal} kcal en alcoholvrij bier ± ${c.portion("bier00").kcal} kcal. Zie de voedingswaarde per 100 ml en waar de calorieën vandaan komen.`,
      en: (c) =>
        `A glass of lager has ± ${c.portion("bier").kcal} kcal, a bottle ± ${c.portion("bier", 1).kcal} kcal and alcohol-free beer ± ${c.portion("bier00").kcal} kcal. See nutrition per 100 ml and where the calories come from.`,
    },
    intro: {
      nl: "Een biertje op een verjaardag, op het terras of na het sporten: hoeveel calorieën drink je daarmee? Hier zie je de calorieën van gewone pils en alcoholvrij bier, per glas en per 100 ml.",
      en: "A beer at a party, in a beer garden or after sport: how many calories are you drinking? Here you'll find the calories in regular lager and alcohol-free beer, per glass and per 100 ml.",
    },
    short: {
      nl: (c) => {
        const g = c.portion("bier");
        const f = c.portion("bier", 1);
        const z = c.portion("bier00");
        return `Een glas pils (${g.amount}) bevat ± ${g.kcal} kcal, een flesje (${f.amount}) ± ${f.kcal} kcal. Alcoholvrij bier (0.0) zit op ± ${z.kcal} kcal per glas. Bij gewoon bier komt het grootste deel van de calorieën uit de alcohol zelf, niet uit suiker.`;
      },
      en: (c) => {
        const g = c.portion("bier");
        const f = c.portion("bier", 1);
        const z = c.portion("bier00");
        return `A glass of lager (${g.amount}) contains ± ${g.kcal} kcal, a bottle (${f.amount}) ± ${f.kcal} kcal. Alcohol-free beer (0.0) comes to ± ${z.kcal} kcal per glass. In regular beer, most of the calories come from the alcohol itself, not from sugar.`;
      },
    },
    tableTitle: { nl: "Voedingswaarde bier per 100 ml en per glas", en: "Beer nutrition per 100 ml and per glass" },
    compareTitle: { nl: "Bier vergeleken met andere drankjes", en: "Beer compared with other drinks" },
    sections: {
      nl: [
        {
          title: "Waar komen de calorieën in bier vandaan?",
          paragraphs: [
            "Alcohol levert 7 kcal per gram: bijna net zoveel als vet (9 kcal) en bijna twee keer zoveel als koolhydraten of eiwit (4 kcal). In gewone pils van 5% komt daardoor het grootste deel van de calorieën uit de alcohol; de rest komt uit koolhydraten uit het graan.",
            (c) => {
              const z = c.portion("bier00");
              return `Alcoholvrij bier heeft geen calorieën uit alcohol, maar wel wat meer koolhydraten: ± ${z.carbs} g per glas, waarvan ${z.sugars} g suikers. Daardoor heeft een glas 0.0 nog steeds ± ${z.kcal} kcal.`;
            },
            "Speciaalbier, zoals tripel, IPA of bokbier, heeft vaak een hoger alcoholpercentage en daardoor meer calorieën per glas dan pils. Kijk voor de precieze waarden op het etiket.",
          ],
        },
        { title: "Alcohol en afvallen", paragraphs: shared.alcohol.nl },
      ],
      en: [
        {
          title: "Where do the calories in beer come from?",
          paragraphs: [
            "Alcohol provides 7 kcal per gram: almost as much as fat (9 kcal) and almost twice as much as carbohydrates or protein (4 kcal). In regular 5% lager, most of the calories therefore come from the alcohol; the rest comes from carbohydrates from the grain.",
            (c) => {
              const z = c.portion("bier00");
              return `Alcohol-free beer has no calories from alcohol, but a little more carbohydrate: ± ${z.carbs} g per glass, of which ${z.sugars} g sugars. That's why a glass of 0.0 still has ± ${z.kcal} kcal.`;
            },
            "Craft and speciality beers, such as tripels, IPAs or bock, often have a higher alcohol content and therefore more calories per glass than lager. Check the label for the exact values.",
          ],
        },
        { title: "Alcohol and weight loss", paragraphs: shared.alcohol.en },
      ],
    },
    fit: {
      nl: {
        title: "Past bier in een afvalschema?",
        paragraphs: [
          "Niets is verboden, ook bier niet. Maar bier levert calorieën zonder dat je er vol van zit, dus het helpt om er bewust mee om te gaan. Plan een borrel of feestje gewoon in en houd er bij de rest van je dag rekening mee.",
        ],
        bullets: [
          (c) => `Kies vaker alcoholvrij bier: ± ${c.portion("bier00").kcal} kcal per glas in plaats van ± ${c.portion("bier").kcal} kcal.`,
          "Drink tussendoor een glas water of spa; dan drink je vanzelf minder.",
          "Spreek vooraf met jezelf af hoeveel biertjes je drinkt.",
          (c) =>
            `Let op wat je erbij eet: een handje noten (${c.portion("amandelen").amount}) is al ± ${c.portion("amandelen").kcal} kcal. Groente met hummus of een paar plakjes kipfilet zijn lichtere borrelhapjes.`,
        ],
      },
      en: {
        title: "Does beer fit into a weight-loss plan?",
        paragraphs: [
          "Nothing is off limits, beer included. But beer provides calories without filling you up, so it helps to drink it mindfully. Simply plan in a drink or a party and take it into account for the rest of your day.",
        ],
        bullets: [
          (c) => `Choose alcohol-free beer more often: ± ${c.portion("bier00").kcal} kcal per glass instead of ± ${c.portion("bier").kcal} kcal.`,
          "Have a glass of water in between; you'll naturally drink less.",
          "Decide beforehand how many beers you'll have.",
          (c) =>
            `Watch what you eat with it: a handful of nuts (${c.portion("amandelen").amount}) is already ± ${c.portion("amandelen").kcal} kcal. Vegetables with hummus or a few slices of chicken are lighter snacks.`,
        ],
      },
    },
    faq: {
      nl: [
        {
          q: "Hoeveel calorieën zitten er in een biertje?",
          a: (c) =>
            `Een glas pils (${c.portion("bier").amount}) bevat ± ${c.portion("bier").kcal} kcal, een flesje (${c.portion("bier", 1).amount}) ± ${c.portion("bier", 1).kcal} kcal. Per 100 ml is dat ${c.per100("bier").kcal} kcal. Speciaalbier heeft door het hogere alcoholpercentage meestal meer.`,
        },
        {
          q: "Hoeveel calorieën heeft alcoholvrij bier?",
          a: (c) =>
            `Alcoholvrij bier (0.0) bevat ± ${c.portion("bier00").kcal} kcal per glas van ${c.portion("bier00").amount}, ofwel ${c.per100("bier00").kcal} kcal per 100 ml. Gewone pils zit op ± ${c.portion("bier").kcal} kcal per glas. Radler en andere varianten met limonade bevatten meer suiker; kijk op het etiket.`,
        },
        {
          q: "Zit er suiker in bier?",
          a: (c) =>
            `Gewone pils bevat koolhydraten (± ${c.portion("bier").carbs} g per glas), maar weinig suiker: het meeste suiker is tijdens het brouwen omgezet in alcohol. Alcoholvrij bier bevat wat meer suikers: ± ${c.portion("bier00").sugars} g per glas.`,
        },
        {
          q: "Mag je bier drinken als je wilt afvallen?",
          a: "Ja, niets is verboden. Bier telt wel mee in je calorieën, het vult nauwelijks en alcohol maakt het lastiger om nee te zeggen tegen snacks. Hoe minder je drinkt, of hoe vaker je 0.0 kiest, hoe meer ruimte je overhoudt voor eten dat wel vult.",
        },
      ],
      en: [
        {
          q: "How many calories are in a beer?",
          a: (c) =>
            `A glass of lager (${c.portion("bier").amount}) contains ± ${c.portion("bier").kcal} kcal, a bottle (${c.portion("bier", 1).amount}) ± ${c.portion("bier", 1).kcal} kcal. Per 100 ml, that's ${c.per100("bier").kcal} kcal. Speciality beers usually have more because of their higher alcohol content.`,
        },
        {
          q: "How many calories does alcohol-free beer have?",
          a: (c) =>
            `Alcohol-free beer (0.0) contains ± ${c.portion("bier00").kcal} kcal per ${c.portion("bier00").amount} glass, or ${c.per100("bier00").kcal} kcal per 100 ml. Regular lager comes to ± ${c.portion("bier").kcal} kcal per glass. Shandy and other versions with lemonade contain more sugar; check the label.`,
        },
        {
          q: "Is there sugar in beer?",
          a: (c) =>
            `Regular lager contains carbohydrates (± ${c.portion("bier").carbs} g per glass), but little sugar: most of the sugar is turned into alcohol during brewing. Alcohol-free beer contains a little more sugar: ± ${c.portion("bier00").sugars} g per glass.`,
        },
        {
          q: "Can you drink beer when you want to lose weight?",
          a: "Yes, nothing is off limits. Beer does count towards your calories, it barely fills you up and alcohol makes it harder to say no to snacks. The less you drink, or the more often you choose 0.0, the more room you have left for food that does fill you up.",
        },
      ],
    },
    comparisons: ["wijnRood", "wijnWit", "cola", "sinaasappelsap"],
  },

  // ───────────────────────────── Mandarijn
  {
    slug: "mandarijn",
    foods: ["mandarijn"],
    keyword: "mandarijn kcal",
    label: { nl: "Mandarijn kcal", en: "Mandarin calories" },
    title: { nl: "Mandarijn kcal: hoeveel calorieën heeft een mandarijn?", en: "Mandarin calories: how many kcal are in a mandarin?" },
    metaTitle: { nl: "Mandarijn kcal: hoeveel calorieën heeft een mandarijn?", en: "Mandarin calories: kcal per mandarin and per 100 g" },
    metaDescription: {
      nl: (c) => {
        const m = c.portion("mandarijn");
        return `Een mandarijn (± ${m.amount} zonder schil) bevat ± ${m.kcal} kcal en ${m.sugars} g suikers. Bekijk de voedingswaarde per 100 g en vergelijk met sinaasappel en ander fruit.`;
      },
      en: (c) => {
        const m = c.portion("mandarijn");
        return `A mandarin (± ${m.amount} peeled) contains ± ${m.kcal} kcal and ${m.sugars} g of sugars. See the nutrition per 100 g and compare it with oranges and other fruit.`;
      },
    },
    intro: {
      nl: "Mandarijnen zijn makkelijk te pellen en in de winter overal te koop. Hoeveel kcal heeft een mandarijn, en hoeveel kun je er eten als je wilt afvallen? Hier vind je de voedingswaarde per stuk en per 100 gram.",
      en: "Mandarins are easy to peel and in the shops everywhere in winter. How many calories does a mandarin have, and how many can you eat when you want to lose weight? Here you'll find the nutritional values per mandarin and per 100 grams.",
    },
    short: {
      nl: (c) => {
        const m = c.portion("mandarijn");
        return `Een mandarijn (± ${m.amount} zonder schil) bevat ± ${m.kcal} kcal, ${m.carbs} g koolhydraten (waarvan ${m.sugars} g natuurlijke suikers) en ${m.fiber} g vezels. Per 100 gram is dat ${c.per100("mandarijn").kcal} kcal. Twee mandarijnen zijn samen ± ${c.at("mandarijn", 2 * m.grams).kcal} kcal.`;
      },
      en: (c) => {
        const m = c.portion("mandarijn");
        return `A mandarin (± ${m.amount} peeled) contains ± ${m.kcal} kcal, ${m.carbs} g of carbohydrates (of which ${m.sugars} g natural sugars) and ${m.fiber} g of fibre. Per 100 grams, that's ${c.per100("mandarijn").kcal} kcal. Two mandarins come to ± ${c.at("mandarijn", 2 * m.grams).kcal} kcal together.`;
      },
    },
    tableTitle: { nl: "Voedingswaarde mandarijn per 100 gram en per stuk", en: "Mandarin nutrition per 100 grams and per mandarin" },
    compareTitle: { nl: "Mandarijn vergeleken met ander fruit", en: "Mandarins compared with other fruit" },
    sections: {
      nl: [
        {
          title: "Mandarijn, clementine of sinaasappel?",
          paragraphs: [
            (c) =>
              `Mandarijnen, clementines en satsuma's lijken veel op elkaar en hebben ongeveer dezelfde voedingswaarde. Een sinaasappel is groter: ± ${c.portion("sinaasappel").kcal} kcal per stuk, maar per 100 gram iets minder (${c.per100("sinaasappel").kcal} kcal) dan een mandarijn.`,
            "Mandarijnen uit blik of pot liggen vaak op siroop, met toegevoegde suiker. Kies dan een variant op sap of water, of laat de siroop goed uitlekken.",
          ],
        },
      ],
      en: [
        {
          title: "Mandarin, clementine or orange?",
          paragraphs: [
            (c) =>
              `Mandarins, clementines and satsumas are very similar and have roughly the same nutritional values. An orange is bigger: ± ${c.portion("sinaasappel").kcal} kcal each, but slightly less per 100 grams (${c.per100("sinaasappel").kcal} kcal) than a mandarin.`,
            "Tinned or jarred mandarins often come in syrup, with added sugar. Choose ones in juice or water instead, or drain the syrup well.",
          ],
        },
      ],
    },
    fit: {
      nl: {
        title: "Past een mandarijn in een afvalschema?",
        paragraphs: ["Ja. Een mandarijn heeft weinig calorieën, is snel gepeld en past in elke tas. Daarmee is het een handig alternatief voor een koekje bij de koffie."],
        bullets: [
          (c) => {
            const s = c.sum(["mandarijn", 2 * c.portion("mandarijn").grams], "skyr");
            return `Twee mandarijnen met een schaaltje skyr (${c.portion("skyr").amount}): samen ± ${s.kcal} kcal en ${s.protein} g eiwit.`;
          },
          "Partjes mandarijn door een salade met sla, kip en een paar walnoten.",
          "Leg een schaal mandarijnen in het zicht; dan pak je sneller fruit dan iets uit de koektrommel.",
          "Eet de witte draadjes gewoon mee: ook daarin zitten vezels.",
        ],
      },
      en: {
        title: "Do mandarins fit into a weight-loss plan?",
        paragraphs: ["Yes. A mandarin has few calories, peels in seconds and fits in any bag. That makes it a handy alternative to a biscuit with your coffee."],
        bullets: [
          (c) => {
            const s = c.sum(["mandarijn", 2 * c.portion("mandarijn").grams], "skyr");
            return `Two mandarins with a bowl of skyr (${c.portion("skyr").amount}): ± ${s.kcal} kcal and ${s.protein} g of protein together.`;
          },
          "Mandarin segments in a salad with leaves, chicken and a few walnuts.",
          "Keep a bowl of mandarins in sight; you'll reach for fruit before the biscuit tin.",
          "Just eat the white threads too: they contain fibre as well.",
        ],
      },
    },
    faq: {
      nl: [
        {
          q: "Hoeveel kcal heeft een mandarijn?",
          a: (c) =>
            `Een mandarijn van ± ${c.portion("mandarijn").amount} zonder schil bevat ± ${c.portion("mandarijn").kcal} kcal. Per 100 gram is dat ${c.per100("mandarijn").kcal} kcal. Een grote mandarijn zit iets hoger, een kleine iets lager.`,
        },
        {
          q: "Hoeveel suiker zit er in een mandarijn?",
          a: (c) =>
            `Een mandarijn bevat ± ${c.portion("mandarijn").sugars} g natuurlijke suikers (${c.per100("mandarijn").sugars} g per 100 gram), samen met vezels. Het advies om minder suiker te eten gaat vooral over toegevoegde suikers, zoals in frisdrank en snoep.`,
        },
        { q: "Hoeveel mandarijnen per dag mag je eten?", a: `${shared.fruitPerDay.nl} Twee mandarijnen tellen ongeveer als één portie.` },
        {
          q: "Is een mandarijn gezond?",
          a: "Mandarijnen bevatten vitamine C en vezels, en weinig calorieën. Als fruit passen ze in de Schijf van Vijf. Wissel ze af met ander fruit voor een gevarieerd eetpatroon.",
        },
      ],
      en: [
        {
          q: "How many calories does a mandarin have?",
          a: (c) =>
            `A mandarin of ± ${c.portion("mandarijn").amount} without the skin contains ± ${c.portion("mandarijn").kcal} kcal. Per 100 grams, that's ${c.per100("mandarijn").kcal} kcal. A large mandarin is a little higher, a small one a little lower.`,
        },
        {
          q: "How much sugar is in a mandarin?",
          a: (c) =>
            `A mandarin contains ± ${c.portion("mandarijn").sugars} g of natural sugars (${c.per100("mandarijn").sugars} g per 100 grams), along with fibre. The advice to eat less sugar is mainly about added sugars, such as in soft drinks and sweets.`,
        },
        { q: "How many mandarins can you eat a day?", a: `${shared.fruitPerDay.en} Two mandarins count as roughly one portion.` },
        {
          q: "Are mandarins healthy?",
          a: "Mandarins contain vitamin C and fibre, and few calories. As fruit, they're part of the Dutch dietary guidelines (the Wheel of Five). Alternate them with other fruit for a varied diet.",
        },
      ],
    },
    comparisons: ["sinaasappel", "appel", "banaan", "kiwi"],
  },

  // ───────────────────────────── Watermeloen
  {
    slug: "watermeloen",
    foods: ["watermeloen"],
    keyword: "watermeloen calorieën",
    label: { nl: "Watermeloen calorieën", en: "Watermelon calories" },
    title: { nl: "Watermeloen calorieën: hoeveel kcal zit er in watermeloen?", en: "Watermelon calories: how many kcal are in watermelon?" },
    metaTitle: { nl: "Watermeloen calorieën: kcal per plak en per 100 g", en: "Watermelon calories: kcal per slice and per 100 g" },
    metaDescription: {
      nl: (c) =>
        `Watermeloen bevat ${c.per100("watermeloen").kcal} kcal per 100 gram en een flinke plak ± ${c.portion("watermeloen").kcal} kcal. Bekijk suikers en vezels, en hoe watermeloen past als je wilt afvallen.`,
      en: (c) =>
        `Watermelon contains ${c.per100("watermeloen").kcal} kcal per 100 grams and a large slice ± ${c.portion("watermeloen").kcal} kcal. See the sugars and fibre, and how watermelon fits when you want to lose weight.`,
    },
    intro: {
      nl: "Watermeloen is fris, zoet en perfect op een warme dag. Maar hoeveel calorieën zitten erin, en hoeveel suiker? Hier vind je de voedingswaarde per plak en per 100 gram.",
      en: "Watermelon is refreshing, sweet and perfect on a hot day. But how many calories does it have, and how much sugar? Here you'll find the nutritional values per slice and per 100 grams.",
    },
    short: {
      nl: (c) => {
        const p = c.portion("watermeloen");
        return `Watermeloen is een van de caloriearmste fruitsoorten: ${c.per100("watermeloen").kcal} kcal per 100 gram. Een flinke plak (± ${p.amount} zonder schil) bevat ± ${p.kcal} kcal, ${p.carbs} g koolhydraten (waarvan ${p.sugars} g suikers) en ${p.protein} g eiwit. Het grootste deel van een watermeloen is gewoon water.`;
      },
      en: (c) => {
        const p = c.portion("watermeloen");
        return `Watermelon is one of the lowest-calorie fruits: ${c.per100("watermeloen").kcal} kcal per 100 grams. A large slice (± ${p.amount} without the rind) contains ± ${p.kcal} kcal, ${p.carbs} g of carbohydrates (of which ${p.sugars} g sugars) and ${p.protein} g of protein. Most of a watermelon is simply water.`;
      },
    },
    tableTitle: { nl: "Voedingswaarde watermeloen per 100 gram en per plak", en: "Watermelon nutrition per 100 grams and per slice" },
    compareTitle: { nl: "Watermeloen vergeleken met ander fruit", en: "Watermelon compared with other fruit" },
    sections: {
      nl: [
        {
          title: "Waarom heeft watermeloen zo weinig calorieën?",
          paragraphs: [
            (c) =>
              `Watermeloen bestaat voor ruim 90 procent uit water. Daardoor eet je een grote portie voor weinig calorieën. Er zitten wel natuurlijke suikers in, maar per 100 gram minder (${c.per100("watermeloen").sugars} g) dan in bijvoorbeeld druiven (${c.per100("druiven").sugars} g) of een banaan (${c.per100("banaan").sugars} g).`,
            "Watermeloen bevat weinig vezels. Daardoor zit je er minder lang vol van dan van fruit als een appel of peer.",
          ],
        },
      ],
      en: [
        {
          title: "Why does watermelon have so few calories?",
          paragraphs: [
            (c) =>
              `Watermelon is more than 90 per cent water. That means you get a large portion for few calories. It does contain natural sugars, but less per 100 grams (${c.per100("watermeloen").sugars} g) than grapes (${c.per100("druiven").sugars} g) or a banana (${c.per100("banaan").sugars} g), for example.`,
            "Watermelon contains little fibre. As a result, it keeps you full for less time than fruit such as an apple or a pear.",
          ],
        },
      ],
    },
    fit: {
      nl: {
        title: "Past watermeloen in een afvalschema?",
        paragraphs: ["Ja, heel goed. Je krijgt een grote, frisse portie voor weinig calorieën. Combineer het met iets eiwitrijks als je er langer vol van wilt zitten."],
        bullets: [
          (c) => `Maak een zomerse salade van watermeloen met feta (${c.portion("feta").amount}) en munt: samen ± ${c.sum("watermeloen", "feta").kcal} kcal.`,
          "Vries blokjes watermeloen in als alternatief voor een ijsje op een warme dag.",
          (c) => `Eet er een schaaltje magere kwark bij (± ${c.portion("kwarkMager", 1).kcal} kcal) voor eiwit.`,
          "Snijd een hele meloen in één keer in blokjes en bewaar ze in de koelkast; dan pak je makkelijk een portie.",
        ],
      },
      en: {
        title: "Does watermelon fit into a weight-loss plan?",
        paragraphs: ["Yes, very well. You get a large, refreshing portion for few calories. Pair it with something high in protein if you want it to keep you full for longer."],
        bullets: [
          (c) => `Make a summer salad of watermelon with feta (${c.portion("feta").amount}) and mint: ± ${c.sum("watermeloen", "feta").kcal} kcal together.`,
          "Freeze watermelon cubes as an alternative to an ice lolly on a hot day.",
          (c) => `Have a bowl of low-fat quark with it (± ${c.portion("kwarkMager", 1).kcal} kcal) for protein.`,
          "Cut a whole melon into cubes in one go and keep them in the fridge; then a portion is always within reach.",
        ],
      },
    },
    faq: {
      nl: [
        {
          q: "Hoeveel calorieën zitten er in een plak watermeloen?",
          a: (c) =>
            `Een flinke plak van ± ${c.portion("watermeloen").amount} zonder schil bevat ± ${c.portion("watermeloen").kcal} kcal. Een kleinere plak van ± 100 g is ± ${c.at("watermeloen", 100).kcal} kcal.`,
        },
        {
          q: "Zit er veel suiker in watermeloen?",
          a: (c) =>
            `Per 100 gram bevat watermeloen ${c.per100("watermeloen").sugars} g natuurlijke suikers, per flinke plak ± ${c.portion("watermeloen").sugars} g. Dat is minder dan in veel ander fruit. Het advies om minder suiker te eten gaat vooral over toegevoegde suikers.`,
        },
        { q: "Is watermeloen goed om af te vallen?", a: `Watermeloen past goed in een afvalschema, omdat je veel eet voor weinig calorieën. ${shared.oneProduct.nl}` },
        { q: "Hoeveel watermeloen mag je per dag eten?", a: `${shared.fruitPerDay.nl} Een flinke plak watermeloen telt ongeveer als één portie.` },
      ],
      en: [
        {
          q: "How many calories are in a slice of watermelon?",
          a: (c) =>
            `A large slice of ± ${c.portion("watermeloen").amount} without the rind contains ± ${c.portion("watermeloen").kcal} kcal. A smaller slice of ± 100 g is ± ${c.at("watermeloen", 100).kcal} kcal.`,
        },
        {
          q: "Is there a lot of sugar in watermelon?",
          a: (c) =>
            `Watermelon contains ${c.per100("watermeloen").sugars} g of natural sugars per 100 grams, and ± ${c.portion("watermeloen").sugars} g per large slice. That's less than many other fruits. The advice to eat less sugar is mainly about added sugars.`,
        },
        { q: "Is watermelon good for weight loss?", a: `Watermelon fits well into a weight-loss plan, because you eat a lot for few calories. ${shared.oneProduct.en}` },
        { q: "How much watermelon can you eat a day?", a: `${shared.fruitPerDay.en} A large slice of watermelon counts as roughly one portion.` },
      ],
    },
    comparisons: ["aardbeien", "druiven", "appel", "banaan"],
  },

  // ───────────────────────────── Avocado
  {
    slug: "avocado",
    foods: ["avocado"],
    keyword: "hoeveel calorieën avocado",
    label: { nl: "Calorieën avocado", en: "Calories in an avocado" },
    title: { nl: "Hoeveel calorieën heeft een avocado? Per halve en hele avocado", en: "How many calories in an avocado? Per half and whole avocado" },
    metaTitle: { nl: "Hoeveel calorieën heeft een avocado? Half en heel", en: "How many calories in an avocado? Half and whole" },
    metaDescription: {
      nl: (c) =>
        `Een halve avocado bevat ± ${c.portion("avocado").kcal} kcal, een hele ± ${c.at("avocado", 2 * c.portion("avocado").grams).kcal} kcal. Bekijk de voedingswaarde per 100 g, waar de calorieën vandaan komen en slimme porties.`,
      en: (c) =>
        `Half an avocado contains ± ${c.portion("avocado").kcal} kcal, a whole one ± ${c.at("avocado", 2 * c.portion("avocado").grams).kcal} kcal. See the nutrition per 100 g, where the calories come from and sensible portions.`,
    },
    intro: {
      nl: "Avocado op brood, in een salade of als guacamole: hij is populair, maar staat bekend als calorierijk. Hoeveel calorieën heeft een avocado echt? Hier vind je de voedingswaarde per halve en hele avocado en per 100 gram.",
      en: "Avocado on toast, in a salad or as guacamole: it's popular, but known for being high in calories. How many calories does an avocado really have? Here you'll find the nutritional values per half and whole avocado and per 100 grams.",
    },
    short: {
      nl: (c) => {
        const half = c.portion("avocado");
        const g = 2 * half.grams;
        const h = c.per100("avocado");
        return `Een halve avocado (± ${half.amount}) bevat ± ${half.kcal} kcal, een hele avocado (± ${c.n(g)} g) ± ${c.at("avocado", g).kcal} kcal. Per 100 gram is dat ${h.kcal} kcal. De meeste calorieën komen uit vet (${h.fat} g per 100 gram), grotendeels onverzadigd. Daarnaast bevat een halve avocado ${half.fiber} g vezels.`;
      },
      en: (c) => {
        const half = c.portion("avocado");
        const g = 2 * half.grams;
        const h = c.per100("avocado");
        return `Half an avocado (± ${half.amount}) contains ± ${half.kcal} kcal, a whole avocado (± ${c.n(g)} g) ± ${c.at("avocado", g).kcal} kcal. Per 100 grams, that's ${h.kcal} kcal. Most of the calories come from fat (${h.fat} g per 100 grams), mostly unsaturated. Half an avocado also contains ${half.fiber} g of fibre.`;
      },
    },
    tableTitle: { nl: "Voedingswaarde avocado per 100 gram en per halve avocado", en: "Avocado nutrition per 100 grams and per half avocado" },
    compareTitle: { nl: "Avocado vergeleken met ander beleg en vetten", en: "Avocado compared with other spreads and fats" },
    sections: {
      nl: [
        {
          title: "Waarom heeft avocado zoveel calorieën?",
          paragraphs: [
            (c) =>
              `Avocado is fruit, maar anders dan de meeste fruitsoorten bevat hij weinig suiker en veel vet. Vet levert 9 kcal per gram, ruim twee keer zoveel als koolhydraten of eiwit (4 kcal). Daardoor heeft avocado per 100 gram (${c.per100("avocado").kcal} kcal) veel meer calorieën dan bijvoorbeeld een banaan (${c.per100("banaan").kcal} kcal).`,
            "Dat maakt avocado geen slecht product: het vet is grotendeels onverzadigd en je krijgt er vezels bij. Het betekent alleen dat de portie ertoe doet.",
          ],
        },
        {
          title: "Calorieën van een kwart, halve en hele avocado",
          paragraphs: ["Avocado's verschillen flink in grootte. Gewogen zonder schil en pit:"],
          bullets: [
            (c) => `Kwart avocado (± ${c.n(c.portion("avocado").grams / 2)} g): ± ${c.at("avocado", c.portion("avocado").grams / 2).kcal} kcal`,
            (c) => `Halve avocado (± ${c.portion("avocado").amount}): ± ${c.portion("avocado").kcal} kcal`,
            (c) => `Hele avocado (± ${c.n(2 * c.portion("avocado").grams)} g): ± ${c.at("avocado", 2 * c.portion("avocado").grams).kcal} kcal`,
            (c) => `Grote hele avocado (± 200 g): ± ${c.at("avocado", 200).kcal} kcal`,
          ],
        },
      ],
      en: [
        {
          title: "Why does avocado have so many calories?",
          paragraphs: [
            (c) =>
              `Avocado is a fruit, but unlike most fruit it contains little sugar and a lot of fat. Fat provides 9 kcal per gram, more than twice as much as carbohydrates or protein (4 kcal). That's why avocado has many more calories per 100 grams (${c.per100("avocado").kcal} kcal) than, for example, a banana (${c.per100("banaan").kcal} kcal).`,
            "That doesn't make avocado a bad food: the fat is mostly unsaturated and you get fibre with it. It just means the portion matters.",
          ],
        },
        {
          title: "Calories in a quarter, half and whole avocado",
          paragraphs: ["Avocados vary a lot in size. Weighed without the skin and stone:"],
          bullets: [
            (c) => `Quarter of an avocado (± ${c.n(c.portion("avocado").grams / 2)} g): ± ${c.at("avocado", c.portion("avocado").grams / 2).kcal} kcal`,
            (c) => `Half an avocado (± ${c.portion("avocado").amount}): ± ${c.portion("avocado").kcal} kcal`,
            (c) => `Whole avocado (± ${c.n(2 * c.portion("avocado").grams)} g): ± ${c.at("avocado", 2 * c.portion("avocado").grams).kcal} kcal`,
            (c) => `Large whole avocado (± 200 g): ± ${c.at("avocado", 200).kcal} kcal`,
          ],
        },
      ],
    },
    fit: {
      nl: {
        title: "Past avocado in een afvalschema?",
        paragraphs: [
          "Ja, met aandacht voor de portie. Een kwart tot een halve avocado per keer is een mooie hoeveelheid: genoeg voor op brood of door een salade, zonder dat het ongemerkt veel calorieën worden.",
        ],
        bullets: [
          "Gebruik avocado in plaats van boter of mayonaise, niet erbij.",
          (c) =>
            `Een kwart avocado met een ei op een snee volkoren brood: samen ± ${c.sum(["avocado", c.portion("avocado").grams / 2], "ei", "volkorenBrood").kcal} kcal, met eiwit en vezels.`,
          "Maak guacamole zelf met tomaat, ui, limoen en koriander; dan maak je met dezelfde avocado een grotere portie.",
          "Bewaar de andere helft met de pit erin, goed ingepakt in de koelkast.",
        ],
      },
      en: {
        title: "Does avocado fit into a weight-loss plan?",
        paragraphs: [
          "Yes, with an eye on the portion. A quarter to half an avocado at a time is a good amount: enough for toast or a salad, without the calories quietly piling up.",
        ],
        bullets: [
          "Use avocado instead of butter or mayonnaise, not as well as.",
          (c) =>
            `A quarter of an avocado with an egg on a slice of wholemeal bread: ± ${c.sum(["avocado", c.portion("avocado").grams / 2], "ei", "volkorenBrood").kcal} kcal together, with protein and fibre.`,
          "Make your own guacamole with tomato, onion, lime and coriander; the same avocado then gives you a bigger portion.",
          "Keep the other half with the stone in, well wrapped in the fridge.",
        ],
      },
    },
    faq: {
      nl: [
        {
          q: "Hoeveel calorieën heeft een hele avocado?",
          a: (c) => {
            const g = 2 * c.portion("avocado").grams;
            return `Een hele avocado met ± ${c.n(g)} g vruchtvlees bevat ± ${c.at("avocado", g).kcal} kcal. Grote avocado's hebben meer vruchtvlees en dus meer calorieën: bij ± 200 g is dat ± ${c.at("avocado", 200).kcal} kcal.`;
          },
        },
        {
          q: "Is avocado dikmakend?",
          a: "Nee, geen enkel product maakt op zichzelf dik. Avocado heeft wel veel calorieën per hap, door het vet. Met een kwart tot een halve avocado per keer past hij prima in een afvalschema.",
        },
        {
          q: "Hoeveel koolhydraten zitten er in een avocado?",
          a: (c) =>
            `Heel weinig: ${c.per100("avocado").carbs} g per 100 gram, en ${c.portion("avocado").carbs} g per halve avocado. Avocado bestaat vooral uit water, vet en vezels.`,
        },
        {
          q: "Hoeveel avocado mag je per dag eten?",
          a: "Er is geen vaste grens. Let vooral op de portie: een halve avocado per dag past voor de meeste mensen goed binnen hun calorieën. Wissel af met andere vetbronnen, zoals noten en olijfolie.",
        },
      ],
      en: [
        {
          q: "How many calories does a whole avocado have?",
          a: (c) => {
            const g = 2 * c.portion("avocado").grams;
            return `A whole avocado with ± ${c.n(g)} g of flesh contains ± ${c.at("avocado", g).kcal} kcal. Large avocados have more flesh and therefore more calories: at ± 200 g, that's ± ${c.at("avocado", 200).kcal} kcal.`;
          },
        },
        {
          q: "Is avocado fattening?",
          a: "No, no single food makes you gain weight on its own. Avocado does have a lot of calories per bite, because of the fat. With a quarter to half an avocado at a time, it fits well into a weight-loss plan.",
        },
        {
          q: "How many carbs are in an avocado?",
          a: (c) =>
            `Very few: ${c.per100("avocado").carbs} g per 100 grams, and ${c.portion("avocado").carbs} g per half avocado. Avocado consists mainly of water, fat and fibre.`,
        },
        {
          q: "How much avocado can you eat a day?",
          a: "There's no fixed limit. Mainly watch the portion: half an avocado a day fits comfortably within most people's calories. Alternate with other sources of fat, such as nuts and olive oil.",
        },
      ],
    },
    comparisons: ["hummus", "pindakaas", "amandelen", "olijfolie"],
  },

  // ───────────────────────────── Havermout
  {
    slug: "havermout",
    foods: ["havermout"],
    keyword: "havermout calorieën",
    label: { nl: "Calorieën havermout", en: "Calories in oats" },
    title: { nl: "Havermout calorieën: hoeveel kcal zit er in een portie havermout?", en: "Oats calories: how many kcal are in a portion of oats?" },
    metaTitle: { nl: "Havermout calorieën: kcal per portie en per 100 g", en: "Oats calories: kcal per portion and per 100 g" },
    metaDescription: {
      nl: (c) => {
        const p = c.portion("havermout");
        return `Een portie havermout (${p.amount}) bevat ± ${p.kcal} kcal, ${p.protein} g eiwit en ${p.fiber} g vezels; met melk ± ${c.sum("havermout", "melkHalfvol").kcal} kcal. Bekijk de voedingswaarde per 100 g en ontbijttips.`;
      },
      en: (c) => {
        const p = c.portion("havermout");
        return `A portion of oats (${p.amount}) contains ± ${p.kcal} kcal, ${p.protein} g of protein and ${p.fiber} g of fibre; with milk ± ${c.sum("havermout", "melkHalfvol").kcal} kcal. See nutrition per 100 g and breakfast tips.`;
      },
    },
    intro: {
      nl: "Havermout is een vullend en goedkoop ontbijt. Maar hoeveel calorieën heeft een portie, en wat doen melk, fruit of pindakaas ermee? Hier vind je de voedingswaarde per portie en per 100 gram.",
      en: "Oats make a filling and cheap breakfast. But how many calories are in a portion, and what do milk, fruit or peanut butter add? Here you'll find the nutritional values per portion and per 100 grams.",
    },
    short: {
      nl: (c) => {
        const p = c.portion("havermout");
        const m = c.sum("havermout", "melkHalfvol");
        return `Een portie havermout (${p.amount}, ± 4 eetlepels) bevat ± ${p.kcal} kcal, ${p.protein} g eiwit, ${p.carbs} g koolhydraten en ${p.fiber} g vezels. Per 100 gram is dat ${c.per100("havermout").kcal} kcal. Kook je er pap van met een glas halfvolle melk (${c.portion("melkHalfvol").amount}), dan kom je op ± ${m.kcal} kcal en ${m.protein} g eiwit.`;
      },
      en: (c) => {
        const p = c.portion("havermout");
        const m = c.sum("havermout", "melkHalfvol");
        return `A portion of oats (${p.amount}, ± 4 tablespoons) contains ± ${p.kcal} kcal, ${p.protein} g of protein, ${p.carbs} g of carbohydrates and ${p.fiber} g of fibre. Per 100 grams, that's ${c.per100("havermout").kcal} kcal. If you make porridge with a glass of semi-skimmed milk (${c.portion("melkHalfvol").amount}), it comes to ± ${m.kcal} kcal and ${m.protein} g of protein.`;
      },
    },
    tableTitle: { nl: "Voedingswaarde havermout per 100 gram en per portie", en: "Oats nutrition per 100 grams and per portion" },
    compareTitle: { nl: "Havermout vergeleken met ander ontbijt", en: "Oats compared with other breakfasts" },
    sections: {
      nl: [
        {
          title: "Havermout met water, melk of kwark",
          paragraphs: ["De havermout zelf blijft gelijk; wat je erbij doet, maakt het verschil:"],
          bullets: [
            (c) => `Met water: ± ${c.portion("havermout").kcal} kcal en ${c.portion("havermout").protein} g eiwit`,
            (c) => {
              const s = c.sum("havermout", "melkHalfvol");
              return `Met een glas halfvolle melk (${c.portion("melkHalfvol").amount}): ± ${s.kcal} kcal en ${s.protein} g eiwit`;
            },
            (c) => {
              const s = c.sum("havermout", ["kwarkMager", c.portion("kwarkMager", 1).grams]);
              return `Als overnight oats met een schaaltje magere kwark (${c.portion("kwarkMager", 1).amount}): ± ${s.kcal} kcal en ${s.protein} g eiwit`;
            },
            (c) => `Met een banaan erdoor: ± ${c.portion("banaan").kcal} kcal extra`,
            (c) => `Met een theelepel honing: ± ${c.portion("honing").kcal} kcal extra`,
          ],
        },
        {
          title: "Weeg je havermout droog of gekookt?",
          paragraphs: [
            "De voedingswaarden van havermout gelden voor droge havermout, zoals op het etiket. Gekookt neemt havermout veel water of melk op en wordt het zwaarder, maar de calorieën van de havermout blijven gelijk. Weeg daarom altijd droog af.",
          ],
        },
      ],
      en: [
        {
          title: "Oats with water, milk or quark",
          paragraphs: ["The oats themselves stay the same; what you add makes the difference:"],
          bullets: [
            (c) => `With water: ± ${c.portion("havermout").kcal} kcal and ${c.portion("havermout").protein} g of protein`,
            (c) => {
              const s = c.sum("havermout", "melkHalfvol");
              return `With a glass of semi-skimmed milk (${c.portion("melkHalfvol").amount}): ± ${s.kcal} kcal and ${s.protein} g of protein`;
            },
            (c) => {
              const s = c.sum("havermout", ["kwarkMager", c.portion("kwarkMager", 1).grams]);
              return `As overnight oats with a bowl of low-fat quark (${c.portion("kwarkMager", 1).amount}): ± ${s.kcal} kcal and ${s.protein} g of protein`;
            },
            (c) => `With a banana: ± ${c.portion("banaan").kcal} kcal extra`,
            (c) => `With a teaspoon of honey: ± ${c.portion("honing").kcal} kcal extra`,
          ],
        },
        {
          title: "Do you weigh oats dry or cooked?",
          paragraphs: [
            "The nutritional values for oats are for dry oats, as on the label. When cooked, oats absorb a lot of water or milk and get heavier, but the calories from the oats stay the same. So always weigh them dry.",
          ],
        },
      ],
    },
    fit: {
      nl: {
        title: "Past havermout in een afvalschema?",
        paragraphs: [
          "Ja. Havermout bevat vezels en vult goed, en je maakt er in een paar minuten een warm of koud ontbijt van. Let vooral op de toppings: noten, pindakaas, honing en gedroogd fruit tellen snel op.",
        ],
        bullets: [
          (c) => `Weeg je havermout af: ${c.portion("havermout").amount} is een normale portie.`,
          "Zoet met vers fruit, kaneel of vanille in plaats van suiker of siroop.",
          "Maak het eiwitrijker met magere kwark, skyr of melk.",
          "Kies gewone havermout; instantvarianten met een smaakje bevatten vaak toegevoegde suiker.",
        ],
      },
      en: {
        title: "Do oats fit into a weight-loss plan?",
        paragraphs: [
          "Yes. Oats contain fibre and are filling, and you can turn them into a hot or cold breakfast in a few minutes. Mainly watch the toppings: nuts, peanut butter, honey and dried fruit add up quickly.",
        ],
        bullets: [
          (c) => `Weigh your oats: ${c.portion("havermout").amount} is a normal portion.`,
          "Sweeten with fresh fruit, cinnamon or vanilla instead of sugar or syrup.",
          "Add protein with low-fat quark, skyr or milk.",
          "Choose plain oats; flavoured instant versions often contain added sugar.",
        ],
      },
    },
    faq: {
      nl: [
        {
          q: "Hoeveel calorieën zitten er in 40 gram havermout?",
          a: (c) => {
            const v = c.at("havermout", 40);
            return `40 gram havermout bevat ± ${v.kcal} kcal, ${v.protein} g eiwit en ${v.fiber} g vezels. Per 100 gram is dat ${c.per100("havermout").kcal} kcal.`;
          },
        },
        {
          q: "Hoeveel calorieën heeft havermout met melk?",
          a: (c) => {
            const s = c.sum("havermout", "melkHalfvol");
            return `Een portie havermout (${c.portion("havermout").amount}) met een glas halfvolle melk (${c.portion("melkHalfvol").amount}) bevat ± ${s.kcal} kcal en ${s.protein} g eiwit. Met water is het ± ${c.portion("havermout").kcal} kcal; met volle melk iets meer.`;
          },
        },
        { q: "Is havermout goed om af te vallen?", a: `Havermout past goed in een afvalschema: het vult door de vezels en je kunt de portie makkelijk afwegen. ${shared.oneProduct.nl}` },
        {
          q: "Hoeveel eiwit zit er in havermout?",
          a: (c) =>
            `Havermout bevat ${c.per100("havermout").protein} g eiwit per 100 gram, dus ± ${c.portion("havermout").protein} g per portie van ${c.portion("havermout").amount}. Wil je een eiwitrijk ontbijt, combineer het dan met melk, kwark of skyr.`,
        },
      ],
      en: [
        {
          q: "How many calories are in 40 grams of oats?",
          a: (c) => {
            const v = c.at("havermout", 40);
            return `40 grams of oats contains ± ${v.kcal} kcal, ${v.protein} g of protein and ${v.fiber} g of fibre. Per 100 grams, that's ${c.per100("havermout").kcal} kcal.`;
          },
        },
        {
          q: "How many calories does porridge with milk have?",
          a: (c) => {
            const s = c.sum("havermout", "melkHalfvol");
            return `A portion of oats (${c.portion("havermout").amount}) with a glass of semi-skimmed milk (${c.portion("melkHalfvol").amount}) contains ± ${s.kcal} kcal and ${s.protein} g of protein. With water it's ± ${c.portion("havermout").kcal} kcal; with whole milk a little more.`;
          },
        },
        { q: "Are oats good for weight loss?", a: `Oats fit well into a weight-loss plan: the fibre makes them filling and the portion is easy to weigh. ${shared.oneProduct.en}` },
        {
          q: "How much protein is in oats?",
          a: (c) =>
            `Oats contain ${c.per100("havermout").protein} g of protein per 100 grams, so ± ${c.portion("havermout").protein} g per ${c.portion("havermout").amount} portion. For a high-protein breakfast, combine them with milk, quark or skyr.`,
        },
      ],
    },
    comparisons: ["muesli", "volkorenBrood", "witBrood", "rijstwafel"],
  },

  // ───────────────────────────── Rijst
  {
    slug: "rijst",
    foods: ["rijstOngekookt", "rijstGekookt", "zilvervliesrijstOngekookt"],
    keyword: "calorieën rijst",
    label: { nl: "Calorieën rijst", en: "Calories in rice" },
    title: { nl: "Calorieën rijst: hoeveel kcal zit er in rijst, ongekookt en gekookt?", en: "Calories in rice: how many kcal, uncooked and cooked?" },
    metaTitle: { nl: "Calorieën rijst: ongekookt, gekookt en zilvervlies", en: "Calories in rice: uncooked, cooked and brown rice" },
    metaDescription: {
      nl: (c) =>
        `Ongekookte rijst bevat ${c.per100("rijstOngekookt").kcal} kcal per 100 g, gekookt ${c.per100("rijstGekookt").kcal} kcal. Een portie (${c.portion("rijstOngekookt").amount} ongekookt) is ± ${c.portion("rijstOngekookt").kcal} kcal. Met zilvervliesrijst en porties per persoon.`,
      en: (c) =>
        `Uncooked rice has ${c.per100("rijstOngekookt").kcal} kcal per 100 g, cooked ${c.per100("rijstGekookt").kcal} kcal. A portion (${c.portion("rijstOngekookt").amount} uncooked) is ± ${c.portion("rijstOngekookt").kcal} kcal. With brown rice and portions per person.`,
    },
    intro: {
      nl: "Rijst staat bij veel mensen een paar keer per week op tafel. Maar reken je met ongekookte of gekookte rijst, en hoeveel calorieën heeft een portie? Hier vind je de voedingswaarde van witte rijst en zilvervliesrijst.",
      en: "Many people eat rice a few times a week. But do you count uncooked or cooked rice, and how many calories are in a portion? Here you'll find the nutritional values of white rice and brown rice.",
    },
    short: {
      nl: (c) => {
        const u = c.portion("rijstOngekookt");
        const z = c.portion("zilvervliesrijstOngekookt");
        return `Ongekookte rijst bevat ${c.per100("rijstOngekookt").kcal} kcal per 100 gram; gekookt is dat ${c.per100("rijstGekookt").kcal} kcal, omdat rijst bij het koken water opneemt. Een portie van ${u.amount} ongekookte rijst (± ${c.portion("rijstGekookt").amount} gekookt) levert ± ${u.kcal} kcal en ${u.protein} g eiwit. Zilvervliesrijst heeft ongeveer evenveel calorieën (± ${z.kcal} kcal per portie), maar meer vezels: ${z.fiber} g in plaats van ${u.fiber} g.`;
      },
      en: (c) => {
        const u = c.portion("rijstOngekookt");
        const z = c.portion("zilvervliesrijstOngekookt");
        return `Uncooked rice contains ${c.per100("rijstOngekookt").kcal} kcal per 100 grams; cooked, that's ${c.per100("rijstGekookt").kcal} kcal, because rice absorbs water as it cooks. A portion of ${u.amount} uncooked rice (± ${c.portion("rijstGekookt").amount} cooked) provides ± ${u.kcal} kcal and ${u.protein} g of protein. Brown rice has about the same calories (± ${z.kcal} kcal per portion), but more fibre: ${z.fiber} g instead of ${u.fiber} g.`;
      },
    },
    tableTitle: { nl: "Voedingswaarde rijst per 100 gram en per portie", en: "Rice nutrition per 100 grams and per portion" },
    compareTitle: { nl: "Rijst vergeleken met pasta, aardappelen en andere granen", en: "Rice compared with pasta, potatoes and other grains" },
    sections: {
      nl: [
        {
          title: "Ongekookt of gekookt wegen?",
          paragraphs: [
            "Op de verpakking staan de voedingswaarden van ongekookte rijst. Weeg je rijst dus het liefst af voordat je hem kookt. Weeg je gekookte rijst, gebruik dan de waarden voor gekookte rijst: die zijn per 100 gram veel lager, omdat er water bij zit.",
            (c) => `Als vuistregel: ${c.portion("rijstOngekookt").amount} ongekookte rijst wordt ± ${c.portion("rijstGekookt").amount} gekookte rijst.`,
          ],
        },
        {
          title: "Hoeveel rijst per persoon?",
          paragraphs: [
            (c) =>
              `Veel mensen rekenen met 60 tot 75 gram ongekookte rijst per persoon voor een hoofdmaaltijd. Dat is ± ${c.at("rijstOngekookt", 60).kcal} tot ${c.at("rijstOngekookt", 75).kcal} kcal. Hoeveel jij nodig hebt, hangt af van je caloriebehoefte en van wat je er verder bij eet.`,
          ],
        },
      ],
      en: [
        {
          title: "Weigh it uncooked or cooked?",
          paragraphs: [
            "The packaging gives the nutritional values of uncooked rice. So ideally, weigh your rice before you cook it. If you weigh cooked rice, use the values for cooked rice: they're much lower per 100 grams, because of the added water.",
            (c) => `As a rule of thumb: ${c.portion("rijstOngekookt").amount} of uncooked rice becomes ± ${c.portion("rijstGekookt").amount} of cooked rice.`,
          ],
        },
        {
          title: "How much rice per person?",
          paragraphs: [
            (c) =>
              `Many people allow 60 to 75 grams of uncooked rice per person for a main meal. That's ± ${c.at("rijstOngekookt", 60).kcal} to ${c.at("rijstOngekookt", 75).kcal} kcal. How much you need depends on your calorie needs and what else you eat with it.`,
          ],
        },
      ],
    },
    fit: {
      nl: {
        title: "Past rijst in een afvalschema?",
        paragraphs: ["Ja. Rijst is niet dikmakend op zich; het gaat om de portie en om wat je erbij eet. Vooral bakken in veel olie en romige sauzen tellen snel op."],
        bullets: [
          "Weeg je rijst ongekookt af, dan weet je precies wat je eet.",
          (c) => `Vul je bord voor de helft met groente: een hele zak wokgroente (${c.portion("wokgroente").amount}) is maar ± ${c.portion("wokgroente").kcal} kcal.`,
          "Kies vaker zilvervliesrijst; door de extra vezels zit je langer vol.",
          (c) => `Let op bij nasi en gebakken rijst: elke eetlepel olie is ± ${c.portion("olijfolie").kcal} kcal extra.`,
        ],
      },
      en: {
        title: "Does rice fit into a weight-loss plan?",
        paragraphs: ["Yes. Rice isn't fattening in itself; it's about the portion and what you eat with it. Frying in lots of oil and creamy sauces in particular add up quickly."],
        bullets: [
          "Weigh your rice uncooked, so you know exactly what you're eating.",
          (c) => `Fill half your plate with vegetables: a whole bag of stir-fry vegetables (${c.portion("wokgroente").amount}) is only ± ${c.portion("wokgroente").kcal} kcal.`,
          "Choose brown rice more often; the extra fibre keeps you full for longer.",
          (c) => `Watch out with fried rice: every tablespoon of oil adds ± ${c.portion("olijfolie").kcal} kcal.`,
        ],
      },
    },
    faq: {
      nl: [
        {
          q: "Hoeveel calorieën zit er in 100 gram gekookte rijst?",
          a: (c) =>
            `100 gram gekookte witte rijst bevat ± ${c.at("rijstGekookt", 100).kcal} kcal. Ongekookt is dat ${c.per100("rijstOngekookt").kcal} kcal per 100 gram, omdat er nog geen water in zit.`,
        },
        {
          q: "Hoeveel calorieën heeft een portie rijst?",
          a: (c) =>
            `Een portie van ${c.portion("rijstOngekookt").amount} ongekookte rijst bevat ± ${c.portion("rijstOngekookt").kcal} kcal en ${c.portion("rijstOngekookt").protein} g eiwit. Gekookt weegt die portie ± ${c.portion("rijstGekookt").amount}.`,
        },
        {
          q: "Heeft zilvervliesrijst minder calorieën dan witte rijst?",
          a: (c) =>
            `Nee, ongeveer evenveel: ${c.per100("zilvervliesrijstOngekookt").kcal} kcal per 100 gram ongekookt, tegenover ${c.per100("rijstOngekookt").kcal} kcal voor witte rijst. Zilvervliesrijst bevat wel meer vezels (${c.per100("zilvervliesrijstOngekookt").fiber} g tegenover ${c.per100("rijstOngekookt").fiber} g per 100 gram) en vult daardoor beter.`,
        },
        {
          q: "Is rijst of pasta beter als je wilt afvallen?",
          a: (c) =>
            `Ze ontlopen elkaar weinig: een portie rijst (${c.portion("rijstOngekookt").amount} ongekookt) is ± ${c.portion("rijstOngekookt").kcal} kcal, een portie pasta (${c.portion("pastaOngekookt").amount} ongekookt) ± ${c.portion("pastaOngekookt").kcal} kcal. Kies wat je lekker vindt, let op de portie en kies bij voorkeur de volkorenvariant.`,
        },
      ],
      en: [
        {
          q: "How many calories are in 100 grams of cooked rice?",
          a: (c) =>
            `100 grams of cooked white rice contains ± ${c.at("rijstGekookt", 100).kcal} kcal. Uncooked, it's ${c.per100("rijstOngekookt").kcal} kcal per 100 grams, because there's no water in it yet.`,
        },
        {
          q: "How many calories are in a portion of rice?",
          a: (c) =>
            `A portion of ${c.portion("rijstOngekookt").amount} uncooked rice contains ± ${c.portion("rijstOngekookt").kcal} kcal and ${c.portion("rijstOngekookt").protein} g of protein. Cooked, that portion weighs ± ${c.portion("rijstGekookt").amount}.`,
        },
        {
          q: "Does brown rice have fewer calories than white rice?",
          a: (c) =>
            `No, about the same: ${c.per100("zilvervliesrijstOngekookt").kcal} kcal per 100 grams uncooked, compared with ${c.per100("rijstOngekookt").kcal} kcal for white rice. Brown rice does contain more fibre (${c.per100("zilvervliesrijstOngekookt").fiber} g versus ${c.per100("rijstOngekookt").fiber} g per 100 grams), so it's more filling.`,
        },
        {
          q: "Is rice or pasta better for weight loss?",
          a: (c) =>
            `There's little in it: a portion of rice (${c.portion("rijstOngekookt").amount} uncooked) is ± ${c.portion("rijstOngekookt").kcal} kcal, a portion of pasta (${c.portion("pastaOngekookt").amount} uncooked) ± ${c.portion("pastaOngekookt").kcal} kcal. Choose what you enjoy, watch the portion and preferably go for the wholegrain version.`,
        },
      ],
    },
    comparisons: ["pastaOngekookt", "aardappel", "quinoaOngekookt", "couscousOngekookt"],
  },

  // ───────────────────────────── Aardappel
  {
    slug: "aardappel",
    foods: ["aardappel"],
    keyword: "calorieën aardappel",
    label: { nl: "Calorieën aardappel", en: "Calories in potatoes" },
    title: { nl: "Calorieën aardappel: hoeveel kcal zit er in aardappelen?", en: "Calories in potatoes: how many kcal are in boiled potatoes?" },
    metaTitle: { nl: "Calorieën aardappel: kcal per portie en per 100 g", en: "Calories in potatoes: kcal per portion and per 100 g" },
    metaDescription: {
      nl: (c) =>
        `Gekookte aardappelen bevatten ${c.per100("aardappel").kcal} kcal per 100 g; een portie van ${c.portion("aardappel").amount} is ± ${c.portion("aardappel").kcal} kcal. Vergelijk met rijst, pasta en zoete aardappel, met tips voor lichter koken.`,
      en: (c) =>
        `Boiled potatoes contain ${c.per100("aardappel").kcal} kcal per 100 g; a ${c.portion("aardappel").amount} portion is ± ${c.portion("aardappel").kcal} kcal. Compare with rice, pasta and sweet potato, and see how to cook them lighter.`,
    },
    intro: {
      nl: "Aardappelen horen bij de Nederlandse avondmaaltijd. Hoeveel calorieën zitten er in een portie, en maakt het uit of je ze kookt, bakt of pureert? Hier vind je de voedingswaarde per portie en per 100 gram.",
      en: "Potatoes are a staple of the Dutch evening meal. How many calories are in a portion, and does it matter whether you boil, fry or mash them? Here you'll find the nutritional values per portion and per 100 grams.",
    },
    short: {
      nl: (c) => {
        const p = c.portion("aardappel");
        return `Gekookte aardappelen bevatten ${c.per100("aardappel").kcal} kcal per 100 gram. Een portie van ± ${p.amount} (zo'n 4 middelgrote aardappelen) levert ± ${p.kcal} kcal, ${p.protein} g eiwit en ${p.carbs} g koolhydraten. Daarmee heeft een portie aardappelen minder calorieën dan een portie rijst (± ${c.portion("rijstOngekookt").kcal} kcal) of pasta (± ${c.portion("pastaOngekookt").kcal} kcal).`;
      },
      en: (c) => {
        const p = c.portion("aardappel");
        return `Boiled potatoes contain ${c.per100("aardappel").kcal} kcal per 100 grams. A portion of ± ${p.amount} (about 4 medium potatoes) provides ± ${p.kcal} kcal, ${p.protein} g of protein and ${p.carbs} g of carbohydrates. That means a portion of potatoes has fewer calories than a portion of rice (± ${c.portion("rijstOngekookt").kcal} kcal) or pasta (± ${c.portion("pastaOngekookt").kcal} kcal).`;
      },
    },
    tableTitle: { nl: "Voedingswaarde aardappelen per 100 gram en per portie", en: "Potato nutrition per 100 grams and per portion" },
    compareTitle: { nl: "Aardappelen vergeleken met rijst, pasta en zoete aardappel", en: "Potatoes compared with rice, pasta and sweet potato" },
    sections: {
      nl: [
        {
          title: "Gekookt, gebakken of puree",
          paragraphs: ["De aardappel zelf verandert weinig; de bereiding maakt het verschil:"],
          bullets: [
            (c) => `Gekookte aardappelen (${c.portion("aardappel").amount}): ± ${c.portion("aardappel").kcal} kcal`,
            (c) => `Gebakken in 1 eetlepel olie: ± ${c.sum("aardappel", "olijfolie").kcal} kcal`,
            (c) => `Puree met een scheut halfvolle melk (100 ml): ± ${c.sum("aardappel", ["melkHalfvol", 100]).kcal} kcal`,
            "Friet en chips: veel meer, omdat ze in vet worden gefrituurd. Kijk voor de precieze waarden op de verpakking.",
          ],
        },
        {
          title: "Hoeveel calorieën heeft één aardappel?",
          paragraphs: [
            (c) =>
              `Een middelgrote aardappel weegt ± 50 gram en bevat ± ${c.at("aardappel", 50).kcal} kcal. Een grote aardappel van ± 150 gram is ± ${c.at("aardappel", 150).kcal} kcal.`,
          ],
        },
      ],
      en: [
        {
          title: "Boiled, fried or mashed",
          paragraphs: ["The potato itself changes little; how you cook it makes the difference:"],
          bullets: [
            (c) => `Boiled potatoes (${c.portion("aardappel").amount}): ± ${c.portion("aardappel").kcal} kcal`,
            (c) => `Fried in 1 tablespoon of oil: ± ${c.sum("aardappel", "olijfolie").kcal} kcal`,
            (c) => `Mashed with a splash of semi-skimmed milk (100 ml): ± ${c.sum("aardappel", ["melkHalfvol", 100]).kcal} kcal`,
            "Chips and crisps: a lot more, because they're deep-fried in fat. Check the packaging for the exact values.",
          ],
        },
        {
          title: "How many calories does one potato have?",
          paragraphs: [
            (c) =>
              `A medium potato weighs ± 50 grams and contains ± ${c.at("aardappel", 50).kcal} kcal. A large potato of ± 150 grams is ± ${c.at("aardappel", 150).kcal} kcal.`,
          ],
        },
      ],
    },
    fit: {
      nl: {
        title: "Passen aardappelen in een afvalschema?",
        paragraphs: [
          "Ja. Aardappelen zijn niet dikmakend: per portie hebben ze relatief weinig calorieën, en ze vullen goed. Wat het verschil maakt, is wat je erbij doet: boter, jus, room en frituurvet.",
        ],
        bullets: [
          "Kook of stoom ze, of bak ze in de oven met een theelepel olie en kruiden.",
          "Maak puree met een scheut halfvolle melk en wat nootmuskaat in plaats van boter en room.",
          (c) => `Combineer met veel groente en een magere eiwitbron, zoals kabeljauw (${c.portion("kabeljauw").amount}: ± ${c.portion("kabeljauw").kcal} kcal) of kipfilet.`,
          (c) => `Zoete aardappel is een lekkere afwisseling: ± ${c.portion("zoeteAardappel").kcal} kcal per stuk van ${c.portion("zoeteAardappel").amount}.`,
        ],
      },
      en: {
        title: "Do potatoes fit into a weight-loss plan?",
        paragraphs: [
          "Yes. Potatoes aren't fattening: per portion they have relatively few calories, and they're filling. What makes the difference is what you add: butter, gravy, cream and frying fat.",
        ],
        bullets: [
          "Boil or steam them, or roast them in the oven with a teaspoon of oil and herbs.",
          "Make mash with a splash of semi-skimmed milk and a little nutmeg instead of butter and cream.",
          (c) => `Pair with plenty of vegetables and a lean source of protein, such as cod (${c.portion("kabeljauw").amount}: ± ${c.portion("kabeljauw").kcal} kcal) or chicken breast.`,
          (c) => `Sweet potato makes a tasty change: ± ${c.portion("zoeteAardappel").kcal} kcal for one of ${c.portion("zoeteAardappel").amount}.`,
        ],
      },
    },
    faq: {
      nl: [
        {
          q: "Hoeveel calorieën heeft een aardappel?",
          a: (c) => `Een middelgrote gekookte aardappel van ± 50 gram bevat ± ${c.at("aardappel", 50).kcal} kcal. Een portie van ${c.portion("aardappel").amount} is ± ${c.portion("aardappel").kcal} kcal.`,
        },
        {
          q: "Hoeveel calorieën zit er in 100 gram aardappelen?",
          a: (c) =>
            `100 gram gekookte aardappelen bevat ${c.per100("aardappel").kcal} kcal, ${c.per100("aardappel").carbs} g koolhydraten en ${c.per100("aardappel").protein} g eiwit. Bakken of frituren in vet maakt het wel meer.`,
        },
        {
          q: "Zijn aardappelen dikmakend?",
          a: "Nee. Per portie hebben aardappelen minder calorieën dan rijst of pasta, en ze vullen goed. Je komt aan van een overschot aan calorieën over langere tijd, niet van één product. Let vooral op de boter, jus en sauzen erbij.",
        },
        {
          q: "Aardappel of zoete aardappel: wat heeft minder calorieën?",
          a: (c) =>
            `Ze ontlopen elkaar weinig: gewone aardappelen ${c.per100("aardappel").kcal} kcal per 100 gram, zoete aardappel ${c.per100("zoeteAardappel").kcal} kcal. Zoete aardappel bevat wat meer vezels (${c.per100("zoeteAardappel").fiber} g tegenover ${c.per100("aardappel").fiber} g per 100 gram) en smaakt zoeter.`,
        },
      ],
      en: [
        {
          q: "How many calories does a potato have?",
          a: (c) => `A medium boiled potato of ± 50 grams contains ± ${c.at("aardappel", 50).kcal} kcal. A ${c.portion("aardappel").amount} portion is ± ${c.portion("aardappel").kcal} kcal.`,
        },
        {
          q: "How many calories are in 100 grams of potatoes?",
          a: (c) =>
            `100 grams of boiled potatoes contains ${c.per100("aardappel").kcal} kcal, ${c.per100("aardappel").carbs} g of carbohydrates and ${c.per100("aardappel").protein} g of protein. Frying or deep-frying in fat does add more.`,
        },
        {
          q: "Are potatoes fattening?",
          a: "No. Per portion, potatoes have fewer calories than rice or pasta, and they're filling. You gain weight from a calorie surplus over a longer period, not from one food. Mainly watch the butter, gravy and sauces you add.",
        },
        {
          q: "Potato or sweet potato: which has fewer calories?",
          a: (c) =>
            `There's little in it: regular potatoes have ${c.per100("aardappel").kcal} kcal per 100 grams, sweet potato ${c.per100("zoeteAardappel").kcal} kcal. Sweet potato contains a little more fibre (${c.per100("zoeteAardappel").fiber} g versus ${c.per100("aardappel").fiber} g per 100 grams) and tastes sweeter.`,
        },
      ],
    },
    comparisons: ["zoeteAardappel", "rijstGekookt", "pastaGekookt"],
  },

  // ───────────────────────────── Wijn
  {
    slug: "wijn",
    foods: ["wijnRood", "wijnWit"],
    keyword: "calorieën wijn",
    label: { nl: "Calorieën wijn", en: "Calories in wine" },
    title: { nl: "Calorieën wijn: hoeveel kcal zit er in een glas wijn?", en: "Calories in wine: how many kcal are in a glass of wine?" },
    metaTitle: { nl: "Calorieën wijn: hoeveel kcal in een glas rood of wit?", en: "Calories in wine: kcal in a glass of red or white" },
    metaDescription: {
      nl: (c) =>
        `Een glas rode wijn bevat ± ${c.portion("wijnRood").kcal} kcal, droge witte wijn ± ${c.portion("wijnWit").kcal} kcal en een ruim glas ± ${c.portion("wijnRood", 1).kcal} kcal. Bekijk de suikers per 100 ml en tips om bewust te drinken.`,
      en: (c) =>
        `A glass of red wine contains ± ${c.portion("wijnRood").kcal} kcal, dry white wine ± ${c.portion("wijnWit").kcal} kcal and a large glass ± ${c.portion("wijnRood", 1).kcal} kcal. See the sugars per 100 ml and tips for mindful drinking.`,
    },
    intro: {
      nl: "Een glas wijn bij het eten of op een feestje: hoeveel calorieën zitten erin, en scheelt het of je rood of wit drinkt? Hier vind je de voedingswaarde van rode en droge witte wijn, per glas en per 100 ml.",
      en: "A glass of wine with dinner or at a party: how many calories does it have, and does it matter whether you drink red or white? Here you'll find the nutritional values of red and dry white wine, per glass and per 100 ml.",
    },
    short: {
      nl: (c) => {
        const r = c.portion("wijnRood");
        const r2 = c.portion("wijnRood", 1);
        return `Een glas rode wijn (${r.amount}) bevat ± ${r.kcal} kcal, een glas droge witte wijn ± ${c.portion("wijnWit").kcal} kcal. Schenk je een ruim glas (${r2.amount}), dan is dat ± ${r2.kcal} kcal. Bijna alle calorieën in droge wijn komen uit de alcohol; er zit weinig suiker in.`;
      },
      en: (c) => {
        const r = c.portion("wijnRood");
        const r2 = c.portion("wijnRood", 1);
        return `A glass of red wine (${r.amount}) contains ± ${r.kcal} kcal, a glass of dry white wine ± ${c.portion("wijnWit").kcal} kcal. If you pour a large glass (${r2.amount}), it's ± ${r2.kcal} kcal. Almost all the calories in dry wine come from the alcohol; it contains little sugar.`;
      },
    },
    tableTitle: { nl: "Voedingswaarde wijn per 100 ml en per glas", en: "Wine nutrition per 100 ml and per glass" },
    compareTitle: { nl: "Wijn vergeleken met andere drankjes", en: "Wine compared with other drinks" },
    sections: {
      nl: [
        {
          title: "Rood, wit, rosé of zoet",
          paragraphs: [
            (c) =>
              `Rode en droge witte wijn liggen dicht bij elkaar: ${c.per100("wijnRood").kcal} en ${c.per100("wijnWit").kcal} kcal per 100 ml. Rosé zit ongeveer op hetzelfde niveau. Zoete wijnen, zoals dessertwijn en port, en wijnen met een hoog alcoholpercentage hebben duidelijk meer calorieën.`,
            "Een glas in de horeca is meestal 10 tot 12 cl. Thuis schenk je vaak ruimer: een groot wijnglas is al snel voor 15 cl of meer gevuld.",
          ],
        },
        { title: "Alcohol en afvallen", paragraphs: shared.alcohol.nl },
      ],
      en: [
        {
          title: "Red, white, rosé or sweet",
          paragraphs: [
            (c) =>
              `Red and dry white wine are close: ${c.per100("wijnRood").kcal} and ${c.per100("wijnWit").kcal} kcal per 100 ml. Rosé is roughly the same. Sweet wines, such as dessert wine and port, and wines with a high alcohol content have clearly more calories.`,
            "A glass in a bar or restaurant is usually 10 to 12 cl. At home, you often pour more: a large wine glass easily holds 15 cl or more.",
          ],
        },
        { title: "Alcohol and weight loss", paragraphs: shared.alcohol.en },
      ],
    },
    fit: {
      nl: {
        title: "Past wijn in een afvalschema?",
        paragraphs: [
          "Niets is verboden, ook wijn niet. Maar wijn levert calorieën zonder dat je er vol van zit. Drink je af en toe een glas, plan het dan gewoon in en houd er bij de rest van je dag rekening mee.",
        ],
        bullets: [
          "Schenk kleinere glazen: 10 cl is een standaardglas.",
          "Drink er een glas water naast; dan drink je vanzelf langzamer.",
          "Maak een spritz: wijn aangelengd met bruiswater en ijs, zodat je met minder wijn langer doet.",
          "Spreek vooraf met jezelf af hoeveel glazen je drinkt.",
        ],
      },
      en: {
        title: "Does wine fit into a weight-loss plan?",
        paragraphs: [
          "Nothing is off limits, wine included. But wine provides calories without filling you up. If you have the occasional glass, simply plan it in and take it into account for the rest of your day.",
        ],
        bullets: [
          "Pour smaller glasses: 10 cl is a standard Dutch glass.",
          "Drink a glass of water alongside it; you'll naturally drink more slowly.",
          "Make a spritzer: wine topped up with sparkling water and ice, so less wine lasts longer.",
          "Decide beforehand how many glasses you'll have.",
        ],
      },
    },
    faq: {
      nl: [
        {
          q: "Hoeveel calorieën zitten er in een fles wijn?",
          a: (c) => `Een fles rode wijn van 75 cl bevat ± ${c.at("wijnRood", 750).kcal} kcal, een fles droge witte wijn ± ${c.at("wijnWit", 750).kcal} kcal.`,
        },
        {
          q: "Heeft rode of witte wijn meer calorieën?",
          a: (c) =>
            `Ze liggen dicht bij elkaar: rode wijn ${c.per100("wijnRood").kcal} kcal per 100 ml, droge witte wijn ${c.per100("wijnWit").kcal} kcal. Het alcoholpercentage en de hoeveelheid suiker maken meer uit dan de kleur.`,
        },
        {
          q: "Zit er suiker in wijn?",
          a: (c) =>
            `In droge wijn zit weinig suiker: ${c.per100("wijnRood").sugars} g per 100 ml in rode wijn en ${c.per100("wijnWit").sugars} g in droge witte wijn. Halfzoete en zoete wijnen bevatten veel meer.`,
        },
        {
          q: "Mag je wijn drinken als je wilt afvallen?",
          a: "Ja, niets is verboden. Wijn telt wel mee in je calorieën en alcohol maakt het lastiger om nee te zeggen tegen snacks. Hoe minder je drinkt, hoe meer ruimte je overhoudt voor eten dat wel vult.",
        },
      ],
      en: [
        {
          q: "How many calories are in a bottle of wine?",
          a: (c) => `A 75 cl bottle of red wine contains ± ${c.at("wijnRood", 750).kcal} kcal, a bottle of dry white wine ± ${c.at("wijnWit", 750).kcal} kcal.`,
        },
        {
          q: "Does red or white wine have more calories?",
          a: (c) =>
            `They're close: red wine has ${c.per100("wijnRood").kcal} kcal per 100 ml, dry white wine ${c.per100("wijnWit").kcal} kcal. The alcohol content and the amount of sugar matter more than the colour.`,
        },
        {
          q: "Is there sugar in wine?",
          a: (c) =>
            `Dry wine contains little sugar: ${c.per100("wijnRood").sugars} g per 100 ml in red wine and ${c.per100("wijnWit").sugars} g in dry white wine. Medium-sweet and sweet wines contain much more.`,
        },
        {
          q: "Can you drink wine when you want to lose weight?",
          a: "Yes, nothing is off limits. Wine does count towards your calories, and alcohol makes it harder to say no to snacks. The less you drink, the more room you have left for food that does fill you up.",
        },
      ],
    },
    comparisons: ["bier", "bier00", "cola", "sinaasappelsap"],
  },

  // ───────────────────────────── Brood
  {
    slug: "brood",
    foods: ["volkorenBrood", "witBrood"],
    keyword: "calorieën brood",
    label: { nl: "Calorieën brood", en: "Calories in bread" },
    title: { nl: "Calorieën brood: hoeveel kcal zit er in een boterham?", en: "Calories in bread: how many kcal are in a slice of bread?" },
    metaTitle: { nl: "Calorieën brood: kcal per snee volkoren en wit", en: "Calories in bread: kcal per slice, wholemeal and white" },
    metaDescription: {
      nl: (c) =>
        `Een snee volkoren brood bevat ± ${c.portion("volkorenBrood").kcal} kcal, wit brood ± ${c.portion("witBrood").kcal} kcal. Bekijk de voedingswaarde per 100 g, de calorieën van beleg en tips voor een lichtere lunch.`,
      en: (c) =>
        `A slice of wholemeal bread contains ± ${c.portion("volkorenBrood").kcal} kcal, white bread ± ${c.portion("witBrood").kcal} kcal. See the nutrition per 100 g, the calories in toppings and tips for a lighter lunch.`,
    },
    intro: {
      nl: "Brood is voor veel mensen de basis van ontbijt en lunch. Hoeveel calorieën heeft een boterham, en scheelt volkoren veel met wit brood? Hier vind je de voedingswaarde per snee en per 100 gram, plus de calorieën van beleg.",
      en: "For many people, bread is the basis of breakfast and lunch. How many calories are in a slice, and is wholemeal very different from white bread? Here you'll find the nutritional values per slice and per 100 grams, plus the calories in toppings.",
    },
    short: {
      nl: (c) => {
        const v = c.portion("volkorenBrood");
        const w = c.portion("witBrood");
        return `Een snee volkoren brood (± ${v.amount}) bevat ± ${v.kcal} kcal en ${v.protein} g eiwit; een snee wit brood ± ${w.kcal} kcal en ${w.protein} g eiwit. Volkoren brood heeft meer vezels: ${v.fiber} g per snee, tegenover ${w.fiber} g bij wit brood. Beleg en boter komen daar nog bij.`;
      },
      en: (c) => {
        const v = c.portion("volkorenBrood");
        const w = c.portion("witBrood");
        return `A slice of wholemeal bread (± ${v.amount}) contains ± ${v.kcal} kcal and ${v.protein} g of protein; a slice of white bread ± ${w.kcal} kcal and ${w.protein} g of protein. Wholemeal bread has more fibre: ${v.fiber} g per slice, compared with ${w.fiber} g for white bread. Toppings and butter come on top of that.`;
      },
    },
    tableTitle: { nl: "Voedingswaarde brood per 100 gram en per snee", en: "Bread nutrition per 100 grams and per slice" },
    compareTitle: { nl: "Brood vergeleken met wraps, rijstwafels en ontbijtgranen", en: "Bread compared with wraps, rice cakes and breakfast cereals" },
    sections: {
      nl: [
        {
          title: "Calorieën van beleg",
          paragraphs: [
            (c) =>
              `Wat je op je boterham doet, telt mee. Een snee volkoren met een plak kaas 30+ is samen ± ${c.sum("volkorenBrood", "kaas30").kcal} kcal. Zo tellen veelgebruikte beleggen mee:`,
          ],
          bullets: [
            (c) => `Plak kaas 30+ (${c.portion("kaas30").amount}): ± ${c.portion("kaas30").kcal} kcal`,
            (c) => `Kipfilet, 2 plakjes (${c.portion("kipfiletBeleg").amount}): ± ${c.portion("kipfiletBeleg").kcal} kcal`,
            (c) => `Pindakaas, dun besmeerd (${c.portion("pindakaas").amount}): ± ${c.portion("pindakaas").kcal} kcal`,
            (c) => `Halve avocado (${c.portion("avocado").amount}): ± ${c.portion("avocado").kcal} kcal`,
            (c) => `Gekookt ei (${c.portion("ei").amount}): ± ${c.portion("ei").kcal} kcal`,
            (c) => `Hummus, 2 eetlepels (${c.portion("hummus").amount}): ± ${c.portion("hummus").kcal} kcal`,
          ],
        },
        {
          title: "Volkoren, bruin of wit?",
          paragraphs: [
            "Volkoren brood wordt gemaakt van de hele graankorrel en bevat daardoor de meeste vezels. Bruin brood is iets anders: daarin zit maar een deel volkorenmeel. Wit brood is gemaakt van bloem zonder zemelen.",
            "In calorieën scheelt het per snee weinig. Het verschil zit vooral in de vezels, waardoor je langer een vol gevoel hebt. Volkoren brood staat daarom in de Schijf van Vijf, wit brood niet.",
          ],
        },
      ],
      en: [
        {
          title: "Calories in toppings",
          paragraphs: [
            (c) =>
              `What you put on your bread counts too. A slice of wholemeal with a slice of reduced-fat cheese comes to ± ${c.sum("volkorenBrood", "kaas30").kcal} kcal together. This is how common toppings add up:`,
          ],
          bullets: [
            (c) => `Slice of reduced-fat cheese (${c.portion("kaas30").amount}): ± ${c.portion("kaas30").kcal} kcal`,
            (c) => `Sliced chicken, 2 slices (${c.portion("kipfiletBeleg").amount}): ± ${c.portion("kipfiletBeleg").kcal} kcal`,
            (c) => `Peanut butter, thinly spread (${c.portion("pindakaas").amount}): ± ${c.portion("pindakaas").kcal} kcal`,
            (c) => `Half an avocado (${c.portion("avocado").amount}): ± ${c.portion("avocado").kcal} kcal`,
            (c) => `Boiled egg (${c.portion("ei").amount}): ± ${c.portion("ei").kcal} kcal`,
            (c) => `Hummus, 2 tablespoons (${c.portion("hummus").amount}): ± ${c.portion("hummus").kcal} kcal`,
          ],
        },
        {
          title: "Wholemeal, brown or white?",
          paragraphs: [
            "Wholemeal bread is made from the whole grain and therefore contains the most fibre. Brown bread is something else: it contains only part wholemeal flour. White bread is made from flour without the bran.",
            "In calories, there's little difference per slice. The difference is mainly the fibre, which helps you feel full for longer. That's why wholemeal bread is in the Dutch dietary guidelines (the Wheel of Five) and white bread isn't.",
          ],
        },
      ],
    },
    fit: {
      nl: {
        title: "Past brood in een afvalschema?",
        paragraphs: [
          "Ja. Brood is niet dikmakend op zich. Waar het snel oploopt, is bij veel boter, vette kaas, vette vleeswaren en zoet beleg. Met mager, eiwitrijk beleg en groente erbij is volkoren brood een prima basis.",
        ],
        bullets: [
          "Kies volkoren brood voor meer vezels.",
          "Kies mager, eiwitrijk beleg: kipfilet, kaas 30+, hüttenkäse, ei of hummus.",
          "Leg er groente op of eet het erbij: komkommer, tomaat, paprika of sla.",
          "Smeer dun, of laat de boter weg als je beleg al smeuïg is, zoals avocado of hummus.",
        ],
      },
      en: {
        title: "Does bread fit into a weight-loss plan?",
        paragraphs: [
          "Yes. Bread isn't fattening in itself. Where it adds up quickly is with lots of butter, full-fat cheese, fatty cold cuts and sweet spreads. With lean, high-protein toppings and vegetables on the side, wholemeal bread is a great basis.",
        ],
        bullets: [
          "Choose wholemeal bread for more fibre.",
          "Choose lean, high-protein toppings: sliced chicken, reduced-fat cheese, cottage cheese, egg or hummus.",
          "Add vegetables on top or on the side: cucumber, tomato, pepper or salad leaves.",
          "Spread thinly, or skip the butter if your topping is already creamy, such as avocado or hummus.",
        ],
      },
    },
    faq: {
      nl: [
        {
          q: "Hoeveel calorieën zit er in een boterham?",
          a: (c) =>
            `Een snee volkoren brood (± ${c.portion("volkorenBrood").amount}) bevat ± ${c.portion("volkorenBrood").kcal} kcal, een snee wit brood ± ${c.portion("witBrood").kcal} kcal. Met een plak kaas 30+ kom je op ± ${c.sum("volkorenBrood", "kaas30").kcal} kcal, met dun besmeerde pindakaas op ± ${c.sum("volkorenBrood", "pindakaas").kcal} kcal.`,
        },
        {
          q: "Heeft volkoren brood minder calorieën dan wit brood?",
          a: (c) =>
            `Een beetje: ${c.per100("volkorenBrood").kcal} kcal per 100 gram tegenover ${c.per100("witBrood").kcal} kcal voor wit brood, ofwel ± ${c.portion("volkorenBrood").kcal} tegenover ${c.portion("witBrood").kcal} kcal per snee. Het grootste verschil zit in de vezels: ${c.per100("volkorenBrood").fiber} g tegenover ${c.per100("witBrood").fiber} g per 100 gram.`,
        },
        {
          q: "Is brood dikmakend?",
          a: "Nee, brood maakt je niet dik. Je komt aan als je langere tijd meer calorieën binnenkrijgt dan je verbruikt. Volkoren brood met mager beleg past prima in een afvalschema.",
        },
        {
          q: "Hoeveel boterhammen per dag mag ik eten?",
          a: "Dat hangt af van je caloriebehoefte en van wat je verder eet. Bereken eerst hoeveel calorieën je per dag nodig hebt en verdeel die over je maaltijden. In een voedingsschema is dat al voor je uitgerekend.",
        },
      ],
      en: [
        {
          q: "How many calories are in a slice of bread?",
          a: (c) =>
            `A slice of wholemeal bread (± ${c.portion("volkorenBrood").amount}) contains ± ${c.portion("volkorenBrood").kcal} kcal, a slice of white bread ± ${c.portion("witBrood").kcal} kcal. With a slice of reduced-fat cheese it comes to ± ${c.sum("volkorenBrood", "kaas30").kcal} kcal, with thinly spread peanut butter ± ${c.sum("volkorenBrood", "pindakaas").kcal} kcal.`,
        },
        {
          q: "Does wholemeal bread have fewer calories than white bread?",
          a: (c) =>
            `A little: ${c.per100("volkorenBrood").kcal} kcal per 100 grams versus ${c.per100("witBrood").kcal} kcal for white bread, or ± ${c.portion("volkorenBrood").kcal} versus ${c.portion("witBrood").kcal} kcal per slice. The biggest difference is the fibre: ${c.per100("volkorenBrood").fiber} g versus ${c.per100("witBrood").fiber} g per 100 grams.`,
        },
        {
          q: "Is bread fattening?",
          a: "No, bread doesn't make you gain weight. You gain weight when you take in more calories than you use over a longer period. Wholemeal bread with lean toppings fits well into a weight-loss plan.",
        },
        {
          q: "How many slices of bread can I eat a day?",
          a: "That depends on your calorie needs and what else you eat. First work out how many calories you need a day and divide them over your meals. In a nutrition plan, that's already worked out for you.",
        },
      ],
    },
    comparisons: ["volkorenWrap", "rijstwafel", "havermout", "muesli"],
  },

  // ───────────────────────────── Pasta
  {
    slug: "pasta",
    foods: ["pastaOngekookt", "pastaGekookt", "volkorenPastaOngekookt"],
    keyword: "calorieën pasta",
    label: { nl: "Calorieën pasta", en: "Calories in pasta" },
    title: { nl: "Calorieën pasta: hoeveel kcal zit er in pasta, ongekookt en gekookt?", en: "Calories in pasta: how many kcal, uncooked and cooked?" },
    metaTitle: { nl: "Calorieën pasta: ongekookt, gekookt en volkoren", en: "Calories in pasta: uncooked, cooked and wholewheat" },
    metaDescription: {
      nl: (c) =>
        `Ongekookte pasta bevat ${c.per100("pastaOngekookt").kcal} kcal per 100 g, gekookt ${c.per100("pastaGekookt").kcal} kcal. Een portie (${c.portion("pastaOngekookt").amount}) is ± ${c.portion("pastaOngekookt").kcal} kcal. Met volkoren pasta, sauzen en porties per persoon.`,
      en: (c) =>
        `Uncooked pasta has ${c.per100("pastaOngekookt").kcal} kcal per 100 g, cooked ${c.per100("pastaGekookt").kcal} kcal. A portion (${c.portion("pastaOngekookt").amount}) is ± ${c.portion("pastaOngekookt").kcal} kcal. With wholewheat pasta, sauces and portions per person.`,
    },
    intro: {
      nl: "Pasta is snel, goedkoop en bijna iedereen vindt het lekker. Maar hoeveel calorieën heeft een bord pasta, en reken je met ongekookt of gekookt? Hier vind je de voedingswaarde van gewone en volkoren pasta.",
      en: "Pasta is quick, cheap and almost everyone likes it. But how many calories are in a plate of pasta, and do you count it uncooked or cooked? Here you'll find the nutritional values of regular and wholewheat pasta.",
    },
    short: {
      nl: (c) => {
        const u = c.portion("pastaOngekookt");
        const v = c.portion("volkorenPastaOngekookt");
        return `Ongekookte pasta bevat ${c.per100("pastaOngekookt").kcal} kcal per 100 gram, gekookte pasta ${c.per100("pastaGekookt").kcal} kcal. Een portie van ${u.amount} ongekookt (± ${c.portion("pastaGekookt").amount} gekookt) levert ± ${u.kcal} kcal en ${u.protein} g eiwit. Volkoren pasta heeft ongeveer evenveel calorieën (± ${v.kcal} kcal per portie), maar meer vezels: ${v.fiber} g in plaats van ${u.fiber} g.`;
      },
      en: (c) => {
        const u = c.portion("pastaOngekookt");
        const v = c.portion("volkorenPastaOngekookt");
        return `Uncooked pasta contains ${c.per100("pastaOngekookt").kcal} kcal per 100 grams, cooked pasta ${c.per100("pastaGekookt").kcal} kcal. A portion of ${u.amount} uncooked (± ${c.portion("pastaGekookt").amount} cooked) provides ± ${u.kcal} kcal and ${u.protein} g of protein. Wholewheat pasta has about the same calories (± ${v.kcal} kcal per portion), but more fibre: ${v.fiber} g instead of ${u.fiber} g.`;
      },
    },
    tableTitle: { nl: "Voedingswaarde pasta per 100 gram en per portie", en: "Pasta nutrition per 100 grams and per portion" },
    compareTitle: { nl: "Pasta vergeleken met rijst, aardappelen en andere granen", en: "Pasta compared with rice, potatoes and other grains" },
    sections: {
      nl: [
        {
          title: "De saus maakt het verschil",
          paragraphs: ["Een bord pasta wordt vooral zwaar door wat erop gaat. Zo tellen veelgebruikte toevoegingen mee:"],
          bullets: [
            (c) => `Blik tomatenblokjes (${c.portion("tomatenblokjes").amount}, voor 2 personen): ± ${c.portion("tomatenblokjes").kcal} kcal per blik`,
            (c) => `1 eetlepel pesto (${c.portion("pesto").amount}): ± ${c.portion("pesto").kcal} kcal`,
            (c) => `1 eetlepel olijfolie (${c.portion("olijfolie").amount}): ± ${c.portion("olijfolie").kcal} kcal`,
            (c) => `Mager rundergehakt (${c.portion("rundergehakt").amount}): ± ${c.portion("rundergehakt").kcal} kcal`,
            "Roomsaus en geraspte kaas: vaak veel calorieën, omdat er veel vet in zit.",
          ],
        },
        {
          title: "Hoeveel pasta per persoon?",
          paragraphs: [
            (c) =>
              `Een gangbare portie is ${c.portion("pastaOngekookt").amount} ongekookte pasta per persoon voor een hoofdmaaltijd (± ${c.portion("pastaOngekookt").kcal} kcal). Eet je er veel groente bij, dan is 60 gram (± ${c.at("pastaOngekookt", 60).kcal} kcal) vaak ook genoeg. Weeg ongekookt af: ${c.portion("pastaOngekookt").amount} ongekookt is ± ${c.portion("pastaGekookt").amount} gekookt.`,
          ],
        },
      ],
      en: [
        {
          title: "The sauce makes the difference",
          paragraphs: ["A plate of pasta gets heavy mainly from what goes on it. This is how common additions add up:"],
          bullets: [
            (c) => `Tin of chopped tomatoes (${c.portion("tomatenblokjes").amount}, for 2 people): ± ${c.portion("tomatenblokjes").kcal} kcal per tin`,
            (c) => `1 tablespoon of pesto (${c.portion("pesto").amount}): ± ${c.portion("pesto").kcal} kcal`,
            (c) => `1 tablespoon of olive oil (${c.portion("olijfolie").amount}): ± ${c.portion("olijfolie").kcal} kcal`,
            (c) => `Lean beef mince (${c.portion("rundergehakt").amount}): ± ${c.portion("rundergehakt").kcal} kcal`,
            "Cream sauce and grated cheese: often a lot of calories, because they contain a lot of fat.",
          ],
        },
        {
          title: "How much pasta per person?",
          paragraphs: [
            (c) =>
              `A common portion is ${c.portion("pastaOngekookt").amount} of uncooked pasta per person for a main meal (± ${c.portion("pastaOngekookt").kcal} kcal). If you eat plenty of vegetables with it, 60 grams (± ${c.at("pastaOngekookt", 60).kcal} kcal) is often enough too. Weigh it uncooked: ${c.portion("pastaOngekookt").amount} uncooked is ± ${c.portion("pastaGekookt").amount} cooked.`,
          ],
        },
      ],
    },
    fit: {
      nl: {
        title: "Past pasta in een afvalschema?",
        paragraphs: ["Ja. Pasta is niet dikmakend op zich; het gaat om de portie en de saus. Met een afgewogen portie, veel groente en een magere eiwitbron is pasta een prima avondmaaltijd."],
        bullets: [
          "Weeg je pasta ongekookt af.",
          "Vul de helft van je bord met groente: courgette, paprika, spinazie of champignons in de saus.",
          (c) => `Kies een magere eiwitbron, zoals kipfilet, tonijn (${c.portion("tonijn").amount}: ± ${c.portion("tonijn").kcal} kcal) of linzen.`,
          "Kies vaker volkoren pasta voor meer vezels.",
        ],
      },
      en: {
        title: "Does pasta fit into a weight-loss plan?",
        paragraphs: ["Yes. Pasta isn't fattening in itself; it's about the portion and the sauce. With a weighed portion, plenty of vegetables and a lean source of protein, pasta makes a great evening meal."],
        bullets: [
          "Weigh your pasta uncooked.",
          "Fill half your plate with vegetables: courgette, pepper, spinach or mushrooms in the sauce.",
          (c) => `Choose a lean source of protein, such as chicken breast, tuna (${c.portion("tonijn").amount}: ± ${c.portion("tonijn").kcal} kcal) or lentils.`,
          "Choose wholewheat pasta more often for more fibre.",
        ],
      },
    },
    faq: {
      nl: [
        {
          q: "Hoeveel calorieën zit er in 100 gram gekookte pasta?",
          a: (c) =>
            `100 gram gekookte pasta bevat ± ${c.at("pastaGekookt", 100).kcal} kcal. Ongekookt is dat ${c.per100("pastaOngekookt").kcal} kcal per 100 gram, omdat er nog geen water in zit.`,
        },
        {
          q: "Hoeveel calorieën heeft een bord pasta bolognese?",
          a: (c) => {
            const s = c.sum("pastaOngekookt", ["rundergehakt", 100], ["tomatenblokjes", 200], ["ui", 50], ["olijfolie", 5]);
            return `Een bord met ${c.portion("pastaOngekookt").amount} pasta, 100 g mager rundergehakt, een half blik tomatenblokjes, een halve ui en een theelepel olie bevat ± ${s.kcal} kcal en ${s.protein} g eiwit. Met extra groente erdoor wordt het bord voller, zonder veel calorieën extra.`;
          },
        },
        {
          q: "Heeft volkoren pasta minder calorieën?",
          a: (c) =>
            `Een beetje: ${c.per100("volkorenPastaOngekookt").kcal} tegenover ${c.per100("pastaOngekookt").kcal} kcal per 100 gram ongekookt. Het grootste verschil zit in de vezels: ${c.per100("volkorenPastaOngekookt").fiber} g tegenover ${c.per100("pastaOngekookt").fiber} g per 100 gram. Daardoor vult volkoren pasta beter.`,
        },
        {
          q: "Is pasta dikmakend?",
          a: "Nee, één product maakt je niet dik. Pasta past prima in een afvalschema als je de portie afweegt en kiest voor een saus met groente in plaats van room.",
        },
      ],
      en: [
        {
          q: "How many calories are in 100 grams of cooked pasta?",
          a: (c) =>
            `100 grams of cooked pasta contains ± ${c.at("pastaGekookt", 100).kcal} kcal. Uncooked, it's ${c.per100("pastaOngekookt").kcal} kcal per 100 grams, because there's no water in it yet.`,
        },
        {
          q: "How many calories are in a plate of spaghetti bolognese?",
          a: (c) => {
            const s = c.sum("pastaOngekookt", ["rundergehakt", 100], ["tomatenblokjes", 200], ["ui", 50], ["olijfolie", 5]);
            return `A plate with ${c.portion("pastaOngekookt").amount} of pasta, 100 g of lean beef mince, half a tin of chopped tomatoes, half an onion and a teaspoon of oil contains ± ${s.kcal} kcal and ${s.protein} g of protein. Adding extra vegetables makes the plate fuller without many extra calories.`;
          },
        },
        {
          q: "Does wholewheat pasta have fewer calories?",
          a: (c) =>
            `A little: ${c.per100("volkorenPastaOngekookt").kcal} versus ${c.per100("pastaOngekookt").kcal} kcal per 100 grams uncooked. The biggest difference is the fibre: ${c.per100("volkorenPastaOngekookt").fiber} g versus ${c.per100("pastaOngekookt").fiber} g per 100 grams. That makes wholewheat pasta more filling.`,
        },
        {
          q: "Is pasta fattening?",
          a: "No, no single food makes you gain weight. Pasta fits well into a weight-loss plan if you weigh the portion and choose a vegetable-based sauce instead of cream.",
        },
      ],
    },
    comparisons: ["rijstOngekookt", "aardappel", "couscousOngekookt", "quinoaOngekookt"],
  },

  // ───────────────────────────── Pindakaas
  {
    slug: "pindakaas",
    foods: ["pindakaas"],
    keyword: "calorieën pindakaas",
    label: { nl: "Calorieën pindakaas", en: "Calories in peanut butter" },
    title: { nl: "Calorieën pindakaas: hoeveel kcal zit er in pindakaas?", en: "Calories in peanut butter: how many kcal per slice and spoon?" },
    metaTitle: { nl: "Calorieën pindakaas: kcal per boterham en eetlepel", en: "Calories in peanut butter: per slice and per spoon" },
    metaDescription: {
      nl: (c) =>
        `Pindakaas bevat ${c.per100("pindakaas").kcal} kcal per 100 g. Dun besmeerd op een boterham is dat ± ${c.portion("pindakaas").kcal} kcal en ${c.portion("pindakaas").protein} g eiwit. Met porties en of het past als je afvalt.`,
      en: (c) =>
        `Peanut butter contains ${c.per100("pindakaas").kcal} kcal per 100 g. Thinly spread on a slice of bread, that's ± ${c.portion("pindakaas").kcal} kcal and ${c.portion("pindakaas").protein} g of protein. With portions and tips for weight loss.`,
    },
    intro: {
      nl: "Pindakaas is een van de populairste broodbeleggen van Nederland. Het is eiwitrijk, maar ook calorierijk. Hoeveel kcal zit er in een boterham met pindakaas? Hier vind je de voedingswaarde per portie en per 100 gram.",
      en: "Peanut butter is one of the most popular sandwich spreads in the Netherlands. It's high in protein, but also high in calories. How many calories are in a slice with peanut butter? Here you'll find the nutritional values per portion and per 100 grams.",
    },
    short: {
      nl: (c) => {
        const p = c.portion("pindakaas");
        return `Pindakaas bevat ${c.per100("pindakaas").kcal} kcal per 100 gram. Dun besmeerd op een boterham (± ${p.amount}) is dat ± ${p.kcal} kcal en ${p.protein} g eiwit; dik besmeerd (± 30 g) al ± ${c.at("pindakaas", 30).kcal} kcal. De meeste calorieën komen uit vet, vooral onverzadigd vet uit de pinda's.`;
      },
      en: (c) => {
        const p = c.portion("pindakaas");
        return `Peanut butter contains ${c.per100("pindakaas").kcal} kcal per 100 grams. Thinly spread on a slice of bread (± ${p.amount}), that's ± ${p.kcal} kcal and ${p.protein} g of protein; thickly spread (± 30 g) it's already ± ${c.at("pindakaas", 30).kcal} kcal. Most of the calories come from fat, mainly unsaturated fat from the peanuts.`;
      },
    },
    tableTitle: { nl: "Voedingswaarde pindakaas per 100 gram en per boterham", en: "Peanut butter nutrition per 100 grams and per slice" },
    compareTitle: { nl: "Pindakaas vergeleken met ander beleg", en: "Peanut butter compared with other toppings" },
    sections: {
      nl: [
        {
          title: "Dun of dik besmeerd",
          paragraphs: ["Bij pindakaas maakt de dikte van de laag veel uit. Weeg het een keer af, dan weet je hoe jij smeert:"],
          bullets: [
            (c) => `Dun besmeerd (± ${c.portion("pindakaas").amount}): ± ${c.portion("pindakaas").kcal} kcal`,
            (c) => `Normaal besmeerd (± 20 g): ± ${c.at("pindakaas", 20).kcal} kcal`,
            (c) => `Dik besmeerd (± 30 g): ± ${c.at("pindakaas", 30).kcal} kcal`,
            (c) => `Een snee volkoren brood met dun pindakaas: samen ± ${c.sum("volkorenBrood", "pindakaas").kcal} kcal`,
          ],
        },
        {
          title: "Pindakaas met of zonder toevoegingen",
          paragraphs: [
            "De pindakaas op deze pagina is van 100% pinda's. Veel gewone pindakaas bevat daarnaast zout, suiker of palmolie. In calorieën scheelt dat weinig, maar zonder toevoegingen eet je alleen pinda. Pindakaas van 100% pinda's, zonder toegevoegd zout en suiker, past in de Schijf van Vijf.",
          ],
        },
      ],
      en: [
        {
          title: "Thinly or thickly spread",
          paragraphs: ["With peanut butter, the thickness of the layer makes a big difference. Weigh it once, so you know how you spread:"],
          bullets: [
            (c) => `Thinly spread (± ${c.portion("pindakaas").amount}): ± ${c.portion("pindakaas").kcal} kcal`,
            (c) => `Normally spread (± 20 g): ± ${c.at("pindakaas", 20).kcal} kcal`,
            (c) => `Thickly spread (± 30 g): ± ${c.at("pindakaas", 30).kcal} kcal`,
            (c) => `A slice of wholemeal bread with thinly spread peanut butter: ± ${c.sum("volkorenBrood", "pindakaas").kcal} kcal together`,
          ],
        },
        {
          title: "Peanut butter with or without additives",
          paragraphs: [
            "The peanut butter on this page is made from 100% peanuts. Many regular peanut butters also contain salt, sugar or palm oil. In calories, that makes little difference, but without additives you're eating only peanuts. Peanut butter made from 100% peanuts, without added salt and sugar, fits the Dutch dietary guidelines (the Wheel of Five).",
          ],
        },
      ],
    },
    fit: {
      nl: {
        title: "Past pindakaas in een afvalschema?",
        paragraphs: [
          "Ja, als je let op de portie. Pindakaas geeft eiwit en vet, en daarmee een vol gevoel, maar door de vele calorieën per gram tikt een dikke laag snel aan.",
        ],
        bullets: [
          (c) => `Smeer dun: ${c.portion("pindakaas").amount} is genoeg voor een snee brood.`,
          (c) => `Combineer met fruit: pindakaas op partjes appel is samen ± ${c.sum("appel", "pindakaas").kcal} kcal.`,
          "Roer een theelepel door je havermout of kwark voor een nootachtige smaak.",
          "Gebruik pindakaas in een saus, bijvoorbeeld met sojasaus en limoen voor een saté- of wokgerecht.",
        ],
      },
      en: {
        title: "Does peanut butter fit into a weight-loss plan?",
        paragraphs: [
          "Yes, if you watch the portion. Peanut butter provides protein and fat, and with them a full feeling, but because of the many calories per gram, a thick layer adds up quickly.",
        ],
        bullets: [
          (c) => `Spread thinly: ${c.portion("pindakaas").amount} is enough for a slice of bread.`,
          (c) => `Pair it with fruit: peanut butter on apple slices comes to ± ${c.sum("appel", "pindakaas").kcal} kcal together.`,
          "Stir a teaspoon into your porridge or quark for a nutty flavour.",
          "Use peanut butter in a sauce, for example with soy sauce and lime for a satay or stir-fry.",
        ],
      },
    },
    faq: {
      nl: [
        {
          q: "Hoeveel calorieën zitten er in een eetlepel pindakaas?",
          a: (c) =>
            `Een afgestreken eetlepel pindakaas weegt ± 15 gram en bevat ± ${c.at("pindakaas", 15).kcal} kcal. Een volle, opgehoopte eetlepel kan zomaar 25 gram zijn: ± ${c.at("pindakaas", 25).kcal} kcal.`,
        },
        {
          q: "Hoeveel eiwit zit er in pindakaas?",
          a: (c) =>
            `Pindakaas bevat ${c.per100("pindakaas").protein} g eiwit per 100 gram, dus ± ${c.portion("pindakaas").protein} g per dun besmeerde boterham. Dat is een mooie aanvulling, maar door de calorieën geen zuinige eiwitbron: magere kwark of kipfilet geven meer eiwit voor minder calorieën.`,
        },
        {
          q: "Is pindakaas dikmakend?",
          a: "Nee, één product maakt je niet dik. Pindakaas heeft wel veel calorieën per gram, dus het loont om dun te smeren. Met een afgewogen portie past het prima in een afvalschema.",
        },
        {
          q: "Is pindakaas gezond?",
          a: "Pindakaas van 100% pinda's bevat eiwit, vezels en vooral onverzadigd vet, en past in de Schijf van Vijf. Kies bij voorkeur een variant zonder toegevoegd zout en suiker, en let op de portie.",
        },
      ],
      en: [
        {
          q: "How many calories are in a tablespoon of peanut butter?",
          a: (c) =>
            `A level tablespoon of peanut butter weighs ± 15 grams and contains ± ${c.at("pindakaas", 15).kcal} kcal. A heaped tablespoon can easily be 25 grams: ± ${c.at("pindakaas", 25).kcal} kcal.`,
        },
        {
          q: "How much protein is in peanut butter?",
          a: (c) =>
            `Peanut butter contains ${c.per100("pindakaas").protein} g of protein per 100 grams, so ± ${c.portion("pindakaas").protein} g per thinly spread slice. That's a nice addition, but given the calories it isn't an efficient source of protein: low-fat quark or chicken breast give you more protein for fewer calories.`,
        },
        {
          q: "Is peanut butter fattening?",
          a: "No, no single food makes you gain weight. Peanut butter does have a lot of calories per gram, so it pays to spread it thinly. With a measured portion, it fits well into a weight-loss plan.",
        },
        {
          q: "Is peanut butter healthy?",
          a: "Peanut butter made from 100% peanuts contains protein, fibre and mostly unsaturated fat, and fits the Dutch dietary guidelines. Ideally choose one without added salt and sugar, and watch the portion.",
        },
      ],
    },
    comparisons: ["hummus", "kaas30", "avocado", "amandelen"],
  },

  // ───────────────────────────── Kwark
  {
    slug: "kwark",
    foods: ["kwarkMager"],
    keyword: "calorieën kwark",
    label: { nl: "Calorieën kwark", en: "Calories in quark" },
    title: { nl: "Calorieën kwark: hoeveel kcal en eiwit zit er in magere kwark?", en: "Calories in quark: how many kcal and how much protein?" },
    metaTitle: { nl: "Calorieën kwark: kcal en eiwit in magere kwark", en: "Calories in quark: kcal and protein in low-fat quark" },
    metaDescription: {
      nl: (c) =>
        `Magere kwark bevat ${c.per100("kwarkMager").kcal} kcal en ${c.per100("kwarkMager").protein} g eiwit per 100 g; een bakje van ${c.portion("kwarkMager").amount} ± ${c.portion("kwarkMager").kcal} kcal en ${c.portion("kwarkMager").protein} g eiwit. Vergelijk met skyr, yoghurt en hüttenkäse.`,
      en: (c) =>
        `Low-fat quark contains ${c.per100("kwarkMager").kcal} kcal and ${c.per100("kwarkMager").protein} g of protein per 100 g; a ${c.portion("kwarkMager").amount} tub ± ${c.portion("kwarkMager").kcal} kcal and ${c.portion("kwarkMager").protein} g. Compare with skyr, yoghurt and cottage cheese.`,
    },
    intro: {
      nl: "Magere kwark is een favoriet bij iedereen die op eiwit let. Het is goedkoop, vult goed en je kunt er alle kanten mee op. Hier vind je de calorieën en het eiwit per schaaltje, per bakje en per 100 gram.",
      en: "Low-fat quark is a favourite with anyone watching their protein. It's cheap, filling and very versatile. Here you'll find the calories and protein per bowl, per tub and per 100 grams.",
    },
    short: {
      nl: (c) => {
        const s = c.portion("kwarkMager", 1);
        const b = c.portion("kwarkMager");
        return `Magere kwark bevat ${c.per100("kwarkMager").kcal} kcal en ${c.per100("kwarkMager").protein} g eiwit per 100 gram. Een schaaltje (${s.amount}) is ± ${s.kcal} kcal met ${s.protein} g eiwit, een bakje (${b.amount}) ± ${b.kcal} kcal met ${b.protein} g eiwit. Daarmee krijg je veel eiwit voor weinig calorieën.`;
      },
      en: (c) => {
        const s = c.portion("kwarkMager", 1);
        const b = c.portion("kwarkMager");
        return `Low-fat quark contains ${c.per100("kwarkMager").kcal} kcal and ${c.per100("kwarkMager").protein} g of protein per 100 grams. A bowl (${s.amount}) is ± ${s.kcal} kcal with ${s.protein} g of protein, a tub (${b.amount}) ± ${b.kcal} kcal with ${b.protein} g of protein. That gives you a lot of protein for few calories.`;
      },
    },
    tableTitle: { nl: "Voedingswaarde magere kwark per 100 gram en per portie", en: "Low-fat quark nutrition per 100 grams and per portion" },
    compareTitle: { nl: "Kwark vergeleken met skyr, yoghurt en hüttenkäse", en: "Quark compared with skyr, yoghurt and cottage cheese" },
    sections: {
      nl: [
        {
          title: "Magere, halfvolle of volle kwark",
          paragraphs: [
            "Halfvolle en volle kwark bevatten meer vet, en daardoor meer calorieën. Het eiwit blijft ongeveer gelijk. Wil je zoveel mogelijk eiwit voor zo weinig mogelijk calorieën, dan is magere kwark de handigste keuze.",
            "Let op bij vruchtenkwark en kwarktoetjes uit de koeling: daar zit vaak toegevoegde suiker in. Maak het liever zelf met magere kwark en vers fruit.",
          ],
        },
        {
          title: "Kwark of skyr?",
          paragraphs: [
            (c) =>
              `Skyr is een IJslands zuivelproduct dat veel op kwark lijkt. Per 100 gram bevat skyr iets meer eiwit (${c.per100("skyr").protein} g) en iets meer calorieën (${c.per100("skyr").kcal} kcal) dan magere kwark. Skyr is vaak wat romiger en duurder. Kies gewoon wat je het lekkerst vindt.`,
          ],
        },
      ],
      en: [
        {
          title: "Low-fat, semi-skimmed or full-fat quark",
          paragraphs: [
            "Semi-skimmed and full-fat quark contain more fat, and therefore more calories. The protein stays about the same. If you want as much protein as possible for as few calories as possible, low-fat quark is the easiest choice.",
            "Watch out with fruit quark and chilled quark desserts: they often contain added sugar. It's better to make your own with low-fat quark and fresh fruit.",
          ],
        },
        {
          title: "Quark or skyr?",
          paragraphs: [
            (c) =>
              `Skyr is an Icelandic dairy product that's very similar to quark. Per 100 grams, skyr contains slightly more protein (${c.per100("skyr").protein} g) and slightly more calories (${c.per100("skyr").kcal} kcal) than low-fat quark. Skyr is often a little creamier and more expensive. Just choose the one you like best.`,
          ],
        },
      ],
    },
    fit: {
      nl: {
        title: "Past kwark in een afvalschema?",
        paragraphs: [
          "Ja, heel goed. Magere kwark geeft veel eiwit voor weinig calorieën, en eiwit helpt je langer vol te zitten. Je kunt kwark eten als ontbijt, als tussendoortje of als toetje.",
        ],
        bullets: [
          (c) => {
            const s = c.sum(["kwarkMager", c.portion("kwarkMager", 1).grams], "blauweBessen", ["havermout", 10]);
            return `Kwarkbowl: een schaaltje kwark met een handje blauwe bessen en een eetlepel havermout is samen ± ${s.kcal} kcal en ${s.protein} g eiwit.`;
          },
          "Maak kwark op smaak met kaneel, vanille of een beetje honing.",
          "Gebruik kwark in hartige gerechten, als dip met kruiden of als basis voor een dressing.",
          "Eet een schaaltje kwark als toetje in plaats van vla of pudding.",
        ],
      },
      en: {
        title: "Does quark fit into a weight-loss plan?",
        paragraphs: [
          "Yes, very well. Low-fat quark gives you a lot of protein for few calories, and protein helps you stay full for longer. You can have quark for breakfast, as a snack or as a dessert.",
        ],
        bullets: [
          (c) => {
            const s = c.sum(["kwarkMager", c.portion("kwarkMager", 1).grams], "blauweBessen", ["havermout", 10]);
            return `Quark bowl: a bowl of quark with a handful of blueberries and a tablespoon of oats comes to ± ${s.kcal} kcal and ${s.protein} g of protein.`;
          },
          "Flavour quark with cinnamon, vanilla or a little honey.",
          "Use quark in savoury dishes, as a herb dip or as the base for a dressing.",
          "Have a bowl of quark for dessert instead of custard or pudding.",
        ],
      },
    },
    faq: {
      nl: [
        {
          q: "Hoeveel calorieën zit er in een bakje kwark?",
          a: (c) =>
            `Een bakje magere kwark van ${c.portion("kwarkMager").amount} bevat ± ${c.portion("kwarkMager").kcal} kcal en ${c.portion("kwarkMager").protein} g eiwit. Een groot bakje van 500 g bevat ± ${c.at("kwarkMager", 500).kcal} kcal en ${c.at("kwarkMager", 500).protein} g eiwit. Halfvolle en volle kwark hebben meer calorieën, door het extra vet.`,
        },
        {
          q: "Hoeveel eiwit zit er in kwark?",
          a: (c) =>
            `Magere kwark bevat ${c.per100("kwarkMager").protein} g eiwit per 100 gram. Een schaaltje van ${c.portion("kwarkMager", 1).amount} geeft je ± ${c.portion("kwarkMager", 1).protein} g eiwit, een bakje van ${c.portion("kwarkMager").amount} ± ${c.portion("kwarkMager").protein} g.`,
        },
        { q: "Is kwark goed om af te vallen?", a: `Magere kwark past goed in een afvalschema: veel eiwit, weinig calorieën, en het vult. ${shared.oneProduct.nl}` },
        {
          q: "Kun je elke dag kwark eten?",
          a: "Ja, voor de meeste mensen is dat prima. Kwark telt mee als zuivel, en het Voedingscentrum adviseert volwassenen 2 tot 3 porties zuivel per dag (vanaf 51 jaar iets meer). Wissel af met melk, yoghurt en kaas.",
        },
      ],
      en: [
        {
          q: "How many calories are in a tub of quark?",
          a: (c) =>
            `A ${c.portion("kwarkMager").amount} tub of low-fat quark contains ± ${c.portion("kwarkMager").kcal} kcal and ${c.portion("kwarkMager").protein} g of protein. A large 500 g tub contains ± ${c.at("kwarkMager", 500).kcal} kcal and ${c.at("kwarkMager", 500).protein} g of protein. Semi-skimmed and full-fat quark have more calories because of the extra fat.`,
        },
        {
          q: "How much protein is in quark?",
          a: (c) =>
            `Low-fat quark contains ${c.per100("kwarkMager").protein} g of protein per 100 grams. A ${c.portion("kwarkMager", 1).amount} bowl gives you ± ${c.portion("kwarkMager", 1).protein} g of protein, a ${c.portion("kwarkMager").amount} tub ± ${c.portion("kwarkMager").protein} g.`,
        },
        { q: "Is quark good for weight loss?", a: `Low-fat quark fits well into a weight-loss plan: lots of protein, few calories, and it's filling. ${shared.oneProduct.en}` },
        {
          q: "Can you eat quark every day?",
          a: "Yes, for most people that's fine. Quark counts as dairy, and the Netherlands Nutrition Centre recommends 2 to 3 portions of dairy a day for adults (a little more from age 51). Alternate with milk, yoghurt and cheese.",
        },
      ],
    },
    comparisons: ["skyr", "yoghurtMager", "griekseYoghurt", "huttenkase"],
  },
];

/** Paden van alle productpagina's, voor de sitemap. */
export const calorieProductPaths: string[] = calorieProducts.map((p) => `/calorieen/${p.slug}`);

export function calorieProductBySlug(slug: string): CalorieProduct | undefined {
  return calorieProducts.find((p) => p.slug === slug);
}

/** De productpagina van een product uit de voedingstabel (ook voor varianten, zoals gekookte rijst). */
export function calorieProductForFood(key: FoodKey): CalorieProduct | undefined {
  return calorieProducts.find((p) => p.foods.includes(key));
}

// ───────────────────────────── Groepen van de calorietabel

export interface CalorieTableGroup {
  id: string;
  title: L<string>;
  intro: L<string>;
  foods: FoodKey[];
}

const groups: CalorieTableGroup[] = [
  {
    id: "fruit",
    title: { nl: "Calorieën fruit", en: "Calories in fruit" },
    intro: {
      nl: "Fruit levert weinig calorieën per portie, plus vezels en vitamines. Avocado is de uitzondering: die bevat vooral vet.",
      en: "Fruit provides few calories per portion, plus fibre and vitamins. Avocado is the exception: it's mainly fat.",
    },
    foods: ["banaan", "appel", "mandarijn", "sinaasappel", "watermeloen", "aardbeien", "blauweBessen", "peer", "kiwi", "druiven", "avocado"],
  },
  {
    id: "groente",
    title: { nl: "Calorieën groente", en: "Calories in vegetables" },
    intro: {
      nl: "Groente heeft de minste calorieën van alle productgroepen. Je kunt er je bord ruim mee vullen.",
      en: "Vegetables have the fewest calories of any food group. You can fill your plate generously with them.",
    },
    foods: ["broccoli", "komkommer", "tomaat", "cherrytomaat", "spinazie", "paprika", "wortel", "courgette", "sperziebonen", "ui", "champignons", "sla", "wokgroente"],
  },
  {
    id: "granen",
    title: { nl: "Calorieën granen, brood en aardappelen", en: "Calories in grains, bread and potatoes" },
    intro: {
      nl: "Rijst, pasta en andere granen staan ongekookt in de tabel, tenzij er gekookt bij staat. Gekookt hebben ze per 100 gram minder calorieën, omdat er water bij komt.",
      en: "Rice, pasta and other grains are listed uncooked, unless it says cooked. Cooked, they have fewer calories per 100 grams, because they absorb water.",
    },
    foods: [
      "havermout",
      "muesli",
      "volkorenBrood",
      "witBrood",
      "volkorenWrap",
      "rijstwafel",
      "rijstOngekookt",
      "rijstGekookt",
      "zilvervliesrijstOngekookt",
      "pastaOngekookt",
      "pastaGekookt",
      "volkorenPastaOngekookt",
      "quinoaOngekookt",
      "couscousOngekookt",
      "aardappel",
      "krieltjes",
      "zoeteAardappel",
    ],
  },
  {
    id: "zuivel",
    title: { nl: "Calorieën zuivel en eieren", en: "Calories in dairy and eggs" },
    intro: {
      nl: "Magere zuivel en eieren geven veel eiwit voor relatief weinig calorieën. Bij kaas en Griekse yoghurt telt het vet flink mee.",
      en: "Low-fat dairy and eggs give you a lot of protein for relatively few calories. With cheese and Greek yoghurt, the fat counts for a lot.",
    },
    foods: ["ei", "kwarkMager", "skyr", "yoghurtMager", "griekseYoghurt", "huttenkase", "melkHalfvol", "kaas30", "feta", "mozzarellaLight"],
  },
  {
    id: "vlees",
    title: { nl: "Calorieën vlees, vis en vleesvervangers", en: "Calories in meat, fish and meat alternatives" },
    intro: {
      nl: "Vlees en vis zijn rauw gewogen, tenzij er gaar bij staat. Gaar zijn ze lichter, omdat er vocht uit gaat.",
      en: "Meat and fish are weighed raw, unless it says cooked. Cooked, they're lighter, because they lose moisture.",
    },
    foods: ["kipfilet", "kalkoenfilet", "rundergehakt", "zalm", "kabeljauw", "tonijn", "garnalen", "kipfiletBeleg", "tofu", "tempeh"],
  },
  {
    id: "peulvruchten",
    title: { nl: "Calorieën peulvruchten, noten en zaden", en: "Calories in pulses, nuts and seeds" },
    intro: {
      nl: "Peulvruchten combineren eiwit met veel vezels. Noten, zaden en pindakaas zijn voedzaam, maar bevatten veel calorieën per hap.",
      en: "Pulses combine protein with plenty of fibre. Nuts, seeds and peanut butter are nutritious, but contain a lot of calories per bite.",
    },
    foods: ["linzen", "kikkererwten", "zwarteBonen", "edamame", "hummus", "pindakaas", "amandelen", "walnoten", "chiazaad"],
  },
  {
    id: "overig",
    title: { nl: "Calorieën vetten, sauzen en overig", en: "Calories in fats, sauces and other foods" },
    intro: {
      nl: "Olie, pesto en chocolade bevatten veel calorieën in een kleine portie. Een eetlepel meer of minder maakt hier echt verschil.",
      en: "Oil, pesto and chocolate contain a lot of calories in a small portion. A tablespoon more or less really makes a difference here.",
    },
    foods: ["olijfolie", "pesto", "sojasaus", "tomatenblokjes", "kokosmelkLight", "honing", "pureChocolade", "popcorn", "rozijnen"],
  },
  {
    id: "dranken",
    title: { nl: "Calorieën dranken", en: "Calories in drinks" },
    intro: {
      nl: "Drankjes vullen nauwelijks, maar tellen wel mee. Water, thee en koffie zonder suiker hebben vrijwel geen calorieën.",
      en: "Drinks barely fill you up, but they do count. Water, tea and coffee without sugar have virtually no calories.",
    },
    foods: ["bier", "bier00", "wijnRood", "wijnWit", "cola", "sinaasappelsap"],
  },
];

/**
 * De groepen van de calorietabel. Producten die later aan nutrition.ts worden
 * toegevoegd en nog in geen groep staan, komen bij "overig", zodat de tabel
 * altijd alle producten toont.
 */
export const calorieTableGroups: CalorieTableGroup[] = (() => {
  const listed = new Set<FoodKey>(groups.flatMap((g) => g.foods));
  const rest = (Object.keys(foods) as FoodKey[]).filter((k) => !listed.has(k));
  return groups.map((g) => (g.id === "overig" && rest.length > 0 ? { ...g, foods: [...g.foods, ...rest] } : g));
})();

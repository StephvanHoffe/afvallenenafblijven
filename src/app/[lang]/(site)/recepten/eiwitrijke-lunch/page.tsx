import type { Metadata } from "next";
import { ArticleBody, ArticleSchema, ArrowLink, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { RecipeCard } from "@/components/content/RecipeCard";
import { foods, nutrientsFor } from "@/content/nutrition";
import { nutritionRange, recipeNutrition, recipesIn } from "@/content/recipes";
import { defineCopy } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { formatNumber } from "@/lib/format";

const PATH = "/recepten/eiwitrijke-lunch";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

const RECIPES = recipesIn("lunch");
const [KCAL_MIN, KCAL_MAX] = nutritionRange(RECIPES, "kcal");
const [PROTEIN_MIN, PROTEIN_MAX] = nutritionRange(RECIPES, "protein");
const MEAL_PREP = RECIPES.filter((r) => r.mealPrep).length;
const VEGETARIAN = RECIPES.filter((r) => r.vegetarian).length;
/** Eiwit in 2 volkoren boterhammen met zoet beleg (het beleg zelf telt nauwelijks mee). */
const BREAD_2 = Math.round(nutrientsFor("volkorenBrood", 70).protein);
const TUNA_TIN = Math.round(nutrientsFor("tonijn", 120).protein);
const per100 = (key: "huttenkase" | "kipfiletBeleg" | "kaas30" | "tonijn" | "hummus") => foods[key].per100.protein;

const copy = defineCopy({
  nl: {
    metaTitle: "Eiwitrijke lunch: 8 gezonde recepten om af te vallen",
    metaDescription: `Eiwitrijke lunch met ${PROTEIN_MIN} tot ${PROTEIN_MAX} gram eiwit: ${RECIPES.length} gezonde recepten om af te vallen, van wrap tot linzensoep, met calorieën per portie en meal prep tips.`,
    eyebrow: "Recepten",
    h1: "Eiwitrijke lunch:",
    h1Accent: `${RECIPES.length} gezonde recepten`,
    intro: `Een standaardlunch met een paar boterhammen bevat vaak weinig eiwit en groente. Met deze ${RECIPES.length} recepten maak je een lunch die je vult tot het avondeten, thuis of om mee te nemen naar je werk.`,
    short: `Een eiwitrijke lunch bevat zo'n 25 tot 40 gram eiwit en, als je wilt afvallen, ongeveer 350 tot 500 kcal. Dat haal je met kip, tonijn, eieren, hüttenkäse of peulvruchten, aangevuld met groente en een volkoren basis. De ${RECIPES.length} recepten hieronder hebben ${PROTEIN_MIN} tot ${PROTEIN_MAX} gram eiwit en ${KCAL_MIN} tot ${KCAL_MAX} kcal per portie; ${MEAL_PREP} ervan kun je vooruit maken.`,
    whyTitle: "Waarom een eiwitrijke lunch?",
    why: [
      `Twee volkoren boterhammen met jam of hagelslag leveren zo'n ${BREAD_2} gram eiwit. Dat is weinig, en dan heb je halverwege de middag vaak trek. Dat is precies het moment waarop een koek of reep er makkelijk in gaat.`,
      "Met een lunch die genoeg eiwit, groente en vezels bevat, blijf je langer verzadigd. Bovendien kom je zo makkelijker aan je eiwit voor de hele dag, wat extra belangrijk is als je afvalt.",
    ],
    buildTitle: "Gezonde lunch om af te vallen: zo stel je hem samen",
    buildIntro: "Met dit simpele schema maak je ook zonder recept een goede lunch:",
    buildBullets: [
      `Een eiwitbron: 100 gram kip, een blikje tonijn (${TUNA_TIN} gram eiwit), 2 eieren, 100 tot 200 gram hüttenkäse of 150 gram peulvruchten.`,
      "Groente: minstens een flinke hand, zoals sla, komkommer, tomaat, paprika of wortel. Rauwkost erbij telt ook.",
      "Een volkoren basis: 2 sneetjes volkoren brood, een volkoren wrap of 50 gram (ongekookte) couscous, quinoa of zilvervliesrijst.",
      "Een klein beetje vet voor de smaak: een theelepel olijfolie, wat feta of een eetlepel hummus.",
    ],
    tableTitle: "Eiwitrijke lunch: alle recepten op een rij",
    tableHead: ["Recept", "Kcal", "Eiwit", "Tijd"],
    tableNote: `Per portie, afgerond. ${VEGETARIAN} recepten zijn vegetarisch. De recepten staan hieronder.`,
    recipesTitle: `${RECIPES.length} eiwitrijke lunchrecepten`,
    recipesIntro: "Alle hoeveelheden zijn per portie; vlees, vis en granen zijn ongekookt gewogen, peulvruchten uitgelekt. Kruiden en citroensap tellen we niet mee.",
    takeTitle: "Lunch meenemen naar je werk of school",
    takeBullets: [
      "Houd je lunch koel: zet hem in de koelkast op je werk, of gebruik een koeltas met koelelement.",
      "Maak salades en wraps de avond ervoor of op zondag, en eet ze binnen 2 dagen op.",
      "Houd dressing, sla en knapperige groente apart en meng ze pas vlak voor het eten.",
      "Neem je soep mee? Verwarm hem thuis tot hij kookt en doe hem in een voorverwarmde thermosbeker, of warm hem op je werk op tot hij gloeiend heet is.",
    ],
    mealPrepLink: "Meer over meal prep en veilig bewaren",
    planTitle: "Je lunch, afgestemd op jouw doel",
    planText:
      "In je persoonlijke voedingsschema krijg je een weekmenu met lunches die je thuis maakt of meeneemt, met hoeveelheden op jouw calorie- en eiwitdoel en een complete boodschappenlijst. Het schema houdt rekening met wat je lekker vindt, of je vegetarisch eet en met allergieën.",
    planCta: "Bekijk het voedingsschema",
    faq: [
      {
        q: "Wat is een goede eiwitrijke lunch?",
        a: "Een lunch met zo'n 25 tot 40 gram eiwit, groente en een volkoren basis. Bijvoorbeeld een volkoren wrap met kip en hummus, een salade met tonijn en ei, of linzensoep met een snee volkoren brood.",
      },
      {
        q: "Hoeveel calorieën moet een lunch hebben om af te vallen?",
        a: "Voor de meeste mensen die afvallen werkt een lunch van ongeveer 350 tot 500 kcal goed. Hoeveel jij nodig hebt, hangt af van je totale caloriebehoefte en hoe je je eten over de dag verdeelt.",
      },
      {
        q: "Welk broodbeleg is eiwitrijk?",
        a: `Hüttenkäse (${per100("huttenkase")} gram eiwit per 100 gram), kipfilet als beleg (${per100("kipfiletBeleg")} gram), kaas 30+ (${per100("kaas30")} gram, maar ook veel vet), tonijn (${per100("tonijn")} gram) en eieren. Hummus bevat minder eiwit (${per100("hummus")} gram) en relatief veel vet; neem er een dun laagje van.`,
      },
      {
        q: "Kun je je lunch van tevoren maken?",
        a: "Ja. Salades met granen, soep en wraps zijn goed vooruit te maken. Bewaar ze afgesloten in de koelkast en eet ze binnen 2 dagen op. Soep kun je ook invriezen.",
      },
      {
        q: "Is soep een goede lunch om af te vallen?",
        a: "Soep vult goed voor weinig calorieën, maar bevat vaak weinig eiwit. Kies daarom soep met peulvruchten, zoals linzensoep, of voeg kip of een ei toe, en eet er een snee volkoren brood bij.",
      },
    ],
  },
  en: {
    metaTitle: "High-protein lunch: 8 healthy recipes for weight loss",
    metaDescription: `High-protein lunch with ${PROTEIN_MIN} to ${PROTEIN_MAX} grams of protein: ${RECIPES.length} healthy recipes for weight loss, from wraps to lentil soup, with calories per portion.`,
    eyebrow: "Recipes",
    h1: "High-protein lunch:",
    h1Accent: `${RECIPES.length} healthy recipes`,
    intro: `A standard lunch of a few slices of bread often contains little protein and few vegetables. With these ${RECIPES.length} recipes, you can make a lunch that keeps you full until dinner, at home or to take to work.`,
    short: `A high-protein lunch contains around 25 to 40 grams of protein and, if you want to lose weight, roughly 350 to 500 kcal. You can get there with chicken, tuna, eggs, cottage cheese or pulses, plus vegetables and a wholegrain base. The ${RECIPES.length} recipes below have ${PROTEIN_MIN} to ${PROTEIN_MAX} grams of protein and ${KCAL_MIN} to ${KCAL_MAX} kcal per portion; ${MEAL_PREP} of them can be made ahead.`,
    whyTitle: "Why a high-protein lunch?",
    why: [
      `Two slices of wholemeal bread with jam provide around ${BREAD_2} grams of protein. That's not much, and you're often hungry again by mid-afternoon. That's exactly when a biscuit or snack bar is easy to reach for.`,
      "A lunch with enough protein, vegetables and fibre keeps you full for longer. It also makes it easier to reach your protein for the whole day, which matters even more when you're losing weight.",
    ],
    buildTitle: "Healthy lunch for weight loss: how to put it together",
    buildIntro: "With this simple formula, you can make a good lunch even without a recipe:",
    buildBullets: [
      `A source of protein: 100 grams of chicken, a tin of tuna (${TUNA_TIN} grams of protein), 2 eggs, 100 to 200 grams of cottage cheese or 150 grams of pulses.`,
      "Vegetables: at least a good handful, such as salad leaves, cucumber, tomato, pepper or carrot. Raw veg on the side counts too.",
      "A wholegrain base: 2 slices of wholemeal bread, a wholemeal wrap or 50 grams of (uncooked) couscous, quinoa or brown rice.",
      "A little fat for flavour: a teaspoon of olive oil, some feta or a tablespoon of hummus.",
    ],
    tableTitle: "High-protein lunch: all recipes at a glance",
    tableHead: ["Recipe", "Kcal", "Protein", "Time"],
    tableNote: `Per portion, rounded. ${VEGETARIAN} recipes are vegetarian. The recipes are below.`,
    recipesTitle: `${RECIPES.length} high-protein lunch recipes`,
    recipesIntro: "All amounts are per portion; meat, fish and grains are weighed uncooked, pulses drained. We don't count herbs or lemon juice.",
    takeTitle: "Taking your lunch to work or school",
    takeBullets: [
      "Keep your lunch cool: put it in the fridge at work, or use a cool bag with an ice pack.",
      "Make salads and wraps the night before or on Sunday, and eat them within 2 days.",
      "Keep dressing, salad leaves and crunchy vegetables separate and add them just before eating.",
      "Taking soup? Heat it at home until it's boiling and pour it into a preheated flask, or reheat it at work until piping hot.",
    ],
    mealPrepLink: "More about meal prep and safe storage",
    planTitle: "Your lunch, matched to your goal",
    planText:
      "In your personal nutrition plan, you get a weekly menu with lunches to make at home or take with you, with amounts based on your calorie and protein targets and a complete shopping list. The plan takes into account what you like, whether you're vegetarian and any allergies.",
    planCta: "See the nutrition plan",
    faq: [
      {
        q: "What is a good high-protein lunch?",
        a: "A lunch with around 25 to 40 grams of protein, vegetables and a wholegrain base. For example, a wholemeal wrap with chicken and hummus, a salad with tuna and egg, or lentil soup with a slice of wholemeal bread.",
      },
      {
        q: "How many calories should a lunch have for weight loss?",
        a: "For most people who are losing weight, a lunch of around 350 to 500 kcal works well. How much you need depends on your total calorie needs and how you spread your food over the day.",
      },
      {
        q: "Which sandwich fillings are high in protein?",
        a: `Cottage cheese (${per100("huttenkase")} grams of protein per 100 grams), sliced chicken breast (${per100("kipfiletBeleg")} grams), reduced-fat cheese (${per100("kaas30")} grams, but also quite a lot of fat), tuna (${per100("tonijn")} grams) and eggs. Hummus has less protein (${per100("hummus")} grams) and relatively more fat; spread it thinly.`,
      },
      {
        q: "Can you make your lunch in advance?",
        a: "Yes. Grain salads, soup and wraps are easy to make ahead. Keep them sealed in the fridge and eat them within 2 days. You can also freeze soup.",
      },
      {
        q: "Is soup a good lunch for weight loss?",
        a: "Soup is filling for few calories, but often contains little protein. So choose soup with pulses, such as lentil soup, or add chicken or an egg, and have a slice of wholemeal bread with it.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

export default async function EiwitrijkeLunchPage() {
  const l = await getLocale();
  const c = copy[l];
  const num = (x: number) => formatNumber(x, x % 1 === 0 ? 0 : 1, l);
  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short} />
      <ArticleBody>
        <Section title={c.whyTitle} paragraphs={c.why} />

        <Section title={c.buildTitle} paragraphs={[c.buildIntro]} bullets={c.buildBullets} />

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

        <Section title={c.takeTitle} bullets={c.takeBullets}>
          <ArrowLink href="/meal-prep">{c.mealPrepLink}</ArrowLink>
        </Section>

        <PlanBox title={c.planTitle} text={c.planText} href="/voedingsschema" cta={c.planCta} />
        <RelatedPages l={l} paths={["/recepten/eiwitrijk-ontbijt", "/recepten/eiwitrijk-avondeten", "/meal-prep", "/gezonde-snacks"]} />
      </ArticleBody>
      <FaqAndClose l={l} items={c.faq} />
    </>
  );
}

import type { Metadata } from "next";
import { ArticleBody, ArticleSchema, ArrowLink, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { RecipeCard } from "@/components/content/RecipeCard";
import { foods, nutrientsFor, type FoodKey } from "@/content/nutrition";
import { nutritionRange, recipeNutrition, recipesIn } from "@/content/recipes";
import { defineCopy } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { formatNumber } from "@/lib/format";

const PATH = "/recepten/eiwitrijk-avondeten";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

const RECIPES = recipesIn("avondeten");
const [KCAL_MIN, KCAL_MAX] = nutritionRange(RECIPES, "kcal");
const [PROTEIN_MIN, PROTEIN_MAX] = nutritionRange(RECIPES, "protein");
const MINUTES_MAX = Math.max(...RECIPES.map((r) => r.minutes));
const MEAL_PREP = RECIPES.filter((r) => r.mealPrep).length;
const VEGETARIAN = RECIPES.filter((r) => r.vegetarian).length;
const kcal5 = (key: FoodKey, amount: number) => Math.round(nutrientsFor(key, amount).kcal / 5) * 5;
/** Rekenvoorbeelden uit de voedingstabel. */
const OIL_TBSP = kcal5("olijfolie", 10);
const PASTA_EXTRA = kcal5("pastaOngekookt", 25);
const CHEESE_HANDFUL = kcal5("kaas30", 30);
/** Eiwitbronnen voor het avondeten: eiwit en kcal per 100 gram (rauw). */
const LEAN: FoodKey[] = ["kipfilet", "kalkoenfilet", "kabeljauw", "rundergehakt", "zalm", "tofu"];

const copy = defineCopy({
  nl: {
    metaTitle: "Eiwitrijk avondeten: 8 caloriearme recepten om af te vallen",
    metaDescription: `Eiwitrijk en caloriearm avondeten: ${RECIPES.length} gezonde recepten om af te vallen, met ${PROTEIN_MIN} tot ${PROTEIN_MAX} gram eiwit per portie en binnen ${MINUTES_MAX} minuten op tafel.`,
    eyebrow: "Recepten",
    h1: "Eiwitrijk avondeten:",
    h1Accent: `${RECIPES.length} recepten binnen ${MINUTES_MAX} minuten`,
    intro: `Gezond avondeten om af te vallen hoeft niet ingewikkeld te zijn. Met een flinke portie groente, een eiwitbron en een volkoren basis zit je vol voor een redelijk aantal calorieën. Deze ${RECIPES.length} recepten staan doordeweeks gewoon op tafel.`,
    short: `Een eiwitrijk avondeten om af te vallen bevat zo'n 25 tot 40 gram eiwit, een half bord groente en ongeveer 400 tot 600 kcal. De ${RECIPES.length} recepten hieronder hebben ${PROTEIN_MIN} tot ${PROTEIN_MAX} gram eiwit en ${KCAL_MIN} tot ${KCAL_MAX} kcal per portie, en staan binnen ${MINUTES_MAX} minuten op tafel. ${VEGETARIAN} ervan zijn vegetarisch.`,
    plateTitle: "Zo ziet een gezond avondeten om af te vallen eruit",
    plateIntro: "Een handige vuistregel is het bordmodel. Daarmee heb je zonder te wegen al snel een goede verhouding:",
    plateBullets: [
      "Een half bord groente: zo'n 200 tot 250 gram. Daarmee haal je in één keer bijna de 250 gram groente die per dag wordt aangeraden.",
      "Een kwart eiwit: 100 tot 150 gram (rauw gewogen) kip, vis of mager vlees, 2 eieren, 150 gram tofu of 150 gram peulvruchten.",
      "Een kwart volkoren koolhydraten: 50 tot 75 gram ongekookte zilvervliesrijst of volkoren pasta, of zo'n 200 gram aardappelen.",
      "Een beetje vet: een eetlepel olie of wat kaas is genoeg voor de smaak.",
    ],
    lightTitle: "Caloriearm avondeten: waar zitten de calorieën?",
    light: [
      `Bij het avondeten zitten de meeste extra calorieën niet in het vlees of de groente, maar in de olie, de saus en de portie rijst of pasta. 1 eetlepel olie is al zo'n ${OIL_TBSP} kcal, en een extra schep pasta van 25 gram (ongekookt) zo'n ${PASTA_EXTRA} kcal. Een handje geraspte kaas (30 gram) erover voegt zo'n ${CHEESE_HANDFUL} kcal toe.`,
      "Meet olie daarom af met een lepel, bak in een antiaanbakpan en weeg rijst en pasta af voordat je ze kookt. Gebruik tomatenblokjes, kruiden, knoflook, citroen of een scheutje kokosmelk light voor smaak, in plaats van room of veel kaas.",
    ],
    leanTitle: "Kip, vis, gehakt of tofu: eiwit en calorieën vergeleken",
    leanHead: ["Product (per 100 g, rauw)", "Eiwit", "Kcal"],
    leanNote: "Afgeronde gemiddelden. Zalm is een vette vis: het advies is om 1 keer per week vis te eten, bij voorkeur vette vis.",
    tableTitle: "Eiwitrijk avondeten: alle recepten op een rij",
    tableHead: ["Recept", "Kcal", "Eiwit", "Tijd"],
    tableNote: "Per portie, afgerond. De recepten staan hieronder.",
    recipesTitle: `${RECIPES.length} eiwitrijke recepten voor het avondeten`,
    recipesIntro: "Alle hoeveelheden zijn per portie; vlees, vis, rijst en pasta zijn ongekookt gewogen. Kruiden, knoflook en citroen tellen we niet mee.",
    prepTitle: "Vooruit koken voor doordeweeks",
    prep: [
      `${MEAL_PREP} van deze recepten zijn geschikt om vooruit te koken: de wokschotel, de chili, de curry en de linzenbolognese. Kook 4 porties tegelijk, laat ze snel afkoelen en zet ze in afgesloten bakjes in de koelkast. Eet ze binnen 2 dagen op, of vries ze in.`,
    ],
    prepLink: "Zo pak je meal prep aan",
    planTitle: "Avondeten op jouw calorie- en eiwitdoel",
    planText:
      "In je persoonlijke voedingsschema krijg je een weekmenu met avondmaaltijden zoals deze, met hoeveelheden die passen bij jouw calorie- en eiwitdoel en een complete boodschappenlijst. Het schema houdt rekening met wat je lekker vindt, of je vegetarisch eet en met allergieën.",
    planCta: "Bekijk het voedingsschema",
    faq: [
      {
        q: "Wat is een gezond avondeten om af te vallen?",
        a: "Een maaltijd met een half bord groente, een eiwitbron (kip, vis, eieren, tofu of peulvruchten) en een volkoren basis zoals zilvervliesrijst, volkoren pasta of aardappelen. Met weinig toegevoegd vet kom je zo op ongeveer 400 tot 600 kcal.",
      },
      {
        q: "Hoeveel calorieën mag je avondeten hebben als je wilt afvallen?",
        a: "Voor de meeste mensen die afvallen werkt 400 tot 600 kcal goed. Hoeveel jij nodig hebt, hangt af van je totale caloriebehoefte en van wat je de rest van de dag eet.",
      },
      {
        q: "Mag je 's avonds koolhydraten eten als je wilt afvallen?",
        a: "Ja. Voor afvallen telt vooral hoeveel calorieën je over de hele dag eet, niet hoe laat je je koolhydraten eet. Kies wel voor volkoren varianten en let op de portie.",
      },
      {
        q: "Wat eet je als je weinig tijd hebt?",
        a: "Kies een snel recept, zoals de pasta met kip en pesto (20 minuten), of kook in het weekend een paar porties chili of curry vooruit. Die bewaar je 2 dagen in de koelkast of langer in de vriezer.",
      },
      {
        q: "Welk vlees of welke vis is mager en eiwitrijk?",
        a: `Kipfilet, kalkoenfilet en witte vis zoals kabeljauw bevatten veel eiwit en weinig vet. Kipfilet heeft per 100 gram (rauw) zo'n ${foods.kipfilet.per100.protein} gram eiwit en ${foods.kipfilet.per100.kcal} kcal. Mager rundergehakt en zalm bevatten meer vet en dus meer calorieën, maar passen prima in een gezond menu.`,
      },
    ],
  },
  en: {
    metaTitle: "High-protein dinner: 8 low-calorie recipes for weight loss",
    metaDescription: `High-protein, low-calorie dinners: ${RECIPES.length} healthy recipes for weight loss, with ${PROTEIN_MIN} to ${PROTEIN_MAX} grams of protein per portion and on the table within ${MINUTES_MAX} minutes.`,
    eyebrow: "Recipes",
    h1: "High-protein dinner:",
    h1Accent: `${RECIPES.length} recipes within ${MINUTES_MAX} minutes`,
    intro: `A healthy dinner for weight loss doesn't have to be complicated. With a good portion of vegetables, a source of protein and a wholegrain base, you'll feel full for a reasonable number of calories. These ${RECIPES.length} recipes are easy to make on a weekday.`,
    short: `A high-protein dinner for weight loss contains around 25 to 40 grams of protein, half a plate of vegetables and roughly 400 to 600 kcal. The ${RECIPES.length} recipes below have ${PROTEIN_MIN} to ${PROTEIN_MAX} grams of protein and ${KCAL_MIN} to ${KCAL_MAX} kcal per portion, and are on the table within ${MINUTES_MAX} minutes. ${VEGETARIAN} of them are vegetarian.`,
    plateTitle: "What a healthy dinner for weight loss looks like",
    plateIntro: "A handy rule of thumb is the plate model. It gives you a good balance without weighing anything:",
    plateBullets: [
      "Half a plate of vegetables: around 200 to 250 grams. That gets you close to the 250 grams of vegetables recommended a day in one go.",
      "A quarter protein: 100 to 150 grams (raw weight) of chicken, fish or lean meat, 2 eggs, 150 grams of tofu or 150 grams of pulses.",
      "A quarter wholegrain carbs: 50 to 75 grams of uncooked brown rice or wholewheat pasta, or around 200 grams of potatoes.",
      "A little fat: a tablespoon of oil or a little cheese is enough for flavour.",
    ],
    lightTitle: "Low-calorie dinner: where are the calories?",
    light: [
      `At dinner, most of the extra calories aren't in the meat or vegetables, but in the oil, the sauce and the portion of rice or pasta. 1 tablespoon of oil is already around ${OIL_TBSP} kcal, and an extra 25 grams of pasta (uncooked) around ${PASTA_EXTRA} kcal. A handful of grated cheese (30 grams) on top adds around ${CHEESE_HANDFUL} kcal.`,
      "So measure oil with a spoon, use a non-stick pan and weigh rice and pasta before cooking. Use chopped tomatoes, herbs, garlic, lemon or a splash of light coconut milk for flavour instead of cream or lots of cheese.",
    ],
    leanTitle: "Chicken, fish, mince or tofu: protein and calories compared",
    leanHead: ["Product (per 100 g, raw)", "Protein", "Kcal"],
    leanNote: "Rounded averages. Salmon is an oily fish: the advice is to eat fish once a week, preferably oily fish.",
    tableTitle: "High-protein dinner: all recipes at a glance",
    tableHead: ["Recipe", "Kcal", "Protein", "Time"],
    tableNote: "Per portion, rounded. The recipes are below.",
    recipesTitle: `${RECIPES.length} high-protein dinner recipes`,
    recipesIntro: "All amounts are per portion; meat, fish, rice and pasta are weighed uncooked. We don't count herbs, garlic or lemon.",
    prepTitle: "Cooking ahead for weekdays",
    prep: [
      `${MEAL_PREP} of these recipes are good for cooking ahead: the stir-fry, the chilli, the curry and the lentil bolognese. Cook 4 portions at once, cool them quickly and keep them in sealed containers in the fridge. Eat them within 2 days, or freeze them.`,
    ],
    prepLink: "How to approach meal prep",
    planTitle: "Dinners that match your calorie and protein targets",
    planText:
      "In your personal nutrition plan, you get a weekly menu with dinners like these, with amounts that match your calorie and protein targets and a complete shopping list. The plan takes into account what you like, whether you're vegetarian and any allergies.",
    planCta: "See the nutrition plan",
    faq: [
      {
        q: "What is a healthy dinner for weight loss?",
        a: "A meal with half a plate of vegetables, a source of protein (chicken, fish, eggs, tofu or pulses) and a wholegrain base such as brown rice, wholewheat pasta or potatoes. With little added fat, that comes to around 400 to 600 kcal.",
      },
      {
        q: "How many calories should your dinner have when you're losing weight?",
        a: "For most people who are losing weight, 400 to 600 kcal works well. How much you need depends on your total calorie needs and what you eat during the rest of the day.",
      },
      {
        q: "Can you eat carbs in the evening when you're losing weight?",
        a: "Yes. For weight loss, what counts most is how many calories you eat over the whole day, not what time you eat your carbs. Do choose wholegrain options and watch the portion size.",
      },
      {
        q: "What do you eat when you're short on time?",
        a: "Choose a quick recipe, such as the pasta with chicken and pesto (20 minutes), or cook a few portions of chilli or curry ahead at the weekend. Keep them for 2 days in the fridge or longer in the freezer.",
      },
      {
        q: "Which meat or fish is lean and high in protein?",
        a: `Chicken breast, turkey breast and white fish such as cod are high in protein and low in fat. Chicken breast has around ${foods.kipfilet.per100.protein} grams of protein and ${foods.kipfilet.per100.kcal} kcal per 100 grams (raw). Lean beef mince and salmon contain more fat and so more calories, but fit well into a healthy menu.`,
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

export default async function EiwitrijkAvondetenPage() {
  const l = await getLocale();
  const c = copy[l];
  const num = (x: number) => formatNumber(x, x % 1 === 0 ? 0 : 1, l);
  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short} />
      <ArticleBody>
        <Section title={c.plateTitle} paragraphs={[c.plateIntro]} bullets={c.plateBullets} />

        <Section title={c.lightTitle} paragraphs={c.light} />

        <Section title={c.leanTitle}>
          <DataTable
            head={c.leanHead}
            rows={LEAN.map((key) => [foods[key].name[l], `${num(foods[key].per100.protein)} g`, `${foods[key].per100.kcal} kcal`])}
            note={c.leanNote}
            minWidth="22rem"
          />
        </Section>

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

        <Section title={c.prepTitle} paragraphs={c.prep}>
          <ArrowLink href="/meal-prep">{c.prepLink}</ArrowLink>
        </Section>

        <PlanBox title={c.planTitle} text={c.planText} href="/voedingsschema" cta={c.planCta} />
        <RelatedPages l={l} paths={["/recepten/eiwitrijk-ontbijt", "/recepten/eiwitrijke-lunch", "/meal-prep", "/gezond-weekmenu"]} />
      </ArticleBody>
      <FaqAndClose l={l} items={c.faq} />
    </>
  );
}

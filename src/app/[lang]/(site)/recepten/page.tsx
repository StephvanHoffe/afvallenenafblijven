import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ArticleBody, ArticleSchema, ArrowLink, ContentHero, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { RecipeCard } from "@/components/content/RecipeCard";
import { foods, nutrientsFor } from "@/content/nutrition";
import {
  nutritionRange,
  recipeBySlug,
  recipeCategoryPath,
  recipeHref,
  recipeNutrition,
  recipes,
  recipesIn,
  type RecipeCategory,
} from "@/content/recipes";
import { defineCopy } from "@/i18n/config";
import Link from "@/i18n/Link";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { formatNumber } from "@/lib/format";

const PATH = "/recepten";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

const CATEGORIES: RecipeCategory[] = ["ontbijt", "lunch", "avondeten"];
/** Eén recept per maaltijd om mee te beginnen. */
const PICKS = ["kwarkbowl-blauwe-bessen-walnoten", "wrap-kip-hummus-rauwkost", "chili-con-carne-zwarte-bonen"];

const [KCAL_MIN, KCAL_MAX] = nutritionRange(recipes, "kcal");
const [PROTEIN_MIN] = nutritionRange(recipes, "protein");
const VEGETARIAN = recipes.filter((r) => r.vegetarian).length;
const MEAL_PREP = recipes.filter((r) => r.mealPrep).length;
/** Rekenvoorbeelden uit de voedingstabel. */
const OIL_TBSP = Math.round(nutrientsFor("olijfolie", 10).kcal / 5) * 5;
const PESTO_TBSP = Math.round(nutrientsFor("pesto", 15).kcal / 5) * 5;
const BROCCOLI = foods.broccoli.per100.kcal;
const RICE = foods.rijstGekookt.per100.kcal;

type Range = [number, number];

const copy = defineCopy({
  nl: {
    metaTitle: "Gezonde recepten om af te vallen: eiwitrijk en caloriearm",
    metaDescription: `${recipes.length} gezonde, eiwitrijke en caloriearme recepten om af te vallen: ontbijt, lunch en avondeten met calorieën en eiwit per portie, plus meal prep.`,
    eyebrow: "Recepten",
    h1: "Gezonde recepten",
    h1Accent: "om af te vallen",
    intro: `Afvallen gaat het makkelijkst met gewone maaltijden die je goed vullen: genoeg eiwit, veel groente en een portie die past bij je calorieën. Hier vind je ${recipes.length} recepten voor ontbijt, lunch en avondeten, met de calorieën en macro's per portie.`,
    short: `Een gezond recept om af te vallen bevat per portie genoeg eiwit (zo'n 20 tot 40 gram), een flinke portie groente en niet meer calorieën dan nodig. Onze ${recipes.length} recepten hebben ${KCAL_MIN} tot ${KCAL_MAX} kcal en minimaal ${PROTEIN_MIN} gram eiwit per portie: ontbijt rond 300 tot 450 kcal, lunch 350 tot 500 kcal en avondeten 400 tot 600 kcal. Met 1 of 2 tussendoortjes past een hele dag zo in ongeveer 1.500 tot 1.700 kcal.`,
    healthyTitle: "Wat maakt een recept gezond als je wilt afvallen?",
    healthyIntro:
      "Afvallen draait om een klein calorietekort dat je lang volhoudt. Dat lukt het best met maaltijden waar je vol van zit, zodat je niet de hele dag met trek rondloopt. Daar letten we bij elk recept op:",
    healthyBullets: [
      "Genoeg eiwit: zo'n 20 tot 40 gram per maaltijd. Eiwit vult goed en helpt je spieren te behouden terwijl je afvalt.",
      "Veel groente: het advies is 250 gram per dag. Groente geeft volume en vezels voor weinig calorieën.",
      "Volkoren in plaats van wit: volkoren brood, volkoren pasta, zilvervliesrijst en havermout bevatten meer vezels en houden je langer verzadigd.",
      "Weinig toegevoegd vet en suiker: olie meet je af met een lepel en zoet komt vooral uit fruit.",
      "Een portie die past: niet te groot, maar ook niet zo klein dat je een uur later weer honger hebt.",
    ],
    proteinLink: "Hoeveel eiwit heb je per dag nodig?",
    categoriesTitle: "Recepten per maaltijd",
    categoriesIntro: "Kies een maaltijd. Op elke pagina staan de recepten met ingrediënten, bereiding en voedingswaarden per portie.",
    categoryCards: {
      ontbijt: { title: "Eiwitrijk ontbijt", text: "Kwarkbowls, omeletten, overnight oats en meer." },
      lunch: { title: "Eiwitrijke lunch", text: "Wraps, salades en soep, voor thuis of om mee te nemen." },
      avondeten: { title: "Eiwitrijk avondeten", text: "Avondeten dat binnen 30 minuten op tafel staat." },
    } as Record<RecipeCategory, { title: string; text: string }>,
    categoryStats: (count: number, kcal: Range, protein: Range) => `${count} recepten · ${kcal[0]}-${kcal[1]} kcal · ${protein[0]}-${protein[1]} g eiwit`,
    extraCards: [
      { href: "/meal-prep", title: "Meal prep", text: `Kook in één keer voor een paar dagen. ${MEAL_PREP} recepten zijn daar geschikt voor.` },
      { href: "/gezond-weekmenu", title: "Gezond weekmenu", text: "Een voorbeeldweek met deze recepten, met boodschappenlijst." },
    ],
    lightTitle: "Caloriearme recepten: zo houd je je maaltijd licht",
    lightIntro: "Caloriearm koken betekent niet dat je minder op je bord krijgt. Met deze keuzes scheelt het al snel honderden calorieën per dag:",
    lightBullets: [
      `Meet olie af en bak in een antiaanbakpan: 1 eetlepel olie is al zo'n ${OIL_TBSP} kcal.`,
      "Kies magere eiwitbronnen, zoals kipfilet, kabeljauw, tonijn in water, magere kwark, skyr, eieren en peulvruchten.",
      `Maak je bord voller met groente in plaats van extra rijst of pasta: 100 gram broccoli heeft ${BROCCOLI} kcal, 100 gram gekookte rijst ${RICE} kcal.`,
      `Wees zuinig met sauzen, pesto en kaas. Lekker, maar veel calorieën in een klein beetje: 1 eetlepel pesto is zo'n ${PESTO_TBSP} kcal.`,
      "Gebruik kwark of yoghurt in plaats van room of mayonaise, zoals in de eiersalade bij de lunchrecepten.",
    ],
    allTitle: "Eiwitrijke recepten: alle recepten op een rij",
    allIntro: `Alle ${recipes.length} recepten met calorieën en eiwit per portie. ${VEGETARIAN} ervan zijn vegetarisch.`,
    categoryName: { ontbijt: "Ontbijt", lunch: "Lunch", avondeten: "Avondeten" } as Record<RecipeCategory, string>,
    recipeLine: (kcal: number, protein: string, minutes: number) => `${kcal} kcal · ${protein} g eiwit · ${minutes} min`,
    picksTitle: "Drie recepten om mee te beginnen",
    picksIntro: "Een ontbijt, een lunch en een avondeten om meteen te proberen. Alle hoeveelheden zijn per portie; vlees, vis, rijst en pasta zijn ongekookt gewogen.",
    planTitle: "Recepten op jouw calorie- en eiwitdoel",
    planText:
      "In je persoonlijke voedingsschema krijg je een weekmenu met recepten zoals deze, met hoeveelheden die passen bij jouw calorie- en eiwitdoel en een complete boodschappenlijst. Het schema houdt rekening met wat je lekker vindt, of je vegetarisch eet en met allergieën.",
    planCta: "Bekijk het voedingsschema",
    faq: [
      {
        q: "Wat zijn gezonde recepten om af te vallen?",
        a: "Recepten met genoeg eiwit (zo'n 20 tot 40 gram per portie), veel groente, volkoren producten en weinig toegevoegd vet en suiker. Zulke maaltijden vullen goed voor relatief weinig calorieën, waardoor je een calorietekort makkelijker volhoudt.",
      },
      {
        q: "Hoeveel calorieën mag een maaltijd hebben als je wilt afvallen?",
        a: "Dat hangt af van je caloriebehoefte. Eet je zo'n 1.600 kcal per dag, dan werkt een ontbijt van 300 tot 450 kcal, een lunch van 350 tot 500 kcal en een avondeten van 400 tot 600 kcal goed, met 1 of 2 tussendoortjes. Bereken met de rekenhulp hoeveel jij nodig hebt.",
      },
      {
        q: "Hoe maak je een recept eiwitrijker?",
        a: "Voeg een eiwitbron toe of maak die portie groter: magere kwark of skyr bij het ontbijt, een ei of hüttenkäse op brood, en kip, vis, tofu of peulvruchten bij lunch en avondeten. Peulvruchten zoals linzen en kikkererwten geven naast eiwit ook veel vezels.",
      },
      {
        q: "Kloppen de calorieën per portie precies?",
        a: "Het zijn afgeronde schattingen op basis van gemiddelde voedingswaarden van gewone supermarktproducten. Per merk en bereiding verschilt het wat. Vlees, vis, rijst en pasta zijn ongekookt gewogen en peulvruchten uitgelekt. Kruiden, citroensap en bouillon tellen we niet mee.",
      },
      {
        q: "Zijn er ook vegetarische recepten?",
        a: `Ja, ${VEGETARIAN} van de ${recipes.length} recepten zijn vegetarisch, zoals de linzensoep, de tofu-curry en de shakshuka. In de andere recepten kun je kip vervangen door tofu, tempeh of peulvruchten; neem dan wat meer, zodat je genoeg eiwit binnenkrijgt.`,
      },
    ],
  },
  en: {
    metaTitle: "Healthy recipes for weight loss: high-protein, low-calorie",
    metaDescription: `${recipes.length} healthy, high-protein, low-calorie recipes for weight loss: breakfast, lunch and dinner with calories and protein per portion, plus meal prep.`,
    eyebrow: "Recipes",
    h1: "Healthy recipes",
    h1Accent: "for weight loss",
    intro: `Losing weight is easiest with ordinary meals that keep you full: enough protein, plenty of vegetables and a portion that fits your calories. Here you'll find ${recipes.length} recipes for breakfast, lunch and dinner, with the calories and macros per portion.`,
    short: `A healthy recipe for weight loss gives you enough protein per portion (around 20 to 40 grams), a good helping of vegetables and no more calories than you need. Our ${recipes.length} recipes have ${KCAL_MIN} to ${KCAL_MAX} kcal and at least ${PROTEIN_MIN} grams of protein per portion: breakfast around 300 to 450 kcal, lunch 350 to 500 kcal and dinner 400 to 600 kcal. With 1 or 2 snacks, a whole day fits into roughly 1,500 to 1,700 kcal.`,
    healthyTitle: "What makes a recipe healthy when you want to lose weight?",
    healthyIntro:
      "Losing weight comes down to a small calorie deficit you can keep up. That works best with meals that fill you up, so you're not hungry all day. This is what we look for in every recipe:",
    healthyBullets: [
      "Enough protein: around 20 to 40 grams per meal. Protein is filling and helps you keep your muscle while you lose weight.",
      "Plenty of vegetables: the advice is 250 grams a day. Vegetables add volume and fibre for few calories.",
      "Wholegrain instead of white: wholemeal bread, wholewheat pasta, brown rice and oats contain more fibre and keep you full for longer.",
      "Little added fat and sugar: measure oil with a spoon and let sweetness come mainly from fruit.",
      "A portion that fits: not too big, but not so small that you're hungry again an hour later.",
    ],
    proteinLink: "How much protein do you need a day?",
    categoriesTitle: "Recipes by meal",
    categoriesIntro: "Pick a meal. Each page has the recipes with ingredients, method and nutrition per portion.",
    categoryCards: {
      ontbijt: { title: "High-protein breakfast", text: "Quark bowls, omelettes, overnight oats and more." },
      lunch: { title: "High-protein lunch", text: "Wraps, salads and soup, for home or to take with you." },
      avondeten: { title: "High-protein dinner", text: "Dinners on the table within 30 minutes." },
    } as Record<RecipeCategory, { title: string; text: string }>,
    categoryStats: (count: number, kcal: Range, protein: Range) => `${count} recipes · ${kcal[0]}-${kcal[1]} kcal · ${protein[0]}-${protein[1]} g protein`,
    extraCards: [
      { href: "/meal-prep", title: "Meal prep", text: `Cook for several days at once. ${MEAL_PREP} recipes are suitable.` },
      { href: "/gezond-weekmenu", title: "Healthy weekly menu", text: "An example week with these recipes, with a shopping list." },
    ],
    lightTitle: "Low-calorie recipes: how to keep your meal light",
    lightIntro: "Cooking low-calorie doesn't mean less on your plate. These choices can easily save hundreds of calories a day:",
    lightBullets: [
      `Measure your oil and use a non-stick pan: 1 tablespoon of oil is already around ${OIL_TBSP} kcal.`,
      "Choose lean sources of protein, such as chicken breast, cod, tuna in water, low-fat quark, skyr, eggs and pulses.",
      `Fill your plate with vegetables rather than extra rice or pasta: 100 grams of broccoli has ${BROCCOLI} kcal, 100 grams of cooked rice ${RICE} kcal.`,
      `Go easy on sauces, pesto and cheese. Tasty, but a lot of calories in a small amount: 1 tablespoon of pesto is around ${PESTO_TBSP} kcal.`,
      "Use quark or yoghurt instead of cream or mayonnaise, as in the egg salad in the lunch recipes.",
    ],
    allTitle: "High-protein recipes: all recipes at a glance",
    allIntro: `All ${recipes.length} recipes with calories and protein per portion. ${VEGETARIAN} of them are vegetarian.`,
    categoryName: { ontbijt: "Breakfast", lunch: "Lunch", avondeten: "Dinner" } as Record<RecipeCategory, string>,
    recipeLine: (kcal: number, protein: string, minutes: number) => `${kcal} kcal · ${protein} g protein · ${minutes} min`,
    picksTitle: "Three recipes to start with",
    picksIntro: "A breakfast, a lunch and a dinner to try straight away. All amounts are per portion; meat, fish, rice and pasta are weighed uncooked.",
    planTitle: "Recipes that match your calorie and protein targets",
    planText:
      "In your personal nutrition plan, you get a weekly menu with recipes like these, with amounts that match your calorie and protein targets and a complete shopping list. The plan takes into account what you like, whether you're vegetarian and any allergies.",
    planCta: "See the nutrition plan",
    faq: [
      {
        q: "What are healthy recipes for weight loss?",
        a: "Recipes with enough protein (around 20 to 40 grams per portion), plenty of vegetables, wholegrain products and little added fat and sugar. Meals like these are filling for relatively few calories, which makes a calorie deficit easier to keep up.",
      },
      {
        q: "How many calories should a meal have when you're losing weight?",
        a: "That depends on your calorie needs. If you eat around 1,600 kcal a day, a breakfast of 300 to 450 kcal, a lunch of 350 to 500 kcal and a dinner of 400 to 600 kcal work well, with 1 or 2 snacks. Use the calculator to work out what you need.",
      },
      {
        q: "How do you make a recipe higher in protein?",
        a: "Add a source of protein or make that portion bigger: low-fat quark or skyr at breakfast, an egg or cottage cheese on bread, and chicken, fish, tofu or pulses at lunch and dinner. Pulses such as lentils and chickpeas also give you plenty of fibre.",
      },
      {
        q: "Are the calories per portion exact?",
        a: "They're rounded estimates based on average nutritional values of ordinary supermarket products. They vary a little by brand and cooking method. Meat, fish, rice and pasta are weighed uncooked and pulses drained. We don't count herbs, lemon juice or stock.",
      },
      {
        q: "Are there vegetarian recipes too?",
        a: `Yes, ${VEGETARIAN} of the ${recipes.length} recipes are vegetarian, such as the lentil soup, the tofu curry and the shakshuka. In the other recipes, you can swap chicken for tofu, tempeh or pulses; use a little more so you still get enough protein.`,
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

export default async function ReceptenPage() {
  const l = await getLocale();
  const c = copy[l];
  const g = (x: number) => formatNumber(x, x % 1 === 0 ? 0 : 1, l);
  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short} />
      <ArticleBody>
        <Section title={c.healthyTitle} paragraphs={[c.healthyIntro]} bullets={c.healthyBullets}>
          <ArrowLink href="/eiwitten-per-dag">{c.proteinLink}</ArrowLink>
        </Section>

        <Section title={c.categoriesTitle} paragraphs={[c.categoriesIntro]}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {CATEGORIES.map((cat) => {
              const list = recipesIn(cat);
              return (
                <li key={cat}>
                  <Link href={recipeCategoryPath[cat]} className="card flex h-full flex-col gap-1 p-5 transition hover:border-brand-300">
                    <h3 className="flex items-center justify-between gap-3 text-lg font-extrabold">
                      {c.categoryCards[cat].title} <ArrowRight className="size-4 shrink-0 text-brand-600" aria-hidden />
                    </h3>
                    <p className="text-muted">{c.categoryCards[cat].text}</p>
                    <p className="mt-auto pt-2 text-sm font-bold text-brand-700">{c.categoryStats(list.length, nutritionRange(list, "kcal"), nutritionRange(list, "protein"))}</p>
                  </Link>
                </li>
              );
            })}
            {c.extraCards.map((x) => (
              <li key={x.href}>
                <Link href={x.href} className="card flex h-full flex-col gap-1 p-5 transition hover:border-brand-300">
                  <h3 className="flex items-center justify-between gap-3 text-lg font-extrabold">
                    {x.title} <ArrowRight className="size-4 shrink-0 text-brand-600" aria-hidden />
                  </h3>
                  <p className="text-muted">{x.text}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={c.lightTitle} paragraphs={[c.lightIntro]} bullets={c.lightBullets} />

        <Section title={c.allTitle} paragraphs={[c.allIntro]}>
          <div className="space-y-6">
            {CATEGORIES.map((cat) => (
              <div key={cat}>
                <h3 className="text-lg font-extrabold">{c.categoryName[cat]}</h3>
                <ul className="mt-2 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-white">
                  {recipesIn(cat).map((r) => {
                    const n = recipeNutrition(r);
                    return (
                      <li key={r.slug} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <Link href={recipeHref(r)} className="font-semibold text-brand-700 underline">
                          {r.title[l]}
                        </Link>
                        <span className="text-sm whitespace-nowrap text-muted tabular-nums">{c.recipeLine(n.kcal, g(n.protein), r.minutes)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section title={c.picksTitle} paragraphs={[c.picksIntro]}>
          <div className="space-y-6">
            {PICKS.map((slug) => (
              <RecipeCard key={slug} recipe={recipeBySlug(slug)} l={l} />
            ))}
          </div>
        </Section>

        <PlanBox title={c.planTitle} text={c.planText} href="/voedingsschema" cta={c.planCta} />
        <RelatedPages l={l} paths={["/meal-prep", "/gezond-weekmenu", "/eiwitten-per-dag", "/caloriebehoefte-berekenen"]} />
      </ArticleBody>
      <FaqAndClose l={l} items={c.faq} />
    </>
  );
}

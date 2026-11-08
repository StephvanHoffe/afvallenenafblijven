import type { Metadata } from "next";
import { ArticleBody, ArticleSchema, ArrowLink, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { RecipeCard } from "@/components/content/RecipeCard";
import { recipes, type RecipeCategory } from "@/content/recipes";
import { defineCopy } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const PATH = "/meal-prep";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

const MEAL_PREP = recipes.filter((r) => r.mealPrep);
const CATEGORIES: RecipeCategory[] = ["ontbijt", "lunch", "avondeten"];

const copy = defineCopy({
  nl: {
    metaTitle: "Meal prep: stappenplan, recepten en veilig bewaren",
    metaDescription: `Meal prep voor beginners: zo kook je in één keer voor een paar dagen, met een stappenplan, bewaarregels, de juiste bakjes en ${MEAL_PREP.length} meal prep recepten.`,
    eyebrow: "Recepten",
    h1: "Meal prep:",
    h1Accent: "in één keer koken voor een paar dagen",
    intro:
      "Geen zin om elke avond te koken, of te vaak iets onderweg gehaald? Met meal prep kook je in één keer voor een paar dagen. Zo ligt je eten al klaar als je moe of druk bent. Hier lees je hoe je begint, hoe je het veilig bewaart en welke recepten zich er goed voor lenen.",
    short: `Meal prep betekent dat je in één keer een paar maaltijden vooruit kookt en in porties verdeelt. Reken op 1 tot 2 uur, bijvoorbeeld op zondag. Laat het eten snel afkoelen, bewaar het in de koelkast en eet het binnen 2 dagen op, of vries het in. Verwarm het daarna tot het overal gloeiend heet is. Hieronder vind je een stappenplan en ${MEAL_PREP.length} meal prep recepten.`,
    whatTitle: "Wat is meal prep?",
    what: [
      "Meal prep is Engels voor maaltijdvoorbereiding: je kookt, verdeelt en bewaart je eten voor de komende dagen in één keer. Dat kan een complete maaltijd zijn, zoals chili in bakjes, of losse onderdelen die je later combineert, zoals gekookte rijst, gegaarde kip en gesneden groente.",
      "Het voordeel: je hoeft minder vaak te bedenken wat je eet als je al honger hebt, je porties liggen vast en je bent minder tijd kwijt aan koken en afwassen. Voor veel mensen maakt dat het makkelijker om bij hun plan te blijven.",
    ],
    stepsTitle: "Meal prep voor beginners: zo doe je het op zondag",
    stepsIntro: "Met 2 of 3 recepten ben je zo'n 1 tot 1,5 uur bezig. Zo pak je het aan:",
    steps: [
      "Kies 2 of 3 recepten, bijvoorbeeld 1 lunch en 1 of 2 avondmaaltijden, en bepaal hoeveel porties je nodig hebt.",
      "Doe boodschappen met een lijst, zodat je alles in huis hebt.",
      "Begin met wat het langst duurt: zet de zilvervliesrijst of quinoa op en verwarm de oven voor geroosterde groente of eiermuffins.",
      "Kook intussen je stoofgerecht, soep of saus, zoals chili, curry of linzenbolognese.",
      "Snijd de groente voor salades en wraps en kook eventueel eieren.",
      "Laat alles snel afkoelen: verdeel grote pannen over kleine, platte bakjes en zet ze zo snel mogelijk in de koelkast, in elk geval binnen 2 uur.",
      "Verdeel het eten in porties en schrijf de datum op elk bakje. Wat je de komende 2 dagen eet, gaat in de koelkast; de rest in de vriezer.",
      "Haal halverwege de week een portie uit de vriezer en laat die een nacht in de koelkast ontdooien, of doe op woensdag een tweede, korte kookronde.",
    ],
    weekLink: "Bekijk hoe dit past in een heel weekmenu",
    safeTitle: "Meal prep veilig bewaren: de regels",
    safeIntro: "Gekookt eten dat te lang of te warm staat, kan bederven zonder dat je het ziet of ruikt. Houd je daarom aan deze regels:",
    safeBullets: [
      "Laat gekookt eten snel afkoelen. Verdeel het over kleine, platte bakjes en zet ze zo snel mogelijk in de koelkast, in elk geval binnen 2 uur.",
      "Zet je koelkast op 4 °C of kouder en zet de bakjes niet te dicht op elkaar, zodat de koude lucht erlangs kan.",
      "Eet gekookte maaltijden uit de koelkast binnen 2 dagen op. Dat is het advies van het Voedingscentrum voor restjes.",
      "Wil je verder vooruit koken? Vries de porties in zodra ze zijn afgekoeld. In de vriezer (-18 °C) blijft eten veilig; voor de smaak eet je het het liefst binnen een paar maanden op.",
      "Ontdooi in de koelkast, bijvoorbeeld een nacht van tevoren, en niet op het aanrecht. Of ontdooi in de magnetron en eet het dan meteen op.",
      "Verwarm je eten tot het overal gloeiend heet is, ook in het midden. Roer halverwege als je de magnetron gebruikt.",
      "Warm een portie maar één keer op en vries ontdooid eten niet opnieuw in.",
      "Let extra op rijst: laat gekookte rijst snel afkoelen, bewaar hem in de koelkast en eet hem binnen 2 dagen op.",
    ],
    keepTitle: "Welk eten is geschikt voor meal prep?",
    keepIntro: "Bijna alles wat je kookt, kun je 2 dagen in de koelkast bewaren. Maar niet alles blijft even lekker of kan de vriezer in:",
    keepHead: ["Gerecht", "Koelkast", "Vriezer"],
    keepRows: [
      ["Soep, chili, curry en stoofgerechten", "2 dagen", "Ja, heel geschikt"],
      ["Gekookte rijst, quinoa en couscous", "2 dagen", "Ja"],
      ["Pastasaus (zoals linzenbolognese)", "2 dagen", "Ja"],
      ["Gekookte pasta", "2 dagen", "Liever niet, wordt zacht"],
      ["Gegaarde kip, gehakt en vis", "2 dagen", "Ja"],
      ["Eiermuffins", "2 dagen", "Ja"],
      ["Overnight oats", "2 dagen", "Nee"],
      ["Salade met granen of peulvruchten", "2 dagen", "Nee"],
      ["Sla, komkommer en tomaat", "Apart en vers houden", "Nee"],
    ],
    keepNote: "Gekookte gerechten bewaar je afgesloten in de koelkast op 4 °C of kouder.",
    keepBullets: [
      "Gerechten met saus, zoals chili, curry en soep, worden vaak zelfs lekkerder na een dag.",
      "Houd knapperige groente, sla en dressing apart en voeg ze pas vlak voor het eten toe.",
      "Pasta kook je liever vers; de saus kun je wel vooruit maken en invriezen.",
      "Fruit zoals aardbeien en banaan snijd je pas op de dag zelf.",
    ],
    boxTitle: "Meal prep bakjes: waar let je op?",
    boxBullets: [
      "Afsluitbaar en lekvrij, zodat soep en saus niet in je tas lekken.",
      "Geschikt voor de magnetron en de vriezer. Glas is stevig en verkleurt niet; kunststof is lichter om mee te nemen.",
      "Plat en niet te groot: eten koelt dan sneller af en ontdooit gelijkmatiger.",
      "Bakjes met vakjes of een klein potje, zodat je saus, dressing en knapperige onderdelen apart houdt.",
      "Een stift of stickers om de datum op te schrijven.",
      "Een koeltas met koelelement als je je lunch meeneemt en er op je werk geen koelkast is.",
    ],
    recipesTitle: (cat: RecipeCategory) => ({ ontbijt: "Meal prep recepten voor het ontbijt", lunch: "Meal prep recepten voor de lunch", avondeten: "Meal prep recepten voor het avondeten" })[cat],
    recipesIntro: (cat: RecipeCategory, n: number) =>
      ({
        ontbijt: `${n} ontbijtjes die je de avond ervoor of op zondag maakt.`,
        lunch: `${n} lunches om mee te nemen. Houd sla en dressing apart tot je gaat eten.`,
        avondeten: `${n} avondmaaltijden om in 4 porties te koken: 2 voor de koelkast en 2 voor de vriezer.`,
      })[cat],
    planTitle: "Meal prep met een plan dat bij jou past",
    planText:
      "In je persoonlijke voedingsschema krijg je een weekmenu op jouw calorie- en eiwitdoel, met recepten, hoeveelheden en een complete boodschappenlijst. Zo weet je precies wat je op zondag kookt en hoeveel je in elk bakje doet.",
    planCta: "Bekijk het voedingsschema",
    faq: [
      {
        q: "Hoe lang kun je meal prep bewaren?",
        a: "Gekookte maaltijden bewaar je afgesloten in de koelkast (4 °C of kouder) en eet je binnen 2 dagen op; dat is het advies van het Voedingscentrum voor restjes. Wil je langer vooruit, vries de porties dan in zodra ze zijn afgekoeld.",
      },
      {
        q: "Kun je op zondag voor de hele week koken?",
        a: "Ja, maar niet alles kan in de koelkast. Bewaar de porties voor maandag en dinsdag in de koelkast en vries de porties voor woensdag tot en met vrijdag in. Haal ze de avond ervoor uit de vriezer en laat ze in de koelkast ontdooien.",
      },
      {
        q: "Kun je rijst en pasta meal preppen?",
        a: "Ja. Laat gekookte rijst, quinoa en pasta snel afkoelen, bewaar ze in de koelkast en eet ze binnen 2 dagen op, of vries ze in. Verwarm ze tot ze gloeiend heet zijn. Pasta wordt na het invriezen wat zachter; de saus vriest beter in.",
      },
      {
        q: "Helpt meal prep bij afvallen?",
        a: "Meal prep zelf laat je niet afvallen; daarvoor is een calorietekort nodig. Wel maakt het dat tekort voor veel mensen makkelijker vol te houden, omdat je porties vastliggen en je minder snel iets haalt als je moe of druk bent.",
      },
      {
        q: "Hoe warm je meal prep veilig op?",
        a: "Verwarm je eten in de magnetron, pan of oven tot het overal gloeiend heet is, ook in het midden. Roer halverwege, zodat er geen koude plekken overblijven. Warm een portie maar één keer op.",
      },
    ],
  },
  en: {
    metaTitle: "Meal prep: step-by-step plan, recipes and safe storage",
    metaDescription: `Meal prep for beginners: how to cook for several days at once, with a step-by-step plan, storage rules, the right containers and ${MEAL_PREP.length} meal prep recipes.`,
    eyebrow: "Recipes",
    h1: "Meal prep:",
    h1Accent: "cooking for several days at once",
    intro:
      "Don't feel like cooking every evening, or picking up food on the way home too often? With meal prep, you cook for several days in one go. That way, your food is ready when you're tired or busy. Here's how to start, how to store it safely and which recipes work well.",
    short: `Meal prep means cooking several meals ahead in one go and dividing them into portions. Allow 1 to 2 hours, on a Sunday for example. Cool the food quickly, keep it in the fridge and eat it within 2 days, or freeze it. Then reheat it until it's piping hot all the way through. Below you'll find a step-by-step plan and ${MEAL_PREP.length} meal prep recipes.`,
    whatTitle: "What is meal prep?",
    what: [
      "Meal prep is short for meal preparation: you cook, portion and store your food for the coming days in one go. That can be a complete meal, such as chilli in containers, or separate components you combine later, such as cooked rice, cooked chicken and chopped vegetables.",
      "The advantage: you have to decide what to eat less often when you're already hungry, your portions are fixed and you spend less time cooking and washing up. For many people, that makes it easier to stick to their plan.",
    ],
    stepsTitle: "Meal prep for beginners: how to do it on a Sunday",
    stepsIntro: "With 2 or 3 recipes, it takes around 1 to 1.5 hours. Here's how:",
    steps: [
      "Choose 2 or 3 recipes, for example 1 lunch and 1 or 2 dinners, and decide how many portions you need.",
      "Shop with a list, so you have everything at home.",
      "Start with what takes longest: put the brown rice or quinoa on and preheat the oven for roasted vegetables or egg muffins.",
      "Meanwhile, cook your stew, soup or sauce, such as chilli, curry or lentil bolognese.",
      "Chop the vegetables for salads and wraps and boil some eggs if needed.",
      "Cool everything quickly: divide large pans into small, shallow containers and put them in the fridge as soon as possible, within 2 hours at the latest.",
      "Divide the food into portions and write the date on each container. What you'll eat in the next 2 days goes in the fridge; the rest goes in the freezer.",
      "Midweek, take a portion out of the freezer and let it thaw overnight in the fridge, or do a second, short cooking session on Wednesday.",
    ],
    weekLink: "See how this fits into a whole weekly menu",
    safeTitle: "Storing meal prep safely: the rules",
    safeIntro: "Cooked food that's kept too long or too warm can spoil without you seeing or smelling it. So stick to these rules:",
    safeBullets: [
      "Cool cooked food quickly. Divide it into small, shallow containers and put them in the fridge as soon as possible, within 2 hours at the latest.",
      "Set your fridge to 4 °C or colder and don't pack the containers too tightly, so the cold air can circulate.",
      "Eat cooked meals from the fridge within 2 days. That's the advice of the Netherlands Nutrition Centre (Voedingscentrum) for leftovers.",
      "Want to cook further ahead? Freeze the portions as soon as they've cooled. In the freezer (-18 °C), food stays safe; for the best taste, eat it within a few months.",
      "Thaw in the fridge, for example overnight, not on the worktop. Or thaw in the microwave and eat it straight away.",
      "Reheat your food until it's piping hot all the way through, including the middle. Stir halfway if you use the microwave.",
      "Reheat a portion only once and don't refreeze thawed food.",
      "Take extra care with rice: cool cooked rice quickly, keep it in the fridge and eat it within 2 days.",
    ],
    keepTitle: "Which foods are good for meal prep?",
    keepIntro: "Almost anything you cook can be kept in the fridge for 2 days. But not everything stays as tasty or can go in the freezer:",
    keepHead: ["Dish", "Fridge", "Freezer"],
    keepRows: [
      ["Soup, chilli, curry and stews", "2 days", "Yes, ideal"],
      ["Cooked rice, quinoa and couscous", "2 days", "Yes"],
      ["Pasta sauce (such as lentil bolognese)", "2 days", "Yes"],
      ["Cooked pasta", "2 days", "Better not, goes soft"],
      ["Cooked chicken, mince and fish", "2 days", "Yes"],
      ["Egg muffins", "2 days", "Yes"],
      ["Overnight oats", "2 days", "No"],
      ["Salad with grains or pulses", "2 days", "No"],
      ["Salad leaves, cucumber and tomato", "Keep separate and fresh", "No"],
    ],
    keepNote: "Keep cooked dishes sealed in the fridge at 4 °C or colder.",
    keepBullets: [
      "Dishes with sauce, such as chilli, curry and soup, often taste even better after a day.",
      "Keep crunchy vegetables, salad leaves and dressing separate and add them just before eating.",
      "Pasta is best cooked fresh; you can make the sauce ahead and freeze it.",
      "Slice fruit such as strawberries and banana on the day itself.",
    ],
    boxTitle: "Meal prep containers: what to look for",
    boxBullets: [
      "Sealable and leak-proof, so soup and sauce don't leak into your bag.",
      "Microwave and freezer safe. Glass is sturdy and doesn't stain; plastic is lighter to carry.",
      "Shallow and not too big: food cools faster and thaws more evenly.",
      "Containers with compartments or a small pot, so you can keep sauce, dressing and crunchy bits separate.",
      "A marker or labels to write the date on.",
      "A cool bag with an ice pack if you take your lunch with you and there's no fridge at work.",
    ],
    recipesTitle: (cat: RecipeCategory) => ({ ontbijt: "Meal prep recipes for breakfast", lunch: "Meal prep recipes for lunch", avondeten: "Meal prep recipes for dinner" })[cat],
    recipesIntro: (cat: RecipeCategory, n: number) =>
      ({
        ontbijt: `${n} breakfasts to make the night before or on Sunday.`,
        lunch: `${n} lunches to take with you. Keep salad leaves and dressing separate until you eat.`,
        avondeten: `${n} dinners to cook in 4 portions: 2 for the fridge and 2 for the freezer.`,
      })[cat],
    planTitle: "Meal prep with a plan that suits you",
    planText:
      "In your personal nutrition plan, you get a weekly menu based on your calorie and protein targets, with recipes, amounts and a complete shopping list. So you know exactly what to cook on Sunday and how much to put in each container.",
    planCta: "See the nutrition plan",
    faq: [
      {
        q: "How long can you keep meal prep?",
        a: "Keep cooked meals sealed in the fridge (4 °C or colder) and eat them within 2 days; that's the Netherlands Nutrition Centre's advice for leftovers. If you want to cook further ahead, freeze the portions as soon as they've cooled.",
      },
      {
        q: "Can you cook for the whole week on Sunday?",
        a: "Yes, but not everything can go in the fridge. Keep the portions for Monday and Tuesday in the fridge and freeze the portions for Wednesday to Friday. Take them out of the freezer the night before and let them thaw in the fridge.",
      },
      {
        q: "Can you meal prep rice and pasta?",
        a: "Yes. Cool cooked rice, quinoa and pasta quickly, keep them in the fridge and eat them within 2 days, or freeze them. Reheat until piping hot. Pasta goes a little soft after freezing; the sauce freezes better.",
      },
      {
        q: "Does meal prep help with weight loss?",
        a: "Meal prep itself doesn't make you lose weight; that takes a calorie deficit. But for many people it makes that deficit easier to keep up, because your portions are fixed and you're less likely to grab something when you're tired or busy.",
      },
      {
        q: "How do you reheat meal prep safely?",
        a: "Reheat your food in the microwave, a pan or the oven until it's piping hot all the way through, including the middle. Stir halfway so there are no cold spots. Reheat a portion only once.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

export default async function MealPrepPage() {
  const l = await getLocale();
  const c = copy[l];
  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short} />
      <ArticleBody>
        <Section title={c.whatTitle} paragraphs={c.what} />

        <Section title={c.stepsTitle} paragraphs={[c.stepsIntro]}>
          <ol className="list-decimal space-y-2 pl-6 text-lg leading-relaxed text-muted marker:font-bold marker:text-brand-600">
            {c.steps.map((s) => (
              <li key={s.slice(0, 48)}>{s}</li>
            ))}
          </ol>
          <ArrowLink href="/gezond-weekmenu">{c.weekLink}</ArrowLink>
        </Section>

        <Section title={c.safeTitle} paragraphs={[c.safeIntro]} bullets={c.safeBullets} />

        <Section title={c.keepTitle} paragraphs={[c.keepIntro]}>
          <DataTable head={c.keepHead} rows={c.keepRows} note={c.keepNote} />
          <ul className="list-disc space-y-2 pl-6 text-lg leading-relaxed text-muted marker:text-brand-600">
            {c.keepBullets.map((b) => (
              <li key={b.slice(0, 48)}>{b}</li>
            ))}
          </ul>
        </Section>

        <Section title={c.boxTitle} bullets={c.boxBullets} />

        {CATEGORIES.map((cat) => {
          const list = MEAL_PREP.filter((r) => r.category === cat);
          if (list.length === 0) return null;
          return (
            <Section key={cat} title={c.recipesTitle(cat)} paragraphs={[c.recipesIntro(cat, list.length)]}>
              <div className="space-y-6">
                {list.map((r) => (
                  <RecipeCard key={r.slug} recipe={r} l={l} />
                ))}
              </div>
            </Section>
          );
        })}

        <PlanBox title={c.planTitle} text={c.planText} href="/voedingsschema" cta={c.planCta} />
        <RelatedPages l={l} paths={["/gezond-weekmenu", "/recepten", "/recepten/eiwitrijke-lunch", "/recepten/eiwitrijk-avondeten"]} />
      </ArticleBody>
      <FaqAndClose l={l} items={c.faq} />
    </>
  );
}

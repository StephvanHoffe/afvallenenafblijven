import type { Metadata } from "next";
import { WaterCalculator } from "@/components/calculator/WaterCalculator";
import { ArrowLink, ArticleBody, ArticleSchema, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { foods, nutrientsFor, roundNutrients } from "@/content/nutrition";
import { defineCopy } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { formatNumber } from "@/lib/format";

const PATH = "/hoeveel-water-per-dag";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

/** Vuistregel (zoals de rekenhulp): 0,03 tot 0,035 liter per kilo, plus 0,5 tot 1 liter per uur sporten. */
const PER_KG = { low: 0.03, high: 0.035 } as const;
const PER_HOUR_SPORT = { low: 0.5, high: 1 } as const;
const WEIGHTS = [50, 60, 70, 80, 90, 100];

const litres = (x: number) => Math.round(x * 10) / 10;

/** Calorieën en suiker van een standaardportie uit nutrition.ts (de eerste portie). */
function drink(key: "cola" | "sinaasappelsap") {
  const portion = foods[key].portions[0];
  return { ...roundNutrients(nutrientsFor(key, portion.amount)), ml: portion.amount };
}

type DrinkFacts = { colaKcal: string; colaSugar: string; juiceKcal: string; juiceSugar: string; weekKcal: string };

const copy = defineCopy({
  nl: {
    metaTitle: "Hoeveel water per dag moet je drinken? Met rekenhulp",
    metaDescription:
      "Hoeveel water per dag moet je drinken? Het advies is 1,5 tot 2 liter. Lees wat meetelt, wanneer je meer nodig hebt en bereken een indicatie voor jezelf.",
    eyebrow: "Voeding",
    h1: "Hoeveel water per dag",
    h1Accent: "moet je drinken?",
    intro:
      "Genoeg drinken is belangrijk, maar hoeveel is genoeg? En telt koffie mee? Hier lees je wat het advies is, wanneer je meer nodig hebt en hoe je merkt dat je genoeg drinkt.",
    short:
      "Het Voedingscentrum adviseert volwassenen om ongeveer 1,5 tot 2 liter vocht per dag te drinken: zo'n 6 tot 8 glazen van 250 ml. Water, thee, koffie en melk tellen allemaal mee. Bij warm weer, sporten of koorts heb je meer nodig. Dorst en donkere urine zijn tekenen dat je meer moet drinken.",
    adviceTitle: "Hoeveel water per dag heb je nodig?",
    advice: [
      "Voor de meeste volwassenen is 1,5 tot 2 liter vocht per dag genoeg. Dat is het advies van het Voedingscentrum. Daarnaast krijg je ook vocht binnen via je eten, bijvoorbeeld uit groente, fruit en soep.",
      "Hoeveel jij precies nodig hebt, verschilt per persoon en per dag. Wie zwaarder is, veel beweegt of het warm heeft, verliest meer vocht en heeft dus ook meer nodig.",
    ],
    weightTitle: "Hoeveel water per dag per lichaamsgewicht?",
    weightIntro:
      "Een vuistregel die vaak wordt gebruikt: ongeveer 0,03 tot 0,035 liter per kilo lichaamsgewicht, plus 0,5 tot 1 liter per uur sporten. In onze schema's rekenen we met 0,033 liter per kilo. Zie het als een indicatie, niet als iets wat je precies moet halen.",
    weightHead: ["Gewicht", "Per dag", "Met 1 uur sporten"],
    weightNote: "Liter vocht per dag, alles wat je drinkt samen. Een indicatie; je dorst en de kleur van je urine zeggen meer.",
    countsTitle: "Wat telt mee als vocht?",
    countsIntro: "Niet alleen water telt mee. Ook deze dranken horen erbij:",
    counts: [
      "Water, uit de kraan of uit een fles.",
      "Thee en koffie, het liefst zonder suiker.",
      "Melk en karnemelk.",
      "Soep: die bestaat grotendeels uit water.",
      "Frisdrank en vruchtensap tellen ook mee als vocht, maar er zit veel suiker in. Kies ze daarom liever niet als dorstlesser.",
    ],
    moreTitle: "Wanneer heb je meer water nodig?",
    moreIntro: "Op sommige dagen verlies je meer vocht dan normaal. Drink dan extra:",
    more: [
      "Bij warm weer, ook als je weinig doet.",
      "Als je sport: reken op ongeveer 0,5 tot 1 liter extra per uur, afhankelijk van hoeveel je zweet.",
      "Bij koorts, diarree of overgeven.",
    ],
    moreNote:
      "Ouderen voelen minder snel dorst. Drink daarom op vaste momenten, bijvoorbeeld een glas bij elke maaltijd en bij de koffie of thee.",
    enoughTitle: "Hoe weet je of je genoeg drinkt?",
    enough: [
      "Je lichaam geeft zelf goed aan of je genoeg drinkt. Dorst is het eerste signaal. Ook de kleur van je urine helpt: lichtgeel betekent meestal dat je genoeg drinkt, donkergeel dat je meer moet drinken.",
      "Plas je weinig, heb je een droge mond of voel je je slap of duizelig, drink dan wat extra. Houden klachten aan, neem dan contact op met je huisarts.",
    ],
    tooMuchTitle: "Kun je te veel water drinken?",
    tooMuch: [
      "Voor gezonde mensen is dat zeldzaam. Alleen heel grote hoeveelheden in korte tijd kunnen schadelijk zijn: het zoutgehalte in je bloed kan dan te laag worden. Met gewoon drinken op je dorst loop je dat risico niet.",
      "Heb je hart- of nierproblemen? Dan kan je arts je een vochtbeperking geven: een maximum aan wat je per dag mag drinken. Volg dan altijd het advies van je arts, ook als dat minder is dan wat op deze pagina staat.",
    ],
    weightLossTitle: "Helpt water drinken bij afvallen?",
    weightLoss: (d: DrinkFacts) => [
      "Water is geen vetverbrander: van extra water drinken val je niet vanzelf af. Water helpt vooral als je het drinkt in plaats van drankjes met suiker. Water bevat geen calorieën.",
      `Een blikje cola (33 cl) bevat ± ${d.colaKcal} kcal en ${d.colaSugar} gram suiker, een glas sinaasappelsap (200 ml) ± ${d.juiceKcal} kcal en ${d.juiceSugar} gram suiker. Drink je elke dag een blikje cola, dan is dat zo'n ${d.weekKcal} kcal per week. Vervang je het door water, thee of koffie zonder suiker, dan scheelt dat dus flink.`,
    ],
    sugarLink: "Hoeveel suiker per dag mag je?",
    boxTitle: "Afvallen zonder te tellen",
    boxText:
      "In je persoonlijke voedingsschema rekenen we je calorieën en eiwit voor je uit. Je krijgt een weekmenu met recepten en een boodschappenlijst, zodat je precies weet wat je eet.",
    boxCta: "Maak mijn persoonlijke plan",
    boxNote: "± 3 minuten · je betaalt pas als je een plan kiest",
    faq: (d: DrinkFacts) => [
      {
        q: "Hoeveel liter water per dag is gezond?",
        a: "Het Voedingscentrum adviseert volwassenen om ongeveer 1,5 tot 2 liter vocht per dag te drinken. Alles wat je drinkt telt mee. Bij warm weer, sporten of koorts heb je meer nodig.",
      },
      {
        q: "Tellen koffie en thee mee?",
        a: "Ja. Koffie en thee tellen mee als vocht, net als melk en soep. Kies ze het liefst zonder suiker.",
      },
      {
        q: "Is 3 liter water per dag te veel?",
        a: "Voor de meeste gezonde volwassenen is dat geen probleem, zeker niet bij warm weer of als je sport. Alleen heel grote hoeveelheden in korte tijd kunnen schadelijk zijn. Heb je hart- of nierproblemen, volg dan het advies van je arts.",
      },
      {
        q: "Hoeveel water per dag als je sport?",
        a: "Als vuistregel drink je ongeveer 0,5 tot 1 liter extra per uur sporten. Hoeveel precies, hangt af van hoe warm het is en hoeveel je zweet.",
      },
      {
        q: "Val je af van veel water drinken?",
        a: `Niet vanzelf: water verbrandt geen vet. Het helpt wel als je water drinkt in plaats van drankjes met suiker. Een blikje cola bevat ± ${d.colaKcal} kcal, water 0.`,
      },
      {
        q: "Moet je ook drinken als je geen dorst hebt?",
        a: "Voor gezonde volwassenen is dorst meestal een goede graadmeter. Ouderen voelen minder snel dorst; voor hen is het verstandig om op vaste momenten te drinken.",
      },
    ],
  },
  en: {
    metaTitle: "How much water a day should you drink? With calculator",
    metaDescription:
      "How much water should you drink a day? The advice is 1.5 to 2 litres. Find out what counts, when you need more, and work out an indication for yourself.",
    eyebrow: "Nutrition",
    h1: "How much water a day",
    h1Accent: "should you drink?",
    intro:
      "Drinking enough matters, but how much is enough? And does coffee count? Here you can read what the advice is, when you need more and how to tell whether you're drinking enough.",
    short:
      "The Netherlands Nutrition Centre advises adults to drink around 1.5 to 2 litres of fluid a day: about 6 to 8 glasses of 250 ml. Water, tea, coffee and milk all count. You need more in hot weather, when you exercise or when you have a fever. Thirst and dark urine are signs that you need to drink more.",
    adviceTitle: "How much water a day do you need?",
    advice: [
      "For most adults, 1.5 to 2 litres of fluid a day is enough. That's the advice of the Netherlands Nutrition Centre (Voedingscentrum). You also get fluid from your food, for example from vegetables, fruit and soup.",
      "Exactly how much you need varies from person to person and from day to day. If you're heavier, move a lot or are hot, you lose more fluid and so need more.",
    ],
    weightTitle: "How much water a day by body weight?",
    weightIntro:
      "A commonly used rule of thumb: around 0.03 to 0.035 litres per kilo of body weight, plus 0.5 to 1 litre per hour of exercise. In our plans, we use 0.033 litres per kilo. See it as an indication, not something you have to hit exactly.",
    weightHead: ["Weight", "Per day", "With 1 hour of exercise"],
    weightNote: "Litres of fluid a day, everything you drink together. An indication; your thirst and the colour of your urine tell you more.",
    countsTitle: "What counts as fluid?",
    countsIntro: "It's not just water that counts. These drinks count too:",
    counts: [
      "Water, from the tap or from a bottle.",
      "Tea and coffee, preferably without sugar.",
      "Milk and buttermilk.",
      "Soup: it's mostly water.",
      "Soft drinks and fruit juice also count as fluid, but they contain a lot of sugar. So it's better not to choose them to quench your thirst.",
    ],
    moreTitle: "When do you need more water?",
    moreIntro: "On some days, you lose more fluid than usual. Drink extra then:",
    more: [
      "In hot weather, even if you're not doing much.",
      "When you exercise: count on around 0.5 to 1 litre extra per hour, depending on how much you sweat.",
      "With a fever, diarrhoea or vomiting.",
    ],
    moreNote: "Older people feel thirsty less quickly. So drink at fixed moments, for example a glass with every meal and with your coffee or tea.",
    enoughTitle: "How do you know if you're drinking enough?",
    enough: [
      "Your body is good at telling you whether you're drinking enough. Thirst is the first signal. The colour of your urine helps too: pale yellow usually means you're drinking enough, dark yellow that you need to drink more.",
      "If you pass little urine, have a dry mouth or feel weak or dizzy, drink a bit extra. If symptoms persist, contact your GP.",
    ],
    tooMuchTitle: "Can you drink too much water?",
    tooMuch: [
      "For healthy people, that's rare. Only very large amounts in a short time can be harmful: the salt level in your blood can then drop too low. If you simply drink when you're thirsty, you don't run that risk.",
      "Do you have heart or kidney problems? Then your doctor may give you a fluid restriction: a maximum amount you're allowed to drink a day. Always follow your doctor's advice, even if it's less than what this page says.",
    ],
    weightLossTitle: "Does drinking water help you lose weight?",
    weightLoss: (d: DrinkFacts) => [
      "Water is not a fat burner: drinking extra water won't make you lose weight on its own. Water mainly helps when you drink it instead of sugary drinks. Water contains no calories.",
      `A can of cola (33 cl) contains around ${d.colaKcal} kcal and ${d.colaSugar} grams of sugar, a glass of orange juice (200 ml) around ${d.juiceKcal} kcal and ${d.juiceSugar} grams of sugar. If you drink a can of cola every day, that's around ${d.weekKcal} kcal a week. Replacing it with water, or tea or coffee without sugar, makes quite a difference.`,
    ],
    sugarLink: "How much sugar a day is OK?",
    boxTitle: "Lose weight without counting",
    boxText:
      "In your personal nutrition plan, we work out your calories and protein for you. You get a weekly menu with recipes and a shopping list, so you know exactly what you're eating.",
    boxCta: "Create my personal plan",
    boxNote: "About 3 minutes · you only pay once you choose a plan",
    faq: (d: DrinkFacts) => [
      {
        q: "How many litres of water a day is healthy?",
        a: "The Netherlands Nutrition Centre advises adults to drink around 1.5 to 2 litres of fluid a day. Everything you drink counts. You need more in hot weather, when you exercise or when you have a fever.",
      },
      {
        q: "Do coffee and tea count?",
        a: "Yes. Coffee and tea count as fluid, just like milk and soup. Preferably choose them without sugar.",
      },
      {
        q: "Is 3 litres of water a day too much?",
        a: "For most healthy adults, that's not a problem, especially in hot weather or when you exercise. Only very large amounts in a short time can be harmful. If you have heart or kidney problems, follow your doctor's advice.",
      },
      {
        q: "How much water a day when you exercise?",
        a: "As a rule of thumb, drink around 0.5 to 1 litre extra per hour of exercise. Exactly how much depends on how hot it is and how much you sweat.",
      },
      {
        q: "Do you lose weight by drinking lots of water?",
        a: `Not on its own: water doesn't burn fat. It does help if you drink water instead of sugary drinks. A can of cola contains around ${d.colaKcal} kcal, water 0.`,
      },
      {
        q: "Should you drink even when you're not thirsty?",
        a: "For healthy adults, thirst is usually a good guide. Older people feel thirsty less quickly; for them, it's sensible to drink at fixed moments.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

export default async function WaterPage() {
  const l = await getLocale();
  const c = copy[l];
  const n = (x: number, d = 0) => formatNumber(x, d, l);
  const unit = l === "en" ? "litres" : "liter";
  const range = (low: number, high: number) => `${n(litres(low), 1)}–${n(litres(high), 1)} ${unit}`;

  const cola = drink("cola");
  const juice = drink("sinaasappelsap");
  const facts: DrinkFacts = {
    colaKcal: n(cola.kcal),
    colaSugar: n(cola.sugars ?? 0),
    juiceKcal: n(juice.kcal),
    juiceSugar: n(juice.sugars ?? 0),
    weekKcal: n(Math.round((cola.kcal * 7) / 10) * 10),
  };
  const weightRows = WEIGHTS.map((w) => [
    `${n(w)} kg`,
    range(w * PER_KG.low, w * PER_KG.high),
    range(w * PER_KG.low + PER_HOUR_SPORT.low, w * PER_KG.high + PER_HOUR_SPORT.high),
  ]);

  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short}>
        <WaterCalculator />
      </ContentHero>

      <ArticleBody>
        <Section title={c.adviceTitle} paragraphs={c.advice} />

        <Section title={c.weightTitle} paragraphs={[c.weightIntro]}>
          <DataTable head={c.weightHead} rows={weightRows} note={c.weightNote} minWidth="24rem" />
        </Section>

        <Section title={c.countsTitle} paragraphs={[c.countsIntro]} bullets={c.counts} />

        <Section title={c.moreTitle} paragraphs={[c.moreIntro]} bullets={c.more}>
          <p className="text-lg leading-relaxed text-muted">{c.moreNote}</p>
        </Section>

        <Section title={c.enoughTitle} paragraphs={c.enough} />

        <Section title={c.tooMuchTitle} paragraphs={c.tooMuch} />

        <Section title={c.weightLossTitle} paragraphs={c.weightLoss(facts)}>
          <ArrowLink href="/hoeveel-suiker-per-dag">{c.sugarLink}</ArrowLink>
        </Section>

        <PlanBox title={c.boxTitle} text={c.boxText} href="/start?doel=afvallen" cta={c.boxCta} note={c.boxNote} />

        <RelatedPages l={l} paths={["/hoeveel-suiker-per-dag", "/vezels-per-dag", "/koolhydraten-per-dag", "/caloriebehoefte-berekenen"]} />
      </ArticleBody>

      <FaqAndClose l={l} items={c.faq(facts)} />
    </>
  );
}

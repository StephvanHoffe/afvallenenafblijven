import type { Metadata } from "next";
import { ArrowLink, ArticleBody, ArticleSchema, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { defineCopy, type Locale } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { formatNumber } from "@/lib/format";

const PATH = "/hoeveel-stappen-per-dag";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";
/** Afhankelijk van je paslengte zet je ± 1.300 tot 1.500 stappen per kilometer. */
const STEPS_PER_KM = { short: 1500, long: 1300 };
/** ± 100 stappen per minuut is voor de meeste volwassenen de ondergrens van stevig (matig intensief) wandelen. */
const STEPS_PER_MINUTE = 100;
const STEP_ROWS = [2000, 4000, 6000, 8000, 10000, 12000];

const copy = defineCopy({
  nl: {
    metaTitle: "Hoeveel stappen per dag zijn gezond? Is 10.000 nodig?",
    metaDescription:
      "Hoeveel stappen per dag zijn gezond, en moet het echt 10.000 stappen per dag zijn? Wat onderzoek zegt, met een tabel van stappen naar kilometers en minuten.",
    eyebrow: "Bewegen",
    h1: "Hoeveel stappen per dag",
    h1Accent: "zijn gezond?",
    intro:
      "10.000 stappen per dag is het bekendste beweegdoel ter wereld. Maar waar komt dat getal vandaan, en heb je echt zoveel stappen nodig? Dit zegt het onderzoek, en zo zet je zonder sportschool meer stappen.",
    short:
      "Meer stappen is beter, maar 10.000 is geen magische grens. In een grote analyse van 15 onderzoeken (The Lancet Public Health, 2022) daalde het sterfterisico naarmate mensen meer stappen zetten, tot het afvlakte rond 6.000 tot 8.000 stappen per dag voor 60-plussers en rond 8.000 tot 10.000 voor jongere volwassenen. 10.000 stappen is ongeveer 7 kilometer: in een stevig tempo zo'n anderhalf uur wandelen.",
    origin: {
      title: "Waar komen die 10.000 stappen per dag vandaan?",
      paragraphs: [
        "Het getal komt niet uit onderzoek, maar uit de marketing. In de jaren zestig kwam in Japan een stappenteller op de markt met de naam manpo-kei: letterlijk '10.000-stappenmeter'. Een rond, pakkend getal dat goed bleef hangen, en dat later over de hele wereld is overgenomen.",
        "Pas veel later hebben onderzoekers uitgezocht hoeveel stappen per dag echt verschil maken. Het goede nieuws: 10.000 blijkt een prima doel, maar voor veel mensen is het geen harde ondergrens.",
      ],
    },
    research: {
      title: "Hoeveel stappen per dag zijn gezond volgens onderzoek?",
      paragraphs: [
        "In 2022 verscheen in The Lancet Public Health een grote meta-analyse (Paluch en collega's) van 15 onderzoeken met bijna 50.000 volwassenen. Hoe meer stappen mensen per dag zetten, hoe lager hun risico om tijdens de onderzoeksperiode te overlijden. Dat voordeel bleef alleen niet eindeloos groeien: het vlakte af, en waar dat gebeurde, hing af van de leeftijd.",
      ],
      head: ["Leeftijd", "Voordeel vlakt af rond"],
      rows: [
        ["60 jaar en ouder", "6.000 tot 8.000 stappen per dag"],
        ["Jonger dan 60", "8.000 tot 10.000 stappen per dag"],
      ],
      note: "Bron: Paluch e.a., The Lancet Public Health (2022).",
      after: [
        "Let wel: dit is onderzoek naar een verband. Het laat zien dat mensen die meer stappen zetten gemiddeld langer leven, maar bewijst niet dat het alleen aan de stappen ligt. De praktische les: je hoeft niet per se 10.000 te halen, en zit je daar nu ver onder, dan telt elke stap die je erbij zet.",
      ],
    },
    guideline: {
      title: "Wat zegt de beweegrichtlijn?",
      paragraphs: [
        "De Nederlandse beweegrichtlijnen van de Gezondheidsraad (2017) noemen geen aantal stappen. De kern is: bewegen is goed, meer bewegen is beter. Voor volwassenen en ouderen komt het advies hierop neer:",
      ],
      bullets: [
        "Minstens 150 minuten per week matig intensief bewegen, verspreid over meerdere dagen. Bijvoorbeeld stevig wandelen of fietsen: je hartslag en ademhaling gaan omhoog, maar je kunt nog praten.",
        "Minstens 2 keer per week spier- en botversterkende activiteiten, zoals krachttraining. Voor ouderen gecombineerd met balansoefeningen.",
        "Voorkom veel stilzitten.",
      ],
      after: [
        "150 minuten is bijvoorbeeld 5 keer per week een half uur stevig wandelen. Ongeveer 100 stappen per minuut komt voor de meeste volwassenen overeen met matig intensief wandelen, dus een half uur stevig doorlopen is al gauw 3.000 stappen of meer.",
      ],
    },
    distance: {
      title: "10.000 stappen: hoeveel kilometer en hoe lang?",
      paragraphs: [
        "Hoeveel kilometer je met een aantal stappen aflegt, hangt af van je paslengte: de meeste mensen zetten 1.300 tot 1.500 stappen per kilometer. 10.000 stappen is dus zo'n 7 kilometer. In de tabel zie je ook hoe lang je erover doet als je ± 100 stappen per minuut zet.",
      ],
      head: ["Stappen", "Afstand (ongeveer)", "Tijd bij ± 100 stappen/min"],
      note: "Afstand bij 1.300 tot 1.500 stappen per kilometer: wie langer is, zet meestal grotere stappen en heeft er minder nodig per kilometer. Loop je sneller dan 100 stappen per minuut, dan ben je eerder klaar. Je hoeft je stappen niet in één keer te zetten: alles wat je op een dag loopt, telt mee.",
      time: (h: number, m: number) => (h === 0 ? `${m} min` : m === 0 ? `${h} uur` : `${h} uur ${m} min`),
    },
    weightLoss: {
      title: "Hoeveel stappen per dag om af te vallen?",
      paragraphs: [
        "Daar is geen vast getal voor. Je valt af als je langere tijd minder energie binnenkrijgt dan je verbruikt, en dat bepaal je vooral met wat je eet. Meer stappen verhogen wel je verbruik. Voor iemand van 75 kilo kosten 10.000 stappen in een stevig tempo zo'n 375 kcal in totaal, waarvan ± 270 kcal extra bovenop wat je in rust al verbruikt.",
        "In onze schema's krijg je een dagelijks stappendoel: 8.000 stappen als je overdag vooral zit, en anders 10.000. Haal je dat nu nog lang niet? Bouw het dan rustig op, bijvoorbeeld met 500 tot 1.000 stappen per dag extra per week.",
      ],
      link: "Bereken hoeveel calorieën je verbrandt met wandelen",
      calcLink: "Bereken je caloriebehoefte",
    },
    tips: {
      title: "Zo zet je meer stappen per dag",
      paragraphs: ["Je hoeft er geen uur extra voor vrij te maken. Een paar kleine gewoontes leveren samen zo duizenden stappen op:"],
      bullets: [
        "Loop tijdens het bellen: een gesprek van 10 minuten levert al snel 500 tot 1.000 stappen op.",
        "Neem de trap in plaats van de lift of de roltrap.",
        "Stap een halte eerder uit, of parkeer wat verder weg.",
        "Maak na het eten een ommetje van 10 tot 15 minuten.",
        "Doe kleine boodschappen lopend, of loop een rondje voordat je begint met werken.",
        "Sta elk uur even op: haal water, of loop naar een collega in plaats van te mailen.",
        "Spreek af om samen te wandelen. Een vaste afspraak sla je minder snel over.",
        "Kijk aan het eind van de middag op je stappenteller, dan heb je nog tijd voor een rondje.",
      ],
      after: [
        "Je telefoon telt alleen de stappen die je zet terwijl je hem bij je hebt; een horloge of stappenteller om je pols of aan je broek telt meer van je dag. Geen van beide is tot op de stap nauwkeurig, maar ze zijn goed genoeg om te zien of je meer of minder beweegt dan vorige week.",
      ],
    },
    planTitle: "Een stappendoel in je persoonlijke plan",
    planText:
      "In je persoonlijke plan staat een dagelijks stappendoel dat bij je dag past (8.000 of 10.000), met een weekmenu dat precies op je caloriedoel uitkomt en, als je wilt, een trainingsschema voor thuis of de sportschool.",
    planCta: "Maak mijn persoonlijke plan",
    planNote: "± 3 minuten · je betaalt pas als je een plan kiest",
    faq: [
      {
        q: "Hoeveel stappen per dag zijn gezond?",
        a: "Er is geen officiële norm in stappen. Onderzoek laat zien dat meer stappen samengaan met een lager sterfterisico, tot dat voordeel afvlakt rond 6.000 tot 8.000 stappen per dag voor 60-plussers en rond 8.000 tot 10.000 voor jongere volwassenen. De beweegrichtlijn vraagt daarnaast minstens 150 minuten matig intensief bewegen per week.",
      },
      {
        q: "Hoeveel kilometer is 10.000 stappen?",
        a: "Ongeveer 6,7 tot 7,7 kilometer, afhankelijk van je paslengte: gemiddeld zo'n 7 kilometer. Bij ± 100 stappen per minuut ben je er 1 uur en 40 minuten mee bezig; loop je sneller, dan ben je eerder klaar. Je mag ze gewoon over de dag verspreiden.",
      },
      {
        q: "Hoeveel stappen per dag om af te vallen?",
        a: "Daar is geen vast getal voor: je valt af door een calorietekort, en dat bepaal je vooral met wat je eet. Meer stappen verhogen wel je verbruik. In onze schema's is het stappendoel 8.000 per dag als je overdag vooral zit, en anders 10.000.",
      },
      {
        q: "Is 5.000 stappen per dag genoeg?",
        a: "Het is een goed begin. In het onderzoek gingen meer stappen samen met een lager risico, tot ongeveer 6.000 tot 10.000 per dag, afhankelijk van je leeftijd. Zet je nu 5.000 stappen, probeer er dan geleidelijk meer van te maken, bijvoorbeeld 500 tot 1.000 per dag extra per week.",
      },
      {
        q: "Telt fietsen mee voor je stappen?",
        a: "Voor je stappenteller meestal niet: die telt passen. Voor de beweegrichtlijn telt fietsen wel gewoon mee: stevig fietsen is, net als stevig wandelen, matig intensief bewegen.",
      },
      {
        q: "Hoeveel stappen per dag als 60-plusser?",
        a: "In het grote onderzoek uit 2022 vlakte het voordeel bij 60-plussers af rond 6.000 tot 8.000 stappen per dag. De beweegrichtlijn adviseert ouderen daarnaast spier- en botversterkende activiteiten, gecombineerd met balansoefeningen. Heb je klachten of een aandoening, overleg dan eerst met je huisarts.",
      },
    ],
  },
  en: {
    metaTitle: "How many steps a day is healthy? Do you need 10,000?",
    metaDescription:
      "How many steps a day is healthy, and do you really need 10,000 steps a day? What research says, with a table converting steps into kilometres and minutes.",
    eyebrow: "Exercise",
    h1: "How many steps a day",
    h1Accent: "is healthy?",
    intro:
      "10,000 steps a day is the best-known activity target in the world. But where does that number come from, and do you really need that many steps? Here's what the research says, and how to walk more without a gym.",
    short:
      "More steps is better, but 10,000 isn't a magic threshold. In a large analysis of 15 studies (The Lancet Public Health, 2022), the risk of death fell as people took more steps, until it levelled off at around 6,000 to 8,000 steps a day for people aged 60 and over and around 8,000 to 10,000 for younger adults. 10,000 steps is roughly 7 kilometres: about an hour and a half of brisk walking.",
    origin: {
      title: "Where does 10,000 steps a day come from?",
      paragraphs: [
        "The number doesn't come from research, but from marketing. In the 1960s, a pedometer went on sale in Japan called the manpo-kei: literally '10,000-step meter'. A round, catchy number that stuck, and was later adopted all over the world.",
        "Only much later did researchers look into how many steps a day really make a difference. The good news: 10,000 turns out to be a fine target, but for many people it isn't a hard minimum.",
      ],
    },
    research: {
      title: "How many steps a day is healthy according to research?",
      paragraphs: [
        "In 2022, The Lancet Public Health published a large meta-analysis (Paluch and colleagues) of 15 studies with nearly 50,000 adults. The more steps people took a day, the lower their risk of dying during the study period. But that benefit didn't keep growing forever: it levelled off, and where that happened depended on age.",
      ],
      head: ["Age", "Benefit levels off at around"],
      rows: [
        ["60 and over", "6,000 to 8,000 steps a day"],
        ["Under 60", "8,000 to 10,000 steps a day"],
      ],
      note: "Source: Paluch et al., The Lancet Public Health (2022).",
      after: [
        "Bear in mind: this is research into an association. It shows that people who take more steps live longer on average, but doesn't prove that it's down to the steps alone. The practical lesson: you don't necessarily have to reach 10,000, and if you're well below that now, every step you add counts.",
      ],
    },
    guideline: {
      title: "What do the Dutch activity guidelines say?",
      paragraphs: [
        "The Dutch physical activity guidelines from the Health Council of the Netherlands (2017) don't mention a number of steps. The core message: moving is good, moving more is better. For adults and older adults, the advice comes down to this:",
      ],
      bullets: [
        "At least 150 minutes of moderate-intensity activity a week, spread over several days. For example brisk walking or cycling: your heart rate and breathing go up, but you can still talk.",
        "Muscle- and bone-strengthening activities, such as strength training, at least twice a week. For older adults, combined with balance exercises.",
        "Avoid sitting still for long periods.",
      ],
      after: [
        "150 minutes is, for example, half an hour of brisk walking 5 times a week. About 100 steps a minute corresponds to moderate-intensity walking for most adults, so half an hour of brisk walking easily adds up to 3,000 steps or more.",
      ],
    },
    distance: {
      title: "10,000 steps: how many kilometres and how long?",
      paragraphs: [
        "How far you get with a number of steps depends on your stride length: most people take 1,300 to 1,500 steps per kilometre. So 10,000 steps is about 7 kilometres. The table also shows how long it takes at about 100 steps a minute.",
      ],
      head: ["Steps", "Distance (approx.)", "Time at ± 100 steps/min"],
      note: "Distance at 1,300 to 1,500 steps per kilometre: taller people usually take longer strides and need fewer per kilometre. If you walk faster than 100 steps a minute, you'll finish sooner. You don't have to take your steps in one go: everything you walk in a day counts.",
      time: (h: number, m: number) => (h === 0 ? `${m} min` : m === 0 ? `${h} hr${h > 1 ? "s" : ""}` : `${h} hr${h > 1 ? "s" : ""} ${m} min`),
    },
    weightLoss: {
      title: "How many steps a day to lose weight?",
      paragraphs: [
        "There's no fixed number. You lose weight when you take in less energy than you use over a longer period, and that's mostly down to what you eat. More steps do increase how much you burn. For someone weighing 75 kilos, 10,000 steps at a brisk pace burns around 375 kcal in total, of which about 270 kcal is extra on top of what you burn at rest anyway.",
        "In our plans, you get a daily step target: 8,000 steps if you mostly sit during the day, and 10,000 otherwise. Still a long way off? Then build up gradually, for example by adding 500 to 1,000 steps a day each week.",
      ],
      link: "Work out how many calories you burn walking",
      calcLink: "Calculate your calorie needs",
    },
    tips: {
      title: "How to take more steps a day",
      paragraphs: ["You don't need to free up an extra hour. A few small habits easily add up to thousands of steps:"],
      bullets: [
        "Walk while you're on the phone: a 10-minute call easily gives you 500 to 1,000 steps.",
        "Take the stairs instead of the lift or escalator.",
        "Get off one stop earlier, or park a little further away.",
        "Go for a 10 to 15-minute stroll after meals.",
        "Do small shopping trips on foot, or walk round the block before you start work.",
        "Get up every hour: fetch some water, or walk over to a colleague instead of sending an email.",
        "Arrange to walk with someone. You're less likely to skip a fixed appointment.",
        "Check your step counter in the late afternoon, so you still have time for a walk.",
      ],
      after: [
        "Your phone only counts the steps you take while you're carrying it; a watch or pedometer on your wrist or clipped to your clothes counts more of your day. Neither is accurate to the exact step, but both are good enough to see whether you're moving more or less than last week.",
      ],
    },
    planTitle: "A step target in your personal plan",
    planText:
      "Your personal plan includes a daily step target that suits your day (8,000 or 10,000), with a weekly menu that adds up to exactly your calorie target and, if you like, a workout plan for home or the gym.",
    planCta: "Create my personal plan",
    planNote: "About 3 minutes · you only pay once you choose a plan",
    faq: [
      {
        q: "How many steps a day is healthy?",
        a: "There's no official standard in steps. Research shows that more steps go together with a lower risk of death, until that benefit levels off at around 6,000 to 8,000 steps a day for people aged 60 and over and around 8,000 to 10,000 for younger adults. The Dutch guidelines also recommend at least 150 minutes of moderate-intensity activity a week.",
      },
      {
        q: "How many kilometres is 10,000 steps?",
        a: "About 6.7 to 7.7 kilometres, depending on your stride length: around 7 kilometres on average. At about 100 steps a minute, it takes 1 hour and 40 minutes; if you walk faster, you'll finish sooner. You can simply spread them over the day.",
      },
      {
        q: "How many steps a day to lose weight?",
        a: "There's no fixed number: you lose weight through a calorie deficit, and that's mostly down to what you eat. More steps do increase how much you burn. In our plans, the step target is 8,000 a day if you mostly sit during the day, and 10,000 otherwise.",
      },
      {
        q: "Is 5,000 steps a day enough?",
        a: "It's a good start. In the research, more steps went together with a lower risk, up to about 6,000 to 10,000 a day depending on age. If you take 5,000 steps now, try to increase that gradually, for example by 500 to 1,000 a day each week.",
      },
      {
        q: "Does cycling count towards your steps?",
        a: "Not for your step counter, usually: it counts strides. For the activity guidelines, cycling does count: brisk cycling, like brisk walking, is moderate-intensity activity.",
      },
      {
        q: "How many steps a day if you're over 60?",
        a: "In the large 2022 study, the benefit for people aged 60 and over levelled off at around 6,000 to 8,000 steps a day. The guidelines also advise older adults to do muscle- and bone-strengthening activities, combined with balance exercises. If you have any symptoms or a health condition, talk to your GP first.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

/** Rijen voor de tabel stappen → kilometers → minuten. */
function distanceRows(l: Locale): string[][] {
  const d = copy[l].distance;
  return STEP_ROWS.map((steps) => {
    const minutes = Math.round(steps / STEPS_PER_MINUTE);
    const km = `${formatNumber(steps / STEPS_PER_KM.short, 1, l)}–${formatNumber(steps / STEPS_PER_KM.long, 1, l)} km`;
    return [formatNumber(steps, 0, l), km, d.time(Math.floor(minutes / 60), minutes % 60)];
  });
}

export default async function StappenPage() {
  const l = await getLocale();
  const c = copy[l];
  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short} />

      <ArticleBody>
        <Section title={c.origin.title} paragraphs={c.origin.paragraphs} />

        <Section title={c.research.title} paragraphs={c.research.paragraphs}>
          <DataTable head={c.research.head} rows={c.research.rows} note={c.research.note} minWidth="22rem" />
          {c.research.after.map((p) => (
            <p key={p.slice(0, 48)} className="text-lg leading-relaxed text-muted">
              {p}
            </p>
          ))}
        </Section>

        <Section title={c.guideline.title} paragraphs={c.guideline.paragraphs} bullets={c.guideline.bullets}>
          {c.guideline.after.map((p) => (
            <p key={p.slice(0, 48)} className="text-lg leading-relaxed text-muted">
              {p}
            </p>
          ))}
        </Section>

        <Section title={c.distance.title} paragraphs={c.distance.paragraphs}>
          <DataTable head={c.distance.head} rows={distanceRows(l)} note={c.distance.note} minWidth="26rem" />
        </Section>

        <Section title={c.weightLoss.title} paragraphs={c.weightLoss.paragraphs}>
          <div className="flex flex-col gap-2">
            <ArrowLink href="/afvallen-met-wandelen">{c.weightLoss.link}</ArrowLink>
            <ArrowLink href="/caloriebehoefte-berekenen">{c.weightLoss.calcLink}</ArrowLink>
          </div>
        </Section>

        <Section title={c.tips.title} paragraphs={c.tips.paragraphs} bullets={c.tips.bullets}>
          {c.tips.after.map((p) => (
            <p key={p.slice(0, 48)} className="text-lg leading-relaxed text-muted">
              {p}
            </p>
          ))}
        </Section>

        <PlanBox title={c.planTitle} text={c.planText} href="/start?doel=afvallen" cta={c.planCta} note={c.planNote} />

        <RelatedPages l={l} paths={["/afvallen-met-wandelen", "/caloriebehoefte-berekenen", "/krachttraining-thuis", "/hoeveel-water-per-dag"]} />
      </ArticleBody>

      <FaqAndClose l={l} items={c.faq} />
    </>
  );
}

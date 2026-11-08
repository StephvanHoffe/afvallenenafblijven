import type { Metadata } from "next";
import { BmiCalculator } from "@/components/calculator/BmiCalculator";
import { ArrowLink, ArticleBody, ArticleSchema, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { defineCopy } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { bmi } from "@/lib/calculations";
import { formatNumber } from "@/lib/format";

const PATH = "/bmi-berekenen";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";
/** Lengtes voor de tabel "gezond gewicht per lengte": 150 tot en met 200 cm. */
const HEIGHTS = Array.from({ length: 11 }, (_, i) => 150 + i * 5);
/** Rekenvoorbeeld in de tekst: 1,70 meter. */
const EXAMPLE_HEIGHT = 170;

const round1 = (x: number) => Math.round(x * 10) / 10;

/**
 * Hele kilo's bij deze lengte waarbij de BMI (op 1 decimaal) tussen `lo` en
 * `hi` ligt; dezelfde berekening als in de rekenhulp (BmiCalculator), zodat
 * tabel en uitkomst elkaar nooit tegenspreken.
 */
function weightRange(heightCm: number, lo: number, hi: number) {
  const m2 = (heightCm / 100) ** 2;
  let min = Math.floor(lo * m2);
  while (round1(bmi(min, heightCm)) < lo) min++;
  let max = Math.ceil(hi * m2);
  while (round1(bmi(max, heightCm)) > hi) max--;
  return { min, max };
}

const copy = defineCopy({
  nl: {
    metaTitle: "BMI berekenen (vrouw en man) + gezond gewicht per lengte",
    metaDescription:
      "Bereken gratis je BMI en zie direct of je gewicht gezond is bij je lengte. Met BMI-tabel, gezond gewicht per lengte en wat een gezonde buikomvang is.",
    eyebrow: "Rekenhulp",
    h1: "BMI berekenen:",
    h1Accent: "heb jij een gezond gewicht?",
    intro:
      "Met je BMI zie je snel of je gewicht past bij je lengte. Vul hieronder je lengte en gewicht in. Wil je een completer beeld? Vul dan ook je buikomvang in: die laat zien hoeveel vet je rond je buik hebt.",
    short:
      "Je BMI bereken je door je gewicht in kilo's te delen door je lengte in meters in het kwadraat. Een BMI van 18,5 tot 24,9 is een gezond gewicht, vanaf 25 is het overgewicht en vanaf 30 obesitas; deze grenzen van de WHO gelden voor vrouwen en mannen. Weeg je 70 kilo bij 1,70 meter, dan is je BMI 24,2. Een gezonde buikomvang is voor vrouwen minder dan 80 cm en voor mannen minder dan 94 cm.",
    formulaTitle: "Hoe bereken je je BMI?",
    formula: [
      "BMI staat voor Body Mass Index. Je berekent hem door je gewicht in kilo's te delen door je lengte in meters in het kwadraat (je lengte keer je lengte). De formule is: BMI = gewicht (kg) ÷ lengte (m)².",
      "Een voorbeeld: je weegt 70 kilo en bent 1,70 meter lang. Je lengte in het kwadraat is 1,70 × 1,70 = 2,89. Je BMI is dan 70 ÷ 2,89 = 24,2. Dat valt binnen een gezond gewicht.",
      "De rekenhulp hierboven doet dit voor je. Je ziet meteen ook welk gewicht gezond is bij jouw lengte.",
    ],
    categoriesTitle: "BMI-tabel: wat betekent je uitkomst?",
    categoriesIntro:
      "Voor volwassenen vanaf 18 jaar gebruikt de Wereldgezondheidsorganisatie (WHO) de indeling hieronder. Het Voedingscentrum gebruikt dezelfde grenzen.",
    categoriesHead: ["BMI", "Wat betekent het?"],
    categoriesRows: [
      ["Lager dan 18,5", "Ondergewicht"],
      ["18,5 tot 24,9", "Gezond gewicht"],
      ["25 tot 29,9", "Overgewicht"],
      ["30 tot 34,9", "Obesitas (klasse 1)"],
      ["35 tot 39,9", "Obesitas (klasse 2)"],
      ["40 of hoger", "Obesitas (klasse 3)"],
    ],
    categoriesNote: "Indeling van de WHO voor volwassenen. Ben je 70 of ouder, dan vindt het Voedingscentrum een BMI van ongeveer 22 tot 28 gezond.",
    womenTitle: "BMI berekenen als vrouw",
    women: [
      "Voor vrouwen en mannen gelden dezelfde BMI-grenzen. Een BMI tussen 18,5 en 24,9 is dus voor elke volwassen vrouw een gezond gewicht, of je nu 25 bent of 60.",
      "Wel hebben vrouwen bij dezelfde BMI gemiddeld meer lichaamsvet dan mannen. Dat is normaal. Je BMI zegt dus niet hoeveel vet je hebt; je buikomvang en je vetpercentage zeggen daar meer over.",
      "In en na de overgang verschuift vet bij veel vrouwen naar de buik. Je BMI kan dan gelijk blijven, terwijl je buikomvang groeit. Meet daarom ook je buikomvang: voor vrouwen is minder dan 80 centimeter gezond.",
      "Ben je zwanger? Dan zegt je BMI weinig. Je verloskundige kan je vertellen wat voor jou een gezonde gewichtstoename is.",
    ],
    womenLink: "Lees meer over afvallen in de overgang",
    healthyTitle: "Wat is een gezond gewicht bij jouw lengte?",
    healthy: [
      "Een gezond gewicht hoort bij een BMI van 18,5 tot 24,9. Gezond gewicht berekenen doe je zo: vermenigvuldig je lengte in meters met zichzelf, en dat getal met 18,5 en met 24,9. Bij 1,70 meter is dat 2,89 × 18,5 = 53,5 kilo en 2,89 × 24,9 = 72 kilo.",
      "In de tabel zie je per lengte welk gewicht gezond is. Voor 70-plussers staat er een aparte kolom, omdat voor hen een BMI van ongeveer 22 tot 28 als gezond geldt (Voedingscentrum).",
    ],
    healthyHead: ["Lengte", "Gezond gewicht (BMI 18,5–24,9)", "70 jaar en ouder (BMI 22–28)"],
    healthyNote: "Afgerond op hele kilo's: elk gewicht in de tabel geeft een BMI binnen de grenzen.",
    idealTitle: "Ideaal gewicht berekenen: bestaat dat?",
    ideal: (min: string, max: string) => [
      `Er bestaat niet één ideaal gewicht. Bij elke lengte hoort een gezond bereik van een flink aantal kilo's. Bij 1,70 meter ligt dat bijvoorbeeld tussen ${min} en ${max} kilo.`,
      "Een oude vuistregel is 'lengte in centimeters min 100' (de formule van Broca). Die geeft één getal en houdt geen rekening met je lichaamsbouw, je spiermassa of je leeftijd.",
      "Een goed streefgewicht ligt binnen het gezonde bereik, past bij een gezonde buikomvang en is een gewicht dat je met normale eetgewoonten kunt volhouden. Wil je afvallen, kies dan eerst een haalbaar tussendoel.",
    ],
    waistTitle: "Buikomvang meten: wat is gezond?",
    waist: [
      "Je buikomvang, ook wel tailleomtrek genoemd, laat zien hoeveel vet je rond je buik hebt. Dat is iets wat je BMI niet laat zien. Volgens het Voedingscentrum hangt veel buikvet samen met een hoger risico op onder andere hart- en vaatziekten en diabetes type 2.",
    ],
    waistHead: ["Geslacht", "Gezond", "Verhoogd risico", "Sterk verhoogd risico"],
    waistRows: [
      ["Vrouwen", "Minder dan 80 cm", "80 tot 88 cm", "Meer dan 88 cm"],
      ["Mannen", "Minder dan 94 cm", "94 tot 102 cm", "Meer dan 102 cm"],
    ],
    waistNote: "Bron: Voedingscentrum.",
    measureTitle: "Zo meet je je buikomvang",
    measure: [
      "Ga rechtop staan, ontspan je buik en meet op je blote huid.",
      "Zoek je onderste rib en de bovenkant van je heupbot. Leg het meetlint precies halverwege, rond je hele buik.",
      "Houd het meetlint recht en strak, maar druk je huid niet in.",
      "Adem rustig uit en lees dan de maat af.",
    ],
    measureNote: "Let op: je buikomvang is iets anders dan je broekmaat. Een broek zit vaak lager, op je heupen.",
    limitsTitle: "Wanneer zegt je BMI minder?",
    limitsIntro: "De BMI is een snelle en handige maat, maar hij kijkt alleen naar je lengte en gewicht. In deze gevallen zegt hij minder:",
    limits: [
      "Veel spieren: de BMI ziet geen verschil tussen spieren en vet. Sporters met veel spiermassa hebben soms een BMI boven de 25, terwijl ze weinig vet hebben.",
      "Kinderen en tieners: onder de 18 jaar hangt een gezonde BMI af van leeftijd en geslacht. Daarvoor worden aparte grafieken gebruikt.",
      "Zwangerschap: tijdens een zwangerschap is de BMI geen goede maat.",
      "70 jaar en ouder: dan geldt een BMI van ongeveer 22 tot 28 als gezond.",
      "Afkomst: voor mensen van Aziatische afkomst worden vaak lagere grenzen gebruikt, omdat gezondheidsrisico's bij hen al bij een lagere BMI toenemen.",
      "Vetverdeling: de BMI zegt niet waar je vet zit. Je buikomvang is daarom een goede aanvulling.",
    ],
    limitsLink: "Schat je vetpercentage",
    nextTitle: "BMI te hoog of te laag: wat nu?",
    next: ["Je BMI is geen diagnose, maar een eerste indicatie. Kijk ook naar je buikomvang, hoe je je voelt en hoe fit je bent."],
    highTitle: "Is je BMI 25 of hoger?",
    high: [
      "Wil je afvallen, dan is een klein calorietekort dat je goed volhoudt verstandiger dan een streng dieet. Eet genoeg eiwit en groente, beweeg elke dag en doe krachttraining, zodat je je spieren behoudt.",
      "Heb je een BMI van 35 of hoger, of heb je gezondheidsklachten? Overleg dan eerst met je huisarts.",
    ],
    highLink: "Bereken hoeveel calorieën je per dag nodig hebt",
    lowTitle: "Is je BMI lager dan 18,5?",
    low: "Dan heb je volgens de BMI ondergewicht. Afvallen is dan niet gezond. Sommige mensen zijn van nature slank en voelen zich prima. Val je af zonder dat je dat wilt, ben je vaak moe of twijfel je? Overleg dan met je huisarts.",
    planTitle: "Van je BMI naar een plan dat bij je past",
    planText:
      "Wil je afvallen of op gewicht blijven? Vul de vragenlijst in. Op basis van je lengte, gewicht, leeftijd, doel en voorkeuren wordt je persoonlijke voedings- en trainingsschema automatisch samengesteld, met calorie- en eiwitdoelen die bij jou passen, een weekmenu met recepten en een boodschappenlijst.",
    planCta: "Maak mijn persoonlijke plan",
    planNote: "± 3 minuten · je betaalt pas als je een plan kiest",
    faq: [
      {
        q: "Wat is een gezond BMI?",
        a: "Voor volwassenen is een BMI tussen 18,5 en 24,9 een gezond gewicht (WHO). Vanaf 25 spreek je van overgewicht en vanaf 30 van obesitas. Ben je 70 of ouder, dan vindt het Voedingscentrum een BMI van ongeveer 22 tot 28 gezond.",
      },
      {
        q: "Is de BMI voor vrouwen anders dan voor mannen?",
        a: "Nee. Voor vrouwen en mannen gelden dezelfde BMI-grenzen. Voor je buikomvang zijn de grenzen wel verschillend: voor vrouwen is minder dan 80 centimeter gezond, voor mannen minder dan 94 centimeter.",
      },
      {
        q: "Hoe bereken ik mijn BMI zelf?",
        a: "Deel je gewicht in kilo's door je lengte in meters in het kwadraat. Weeg je 70 kilo en ben je 1,70 meter, dan reken je 70 ÷ (1,70 × 1,70) = 70 ÷ 2,89 = 24,2.",
      },
      {
        q: "Wat is een gezonde buikomvang voor een vrouw?",
        a: "Volgens het Voedingscentrum is een buikomvang van minder dan 80 centimeter gezond. Tussen 80 en 88 centimeter is het risico op gezondheidsproblemen verhoogd, boven de 88 centimeter sterk verhoogd. Je meet halverwege je onderste rib en de bovenkant van je heupbot.",
      },
      {
        q: "Klopt de BMI als je veel spieren hebt?",
        a: "Niet altijd. De BMI ziet geen verschil tussen spieren en vet. Sporters met veel spiermassa kunnen een BMI boven de 25 hebben zonder veel vet. Je buikomvang of vetpercentage geeft dan een beter beeld.",
      },
      {
        q: "Kan ik de BMI gebruiken voor mijn kind?",
        a: "Niet met deze grenzen. Voor kinderen en tieners onder de 18 hangt een gezonde BMI af van leeftijd en geslacht, en daarvoor worden aparte grafieken gebruikt. Twijfel je over het gewicht van je kind, vraag het dan aan de jeugdarts of je huisarts.",
      },
    ],
  },
  en: {
    metaTitle: "BMI calculator for women and men + healthy weight by height",
    metaDescription:
      "Calculate your BMI for free and see straight away whether your weight is healthy for your height. With a BMI chart, healthy weight table and waist guide.",
    eyebrow: "Calculator",
    h1: "BMI calculator:",
    h1Accent: "is your weight healthy?",
    intro:
      "Your BMI quickly shows whether your weight suits your height. Fill in your height and weight below. Want a fuller picture? Then add your waist measurement too: it shows how much fat you carry around your middle.",
    short:
      "To calculate your BMI, divide your weight in kilos by your height in metres squared. A BMI of 18.5 to 24.9 is a healthy weight, 25 or more is overweight and 30 or more is obesity; these WHO cut-offs apply to women and men alike. If you weigh 70 kilos and are 1.70 metres tall, your BMI is 24.2. A healthy waist measurement is less than 80 cm for women and less than 94 cm for men.",
    formulaTitle: "How do you calculate your BMI?",
    formula: [
      "BMI stands for Body Mass Index. You calculate it by dividing your weight in kilos by your height in metres squared (your height multiplied by your height). The formula is: BMI = weight (kg) ÷ height (m)².",
      "An example: you weigh 70 kilos and are 1.70 metres tall. Your height squared is 1.70 × 1.70 = 2.89. Your BMI is then 70 ÷ 2.89 = 24.2. That's within a healthy weight.",
      "The calculator above does this for you. You'll also see straight away which weight is healthy for your height.",
    ],
    categoriesTitle: "BMI chart: what does your result mean?",
    categoriesIntro:
      "For adults aged 18 and over, the World Health Organization (WHO) uses the categories below. The Netherlands Nutrition Centre (Voedingscentrum) uses the same cut-offs.",
    categoriesHead: ["BMI", "What it means"],
    categoriesRows: [
      ["Below 18.5", "Underweight"],
      ["18.5 to 24.9", "Healthy weight"],
      ["25 to 29.9", "Overweight"],
      ["30 to 34.9", "Obesity (class 1)"],
      ["35 to 39.9", "Obesity (class 2)"],
      ["40 or higher", "Obesity (class 3)"],
    ],
    categoriesNote: "WHO categories for adults. If you're 70 or older, the Voedingscentrum considers a BMI of roughly 22 to 28 healthy.",
    womenTitle: "BMI for women",
    women: [
      "The same BMI cut-offs apply to women and men. So a BMI between 18.5 and 24.9 is a healthy weight for every adult woman, whether you're 25 or 60.",
      "At the same BMI, women do carry more body fat than men on average. That's normal. So your BMI doesn't tell you how much fat you have; your waist measurement and body fat percentage say more about that.",
      "During and after menopause, many women find that fat shifts towards the belly. Your BMI can then stay the same while your waist grows. So measure your waist too: for women, less than 80 centimetres is healthy.",
      "Pregnant? Then your BMI says little. Your midwife can tell you what healthy weight gain looks like for you.",
    ],
    womenLink: "Read more about losing weight during menopause",
    healthyTitle: "What is a healthy weight for your height?",
    healthy: [
      "A healthy weight goes with a BMI of 18.5 to 24.9. To work out your healthy weight, multiply your height in metres by itself, then multiply that number by 18.5 and by 24.9. At 1.70 metres, that's 2.89 × 18.5 = 53.5 kilos and 2.89 × 24.9 = 72 kilos.",
      "The table shows the healthy weight for each height. There's a separate column for people aged 70 and over, because a BMI of roughly 22 to 28 counts as healthy for them (Voedingscentrum).",
    ],
    healthyHead: ["Height", "Healthy weight (BMI 18.5–24.9)", "Aged 70 and over (BMI 22–28)"],
    healthyNote: "Rounded to whole kilos: every weight in the table gives a BMI within the range.",
    idealTitle: "Calculating your ideal weight: is there such a thing?",
    ideal: (min: string, max: string) => [
      `There's no single ideal weight. Every height comes with a healthy range spanning quite a few kilos. At 1.70 metres, for example, it's between ${min} and ${max} kilos.`,
      "An old rule of thumb is 'height in centimetres minus 100' (the Broca formula). It gives one number and doesn't take your build, muscle mass or age into account.",
      "A good target weight sits within the healthy range, goes with a healthy waist measurement and is a weight you can maintain with normal eating habits. If you want to lose weight, start with an achievable interim goal.",
    ],
    waistTitle: "Measuring your waist: what's healthy?",
    waist: [
      "Your waist circumference shows how much fat you carry around your middle. That's something your BMI doesn't show. According to the Voedingscentrum, a lot of belly fat is linked to a higher risk of conditions such as cardiovascular disease and type 2 diabetes.",
    ],
    waistHead: ["Sex", "Healthy", "Increased risk", "Greatly increased risk"],
    waistRows: [
      ["Women", "Less than 80 cm", "80 to 88 cm", "More than 88 cm"],
      ["Men", "Less than 94 cm", "94 to 102 cm", "More than 102 cm"],
    ],
    waistNote: "Source: Voedingscentrum (Netherlands Nutrition Centre).",
    measureTitle: "How to measure your waist",
    measure: [
      "Stand up straight, relax your stomach and measure on bare skin.",
      "Find your lowest rib and the top of your hip bone. Place the tape measure exactly halfway between them, all the way round.",
      "Keep the tape straight and snug, but don't press it into your skin.",
      "Breathe out gently, then read the measurement.",
    ],
    measureNote: "Note: your waist measurement isn't the same as your trouser size. Trousers often sit lower, on your hips.",
    limitsTitle: "When is BMI less reliable?",
    limitsIntro: "BMI is a quick and handy measure, but it only looks at your height and weight. In these cases, it tells you less:",
    limits: [
      "Lots of muscle: BMI can't tell muscle from fat. Athletes with a lot of muscle sometimes have a BMI above 25 while carrying little fat.",
      "Children and teenagers: under 18, a healthy BMI depends on age and sex. Separate charts are used for that.",
      "Pregnancy: during pregnancy, BMI isn't a good measure.",
      "Aged 70 and over: a BMI of roughly 22 to 28 then counts as healthy.",
      "Ethnicity: for people of Asian descent, lower cut-offs are often used, because health risks rise at a lower BMI for them.",
      "Fat distribution: BMI doesn't show where you carry fat. Your waist measurement is a useful addition.",
    ],
    limitsLink: "Estimate your body fat percentage",
    nextTitle: "BMI too high or too low: what now?",
    next: ["Your BMI isn't a diagnosis, but a first indication. Also look at your waist measurement, how you feel and how fit you are."],
    highTitle: "Is your BMI 25 or higher?",
    high: [
      "If you want to lose weight, a small calorie deficit you can keep up is wiser than a strict diet. Eat enough protein and vegetables, move every day and do strength training so you keep your muscle.",
      "Is your BMI 35 or higher, or do you have health problems? Then talk to your GP first.",
    ],
    highLink: "Calculate how many calories you need a day",
    lowTitle: "Is your BMI below 18.5?",
    low: "Then your BMI indicates that you're underweight. Losing weight wouldn't be healthy. Some people are naturally slim and feel fine. If you're losing weight without trying, often feel tired or are unsure, please talk to your GP.",
    planTitle: "From your BMI to a plan that suits you",
    planText:
      "Want to lose weight or stay at your current weight? Fill in the questionnaire. Based on your height, weight, age, goal and preferences, your personal nutrition and workout plan is put together automatically, with calorie and protein targets that suit you, a weekly menu with recipes and a shopping list.",
    planCta: "Create my personal plan",
    planNote: "About 3 minutes · you only pay once you choose a plan",
    faq: [
      {
        q: "What is a healthy BMI?",
        a: "For adults, a BMI between 18.5 and 24.9 is a healthy weight (WHO). From 25 it's called overweight and from 30 obesity. If you're 70 or older, the Voedingscentrum considers a BMI of roughly 22 to 28 healthy.",
      },
      {
        q: "Is BMI different for women and men?",
        a: "No. The same BMI cut-offs apply to women and men. The cut-offs for waist measurement do differ: for women, less than 80 centimetres is healthy; for men, less than 94 centimetres.",
      },
      {
        q: "How do I calculate my BMI myself?",
        a: "Divide your weight in kilos by your height in metres squared. If you weigh 70 kilos and are 1.70 metres tall, you calculate 70 ÷ (1.70 × 1.70) = 70 ÷ 2.89 = 24.2.",
      },
      {
        q: "What is a healthy waist measurement for a woman?",
        a: "According to the Voedingscentrum, a waist measurement of less than 80 centimetres is healthy. Between 80 and 88 centimetres the risk of health problems is increased, and above 88 centimetres greatly increased. Measure halfway between your lowest rib and the top of your hip bone.",
      },
      {
        q: "Is BMI accurate if you have a lot of muscle?",
        a: "Not always. BMI can't tell muscle from fat. Athletes with a lot of muscle can have a BMI above 25 without much fat. Your waist measurement or body fat percentage then gives a better picture.",
      },
      {
        q: "Can I use BMI for my child?",
        a: "Not with these cut-offs. For children and teenagers under 18, a healthy BMI depends on age and sex, and separate charts are used for that. If you're unsure about your child's weight, ask your GP.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

export default async function BmiPage() {
  const l = await getLocale();
  const c = copy[l];
  const n = (x: number) => formatNumber(x, 0, l);
  const example = weightRange(EXAMPLE_HEIGHT, 18.5, 24.9);
  const heightRows = HEIGHTS.map((h) => {
    const healthy = weightRange(h, 18.5, 24.9);
    const senior = weightRange(h, 22, 28);
    return [`${n(h)} cm`, `${n(healthy.min)}–${n(healthy.max)} kg`, `${n(senior.min)}–${n(senior.max)} kg`];
  });

  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short}>
        <BmiCalculator />
      </ContentHero>

      <ArticleBody>
        <Section title={c.formulaTitle} paragraphs={c.formula} />

        <Section title={c.categoriesTitle} paragraphs={[c.categoriesIntro]}>
          <DataTable head={c.categoriesHead} rows={c.categoriesRows} note={c.categoriesNote} minWidth="20rem" />
        </Section>

        <Section title={c.womenTitle} paragraphs={c.women}>
          <ArrowLink href="/afvallen-in-de-overgang">{c.womenLink}</ArrowLink>
        </Section>

        <Section title={c.healthyTitle} paragraphs={c.healthy}>
          <DataTable head={c.healthyHead} rows={heightRows} note={c.healthyNote} />
        </Section>

        <Section title={c.idealTitle} paragraphs={c.ideal(n(example.min), n(example.max))} />

        <Section title={c.waistTitle} paragraphs={c.waist}>
          <DataTable head={c.waistHead} rows={c.waistRows} note={c.waistNote} minWidth="32rem" />
          <h3 className="pt-2 text-lg font-bold">{c.measureTitle}</h3>
          <ul className="list-disc space-y-2 pl-6 text-lg leading-relaxed text-muted marker:text-brand-600">
            {c.measure.map((m) => (
              <li key={m.slice(0, 48)}>{m}</li>
            ))}
          </ul>
          <p className="text-lg leading-relaxed text-muted">{c.measureNote}</p>
        </Section>

        <Section title={c.limitsTitle} paragraphs={[c.limitsIntro]} bullets={c.limits}>
          <ArrowLink href="/vetpercentage-berekenen">{c.limitsLink}</ArrowLink>
        </Section>

        <Section title={c.nextTitle} paragraphs={c.next}>
          <h3 className="pt-2 text-lg font-bold">{c.highTitle}</h3>
          {c.high.map((p) => (
            <p key={p.slice(0, 48)} className="text-lg leading-relaxed text-muted">
              {p}
            </p>
          ))}
          <ArrowLink href="/caloriebehoefte-berekenen">{c.highLink}</ArrowLink>
          <h3 className="pt-2 text-lg font-bold">{c.lowTitle}</h3>
          <p className="text-lg leading-relaxed text-muted">{c.low}</p>
        </Section>

        <PlanBox title={c.planTitle} text={c.planText} href="/start" cta={c.planCta} note={c.planNote} />

        <RelatedPages l={l} paths={["/caloriebehoefte-berekenen", "/vetpercentage-berekenen", "/eiwitten-per-dag", "/afvallen-in-de-overgang"]} />
      </ArticleBody>

      <FaqAndClose l={l} items={c.faq} />
    </>
  );
}

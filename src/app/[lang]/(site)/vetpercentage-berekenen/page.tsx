import type { Metadata } from "next";
import { BodyFatCalculator } from "@/components/calculator/BodyFatCalculator";
import { ArrowLink, ArticleBody, ArticleSchema, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { defineCopy } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const PATH = "/vetpercentage-berekenen";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

/**
 * Grenzen per leeftijdsgroep (Gallagher e.a., 2000): [onder = laag, t/m = gezond, t/m = hoog].
 * Dezelfde getallen staan in src/components/calculator/BodyFatCalculator.tsx.
 */
const AGE_GROUPS = ["20–39", "40–59", "60–79"] as const;
const RANGES = {
  vrouw: [
    [21, 33, 39],
    [23, 34, 40],
    [24, 36, 42],
  ],
  man: [
    [8, 20, 25],
    [11, 22, 28],
    [13, 25, 30],
  ],
} as const;

const copy = defineCopy({
  nl: {
    metaTitle: "Vetpercentage berekenen: wat is gezond voor vrouw en man?",
    metaDescription:
      "Bereken je vetpercentage gratis met een meetlint en zie wat gezond is voor je leeftijd. Met tabellen voor vrouwen en mannen en uitleg over de weegschaal.",
    eyebrow: "Rekenhulp",
    h1: "Vetpercentage berekenen:",
    h1Accent: "wat is gezond voor jou?",
    intro:
      "Je vetpercentage zegt meer over je lichaam dan je gewicht alleen. Met een meetlint en de rekenhulp hieronder schat je het in een paar minuten. Je ziet meteen wat gezond is voor jouw leeftijd, als vrouw of als man.",
    short:
      "Een gezond vetpercentage ligt voor vrouwen van 20 tot 39 jaar tussen 21 en 33%, en voor mannen van die leeftijd tussen 8 en 20%. Vanaf je 40e en je 60e liggen de grenzen een paar procentpunten hoger: voor vrouwen van 60 tot 79 jaar is 24 tot 36% gezond, voor mannen 13 tot 25%. Met een meetlint of een weegschaal met vetmeting krijg je een schatting, die een paar procentpunten kan afwijken.",
    years: "jaar",
    tableHead: ["Leeftijd", "Laag", "Gezond", "Hoog", "Zeer hoog"],
    tableNote:
      "Bron: Gallagher e.a. (2000). Het gezonde bereik hoort bij een gezonde BMI (18,5 tot 25). Ben je 18 of 19, kijk dan bij 20–39 jaar. Voor 80-plussers zijn geen aparte grenzen vastgesteld; gebruik dan 60–79 jaar.",
    women: {
      title: "Gezond vetpercentage voor vrouwen",
      paragraphs: [
        "Vrouwen hebben van nature een hoger vetpercentage dan mannen. Een deel van dat vet is essentieel vet: je lichaam heeft het nodig, onder meer voor je hormonen en je vruchtbaarheid. Daarom liggen de gezonde grenzen voor vrouwen een stuk hoger.",
        "Met de leeftijd schuiven de grenzen op. Je spiermassa neemt af en je lichaam slaat makkelijker vet op. Zoek in de tabel je leeftijd op:",
      ],
      link: "Waarom afvallen in de overgang lastiger is",
    },
    men: {
      title: "Gezond vetpercentage voor mannen",
      paragraphs: [
        "Mannen hebben van nature minder essentieel vet en meer spiermassa dan vrouwen. De gezonde grenzen liggen voor mannen daarom zo'n 11 tot 13 procentpunten lager.",
        "Ook bij mannen gaan de grenzen met de leeftijd omhoog. Mannen slaan extra vet vaak op rond hun buik, dus houd ook je buikomvang in de gaten (daarover verderop meer).",
      ],
    },
    tape: {
      title: "Zo meet je met een meetlint",
      paragraphs: [
        "Voor de rekenhulp heb je een zacht meetlint nodig, zoals een naaimeetlint. Hoe nauwkeuriger je meet, hoe beter de schatting. Zo doe je het:",
      ],
      bullets: [
        "Meet 's ochtends, voor het ontbijt, op je blote huid. Sta rechtop en ontspannen.",
        "Leg het lint strak om je lichaam, maar duw je huid niet in.",
        "Nek: meet net onder je adamsappel (strottenhoofd). Kijk recht vooruit en span je nek niet aan.",
        "Taille voor mannen: meet ter hoogte van je navel, met het lint horizontaal, aan het eind van een rustige uitademing. Trek je buik niet in.",
        "Taille voor vrouwen: meet op het smalste punt van je taille, met het lint horizontaal, aan het eind van een rustige uitademing.",
        "Heup (alleen voor vrouwen): meet op het breedste punt van je billen, met je voeten tegen elkaar.",
        "Meet alles twee of drie keer en neem het gemiddelde. Rond af op een halve centimeter.",
      ],
    },
    method: {
      title: "Hoe berekent de rekenhulp je vetpercentage?",
      paragraphs: [
        "De rekenhulp gebruikt de meetlintmethode van de Amerikaanse marine (de U.S. Navy-methode). Die schat je vetpercentage uit je lengte en de omtrek van je nek en taille, en bij vrouwen ook je heup. De methode is ontwikkeld voor de marine, om het vetpercentage van militairen te schatten.",
        "Een voorbeeld: een vrouw van 1,65 meter met een taille van 80 cm, een heup van 100 cm en een nek van 33 cm komt uit op ongeveer 32%. Dat valt in alle leeftijdsgroepen binnen het gezonde bereik.",
        "Het blijft een schatting. Vergeleken met nauwkeurige metingen zit de uitkomst er meestal een paar procentpunten naast, bij sommige mensen meer. Gebruik hem vooral om je voortgang te volgen, en meet steeds op dezelfde manier.",
        "De formules (alle maten in centimeters; log is de logaritme met grondtal 10):",
      ],
      bullets: [
        "Mannen: 495 / (1,0324 − 0,19077 × log(taille − nek) + 0,15456 × log(lengte)) − 450",
        "Vrouwen: 495 / (1,29579 − 0,35004 × log(taille + heup − nek) + 0,22100 × log(lengte)) − 450",
      ],
    },
    scale: {
      title: "Vetpercentage meten met een weegschaal: hoe betrouwbaar?",
      paragraphs: [
        "Een weegschaal met vetmeting gebruikt bio-impedantie. Hij stuurt een zwakke stroom door je lichaam, die je niet voelt. Water geleidt stroom goed en vet slecht. Uit die weerstand en je lengte, gewicht, leeftijd en geslacht schat de weegschaal je vetpercentage.",
        "Het nadeel: de uitkomst hangt sterk af van hoeveel vocht je lichaam op dat moment bevat. Na eten of drinken, na het sporten of later op de dag kan je vetpercentage een paar procentpunten anders uitvallen, terwijl je vet niet is veranderd.",
        "Een weegschaal is dus vooral handig om een trend te zien. Meet altijd op hetzelfde moment, bijvoorbeeld 's ochtends na het plassen en voor je iets eet of drinkt. Kijk naar het verloop over een paar weken, niet naar één meting.",
        "Heb je een pacemaker of een ander geïmplanteerd medisch apparaat, of ben je zwanger? Lees dan eerst de handleiding: fabrikanten raden de vetmeting dan meestal af. Twijfel je, vraag het je huisarts.",
      ],
    },
    other: {
      title: "Andere manieren om je vetpercentage te meten",
      paragraphs: [
        "Naast het meetlint en de weegschaal zijn er nog twee bekende methodes. Elke methode geeft een iets andere uitkomst, dus vergelijk metingen alleen met dezelfde methode.",
      ],
      bullets: [
        "Huidplooimeter (caliper): met een soort tang meet je de dikte van huidplooien op vaste plekken, zoals je bovenarm, buik en dij. Door iemand met ervaring gemeten is dat redelijk nauwkeurig; zelf meten is lastig.",
        "DEXA-scan: een scan met een lage dosis röntgenstraling die vet, spieren en botten apart meet. Van de methodes op deze pagina is dit de nauwkeurigste. Je vindt hem vooral in ziekenhuizen en bij wetenschappelijk onderzoek.",
      ],
    },
    bmi: {
      title: "Vetpercentage of BMI: wat zegt meer?",
      paragraphs: [
        "Je BMI rekent alleen met je lengte en gewicht. Hij ziet geen verschil tussen vet en spieren. Iemand die veel aan krachttraining doet, kan een hoge BMI hebben en toch weinig vet. Andersom kun je een gezonde BMI hebben met een vrij hoog vetpercentage.",
        "Je vetpercentage zegt dus meer over hoe je lichaam is opgebouwd. Je buikomvang is een handige extra graadmeter. Volgens de gangbare grenzen is het risico op gezondheidsproblemen verhoogd bij een buikomvang boven 80 cm voor vrouwen en 94 cm voor mannen, en sterk verhoogd boven 88 en 102 cm. Maak je je zorgen over je gewicht of gezondheid, bespreek het dan met je huisarts.",
      ],
      link: "Bereken je BMI",
    },
    lower: {
      title: "Je vetpercentage verlagen",
      paragraphs: [
        "Je vetpercentage daalt als je vet verliest en je spiermassa behoudt. Daar zijn geen trucs voor, wel drie dingen die samen het verschil maken:",
      ],
      bullets: [
        "Een calorietekort: eet iets minder dan je verbruikt. Een klein tekort, zo'n 300 tot 500 kcal per dag, houd je makkelijker vol dan een streng dieet.",
        "Krachttraining, 2 tot 3 keer per week. Zo geef je je spieren een reden om te blijven, ook als je minder eet.",
        "Genoeg eiwit: zo'n 1,6 tot 2,0 gram per kilo lichaamsgewicht per dag. Eiwit helpt je spieren te behouden en geeft een vol gevoel.",
      ],
      after: [
        "Plaatselijk vet verbranden kan niet. Met buikspieroefeningen maak je je buikspieren sterker, maar je verliest er niet speciaal buikvet mee. Waar je het eerst vet verliest, bepaalt je lichaam zelf.",
        "Kijk ook niet alleen naar de weegschaal. Bouw je spieren op terwijl je vet verliest, dan daalt je gewicht soms langzamer dan je vetpercentage. Meet daarom elke paar weken ook je taille en je vetpercentage, steeds op dezelfde manier.",
      ],
      links: [
        ["/caloriebehoefte-berekenen", "Bereken je caloriebehoefte"],
        ["/krachttraining-thuis", "Krachttraining thuis: een schema"],
        ["/eiwitten-per-dag", "Hoeveel eiwitten per dag heb je nodig?"],
      ] as [string, string][],
    },
    planTitle: "Van meten naar een plan",
    planText:
      "Met je persoonlijke plan krijg je een calorie- en eiwitdoel dat bij je past, een weekmenu met recepten en boodschappenlijst, en als je wilt een trainingsschema met krachttraining. Je plan wordt automatisch samengesteld op basis van je antwoorden, en elke week sturen we bij op je voortgang.",
    planCta: "Maak mijn persoonlijke plan",
    planNote: "± 3 minuten · je betaalt pas als je een plan kiest",
    faq: [
      {
        q: "Wat is een gezond vetpercentage voor een vrouw?",
        a: "Voor vrouwen van 20 tot 39 jaar is 21 tot 33% gezond, van 40 tot 59 jaar 23 tot 34% en van 60 tot 79 jaar 24 tot 36%. Vrouwen hebben van nature meer vet nodig dan mannen, onder meer voor hun hormonen.",
      },
      {
        q: "Wat is een gezond vetpercentage voor een man?",
        a: "Voor mannen van 20 tot 39 jaar is 8 tot 20% gezond, van 40 tot 59 jaar 11 tot 22% en van 60 tot 79 jaar 13 tot 25%. Daarboven spreek je van een hoog vetpercentage.",
      },
      {
        q: "Hoe betrouwbaar is een weegschaal met vetpercentage?",
        a: "Als losse meting niet erg betrouwbaar. De weegschaal meet met een zwakke stroom, en de uitkomst hangt af van hoeveel vocht je lichaam bevat: na eten, drinken of sporten kan hij een paar procentpunten verschillen. Meet je altijd op hetzelfde moment, dan zie je wel goed of je vetpercentage daalt of stijgt.",
      },
      {
        q: "Hoe bereken ik mijn vetpercentage zonder weegschaal?",
        a: "Met een meetlint. Meet je nek, je taille en (als vrouw) je heup, en vul die samen met je lengte in de rekenhulp op deze pagina in. Die gebruikt de methode van de Amerikaanse marine. De uitkomst is een schatting die er meestal een paar procentpunten naast zit.",
      },
      {
        q: "Kun je gericht buikvet verliezen?",
        a: "Nee. Met buikspieroefeningen maak je je buikspieren sterker, maar je verbrandt er niet speciaal buikvet mee. Buikvet verlies je, net als ander vet, met een calorietekort, krachttraining en genoeg eiwit. Waar je het eerst vet verliest, bepaalt je lichaam zelf.",
      },
      {
        q: "Waarom hebben vrouwen een hoger vetpercentage dan mannen?",
        a: "Vrouwen hebben van nature meer essentieel vet: vet dat je lichaam nodig heeft, onder meer voor de hormoonhuishouding en de vruchtbaarheid. Daarom liggen de gezonde grenzen voor vrouwen zo'n 11 tot 13 procentpunten hoger dan voor mannen.",
      },
    ],
  },
  en: {
    metaTitle: "Body fat calculator: what's healthy for women and men?",
    metaDescription:
      "Estimate your body fat percentage for free with a tape measure and see what's healthy for your age. With tables for women and men and how reliable scales are.",
    eyebrow: "Calculator",
    h1: "Body fat calculator:",
    h1Accent: "what's healthy for you?",
    intro:
      "Your body fat percentage says more about your body than your weight alone. With a tape measure and the calculator below, you can estimate it in a few minutes. You'll see straight away what's healthy for your age, as a woman or as a man.",
    short:
      "A healthy body fat percentage for women aged 20 to 39 is between 21 and 33%, and for men of that age between 8 and 20%. From 40 and again from 60, the ranges are a few percentage points higher: for women aged 60 to 79, 24 to 36% is healthy, for men 13 to 25%. A tape measure or a body fat scale gives you an estimate, which can be a few percentage points out.",
    years: "years",
    tableHead: ["Age", "Low", "Healthy", "High", "Very high"],
    tableNote:
      "Source: Gallagher et al. (2000). The healthy range matches a healthy BMI (18.5 to 25). If you're 18 or 19, use 20–39 years. No separate ranges have been set for people aged 80 and over; use 60–79 years.",
    women: {
      title: "Healthy body fat percentage for women",
      paragraphs: [
        "Women naturally have a higher body fat percentage than men. Part of that fat is essential fat: your body needs it, for example for your hormones and fertility. That's why the healthy ranges for women are quite a bit higher.",
        "The ranges shift with age. Your muscle mass declines and your body stores fat more easily. Find your age in the table:",
      ],
      link: "Why losing weight during menopause is harder",
    },
    men: {
      title: "Healthy body fat percentage for men",
      paragraphs: [
        "Men naturally have less essential fat and more muscle mass than women. That's why the healthy ranges for men are around 11 to 13 percentage points lower.",
        "For men, too, the ranges go up with age. Men often store extra fat around their belly, so keep an eye on your waist size as well (more on that below).",
      ],
    },
    tape: {
      title: "How to measure with a tape measure",
      paragraphs: [
        "For the calculator, you need a soft tape measure, such as a sewing tape. The more accurately you measure, the better the estimate. Here's how:",
      ],
      bullets: [
        "Measure in the morning, before breakfast, on bare skin. Stand up straight and relaxed.",
        "Pull the tape snug around your body, but don't press into your skin.",
        "Neck: measure just below your Adam's apple (larynx). Look straight ahead and don't tense your neck.",
        "Waist for men: measure level with your navel, with the tape horizontal, at the end of a relaxed breath out. Don't pull your stomach in.",
        "Waist for women: measure at the narrowest point of your waist, with the tape horizontal, at the end of a relaxed breath out.",
        "Hips (women only): measure at the widest point of your bottom, with your feet together.",
        "Measure everything two or three times and take the average. Round to the nearest half centimetre.",
      ],
    },
    method: {
      title: "How does the calculator work out your body fat?",
      paragraphs: [
        "The calculator uses the tape-measure method of the US Navy (the U.S. Navy method). It estimates your body fat from your height and the circumference of your neck and waist, and for women also your hips. The method was developed for the Navy, to estimate the body fat of its personnel.",
        "An example: a woman who is 1.65 metres tall with an 80 cm waist, 100 cm hips and a 33 cm neck comes out at around 32%. That's within the healthy range in every age group.",
        "It's still an estimate. Compared with accurate measurements, the result is usually a few percentage points out, and more for some people. Use it mainly to track your progress, and always measure the same way.",
        "The formulas (all measurements in centimetres; log is the base-10 logarithm):",
      ],
      bullets: [
        "Men: 495 / (1.0324 − 0.19077 × log(waist − neck) + 0.15456 × log(height)) − 450",
        "Women: 495 / (1.29579 − 0.35004 × log(waist + hips − neck) + 0.22100 × log(height)) − 450",
      ],
    },
    scale: {
      title: "Measuring body fat with scales: how reliable is it?",
      paragraphs: [
        "Body fat scales use bioelectrical impedance. They send a weak current through your body that you can't feel. Water conducts electricity well and fat conducts it poorly. From that resistance and your height, weight, age and sex, the scales estimate your body fat percentage.",
        "The downside: the result depends heavily on how much fluid your body holds at that moment. After eating or drinking, after exercise or later in the day, your body fat reading can differ by a few percentage points, even though your fat hasn't changed.",
        "So body fat scales are mainly useful for spotting a trend. Always measure at the same moment, for example in the morning after going to the toilet and before you eat or drink anything. Look at the trend over a few weeks, not at a single reading.",
        "Do you have a pacemaker or another implanted medical device, or are you pregnant? Then read the manual first: manufacturers usually advise against using the body fat function. If in doubt, ask your GP.",
      ],
    },
    other: {
      title: "Other ways to measure your body fat",
      paragraphs: [
        "Besides a tape measure and scales, there are two other well-known methods. Each method gives a slightly different result, so only compare measurements taken with the same method.",
      ],
      bullets: [
        "Skinfold callipers: a pincer-like tool that measures the thickness of skinfolds at set points, such as your upper arm, stomach and thigh. Measured by someone experienced, it's reasonably accurate; measuring yourself is tricky.",
        "DEXA scan: a scan with a low dose of X-rays that measures fat, muscle and bone separately. Of the methods on this page, it's the most accurate. You'll mainly find it in hospitals and scientific research.",
      ],
    },
    bmi: {
      title: "Body fat or BMI: which tells you more?",
      paragraphs: [
        "Your BMI only uses your height and weight. It can't tell fat from muscle. Someone who does a lot of strength training can have a high BMI and still little fat. The other way round, you can have a healthy BMI with a fairly high body fat percentage.",
        "So your body fat percentage says more about how your body is made up. Your waist size is a useful extra measure. According to the usual thresholds, the risk of health problems is increased with a waist above 80 cm for women and 94 cm for men, and substantially increased above 88 and 102 cm. If you're worried about your weight or health, talk to your GP.",
      ],
      link: "Calculate your BMI",
    },
    lower: {
      title: "Lowering your body fat",
      paragraphs: [
        "Your body fat percentage goes down when you lose fat and keep your muscle. There are no tricks for this, but there are three things that make the difference together:",
      ],
      bullets: [
        "A calorie deficit: eat a little less than you use. A small deficit, around 300 to 500 kcal a day, is easier to stick to than a strict diet.",
        "Strength training, 2 to 3 times a week. That gives your muscles a reason to stay, even when you're eating less.",
        "Enough protein: around 1.6 to 2.0 grams per kilo of body weight a day. Protein helps you keep your muscle and keeps you feeling full.",
      ],
      after: [
        "You can't burn fat in one specific spot. Ab exercises make your abdominal muscles stronger, but they don't make you lose belly fat in particular. Your body decides where you lose fat first.",
        "Don't just look at the scales, either. If you build muscle while losing fat, your weight sometimes drops more slowly than your body fat percentage. So every few weeks, also measure your waist and your body fat, always the same way.",
      ],
      links: [
        ["/caloriebehoefte-berekenen", "Calculate your calorie needs"],
        ["/krachttraining-thuis", "Strength training at home: a plan"],
        ["/eiwitten-per-dag", "How much protein do you need a day?"],
      ] as [string, string][],
    },
    planTitle: "From measuring to a plan",
    planText:
      "With your personal plan, you get a calorie and protein target that suits you, a weekly menu with recipes and a shopping list, and, if you like, a training plan with strength training. Your plan is put together automatically from your answers, and we fine-tune it every week based on your progress.",
    planCta: "Create my personal plan",
    planNote: "About 3 minutes · you only pay once you choose a plan",
    faq: [
      {
        q: "What is a healthy body fat percentage for a woman?",
        a: "For women aged 20 to 39, 21 to 33% is healthy; aged 40 to 59, 23 to 34%; and aged 60 to 79, 24 to 36%. Women naturally need more fat than men, for example for their hormones.",
      },
      {
        q: "What is a healthy body fat percentage for a man?",
        a: "For men aged 20 to 39, 8 to 20% is healthy; aged 40 to 59, 11 to 22%; and aged 60 to 79, 13 to 25%. Above that, it counts as a high body fat percentage.",
      },
      {
        q: "How reliable are body fat scales?",
        a: "Not very reliable as a single reading. The scales measure with a weak current, and the result depends on how much fluid your body holds: after eating, drinking or exercise, it can differ by a few percentage points. If you always measure at the same moment, you can still see clearly whether your body fat is going down or up.",
      },
      {
        q: "How do I calculate my body fat without scales?",
        a: "With a tape measure. Measure your neck, your waist and (if you're a woman) your hips, and enter them with your height in the calculator on this page. It uses the US Navy method. The result is an estimate that's usually a few percentage points out.",
      },
      {
        q: "Can you lose belly fat specifically?",
        a: "No. Ab exercises make your abdominal muscles stronger, but they don't burn belly fat in particular. You lose belly fat, like any other fat, with a calorie deficit, strength training and enough protein. Your body decides where you lose fat first.",
      },
      {
        q: "Why do women have a higher body fat percentage than men?",
        a: "Women naturally have more essential fat: fat the body needs, for example for hormone balance and fertility. That's why the healthy ranges for women are around 11 to 13 percentage points higher than for men.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

function rangeRows(ranges: readonly (readonly [number, number, number])[], years: string): string[][] {
  return ranges.map(([low, healthy, high], i) => [`${AGE_GROUPS[i]} ${years}`, `< ${low}%`, `${low}–${healthy}%`, `${healthy}–${high}%`, `> ${high}%`]);
}

export default async function VetpercentagePage() {
  const l = await getLocale();
  const c = copy[l];
  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short}>
        <BodyFatCalculator />
      </ContentHero>

      <ArticleBody>
        <Section title={c.women.title} paragraphs={c.women.paragraphs}>
          <DataTable head={c.tableHead} rows={rangeRows(RANGES.vrouw, c.years)} note={c.tableNote} minWidth="30rem" />
          <ArrowLink href="/afvallen-in-de-overgang">{c.women.link}</ArrowLink>
        </Section>

        <Section title={c.men.title} paragraphs={c.men.paragraphs}>
          <DataTable head={c.tableHead} rows={rangeRows(RANGES.man, c.years)} note={c.tableNote} minWidth="30rem" />
        </Section>

        <Section title={c.tape.title} paragraphs={c.tape.paragraphs} bullets={c.tape.bullets} />

        <Section title={c.method.title} paragraphs={c.method.paragraphs} bullets={c.method.bullets} />

        <Section title={c.scale.title} paragraphs={c.scale.paragraphs} />

        <Section title={c.other.title} paragraphs={c.other.paragraphs} bullets={c.other.bullets} />

        <Section title={c.bmi.title} paragraphs={c.bmi.paragraphs}>
          <ArrowLink href="/bmi-berekenen">{c.bmi.link}</ArrowLink>
        </Section>

        <Section title={c.lower.title} paragraphs={c.lower.paragraphs} bullets={c.lower.bullets}>
          {c.lower.after.map((p) => (
            <p key={p.slice(0, 48)} className="text-lg leading-relaxed text-muted">
              {p}
            </p>
          ))}
          <ul className="space-y-2">
            {c.lower.links.map(([href, label]) => (
              <li key={href}>
                <ArrowLink href={href}>{label}</ArrowLink>
              </li>
            ))}
          </ul>
        </Section>

        <PlanBox title={c.planTitle} text={c.planText} href="/start?doel=afvallen_strakker" cta={c.planCta} note={c.planNote} />

        <RelatedPages l={l} paths={["/bmi-berekenen", "/caloriebehoefte-berekenen", "/krachttraining-thuis", "/eiwitten-per-dag"]} />
      </ArticleBody>

      <FaqAndClose l={l} items={c.faq} />
    </>
  );
}

import type { Metadata } from "next";
import { WalkingCalculator } from "@/components/calculator/WalkingCalculator";
import { ArrowLink, ArticleBody, ArticleSchema, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { defineCopy, type Locale } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { formatNumber } from "@/lib/format";

const PATH = "/afvallen-met-wandelen";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";
/**
 * MET-waarden voor wandelen op vlak terrein (Compendium of Physical Activities),
 * dezelfde als in WalkingCalculator: rustig ± 4, stevig ± 5, snel ± 5,6 en zeer snel ± 6,4 km/u.
 * Een constante uit een "use client"-bestand is op de server niet als waarde te gebruiken; daarom hier nogmaals.
 */
const METS = [3.0, 3.5, 4.3, 5.0];
const WEIGHTS = [60, 70, 80, 90, 100, 110];

const copy = defineCopy({
  nl: {
    metaTitle: "Afvallen met wandelen: hoeveel calorieën verbrand je?",
    metaDescription:
      "Hoeveel calorieën verbrand je met wandelen? Bereken het gratis voor jouw gewicht en tempo, en lees hoe afvallen door wandelen in de praktijk werkt.",
    eyebrow: "Bewegen",
    h1: "Afvallen met wandelen:",
    h1Accent: "zoveel calorieën verbrand je",
    intro:
      "Wandelen is de makkelijkste manier om meer te bewegen: het kost niets, je kunt het overal doen en je hebt er weinig herstel van nodig. Maar hoeveel calorieën verbrand je er echt mee, en wat betekent dat voor afvallen? Reken het hieronder uit.",
    short:
      "Met wandelen verbrand je ruwweg 3 tot 5 kcal per kilo lichaamsgewicht per uur, afhankelijk van je tempo. Weeg je 75 kilo, dan verbrand je in een uur stevig wandelen (± 5 km/u) zo'n 260 kcal, waarvan ongeveer 190 kcal extra bovenop wat je in rust al verbruikt. Wandelen helpt dus bij een calorietekort, maar wat je eet maakt het grootste verschil.",
    burn: {
      title: "Hoeveel calorieën verbrand je met wandelen?",
      paragraphs: [
        "Hoeveel je verbrandt, hangt vooral af van je gewicht, je tempo en hoe lang je loopt. Onderzoekers drukken de inspanning uit in MET. 1 MET is je verbruik in rust: ongeveer 1 kcal per kilo lichaamsgewicht per uur. Stevig wandelen is volgens het Compendium of Physical Activities ± 3,5 MET: je verbruikt dan 3,5 keer zoveel als in rust.",
        "De rekensom is: MET × gewicht in kilo × tijd in uren. Voor iemand van 75 kilo die een uur stevig wandelt, is dat 3,5 × 75 × 1 = ± 260 kcal. Daarvan had je ± 75 kcal in rust ook verbruikt; het wandelen kost je dus ± 190 kcal extra. Dat extra deel telt voor afvallen.",
      ],
      head: ["Gewicht", "Rustig (± 4 km/u)", "Stevig (± 5 km/u)", "Snel (± 5,6 km/u)", "Zeer snel (± 6,4 km/u)"],
      note: "Kcal per uur wandelen op vlak terrein, in totaal (inclusief je verbruik in rust van ± 1 kcal per kilo per uur), afgerond op 10 kcal. Bron: Compendium of Physical Activities.",
    },
    how: {
      title: "Afvallen door wandelen: zo werkt het",
      paragraphs: [
        "Je valt af als je langere tijd minder energie binnenkrijgt dan je verbruikt: een calorietekort. Wandelen verhoogt je verbruik, en dat helpt. Maar wat je eet heeft meestal meer invloed. De ± 190 kcal extra van een uur stevig wandelen eet je met een handje noten van 30 gram (± 170 tot 200 kcal) al bijna weer terug.",
        "Wandelen werkt daarom het best samen met een eetpatroon dat past bij je caloriebehoefte. Neem je je wandelingen mee als je je activiteitsniveau invult, dan zitten ze daar al in. Eet je ze daarna nog eens extra op, dan tel je ze dubbel.",
      ],
      link: "Bereken je caloriebehoefte",
    },
    practice: {
      title: "Theorie en praktijk: waarom de weegschaal minder hard gaat",
      paragraphs: [
        "Op papier is de som simpel. Eén kilo lichaamsvet staat voor ongeveer 7.700 kcal. Wandel je als iemand van 75 kilo 5 keer per week een uur stevig, dan verbruik je ± 950 kcal extra per week. In theorie kost één kilo vet je dan ruim 8 weken, als je verder precies hetzelfde eet en beweegt. Dat is een rekensom, geen belofte.",
        "In de praktijk valt het effect vaak kleiner uit. Dat heet compensatie, en het is heel normaal:",
      ],
      bullets: [
        "Meer bewegen kan je meer trek geven, waardoor je ongemerkt iets meer eet.",
        "Na een flinke wandeling beweeg je de rest van de dag soms juist minder.",
        "'Ik heb gewandeld, dus ik heb een koekje verdiend' is een bekende valkuil.",
        "Horloges en apps kunnen je verbruik overschatten, waardoor je denkt dat je meer ruimte hebt.",
      ],
      after: [
        "Daarnaast schommelt je gewicht van dag tot dag door vocht, zout en de inhoud van je darmen. Kijk daarom naar het gemiddelde over een paar weken, niet naar één ochtend op de weegschaal.",
      ],
    },
    often: {
      title: "Hoe vaak en hoe lang moet je wandelen om af te vallen?",
      paragraphs: [
        "Er is geen vast minimum. Een goed uitgangspunt is de beweegrichtlijn van de Gezondheidsraad: minstens 150 minuten per week matig intensief bewegen, verspreid over meerdere dagen. Bijvoorbeeld 5 keer per week een half uur stevig wandelen. Meer mag, en voor je verbruik telt elke extra minuut mee.",
        "Begin met wat je nu makkelijk volhoudt, bijvoorbeeld 20 tot 30 minuten, en bouw dat op naar 45 tot 60 minuten. Elke dag een stuk lopen levert meer op dan één lange tocht in het weekend, en het wordt sneller een gewoonte. In onze schema's krijg je een dagelijks stappendoel: 8.000 stappen als je overdag vooral zit, en anders 10.000.",
      ],
      link: "Hoeveel stappen per dag zijn gezond?",
    },
    more: {
      title: "Meer verbranden: tempo, intervallen en heuvels",
      paragraphs: ["Wil je meer uit je wandeling halen in dezelfde tijd? Dan heb je drie knoppen om aan te draaien:"],
      bullets: [
        "Tempo: van rustig (± 4 km/u, 3,0 MET) naar snel (± 5,6 km/u, 4,3 MET) verbrand je per uur ruim 40% meer.",
        "Intervallen: wissel af tussen flink doorstappen en rustig lopen, bijvoorbeeld 3 minuten snel en 2 minuten rustig, 5 tot 6 keer achter elkaar.",
        "Heuvels en trappen: bergop lopen kost duidelijk meer energie dan over vlak terrein. Geen heuvels in de buurt? Zoek een brug, een dijk of de duinen op, neem een trap een paar keer, of zet de loopband op een helling.",
      ],
    },
    strength: {
      title: "Wandelen en krachttraining: de beste combinatie",
      paragraphs: [
        "Als je afvalt, verlies je niet alleen vet maar ook wat spiermassa. Krachttraining, samen met genoeg eiwit, helpt je spieren te behouden. De beweegrichtlijn adviseert sowieso minstens 2 keer per week spier- en botversterkende activiteiten.",
        "Een goede week bestaat dus uit dagelijks wandelen plus 2 tot 3 krachttrainingen. Dat kan prima thuis, met alleen je eigen lichaamsgewicht.",
      ],
      link: "Bekijk krachttraining voor thuis",
    },
    start: {
      title: "Zo begin je: schoenen, blaren en rustig opbouwen",
      paragraphs: ["Wandelen is laagdrempelig, maar met een paar dingen voorkom je dat je na een week afhaakt:"],
      bullets: [
        "Bouw rustig op: maak je wandelingen elke week 5 tot 10 minuten langer in plaats van meteen een uur te lopen.",
        "Loop op goed passende, comfortabele schoenen met wat demping. Voor een rondje door de wijk heb je geen dure wandelschoenen nodig.",
        "Loop nieuwe schoenen eerst in op korte stukken, en kies sokken die niet schuren. Katoen houdt vocht vast; sportsokken van synthetisch materiaal of wol blijven droger.",
        "Voel je een plek schuren? Stop en plak er meteen een (blaren)pleister op, voordat er een blaar ontstaat.",
        "Neem op langere wandelingen water mee, en draag in het donker iets reflecterends.",
        "Heb je pijn in je voeten, knieën of heupen die niet overgaat, of een aandoening aan je hart of longen? Overleg dan eerst met je huisarts.",
      ],
    },
    planTitle: "Wandelen en eten die samenwerken",
    planText:
      "In je persoonlijke plan krijg je een dagelijks stappendoel, een weekmenu dat precies op je caloriedoel uitkomt en, als je wilt, een trainingsschema voor thuis of de sportschool. Je dagelijkse beweging zit al in je caloriedoel verwerkt.",
    planCta: "Maak mijn persoonlijke plan",
    planNote: "± 3 minuten · je betaalt pas als je een plan kiest",
    faq: [
      {
        q: "Hoeveel calorieën verbrand je met 1 uur wandelen?",
        a: "Ongeveer 3 tot 5 kcal per kilo lichaamsgewicht, afhankelijk van je tempo. Iemand van 75 kilo verbrandt in een uur zo'n 225 kcal bij een rustig tempo (± 4 km/u) tot zo'n 375 kcal bij zeer snel wandelen (± 6,4 km/u). Dat is inclusief wat je in rust ook al verbruikt.",
      },
      {
        q: "Hoeveel calorieën verbrand je met 10.000 stappen?",
        a: "10.000 stappen is zo'n 7 kilometer. Voor iemand van 75 kilo in een stevig tempo (± 5 km/u) is dat ± 375 kcal in totaal, waarvan ± 270 kcal extra bovenop je verbruik in rust. Ben je zwaarder, dan is het meer; ben je lichter, dan minder.",
      },
      {
        q: "Is wandelen genoeg om af te vallen?",
        a: "Wandelen helpt, maar alleen als je ook een calorietekort hebt, en wat je eet heeft daar meestal meer invloed op dan hoeveel je beweegt. De beste combinatie: een eetpatroon dat past bij je caloriebehoefte, dagelijks wandelen en 2 tot 3 keer per week krachttraining.",
      },
      {
        q: "Kun je buikvet verliezen met wandelen?",
        a: "Je kunt niet kiezen waar je vet verliest: dat bepaalt je lichaam zelf. Verlies je vet door een calorietekort, dan gebeurt dat verspreid over je hele lichaam, ook rond je buik. Buikspieroefeningen of wandelen alleen 'verbranden' niet specifiek buikvet.",
      },
      {
        q: "Is wandelen of hardlopen beter om af te vallen?",
        a: "Hardlopen verbrandt per minuut meer. Maar wandelen is voor veel mensen makkelijker vol te houden, belast je gewrichten minder en kun je elke dag doen. Voor afvallen werkt de vorm van bewegen die je echt blijft doen het best, samen met wat je eet.",
      },
      {
        q: "Waarom geeft mijn horloge een ander getal?",
        a: "Horloges en apps schatten je verbruik met hun eigen formules, vaak op basis van je hartslag. Die schattingen kunnen flink verschillen, ook tussen apparaten onderling. Gebruik ze vooral om je eigen dagen en weken met elkaar te vergelijken.",
      },
    ],
  },
  en: {
    metaTitle: "Losing weight by walking: how many calories do you burn?",
    metaDescription:
      "How many calories do you burn walking? Work it out for free for your weight and pace, and find out how losing weight by walking works in practice.",
    eyebrow: "Exercise",
    h1: "Losing weight by walking:",
    h1Accent: "this is how many calories you burn",
    intro:
      "Walking is the easiest way to move more: it costs nothing, you can do it anywhere and it needs little recovery. But how many calories do you really burn, and what does that mean for losing weight? Work it out below.",
    short:
      "Walking burns roughly 3 to 5 kcal per kilo of body weight per hour, depending on your pace. If you weigh 75 kilos, an hour of brisk walking (± 5 km/h) burns around 260 kcal, of which about 190 kcal is extra on top of what you burn at rest anyway. So walking helps with a calorie deficit, but what you eat makes the biggest difference.",
    burn: {
      title: "How many calories do you burn walking?",
      paragraphs: [
        "How much you burn depends mainly on your weight, your pace and how long you walk. Researchers express effort in METs. 1 MET is what you burn at rest: about 1 kcal per kilo of body weight per hour. According to the Compendium of Physical Activities, brisk walking is about 3.5 METs: you burn 3.5 times as much as at rest.",
        "The sum is: METs × weight in kilos × time in hours. For someone weighing 75 kilos who walks briskly for an hour, that's 3.5 × 75 × 1 = about 260 kcal. You'd have burned about 75 kcal of that at rest anyway, so walking costs you about 190 kcal extra. That extra part is what counts for weight loss.",
      ],
      head: ["Weight", "Easy (± 4 km/h)", "Brisk (± 5 km/h)", "Fast (± 5.6 km/h)", "Very fast (± 6.4 km/h)"],
      note: "Kcal per hour of walking on level ground, in total (including what you burn at rest, about 1 kcal per kilo per hour), rounded to 10 kcal. Source: Compendium of Physical Activities.",
    },
    how: {
      title: "Losing weight by walking: how it works",
      paragraphs: [
        "You lose weight when you take in less energy than you use over a longer period: a calorie deficit. Walking increases how much you use, and that helps. But what you eat usually has a bigger effect. The roughly 190 extra kcal from an hour of brisk walking is almost cancelled out by a 30-gram handful of nuts (about 170 to 200 kcal).",
        "That's why walking works best together with eating that matches your calorie needs. If you include your walks when you fill in your activity level, they're already counted. Eat them back on top and you're counting them twice.",
      ],
      link: "Calculate your calorie needs",
    },
    practice: {
      title: "Theory and practice: why the scales move more slowly",
      paragraphs: [
        "On paper, the sum is simple. One kilo of body fat stands for about 7,700 kcal. If you weigh 75 kilos and walk briskly for an hour 5 times a week, you burn about 950 kcal extra a week. In theory, one kilo of fat would then take you just over 8 weeks, as long as you eat and move exactly the same otherwise. That's a calculation, not a promise.",
        "In practice, the effect is often smaller. That's called compensation, and it's completely normal:",
      ],
      bullets: [
        "Moving more can make you hungrier, so you eat a little more without noticing.",
        "After a long walk, you sometimes move less for the rest of the day.",
        "'I've been for a walk, so I've earned a biscuit' is a well-known trap.",
        "Watches and apps can overestimate how much you burn, making you think you have more room.",
      ],
      after: [
        "On top of that, your weight fluctuates from day to day because of fluid, salt and what's in your gut. So look at the average over a few weeks, not at one morning on the scales.",
      ],
    },
    often: {
      title: "How often and how long should you walk to lose weight?",
      paragraphs: [
        "There's no fixed minimum. A good starting point is the Dutch Health Council's activity guideline: at least 150 minutes of moderate-intensity activity a week, spread over several days. For example, half an hour of brisk walking 5 times a week. More is fine, and every extra minute adds to what you burn.",
        "Start with what you can easily manage now, for example 20 to 30 minutes, and build up to 45 to 60 minutes. Walking a bit every day does more than one long hike at the weekend, and it becomes a habit sooner. In our plans, you get a daily step target: 8,000 steps if you mostly sit during the day, and 10,000 otherwise.",
      ],
      link: "How many steps a day is healthy?",
    },
    more: {
      title: "Burn more: pace, intervals and hills",
      paragraphs: ["Want to get more out of your walk in the same time? You have three dials to turn:"],
      bullets: [
        "Pace: going from easy (± 4 km/h, 3.0 METs) to fast (± 5.6 km/h, 4.3 METs) burns over 40% more per hour.",
        "Intervals: alternate between walking briskly and walking easily, for example 3 minutes fast and 2 minutes easy, 5 to 6 times in a row.",
        "Hills and stairs: walking uphill costs clearly more energy than walking on the flat. No hills nearby? Look for a bridge, a dyke or the dunes, climb a flight of stairs a few times, or set the treadmill to an incline.",
      ],
    },
    strength: {
      title: "Walking and strength training: the best combination",
      paragraphs: [
        "When you lose weight, you lose not only fat but also some muscle. Strength training, together with enough protein, helps you keep your muscle. The activity guidelines recommend muscle- and bone-strengthening activities at least twice a week anyway.",
        "So a good week consists of walking every day plus 2 to 3 strength sessions. You can easily do those at home, with just your own body weight.",
      ],
      link: "See strength training at home",
    },
    start: {
      title: "Getting started: shoes, blisters and building up gradually",
      paragraphs: ["Walking is easy to start with, but a few things help you avoid giving up after a week:"],
      bullets: [
        "Build up gradually: make your walks 5 to 10 minutes longer each week instead of walking for an hour straight away.",
        "Wear comfortable, well-fitting shoes with some cushioning. You don't need expensive walking boots for a walk round the neighbourhood.",
        "Break in new shoes on short walks first, and choose socks that don't rub. Cotton holds on to moisture; sports socks made of synthetic material or wool stay drier.",
        "Feel a spot rubbing? Stop and put a plaster or blister plaster on it straight away, before a blister forms.",
        "Take water on longer walks, and wear something reflective in the dark.",
        "Do you have pain in your feet, knees or hips that doesn't go away, or a heart or lung condition? Then talk to your GP first.",
      ],
    },
    planTitle: "Walking and eating that work together",
    planText:
      "Your personal plan gives you a daily step target, a weekly menu that adds up to exactly your calorie target and, if you like, a workout plan for home or the gym. Your daily activity is already included in your calorie target.",
    planCta: "Create my personal plan",
    planNote: "About 3 minutes · you only pay once you choose a plan",
    faq: [
      {
        q: "How many calories do you burn walking for 1 hour?",
        a: "About 3 to 5 kcal per kilo of body weight, depending on your pace. Someone weighing 75 kilos burns around 225 kcal in an hour at an easy pace (± 4 km/h) up to around 375 kcal walking very fast (± 6.4 km/h). That includes what you burn at rest anyway.",
      },
      {
        q: "How many calories do you burn with 10,000 steps?",
        a: "10,000 steps is about 7 kilometres. For someone weighing 75 kilos at a brisk pace (± 5 km/h), that's about 375 kcal in total, of which about 270 kcal is extra on top of what you burn at rest. If you weigh more, it's more; if you weigh less, it's less.",
      },
      {
        q: "Is walking enough to lose weight?",
        a: "Walking helps, but only if you're also in a calorie deficit, and what you eat usually has more influence on that than how much you move. The best combination: eating that matches your calorie needs, walking every day and strength training 2 to 3 times a week.",
      },
      {
        q: "Can you lose belly fat by walking?",
        a: "You can't choose where you lose fat: your body decides that. If you lose fat through a calorie deficit, it happens all over your body, including around your belly. Ab exercises or walking alone don't specifically 'burn' belly fat.",
      },
      {
        q: "Is walking or running better for losing weight?",
        a: "Running burns more per minute. But for many people walking is easier to keep up, puts less strain on your joints and can be done every day. For weight loss, the kind of exercise you actually stick with works best, together with what you eat.",
      },
      {
        q: "Why does my watch show a different number?",
        a: "Watches and apps estimate how much you burn with their own formulas, often based on your heart rate. Those estimates can differ a lot, including between devices. Use them mainly to compare your own days and weeks with each other.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

/** Kcal per uur wandelen per gewicht en tempo: MET × kg × 1 uur, afgerond op 10. */
function burnRows(l: Locale): string[][] {
  return WEIGHTS.map((kg) => [`${kg} kg`, ...METS.map((met) => `${formatNumber(Math.round((met * kg) / 10) * 10, 0, l)} kcal`)]);
}

export default async function WandelenPage() {
  const l = await getLocale();
  const c = copy[l];
  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short}>
        <WalkingCalculator />
      </ContentHero>

      <ArticleBody>
        <Section title={c.burn.title} paragraphs={c.burn.paragraphs}>
          <DataTable head={c.burn.head} rows={burnRows(l)} note={c.burn.note} minWidth="36rem" />
        </Section>

        <Section title={c.how.title} paragraphs={c.how.paragraphs}>
          <ArrowLink href="/caloriebehoefte-berekenen">{c.how.link}</ArrowLink>
        </Section>

        <Section title={c.practice.title} paragraphs={c.practice.paragraphs} bullets={c.practice.bullets}>
          {c.practice.after.map((p) => (
            <p key={p.slice(0, 48)} className="text-lg leading-relaxed text-muted">
              {p}
            </p>
          ))}
        </Section>

        <Section title={c.often.title} paragraphs={c.often.paragraphs}>
          <ArrowLink href="/hoeveel-stappen-per-dag">{c.often.link}</ArrowLink>
        </Section>

        <Section title={c.more.title} paragraphs={c.more.paragraphs} bullets={c.more.bullets} />

        <Section title={c.strength.title} paragraphs={c.strength.paragraphs}>
          <ArrowLink href="/krachttraining-thuis">{c.strength.link}</ArrowLink>
        </Section>

        <Section title={c.start.title} paragraphs={c.start.paragraphs} bullets={c.start.bullets} />

        <PlanBox title={c.planTitle} text={c.planText} href="/start?doel=afvallen" cta={c.planCta} note={c.planNote} />

        <RelatedPages l={l} paths={["/hoeveel-stappen-per-dag", "/caloriebehoefte-berekenen", "/krachttraining-thuis", "/eiwitten-per-dag"]} />
      </ArticleBody>

      <FaqAndClose l={l} items={c.faq} />
    </>
  );
}

import type { ProductId } from "@/config/pricing";
import type { FaqId } from "@/content/faq";
import { defineCopy } from "@/i18n/config";
import type { Intake } from "@/lib/intake";

/**
 * Teksten van de campagne-landingspagina's (/lp, /lp/voeding, /lp/training).
 * Elke variant sluit aan op een soort advertentie: dezelfde belofte als in de
 * advertentie, en de vragenlijst begint met het juiste plan.
 */

export const LANDING_VARIANTS = ["afvallen", "voeding", "training"] as const;
export type LandingVariant = (typeof LANDING_VARIANTS)[number];

type Goal = Intake["goal"];

export interface VariantSettings {
  /** Product dat in de vragenlijst al is gekozen (null = de klant kiest zelf). */
  product: ProductId | null;
  /** Volgorde van de doelen in de hero. */
  goals: Goal[];
  /** Producten in de prijstabel en welk product uitgelicht is. */
  pricing: { only?: ProductId[]; highlight: ProductId };
  /** Veelgestelde vragen in deze volgorde: de twijfels die het afsluiten tegenhouden eerst. */
  faq: FaqId[];
  image: { src: string; position: string };
  /** Welke voorbeelden uit het schema we laten zien. */
  preview: ("voeding" | "training")[];
}

export const variantSettings: Record<LandingVariant, VariantSettings> = {
  afvallen: {
    product: null,
    goals: ["afvallen", "afvallen_strakker", "afblijven", "sterker"],
    pricing: { highlight: "bundel" },
    faq: ["opzeggen", "garantie", "abonnement", "persoonlijk", "niet-afvallen", "resultaat", "medisch", "betalen"],
    image: { src: "/images/hero-workout-home.jpg", position: "object-[68%_50%]" },
    preview: ["voeding", "training"],
  },
  voeding: {
    product: "voeding",
    goals: ["afvallen", "afvallen_strakker", "afblijven", "sterker"],
    pricing: { only: ["voeding", "bundel"], highlight: "voeding" },
    faq: ["opzeggen", "garantie", "persoonlijk", "allergie", "abonnement", "niet-afvallen", "resultaat"],
    image: { src: "/images/bowl-salmon.jpg", position: "object-center" },
    preview: ["voeding"],
  },
  training: {
    product: "training",
    goals: ["sterker", "afvallen_strakker", "afvallen", "afblijven"],
    pricing: { only: ["training", "bundel"], highlight: "training" },
    faq: ["opzeggen", "garantie", "thuis", "abonnement", "resultaat", "medisch"],
    image: { src: "/images/woman-overhead-press.jpg", position: "object-[60%_40%]" },
    preview: ["training"],
  },
};

interface VariantCopy {
  metaTitle: string;
  metaDescription: string;
  /** Kop in drie delen: het middelste deel krijgt de accentkleur. */
  title: [string, string, string];
  intro: string;
  heroAlt: string;
  /** Wat je krijgt, in vier korte punten. */
  gets: { title: string; text: string }[];
  /** Herkenbare problemen: zo voelt het nu. */
  painTitle: string;
  painPoints: string[];
  /** Wat het kost om zo door te gaan (geld, tijd, vertrouwen). */
  costs: { title: string; text: string }[];
  /** Het ligt niet aan jou, maar aan je aanpak. */
  reframe: { title: string; text: string };
  /** Hoe het meestal gaat, en hoe wij het doen. */
  fixes: { pain: string; answer: string }[];
  ctaLabel: string;
  finalTitle: string;
  finalText: string;
}

interface SharedCopy {
  badge: string;
  launchBadge: (label: string, pct: number, until: string) => string;
  pickTitle: string;
  pickNote: string;
  orStart: string;
  priceFrom: (price: string, perWeek: string) => string;
  priceNote: string;
  getsEyebrow: string;
  getsTitle: string;
  painsEyebrow: string;
  costTitle: string;
  painCta: string;
  painCtaNote: string;
  fixEyebrow: string;
  fixTitle: string;
  fixLabels: [string, string];
  previewEyebrow: string;
  previewTitle: string;
  previewIntro: string;
  previewDay: (day: string) => string;
  previewTargets: string;
  previewTargetsNote: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  minutes: (n: number) => string;
  previewWorkout: (name: string) => string;
  setsReps: (sets: number, reps: string) => string;
  rest: (s: number) => string;
  previewWeek: string;
  previewFull: string;
  previewAccount: string;
  guideEyebrow: string;
  guideTitle: string;
  guideIntro: string;
  guidePoints: { title: string; text: string }[];
  guideHealth: { title: string; text: string };
  guideChart: string;
  guideChartNote: string;
  stepsEyebrow: string;
  stepsTitle: string;
  compareEyebrow: string;
  compareTitle: string;
  compareCols: [string, string, string];
  compareRows: { label: string; values: [string | boolean, string | boolean, string | boolean] }[];
  compareFrom: (price: string) => string;
  pricingEyebrow: string;
  pricingTitle: string;
  pricingIntro: string;
  safeTitle: string;
  safeText: string;
  faqEyebrow: string;
  faqTitle: string;
  /** Achter de slottekst, als de garantie aan staat. */
  finalRisk: (days: number) => string;
}

export const landingCopy = defineCopy<{ shared: SharedCopy; variants: Record<LandingVariant, VariantCopy> }>({
  nl: {
    shared: {
      badge: "Persoonlijk plan in 2 minuten",
      launchBadge: (label, pct, until) => `${label}: ${pct}% korting op je eerste betaling, t/m ${until}`,
      pickTitle: "Waar wil je aan werken?",
      pickNote: "Kies je doel en beantwoord nog een paar vragen. Duurt ongeveer 2 minuten; je betaalt pas als je een plan kiest.",
      orStart: "Of start direct",
      priceFrom: (price, perWeek) => `Vanaf ${price} per maand (${perWeek} per week)`,
      priceNote: "maandelijks opzegbaar na de minimale looptijd",
      getsEyebrow: "Wat je krijgt",
      getsTitle: "Binnen enkele minuten in je mailbox",
      painsEyebrow: "Herken je dit?",
      costTitle: "Wat het je kost om zo door te gaan",
      painCta: "Doorbreek het patroon",
      painCtaNote: "2 minuten · je betaalt pas als je een plan kiest",
      fixEyebrow: "Zo pakken we het anders aan",
      fixTitle: "Een plan dat zich aanpast aan jou, niet andersom",
      fixLabels: ["Meestal", "Bij ons"],
      previewEyebrow: "Een kijkje in je schema",
      previewTitle: "Concreet, overzichtelijk en meteen te gebruiken",
      previewIntro: "Uit een echt voorbeeldschema. Jouw schema maken we op basis van jouw antwoorden.",
      previewDay: (day) => `${day} uit een voorbeeldweekmenu`,
      previewTargets: "Dagdoelen in het voorbeeld",
      previewTargetsNote: "Jouw doelen berekenen we uit je lengte, gewicht, leeftijd, activiteit en doel.",
      kcal: "kcal",
      protein: "eiwit",
      carbs: "koolhydraten",
      fat: "vet",
      minutes: (n) => `${n} min`,
      previewWorkout: (name) => `${name}`,
      setsReps: (sets, reps) => `${sets} × ${reps}`,
      rest: (s) => `${s} sec rust`,
      previewWeek: "Je week in één oogopslag",
      previewFull: "Bekijk het volledige voorbeeldschema",
      previewAccount: "Zo ziet Mijn schema's eruit",
      guideEyebrow: "Niet alleen een schema",
      guideTitle: "Je staat er niet meer alleen voor",
      guideIntro:
        "Een los schema houdt je niet bij en stuurt niet bij als het tegenzit. Wij wel: elke week kijk je kort met ons mee, en we passen je plan aan op wat er echt gebeurt.",
      guidePoints: [
        { title: "Wekelijks weegmoment", text: "Gewicht en een paar vragen in 1 minuut. Wijkt je voortgang af, dan sturen we je calorieën of training meteen bij." },
        { title: "Elke 4 weken een nieuw schema", text: "Na een korte check-in maken we je volgende schema: wat werkte blijft, wat niet werkte gaat eruit." },
        { title: "Je voortgang in grafieken", text: "Gewicht, taille, je caloriedoel per periode en hoe het ging, overzichtelijk in Mijn schema's." },
      ],
      guideHealth: {
        title: "Koppel je app of horloge",
        text: "Apple Health, Garmin, Fitbit, Oura, Polar of een Withings-weegschaal: dan zie je of je echt traint en wat het oplevert.",
      },
      guideChart: "Zo ziet je voortgang eruit",
      guideChartNote: "Voorbeeld van een fictieve klant in Mijn schema's. Je eigen verloop is anders.",
      stepsEyebrow: "Zo werkt het",
      stepsTitle: "In 3 stappen naar je persoonlijke plan",
      compareEyebrow: "Waarom dit anders is",
      compareTitle: "Persoonlijk als een coach, voor de prijs van een app",
      compareCols: ["Afvallen & Afblijven", "Standaard dieet of app", "Losse afspraken bij een coach"],
      compareRows: [
        { label: "Afgestemd op jouw lichaam, smaak en agenda", values: [true, false, true] },
        { label: "Voeding en training op elkaar afgestemd", values: [true, false, "Vaak apart"] },
        { label: "Elke week bijgestuurd op je voortgang", values: [true, false, "Alleen bij een afspraak"] },
        { label: "Vandaag nog beginnen", values: [true, true, "Vaak een wachttijd"] },
        { label: "Kosten", values: ["", "Wisselend", "Tientallen euro's per afspraak"] },
      ],
      compareFrom: (price) => `Vanaf ${price} per maand`,
      pricingEyebrow: "Prijzen",
      pricingTitle: "Kies je plan en begin vandaag",
      pricingIntro:
        "Gewoontes veranderen kost tijd. Kies je 3 maanden of langer, dan krijg je elke 4 weken een nieuw, bijgestuurd schema en betaal je minder per maand.",
      safeTitle: "Veilig en verantwoord",
      safeText:
        "We werken met een realistisch tempo, voldoende eiwit en nooit onder een veilig minimum aan calorieën. Bij zwangerschap, een eetstoornis of een ongezond streefgewicht maken we geen schema, en bij medische aandoeningen vragen we eerst om overleg met je arts.",
      faqEyebrow: "Veelgestelde vragen",
      faqTitle: "Nog twijfels?",
      finalRisk: (days) => ` Ben je niet tevreden, dan vraag je binnen ${days} dagen je eerste betaling terug.`,
    },
    variants: {
      afvallen: {
        metaTitle: "Afvallen met een persoonlijk voedings- en trainingsschema",
        metaDescription:
          "Je persoonlijke voedings- en trainingsschema, afgestemd op jouw lichaam, smaak en agenda, en elke week bijgestuurd. Binnen enkele minuten in je mailbox.",
        title: ["Klaar met diëten die ", "na drie weken", " alweer stranden?"],
        intro:
          "Je wéét wat gezond is. Maar met een standaard dieet val je steeds terug in hetzelfde patroon. Wij maken een voedings- en trainingsschema op jouw lichaam, smaak en agenda, en sturen het elke week bij. Zonder crashdieet of honger, en binnen enkele minuten in je mailbox.",
        heroAlt: "Vrouw doet thuis een oefening op een yogamat",
        gets: [
          { title: "Jouw dagdoelen", text: "Calorieën en eiwit, berekend voor jouw lichaam en doel." },
          { title: "Weekmenu met recepten", text: "Gerechten die je lekker vindt, plus een boodschappenlijst." },
          { title: "Trainingsschema", text: "Thuis of in de sportschool, opgebouwd over 4 weken." },
          { title: "Wekelijkse bijsturing", text: "We passen je plan aan op hoe het echt gaat." },
        ],
        painTitle: "Maandag begin je. Alweer.",
        painPoints: [
          "Je begint vol goede moed, en na een paar weken sluipen de oude gewoontes er weer in.",
          "Je hebt al van alles geprobeerd: calorieën tellen, shakes, koolhydraatarm. Het werkt even, en dan niet meer.",
          "De kilo's die eraf gingen, kwamen er net zo makkelijk weer bij.",
          "Door alle tegenstrijdige adviezen weet je niet meer wat je nou wel en niet moet eten.",
          "Je hebt honger, mist wat je lekker vindt en voelt je schuldig bij elk koekje.",
          "En stiekem ben je gaan denken dat het aan jou ligt.",
        ],
        costs: [
          { title: "Geld", text: "Elke nieuwe poging kost weer geld: apps, shakes, boeken en abonnementen die je na een maand niet meer gebruikt." },
          { title: "Tijd", text: "Elke keer begin je weer bij nul. Zo worden een paar maanden al snel een paar jaar." },
          { title: "Vertrouwen in jezelf", text: "Elke poging die strandt, maakt de volgende zwaarder. Tot je niet meer gelooft dat het jou kan lukken." },
        ],
        reframe: {
          title: "Het ligt niet aan jou. Het ligt aan je aanpak.",
          text: "Een standaard dieet is voor iedereen hetzelfde, en past dus bij niemand echt. Te streng, niet afgestemd op je leven, en niemand die bijstuurt als het tegenzit. Dan hangt alles af van wilskracht, en die raakt op.",
        },
        fixes: [
          { pain: "Een crashdieet met een groot tekort: het gaat snel, en komt net zo snel terug.", answer: "Een realistisch tekort met genoeg eiwit: verantwoord afvallen, met minder kans op een jojo-effect." },
          { pain: "Honger en trek, tot je wilskracht op is.", answer: "Verzadigende maaltijden met eiwit, vezels en volume. Heb je toch honger, dan sturen we bij." },
          { pain: "Recepten die niet in je drukke week passen.", answer: "Recepten binnen jouw bereidingstijd, slim hergebruik en een complete boodschappenlijst." },
          { pain: "Niemand die ziet dat het misgaat.", answer: "Elke week een weegmoment. Wijkt je voortgang af, dan passen we je plan meteen aan." },
        ],
        ctaLabel: "Maak mijn persoonlijke plan",
        finalTitle: "Wacht niet weer tot maandag",
        finalText: "Beantwoord een paar vragen en ontvang binnen enkele minuten je persoonlijke plan. Je betaalt pas als je een plan kiest.",
      },
      voeding: {
        metaTitle: "Persoonlijk voedingsschema: afvallen met eten dat je lekker vindt",
        metaDescription:
          "Een persoonlijk weekmenu met recepten en boodschappenlijst, afgestemd op jouw calorieën, smaak en allergieën. Binnen enkele minuten in je mailbox.",
        title: ["Afvallen met eten dat je ", "wél", " lekker vindt"],
        intro:
          "Elke dag kipfilet met broccoli? Geen wonder dat je het niet volhoudt. Je krijgt een persoonlijk weekmenu met recepten en boodschappenlijst, afgestemd op jouw calorieën, smaak, allergieën en tijd om te koken. Elke week bijgestuurd, en binnen enkele minuten in je mailbox.",
        heroAlt: "Bowl met zalm, ei en verse groente",
        gets: [
          { title: "Jouw calorie- en eiwitdoel", text: "Berekend voor jouw lichaam, activiteit en tempo." },
          { title: "7-daags weekmenu", text: "Ontbijt, lunch, avondeten en tussendoortjes met recepten." },
          { title: "Boodschappenlijst", text: "Per afdeling in de supermarkt, om af te vinken." },
          { title: "Vervangopties", text: "Voor elke maaltijd een alternatief met vergelijkbare waarden." },
        ],
        painTitle: "Je eet 'gezond'. En toch schiet het niet op.",
        painPoints: [
          "Je weet niet of je genoeg, te veel of juist te weinig eet.",
          "Dieetmenu's zijn zo saai dat je na een week alweer eet wat je altijd at.",
          "Om vijf uur sta je nog te bedenken wat je vanavond gaat eten.",
          "Je allergie, je eetpatroon of wat je niet lust past nooit in een standaardschema.",
          "Overdag gaat het goed, maar 's avonds slaat de honger toe.",
        ],
        costs: [
          { title: "Geld", text: "Dure 'light'-producten, eten dat je weggooit, en toch nog vaak de bezorger aan de deur." },
          { title: "Tijd", text: "Elke dag opnieuw bedenken wat je eet, en zonder lijstje door de supermarkt dwalen." },
          { title: "Plezier in eten", text: "Het gevoel dat afvallen alleen lukt met eten dat je eigenlijk niet lekker vindt." },
        ],
        reframe: {
          title: "Het ligt niet aan jou. Het ligt aan je menu.",
          text: "Een menu dat niet past bij wat jij lekker vindt, hoeveel tijd je hebt en wat je lichaam nodig heeft, is bijna niet vol te houden. Daar helpt geen wilskracht tegen. Een beter plan wel.",
        },
        fixes: [
          { pain: "Gissen wat en hoeveel je moet eten.", answer: "Exacte hoeveelheden per maaltijd, uitgerekend op jouw dagdoel." },
          { pain: "Saaie dieetmenu's die je na een week zat bent.", answer: "Gerechten op basis van wat jij lekker vindt, met genoeg variatie." },
          { pain: "Standaardschema's die geen rekening houden met je allergie of eetpatroon.", answer: "Rekening met allergieën, vegetarisch of veganistisch, en wat je niet lust." },
          { pain: "Honger in de avond, tot het toch misgaat.", answer: "Verzadigende maaltijden met eiwit en vezels. Heb je toch honger, dan sturen we bij." },
        ],
        ctaLabel: "Maak mijn voedingsschema",
        finalTitle: "Weet vanavond al wat je morgen eet",
        finalText: "Beantwoord een paar vragen en ontvang binnen enkele minuten je persoonlijke weekmenu. Je betaalt pas als je een plan kiest.",
      },
      training: {
        metaTitle: "Persoonlijk trainingsschema voor thuis of de sportschool",
        metaDescription:
          "Een persoonlijk trainingsschema met duidelijke uitleg, opgebouwd over 4 weken en afgestemd op jouw niveau, materiaal en blessures.",
        title: ["Stop met trainen ", "zonder plan", ""],
        intro:
          "Elke keer dezelfde oefeningen, twijfelen wat je moet doen en weinig vooruitgang: zonde van je tijd. Je krijgt een persoonlijk trainingsschema met uitleg per oefening, opgebouwd over 4 weken en afgestemd op jouw niveau, materiaal, tijd en eventuele blessures. Thuis of in de sportschool.",
        heroAlt: "Vrouw doet een schouderpress met dumbbells",
        gets: [
          { title: "Schema voor jouw situatie", text: "Thuis zonder of met materiaal, of in de sportschool." },
          { title: "Opbouw over 4 weken", text: "Elke week een stap verder, zodat je blijft vooruitgaan." },
          { title: "Uitleg per oefening", text: "Sets, herhalingen, rust en techniektips, plus een alternatief." },
          { title: "Wekelijkse bijsturing", text: "Te zwaar of te licht? Dan passen we het meteen aan." },
        ],
        painTitle: "Je traint wel. Maar het schiet niet op.",
        painPoints: [
          "Je staat in de sportschool en weet niet goed wat je moet doen, dus doe je maar wat.",
          "Je doet al maanden dezelfde oefeningen, met dezelfde gewichten.",
          "Je zweet, maar je merkt niet dat je sterker wordt.",
          "Je twijfelt over je techniek en bent bang voor een blessure.",
          "Na een paar weken zakt je motivatie in, want waar doe je het eigenlijk voor?",
        ],
        costs: [
          { title: "Geld", text: "Een sportschoolabonnement dat je amper benut, of thuismateriaal dat stof verzamelt." },
          { title: "Tijd", text: "Uren trainen zonder opbouw: veel moeite, weinig vooruitgang." },
          { title: "Motivatie", text: "Het gevoel dat sporten gewoon niets voor jou is." },
        ],
        reframe: {
          title: "Het ligt niet aan jou. Je mist een plan.",
          text: "Zonder opbouw, duidelijke uitleg en iemand die bijstuurt, blijf je hangen op hetzelfde niveau. Met een schema dat elke week een stap verder gaat, weet je bij elke training precies wat je moet doen.",
        },
        fixes: [
          { pain: "Maar wat doen in de sportschool.", answer: "Een vast schema met per oefening sets, herhalingen, rust en uitleg." },
          { pain: "Maandenlang dezelfde oefeningen en gewichten.", answer: "Een opbouw over 4 weken met progressie, afgestemd op je doel." },
          { pain: "Twijfel over je techniek, of last van een blessure.", answer: "Rekening met je klachten en niveau, met een alternatief voor elke oefening." },
          { pain: "Niemand die ziet of het te zwaar of te licht is.", answer: "Elke week bijgestuurd: we passen gewichten of herhalingen aan op hoe het voelt." },
        ],
        ctaLabel: "Maak mijn trainingsschema",
        finalTitle: "Maak je volgende training de eerste mét plan",
        finalText: "Beantwoord een paar vragen en ontvang binnen enkele minuten je persoonlijke trainingsschema. Je betaalt pas als je een plan kiest.",
      },
    },
  },
  en: {
    shared: {
      badge: "Personal plan in 2 minutes",
      launchBadge: (label, pct, until) => `${label}: ${pct}% off your first payment, until ${until}`,
      pickTitle: "What would you like to work on?",
      pickNote: "Choose your goal and answer a few more questions. Takes about 2 minutes; you only pay once you choose a plan.",
      orStart: "Or start straight away",
      priceFrom: (price, perWeek) => `From ${price} a month (${perWeek} a week)`,
      priceNote: "cancel monthly after the minimum term",
      getsEyebrow: "What you get",
      getsTitle: "In your inbox within minutes",
      painsEyebrow: "Sound familiar?",
      costTitle: "What carrying on like this costs you",
      painCta: "Break the cycle",
      painCtaNote: "2 minutes · you only pay once you choose a plan",
      fixEyebrow: "How we do things differently",
      fixTitle: "A plan that adapts to you, not the other way round",
      fixLabels: ["Usually", "With us"],
      previewEyebrow: "A look inside your plan",
      previewTitle: "Practical, clear and ready to use",
      previewIntro: "Taken from a real sample plan. We create yours based on your answers.",
      previewDay: (day) => `${day} from a sample weekly meal plan`,
      previewTargets: "Daily targets in the sample",
      previewTargetsNote: "We calculate your targets from your height, weight, age, activity and goal.",
      kcal: "kcal",
      protein: "protein",
      carbs: "carbs",
      fat: "fat",
      minutes: (n) => `${n} min`,
      previewWorkout: (name) => `${name}`,
      setsReps: (sets, reps) => `${sets} × ${reps}`,
      rest: (s) => `${s} sec rest`,
      previewWeek: "Your week at a glance",
      previewFull: "See the full sample plan",
      previewAccount: "See what My plans looks like",
      guideEyebrow: "Not just a plan",
      guideTitle: "You're no longer on your own",
      guideIntro:
        "A one-off plan doesn't keep track of you or adjust when things get tough. We do: every week you check in briefly, and we adapt your plan to what's really happening.",
      guidePoints: [
        { title: "Weekly weigh-in", text: "Your weight and a few questions in 1 minute. If your progress is off track, we adjust your calories or training straight away." },
        { title: "A new plan every 4 weeks", text: "After a short check-in we create your next plan: what worked stays, what didn't goes." },
        { title: "Your progress in charts", text: "Weight, waist, your calorie target per period and how it went, all clearly laid out in My plans." },
      ],
      guideHealth: {
        title: "Connect your app or watch",
        text: "Apple Health, Garmin, Fitbit, Oura, Polar or a Withings scale: then you'll see whether you really train and what it achieves.",
      },
      guideChart: "This is what your progress looks like",
      guideChartNote: "Example of a fictional customer in My plans. Your own progress will be different.",
      stepsEyebrow: "How it works",
      stepsTitle: "Your personal plan in 3 steps",
      compareEyebrow: "Why this is different",
      compareTitle: "As personal as a coach, for the price of an app",
      compareCols: ["Afvallen & Afblijven", "Standard diet or app", "Separate sessions with a coach"],
      compareRows: [
        { label: "Tailored to your body, taste and schedule", values: [true, false, true] },
        { label: "Nutrition and training aligned", values: [true, false, "Often separate"] },
        { label: "Adjusted to your progress every week", values: [true, false, "Only at an appointment"] },
        { label: "Start today", values: [true, true, "Often a waiting time"] },
        { label: "Cost", values: ["", "Varies", "Tens of euros per session"] },
      ],
      compareFrom: (price) => `From ${price} a month`,
      pricingEyebrow: "Pricing",
      pricingTitle: "Choose your plan and start today",
      pricingIntro:
        "Changing habits takes time. Choose 3 months or longer and you get a new, fine-tuned plan every 4 weeks, at a lower monthly price.",
      safeTitle: "Safe and responsible",
      safeText:
        "We work at a realistic pace, with enough protein, and never below a safe minimum of calories. We don't create a plan during pregnancy, with an eating disorder or for an unhealthy target weight, and with medical conditions we first ask you to check with your doctor.",
      faqEyebrow: "Frequently asked questions",
      faqTitle: "Still unsure?",
      finalRisk: (days) => ` Not satisfied? Request your first payment back within ${days} days.`,
    },
    variants: {
      afvallen: {
        metaTitle: "Lose weight with a personal nutrition and workout plan",
        metaDescription:
          "Your personal nutrition and workout plan, tailored to your body, taste and schedule, and adjusted every week. In your inbox within minutes.",
        title: ["Tired of diets that fall apart ", "after three weeks", "?"],
        intro:
          "You know what healthy looks like. But with a standard diet, you keep slipping back into the same pattern. We create a nutrition and workout plan around your body, taste and schedule, and adjust it every week. No crash diet, no going hungry, and in your inbox within minutes.",
        heroAlt: "Woman doing an exercise on a yoga mat at home",
        gets: [
          { title: "Your daily targets", text: "Calories and protein, calculated for your body and goal." },
          { title: "Weekly meal plan with recipes", text: "Dishes you enjoy, plus a shopping list." },
          { title: "Workout plan", text: "At home or at the gym, built up over 4 weeks." },
          { title: "Weekly adjustments", text: "We adapt your plan to how things are really going." },
        ],
        painTitle: "Starting again on Monday. Again.",
        painPoints: [
          "You start full of good intentions, and after a few weeks the old habits creep back in.",
          "You've tried it all: counting calories, shakes, low-carb. It works for a while, and then it doesn't.",
          "The kilos that came off went straight back on.",
          "With all the conflicting advice, you no longer know what you should and shouldn't eat.",
          "You're hungry, you miss the food you love and you feel guilty about every biscuit.",
          "And deep down, you've started to think it's your fault.",
        ],
        costs: [
          { title: "Money", text: "Every new attempt costs money again: apps, shakes, books and subscriptions you stop using after a month." },
          { title: "Time", text: "Every time, you start from zero. A few months easily turns into a few years." },
          { title: "Self-belief", text: "Every attempt that falls apart makes the next one harder. Until you stop believing you can do it." },
        ],
        reframe: {
          title: "It's not you. It's your approach.",
          text: "A standard diet is the same for everyone, so it doesn't truly fit anyone. Too strict, not built around your life, and nobody to adjust it when things get tough. Then everything depends on willpower, and willpower runs out.",
        },
        fixes: [
          { pain: "A crash diet with a big deficit: it goes fast, and comes back just as fast.", answer: "A realistic deficit with enough protein: losing weight responsibly, with less risk of the yo-yo effect." },
          { pain: "Hunger and cravings, until your willpower runs out.", answer: "Filling meals with protein, fibre and volume. Still hungry? Then we adjust." },
          { pain: "Recipes that don't fit your busy week.", answer: "Recipes within your cooking time, smart leftovers and a complete shopping list." },
          { pain: "Nobody notices when it's going wrong.", answer: "A weekly weigh-in. If your progress is off track, we adjust your plan straight away." },
        ],
        ctaLabel: "Create my personal plan",
        finalTitle: "Don't wait for Monday again",
        finalText: "Answer a few questions and receive your personal plan within minutes. You only pay once you choose a plan.",
      },
      voeding: {
        metaTitle: "Personal nutrition plan: lose weight eating food you enjoy",
        metaDescription:
          "A personal weekly meal plan with recipes and a shopping list, tailored to your calories, taste and allergies. In your inbox within minutes.",
        title: ["Lose weight eating food you ", "actually", " enjoy"],
        intro:
          "Chicken and broccoli every day? No wonder you can't keep it up. You get a personal weekly meal plan with recipes and a shopping list, tailored to your calories, taste, allergies and cooking time. Adjusted every week, and in your inbox within minutes.",
        heroAlt: "Bowl with salmon, egg and fresh vegetables",
        gets: [
          { title: "Your calorie and protein target", text: "Calculated for your body, activity and pace." },
          { title: "7-day meal plan", text: "Breakfast, lunch, dinner and snacks with recipes." },
          { title: "Shopping list", text: "Sorted by supermarket aisle, ready to tick off." },
          { title: "Swap options", text: "An alternative for every meal with similar values." },
        ],
        painTitle: "You're eating 'healthily'. And still not getting anywhere.",
        painPoints: [
          "You don't know whether you're eating enough, too much or too little.",
          "Diet menus are so boring that within a week you're back to your usual meals.",
          "At five o'clock you're still wondering what to have for dinner.",
          "Your allergy, your way of eating or the foods you dislike never fit a standard plan.",
          "The day goes fine, but in the evening the hunger kicks in.",
        ],
        costs: [
          { title: "Money", text: "Pricey 'light' products, food you throw away, and still the delivery driver at your door." },
          { title: "Time", text: "Working out what to eat every single day, and wandering round the supermarket without a list." },
          { title: "Enjoying food", text: "The feeling that losing weight only works with food you don't actually like." },
        ],
        reframe: {
          title: "It's not you. It's your menu.",
          text: "A menu that doesn't match what you enjoy, how much time you have and what your body needs is almost impossible to stick to. Willpower won't fix that. A better plan will.",
        },
        fixes: [
          { pain: "Guessing what and how much to eat.", answer: "Exact quantities per meal, calculated to your daily target." },
          { pain: "Boring diet menus you're sick of within a week.", answer: "Dishes based on what you enjoy, with plenty of variety." },
          { pain: "Standard plans that ignore your allergy or way of eating.", answer: "We account for allergies, vegetarian or vegan eating, and foods you dislike." },
          { pain: "Evening hunger, until it goes wrong after all.", answer: "Filling meals with protein and fibre. Still hungry? Then we adjust." },
        ],
        ctaLabel: "Create my nutrition plan",
        finalTitle: "Know tonight what you'll eat tomorrow",
        finalText: "Answer a few questions and receive your personal weekly meal plan within minutes. You only pay once you choose a plan.",
      },
      training: {
        metaTitle: "Personal workout plan for home or the gym",
        metaDescription:
          "A personal workout plan with clear instructions, built up over 4 weeks and tailored to your level, equipment and injuries.",
        title: ["Stop training ", "without a plan", ""],
        intro:
          "The same exercises every time, unsure what to do and little progress: a waste of your time. You get a personal workout plan with instructions for every exercise, built up over 4 weeks and tailored to your level, equipment, time and any injuries. At home or at the gym.",
        heroAlt: "Woman doing a shoulder press with dumbbells",
        gets: [
          { title: "A plan for your situation", text: "At home with or without equipment, or at the gym." },
          { title: "Built up over 4 weeks", text: "A step further each week, so you keep progressing." },
          { title: "Instructions for every exercise", text: "Sets, reps, rest and technique tips, plus an alternative." },
          { title: "Weekly adjustments", text: "Too hard or too easy? We adjust it straight away." },
        ],
        painTitle: "You do train. But you're not getting anywhere.",
        painPoints: [
          "You're at the gym, not quite sure what to do, so you just do something.",
          "You've been doing the same exercises with the same weights for months.",
          "You sweat, but you don't notice yourself getting any stronger.",
          "You're unsure about your technique and worried about getting injured.",
          "After a few weeks your motivation drops, because what are you actually doing it for?",
        ],
        costs: [
          { title: "Money", text: "A gym membership you barely use, or home equipment gathering dust." },
          { title: "Time", text: "Hours of training without a build-up: lots of effort, little progress." },
          { title: "Motivation", text: "The feeling that exercise just isn't for you." },
        ],
        reframe: {
          title: "It's not you. You're missing a plan.",
          text: "Without a build-up, clear instructions and someone to adjust things, you stay stuck at the same level. With a plan that moves a step forward every week, you know exactly what to do at every workout.",
        },
        fixes: [
          { pain: "Just doing something at the gym.", answer: "A set plan with sets, reps, rest and instructions for every exercise." },
          { pain: "The same exercises and weights for months.", answer: "A 4-week build-up with progression, matched to your goal." },
          { pain: "Doubts about your technique, or an injury that bothers you.", answer: "We account for your complaints and level, with an alternative for every exercise." },
          { pain: "Nobody checking whether it's too hard or too easy.", answer: "Adjusted every week: we change the weights or reps based on how it feels." },
        ],
        ctaLabel: "Create my workout plan",
        finalTitle: "Make your next workout the first one with a plan",
        finalText: "Answer a few questions and receive your personal workout plan within minutes. You only pay once you choose a plan.",
      },
    },
  },
});

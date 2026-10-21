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
    faq: ["snel", "persoonlijk", "opzeggen", "niet-afvallen", "resultaat", "medisch", "betalen"],
    image: { src: "/images/hero-workout-home.jpg", position: "object-[68%_50%]" },
    preview: ["voeding", "training"],
  },
  voeding: {
    product: "voeding",
    goals: ["afvallen", "afvallen_strakker", "afblijven", "sterker"],
    pricing: { only: ["voeding", "bundel"], highlight: "voeding" },
    faq: ["snel", "persoonlijk", "allergie", "opzeggen", "niet-afvallen", "resultaat", "betalen"],
    image: { src: "/images/bowl-salmon.jpg", position: "object-center" },
    preview: ["voeding"],
  },
  training: {
    product: "training",
    goals: ["sterker", "afvallen_strakker", "afvallen", "afblijven"],
    pricing: { only: ["training", "bundel"], highlight: "training" },
    faq: ["snel", "thuis", "opzeggen", "resultaat", "medisch", "betalen"],
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
  pains: { pain: string; answer: string }[];
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
  priceFrom: (price: string) => string;
  priceNote: string;
  getsEyebrow: string;
  getsTitle: string;
  painsEyebrow: string;
  painsTitle: string;
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
}

export const landingCopy = defineCopy<{ shared: SharedCopy; variants: Record<LandingVariant, VariantCopy> }>({
  nl: {
    shared: {
      badge: "Persoonlijk plan in 2 minuten",
      launchBadge: (label, pct, until) => `${label}: ${pct}% korting op je eerste betaling, t/m ${until}`,
      pickTitle: "Waar wil je aan werken?",
      pickNote: "Kies je doel en beantwoord nog een paar vragen. Duurt ongeveer 2 minuten; je betaalt pas als je een plan kiest.",
      orStart: "Of start direct",
      priceFrom: (price) => `Vanaf ${price} per maand`,
      priceNote: "maandelijks opzegbaar na de minimale looptijd",
      getsEyebrow: "Wat je krijgt",
      getsTitle: "Binnen enkele minuten in je mailbox",
      painsEyebrow: "Herken je dit?",
      painsTitle: "Het ligt niet aan jou. Het ligt aan plannen die niet bij je passen.",
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
      guideTitle: "Elke week bijgestuurd, op weg naar je doel",
      guideIntro:
        "Een schema dat niet meebeweegt, houd je niet vol. Daarom kijk je elke week kort met ons mee en passen we je plan aan op wat er echt gebeurt.",
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
      compareEyebrow: "Waarom dit wél werkt",
      compareTitle: "Persoonlijk als een coach, voor de prijs van een app",
      compareCols: ["Afvallen & Afblijven", "Standaard dieet of app", "Losse afspraken bij een coach"],
      compareRows: [
        { label: "Afgestemd op jouw lichaam, smaak en agenda", values: [true, false, true] },
        { label: "Voeding en training op elkaar afgestemd", values: [true, false, "Vaak apart"] },
        { label: "Elke week bijgestuurd op je voortgang", values: [true, false, "Alleen bij een afspraak"] },
        { label: "Vandaag nog beginnen", values: [true, true, "Vaak een wachttijd"] },
        { label: "Kosten", values: ["", "Wisselend", "Per afspraak"] },
      ],
      compareFrom: (price) => `Vanaf ${price} per maand`,
      pricingEyebrow: "Prijzen",
      pricingTitle: "Kies je plan",
      pricingIntro: "Maandelijks via automatische incasso. Hoe langer de looptijd, hoe lager je maandprijs.",
      safeTitle: "Veilig en verantwoord",
      safeText:
        "We werken met een realistisch tempo, voldoende eiwit en nooit onder een veilig minimum aan calorieën. Bij zwangerschap, een eetstoornis of een ongezond streefgewicht maken we geen schema, en bij medische aandoeningen vragen we eerst om overleg met je arts.",
      faqEyebrow: "Veelgestelde vragen",
      faqTitle: "Nog twijfels?",
    },
    variants: {
      afvallen: {
        metaTitle: "Afvallen met een persoonlijk voedings- en trainingsschema",
        metaDescription:
          "Je persoonlijke voedings- en trainingsschema, afgestemd op jouw lichaam, smaak en agenda, en elke week bijgestuurd. Binnen enkele minuten in je mailbox.",
        title: ["Eindelijk een afvalplan dat ", "écht", " bij je past"],
        intro:
          "Je persoonlijke voedings- en trainingsschema, berekend op jouw lichaam, smaak en agenda. Zonder crashdieet of honger, elke week bijgestuurd op je voortgang, en binnen enkele minuten in je mailbox.",
        heroAlt: "Vrouw doet thuis een oefening op een yogamat",
        gets: [
          { title: "Jouw dagdoelen", text: "Calorieën en eiwit, berekend voor jouw lichaam en doel." },
          { title: "Weekmenu met recepten", text: "Gerechten die je lekker vindt, plus een boodschappenlijst." },
          { title: "Trainingsschema", text: "Thuis of in de sportschool, opgebouwd over 4 weken." },
          { title: "Wekelijkse bijsturing", text: "We passen je plan aan op hoe het echt gaat." },
        ],
        pains: [
          { pain: "Je hebt al zoveel diëten geprobeerd, en de kilo's kwamen steeds terug.", answer: "Een realistisch tekort met genoeg eiwit: verantwoord afvallen, met minder kans op een jojo-effect." },
          { pain: "Je hebt vaak honger of trek, en houdt het daardoor niet vol.", answer: "Verzadigende maaltijden met eiwit, vezels en volume. Bij honger sturen we bij." },
          { pain: "Je hebt weinig tijd en geen zin in ingewikkeld koken.", answer: "Recepten binnen jouw bereidingstijd, slim hergebruik en een complete boodschappenlijst." },
        ],
        ctaLabel: "Start je persoonlijke plan",
        finalTitle: "Zet vandaag de eerste stap",
        finalText: "Beantwoord een paar vragen en ontvang binnen enkele minuten je persoonlijke plan.",
      },
      voeding: {
        metaTitle: "Persoonlijk voedingsschema: afvallen met eten dat je lekker vindt",
        metaDescription:
          "Een persoonlijk weekmenu met recepten en boodschappenlijst, afgestemd op jouw calorieën, smaak en allergieën. Binnen enkele minuten in je mailbox.",
        title: ["Afvallen met eten dat je ", "wél", " lekker vindt"],
        intro:
          "Een persoonlijk weekmenu met recepten en boodschappenlijst, afgestemd op jouw calorieën, smaak, allergieën en tijd om te koken. Geen honger, geen saaie lijstjes, en elke week bijgestuurd.",
        heroAlt: "Bowl met zalm, ei en verse groente",
        gets: [
          { title: "Jouw calorie- en eiwitdoel", text: "Berekend voor jouw lichaam, activiteit en tempo." },
          { title: "7-daags weekmenu", text: "Ontbijt, lunch, avondeten en tussendoortjes met recepten." },
          { title: "Boodschappenlijst", text: "Per afdeling in de supermarkt, om af te vinken." },
          { title: "Vervangopties", text: "Voor elke maaltijd een alternatief met vergelijkbare waarden." },
        ],
        pains: [
          { pain: "Je weet niet wat en hoeveel je moet eten om af te vallen.", answer: "Exacte hoeveelheden per maaltijd, uitgerekend op jouw dagdoel." },
          { pain: "Dieetmenu's zijn saai, en je eet al snel weer wat je altijd at.", answer: "Gerechten op basis van wat jij lekker vindt, met genoeg variatie." },
          { pain: "Allergieën of een eetpatroon maken standaardschema's onbruikbaar.", answer: "Rekening met allergieën, vegetarisch of veganistisch, en wat je niet lust." },
        ],
        ctaLabel: "Start je voedingsschema",
        finalTitle: "Volgende week al eten volgens jouw plan",
        finalText: "Beantwoord een paar vragen en ontvang binnen enkele minuten je persoonlijke weekmenu.",
      },
      training: {
        metaTitle: "Persoonlijk trainingsschema voor thuis of de sportschool",
        metaDescription:
          "Een persoonlijk trainingsschema met duidelijke uitleg, opgebouwd over 4 weken en afgestemd op jouw niveau, materiaal en blessures.",
        title: ["Sterker en strakker, ", "thuis of in de sportschool", ""],
        intro:
          "Een persoonlijk trainingsschema met duidelijke uitleg per oefening, opgebouwd over 4 weken en afgestemd op jouw niveau, materiaal, tijd en eventuele blessures. Elke week bijgestuurd op hoe het voelt.",
        heroAlt: "Vrouw doet een schouderpress met dumbbells",
        gets: [
          { title: "Schema voor jouw situatie", text: "Thuis zonder of met materiaal, of in de sportschool." },
          { title: "Opbouw over 4 weken", text: "Elke week een stap verder, zodat je blijft vooruitgaan." },
          { title: "Uitleg per oefening", text: "Sets, herhalingen, rust en techniektips, plus een alternatief." },
          { title: "Wekelijkse bijsturing", text: "Te zwaar of te licht? Dan passen we het meteen aan." },
        ],
        pains: [
          { pain: "Je staat in de sportschool en weet niet goed wat je moet doen.", answer: "Een vast schema met per oefening sets, herhalingen, rust en uitleg." },
          { pain: "Je traint wel, maar je ziet weinig vooruitgang.", answer: "Een opbouw over 4 weken met progressie, afgestemd op je doel." },
          { pain: "Je bent bang voor blessures, of hebt al last van iets.", answer: "Rekening met je klachten en niveau, met een alternatief voor elke oefening." },
        ],
        ctaLabel: "Start je trainingsschema",
        finalTitle: "Je eerste training kan vandaag al",
        finalText: "Beantwoord een paar vragen en ontvang binnen enkele minuten je persoonlijke trainingsschema.",
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
      priceFrom: (price) => `From ${price} a month`,
      priceNote: "cancel monthly after the minimum term",
      getsEyebrow: "What you get",
      getsTitle: "In your inbox within minutes",
      painsEyebrow: "Sound familiar?",
      painsTitle: "It's not you. It's plans that don't fit you.",
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
      guideTitle: "Adjusted every week, on the way to your goal",
      guideIntro:
        "A plan that doesn't adapt is hard to stick to. That's why you check in briefly every week, and we adjust your plan to what's really happening.",
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
      compareEyebrow: "Why this works",
      compareTitle: "As personal as a coach, for the price of an app",
      compareCols: ["Afvallen & Afblijven", "Standard diet or app", "Separate sessions with a coach"],
      compareRows: [
        { label: "Tailored to your body, taste and schedule", values: [true, false, true] },
        { label: "Nutrition and training aligned", values: [true, false, "Often separate"] },
        { label: "Adjusted to your progress every week", values: [true, false, "Only at an appointment"] },
        { label: "Start today", values: [true, true, "Often a waiting time"] },
        { label: "Cost", values: ["", "Varies", "Per session"] },
      ],
      compareFrom: (price) => `From ${price} a month`,
      pricingEyebrow: "Pricing",
      pricingTitle: "Choose your plan",
      pricingIntro: "Monthly by direct debit. The longer the term, the lower your monthly price.",
      safeTitle: "Safe and responsible",
      safeText:
        "We work at a realistic pace, with enough protein, and never below a safe minimum of calories. We don't create a plan during pregnancy, with an eating disorder or for an unhealthy target weight, and with medical conditions we first ask you to check with your doctor.",
      faqEyebrow: "Frequently asked questions",
      faqTitle: "Still unsure?",
    },
    variants: {
      afvallen: {
        metaTitle: "Lose weight with a personal nutrition and workout plan",
        metaDescription:
          "Your personal nutrition and workout plan, tailored to your body, taste and schedule, and adjusted every week. In your inbox within minutes.",
        title: ["Finally, a weight-loss plan that ", "really", " fits you"],
        intro:
          "Your personal nutrition and workout plan, calculated for your body, taste and schedule. No crash diet, no going hungry, adjusted to your progress every week, and in your inbox within minutes.",
        heroAlt: "Woman doing an exercise on a yoga mat at home",
        gets: [
          { title: "Your daily targets", text: "Calories and protein, calculated for your body and goal." },
          { title: "Weekly meal plan with recipes", text: "Dishes you enjoy, plus a shopping list." },
          { title: "Workout plan", text: "At home or at the gym, built up over 4 weeks." },
          { title: "Weekly adjustments", text: "We adapt your plan to how things are really going." },
        ],
        pains: [
          { pain: "You've tried so many diets, and the kilos kept coming back.", answer: "A realistic deficit with enough protein: losing weight responsibly, with less risk of the yo-yo effect." },
          { pain: "You're often hungry or craving snacks, so you can't keep it up.", answer: "Filling meals with protein, fibre and volume. If you're hungry, we adjust." },
          { pain: "You're short on time and don't fancy complicated cooking.", answer: "Recipes within your cooking time, smart leftovers and a complete shopping list." },
        ],
        ctaLabel: "Start your personal plan",
        finalTitle: "Take the first step today",
        finalText: "Answer a few questions and receive your personal plan within minutes.",
      },
      voeding: {
        metaTitle: "Personal nutrition plan: lose weight eating food you enjoy",
        metaDescription:
          "A personal weekly meal plan with recipes and a shopping list, tailored to your calories, taste and allergies. In your inbox within minutes.",
        title: ["Lose weight eating food you ", "actually", " enjoy"],
        intro:
          "A personal weekly meal plan with recipes and a shopping list, tailored to your calories, taste, allergies and cooking time. No going hungry, no boring lists, and adjusted every week.",
        heroAlt: "Bowl with salmon, egg and fresh vegetables",
        gets: [
          { title: "Your calorie and protein target", text: "Calculated for your body, activity and pace." },
          { title: "7-day meal plan", text: "Breakfast, lunch, dinner and snacks with recipes." },
          { title: "Shopping list", text: "Sorted by supermarket aisle, ready to tick off." },
          { title: "Swap options", text: "An alternative for every meal with similar values." },
        ],
        pains: [
          { pain: "You don't know what or how much to eat to lose weight.", answer: "Exact quantities per meal, calculated to your daily target." },
          { pain: "Diet menus are boring, and you soon go back to your old meals.", answer: "Dishes based on what you enjoy, with plenty of variety." },
          { pain: "Allergies or your way of eating make standard plans useless.", answer: "We account for allergies, vegetarian or vegan eating, and foods you dislike." },
        ],
        ctaLabel: "Start your nutrition plan",
        finalTitle: "Eating to your own plan by next week",
        finalText: "Answer a few questions and receive your personal weekly meal plan within minutes.",
      },
      training: {
        metaTitle: "Personal workout plan for home or the gym",
        metaDescription:
          "A personal workout plan with clear instructions, built up over 4 weeks and tailored to your level, equipment and injuries.",
        title: ["Stronger and more toned, ", "at home or at the gym", ""],
        intro:
          "A personal workout plan with clear instructions for every exercise, built up over 4 weeks and tailored to your level, equipment, time and any injuries. Adjusted every week to how it feels.",
        heroAlt: "Woman doing a shoulder press with dumbbells",
        gets: [
          { title: "A plan for your situation", text: "At home with or without equipment, or at the gym." },
          { title: "Built up over 4 weeks", text: "A step further each week, so you keep progressing." },
          { title: "Instructions for every exercise", text: "Sets, reps, rest and technique tips, plus an alternative." },
          { title: "Weekly adjustments", text: "Too hard or too easy? We adjust it straight away." },
        ],
        pains: [
          { pain: "You're at the gym and not quite sure what to do.", answer: "A set plan with sets, reps, rest and instructions for every exercise." },
          { pain: "You do train, but you're not seeing much progress.", answer: "A 4-week build-up with progression, matched to your goal." },
          { pain: "You're worried about injuries, or something already bothers you.", answer: "We account for your complaints and level, with an alternative for every exercise." },
        ],
        ctaLabel: "Start your workout plan",
        finalTitle: "Your first workout can be today",
        finalText: "Answer a few questions and receive your personal workout plan within minutes.",
      },
    },
  },
});

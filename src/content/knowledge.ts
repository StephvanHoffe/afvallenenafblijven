import type { Locale } from "@/i18n/config";

/**
 * Alle kennispagina's (rekenhulpen, artikelen, recepten). Eén lijst voor de
 * overzichtspagina /kennis, de footer, de sitemap en de "Lees ook"-blokken.
 * Voeg een nieuwe pagina hier toe; de calorieën per product staan in
 * src/content/calorie-products.ts.
 */
export type KnowledgeCategory = "rekenhulpen" | "voeding" | "recepten" | "bewegen" | "afvallen";

export interface KnowledgePage {
  path: string;
  category: KnowledgeCategory;
  title: Record<Locale, string>;
  /** Eén zin voor de overzichtspagina. */
  summary: Record<Locale, string>;
}

export const knowledgeCategories: Record<KnowledgeCategory, Record<Locale, string>> = {
  rekenhulpen: { nl: "Rekenhulpen", en: "Calculators" },
  voeding: { nl: "Voeding", en: "Nutrition" },
  recepten: { nl: "Recepten en weekmenu", en: "Recipes and weekly menu" },
  bewegen: { nl: "Bewegen en trainen", en: "Exercise and training" },
  afvallen: { nl: "Afvallen", en: "Weight loss" },
};

export const knowledgePages: KnowledgePage[] = [
  // Rekenhulpen
  {
    path: "/caloriebehoefte-berekenen",
    category: "rekenhulpen",
    title: { nl: "Caloriebehoefte berekenen", en: "Calorie calculator" },
    summary: { nl: "Hoeveel calorieën en eiwit je per dag nodig hebt, met je BMR en TDEE.", en: "How many calories and how much protein you need a day, with your BMR and TDEE." },
  },
  {
    path: "/bmi-berekenen",
    category: "rekenhulpen",
    title: { nl: "BMI berekenen", en: "BMI calculator" },
    summary: { nl: "Je BMI, wat de uitkomst betekent en welk gewicht gezond is bij je lengte.", en: "Your BMI, what the result means and which weight is healthy for your height." },
  },
  {
    path: "/vetpercentage-berekenen",
    category: "rekenhulpen",
    title: { nl: "Vetpercentage berekenen", en: "Body fat calculator" },
    summary: { nl: "Schat je vetpercentage met een meetlint en zie wat gezond is voor jouw leeftijd.", en: "Estimate your body fat with a tape measure and see what's healthy for your age." },
  },
  {
    path: "/eiwitten-per-dag",
    category: "rekenhulpen",
    title: { nl: "Hoeveel eiwitten per dag?", en: "How much protein a day?" },
    summary: { nl: "Je eiwitbehoefte per doel, met een tabel per gewicht en eiwitrijke voeding.", en: "Your protein needs per goal, with a table by weight and high-protein foods." },
  },
  {
    path: "/koolhydraten-per-dag",
    category: "rekenhulpen",
    title: { nl: "Hoeveel koolhydraten per dag?", en: "How many carbs a day?" },
    summary: { nl: "Hoeveel koolhydraten bij jouw calorieën passen, ook als je afvalt.", en: "How many carbs fit your calories, also when you're losing weight." },
  },
  // Voeding
  {
    path: "/hoeveel-water-per-dag",
    category: "voeding",
    title: { nl: "Hoeveel water per dag?", en: "How much water a day?" },
    summary: { nl: "Hoeveel je per dag moet drinken, en wanneer meer.", en: "How much to drink a day, and when you need more." },
  },
  {
    path: "/hoeveel-suiker-per-dag",
    category: "voeding",
    title: { nl: "Hoeveel suiker per dag?", en: "How much sugar a day?" },
    summary: { nl: "Wat het advies voor suiker is, en waar het ongemerkt in zit.", en: "What the advice on sugar is, and where it hides." },
  },
  {
    path: "/vezels-per-dag",
    category: "voeding",
    title: { nl: "Hoeveel vezels per dag?", en: "How much fibre a day?" },
    summary: { nl: "Waarom vezels helpen bij afvallen en hoe je aan 30 tot 40 gram komt.", en: "Why fibre helps you lose weight and how to reach 30 to 40 grams." },
  },
  {
    path: "/gezonde-snacks",
    category: "voeding",
    title: { nl: "Gezonde snacks", en: "Healthy snacks" },
    summary: { nl: "Gezonde, eiwitrijke en caloriearme snacks, met calorieën per portie.", en: "Healthy, high-protein and low-calorie snacks, with calories per portion." },
  },
  {
    path: "/intermittent-fasting",
    category: "voeding",
    title: { nl: "Intermittent fasting", en: "Intermittent fasting" },
    summary: { nl: "Wat het is, of het werkt om af te vallen en voor wie het niet geschikt is.", en: "What it is, whether it works for weight loss and who it isn't for." },
  },
  {
    path: "/calorieen",
    category: "voeding",
    title: { nl: "Calorietabel", en: "Calorie table" },
    summary: { nl: "Calorieën, eiwit en koolhydraten van veelgegeten producten, per portie.", en: "Calories, protein and carbs of everyday foods, per portion." },
  },
  // Recepten
  {
    path: "/recepten",
    category: "recepten",
    title: { nl: "Gezonde recepten om af te vallen", en: "Healthy recipes for weight loss" },
    summary: { nl: "Eiwitrijke recepten met calorieën per portie, voor ontbijt, lunch en avondeten.", en: "High-protein recipes with calories per portion, for breakfast, lunch and dinner." },
  },
  {
    path: "/recepten/eiwitrijk-ontbijt",
    category: "recepten",
    title: { nl: "Eiwitrijk ontbijt", en: "High-protein breakfast" },
    summary: { nl: "Snelle eiwitrijke ontbijtjes, van kwarkbowl tot omelet.", en: "Quick high-protein breakfasts, from quark bowls to omelettes." },
  },
  {
    path: "/recepten/eiwitrijke-lunch",
    category: "recepten",
    title: { nl: "Eiwitrijke lunch", en: "High-protein lunch" },
    summary: { nl: "Eiwitrijke lunches voor thuis en om mee te nemen.", en: "High-protein lunches for home and to take with you." },
  },
  {
    path: "/recepten/eiwitrijk-avondeten",
    category: "recepten",
    title: { nl: "Eiwitrijk avondeten", en: "High-protein dinner" },
    summary: { nl: "Eiwitrijke avondmaaltijden die binnen 30 minuten op tafel staan.", en: "High-protein dinners on the table within 30 minutes." },
  },
  {
    path: "/meal-prep",
    category: "recepten",
    title: { nl: "Meal prep", en: "Meal prep" },
    summary: { nl: "Zo kook je in één keer voor een paar dagen, met recepten die goed blijven.", en: "How to cook for several days at once, with recipes that keep well." },
  },
  {
    path: "/gezond-weekmenu",
    category: "recepten",
    title: { nl: "Gezond weekmenu", en: "Healthy weekly menu" },
    summary: { nl: "Een voorbeeldweek om af te vallen, met boodschappenlijst.", en: "An example week for weight loss, with a shopping list." },
  },
  // Bewegen
  {
    path: "/hoeveel-stappen-per-dag",
    category: "bewegen",
    title: { nl: "Hoeveel stappen per dag?", en: "How many steps a day?" },
    summary: { nl: "Is 10.000 stappen nodig? Wat onderzoek zegt en hoe je meer stappen zet.", en: "Do you need 10,000 steps? What research says and how to walk more." },
  },
  {
    path: "/afvallen-met-wandelen",
    category: "bewegen",
    title: { nl: "Afvallen met wandelen", en: "Losing weight by walking" },
    summary: { nl: "Hoeveel calorieën je verbrandt met wandelen, met rekenhulp.", en: "How many calories you burn walking, with a calculator." },
  },
  {
    path: "/krachttraining-thuis",
    category: "bewegen",
    title: { nl: "Krachttraining thuis", en: "Strength training at home" },
    summary: { nl: "Een schema voor thuis, met of zonder materiaal, ook voor vrouwen.", en: "A plan for home, with or without equipment, for women too." },
  },
  {
    path: "/full-body-workout",
    category: "bewegen",
    title: { nl: "Full body workout", en: "Full body workout" },
    summary: { nl: "Eén training voor je hele lichaam, voor de sportschool of thuis.", en: "One workout for your whole body, at the gym or at home." },
  },
  {
    path: "/buikspieroefeningen",
    category: "bewegen",
    title: { nl: "Buikspieroefeningen", en: "Ab exercises" },
    summary: { nl: "De beste buikspieroefeningen, met uitleg, en wat ze wel en niet doen.", en: "The best ab exercises, explained, and what they do and don't do." },
  },
  {
    path: "/hiit-training",
    category: "bewegen",
    title: { nl: "HIIT-training", en: "HIIT training" },
    summary: { nl: "Wat HIIT is, een voorbeeldtraining en hoe vaak per week.", en: "What HIIT is, an example workout and how often a week." },
  },
  // Afvallen
  {
    path: "/afvallen-in-de-overgang",
    category: "afvallen",
    title: { nl: "Afvallen in de overgang", en: "Losing weight during menopause" },
    summary: { nl: "Waarom het lastiger is en wat wél werkt.", en: "Why it's harder and what does work." },
  },
];

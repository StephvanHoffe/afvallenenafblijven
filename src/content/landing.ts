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
  heroAlt: string;
  /** Wat je krijgt, in vier korte punten. */
  gets: { title: string; text: string }[];
  finalTitle: string;
  finalText: string;
}

interface SharedCopy {
  badge: string;
  launchBadge: (label: string, discount: string, until: string) => string;
  pickTitle: string;
  previewTargets: string;
  kcal: string;
  protein: string;
  minutes: (n: number) => string;
  setsReps: (sets: number, reps: string) => string;
  rest: (s: number) => string;
  previewFull: string;
  pricingEyebrow: string;
  pricingTitle: string;
  pricingIntro: string;
  faqEyebrow: string;
  faqTitle: string;
  /** Achter de slottekst, als de garantie aan staat. */
  finalRisk: (days: number) => string;
}

export const landingCopy = defineCopy<{ shared: SharedCopy; variants: Record<LandingVariant, VariantCopy> }>({
  nl: {
    shared: {
      badge: "In 2 minuten ingevuld · binnen 2 uur je plan",
      launchBadge: (label, discount, until) => `${label}: ${discount}, t/m ${until}`,
      pickTitle: "Waar wil je aan werken?",
      previewTargets: "Dagdoelen in het voorbeeld",
      kcal: "kcal",
      protein: "eiwit",
      minutes: (n) => `${n} min`,
      setsReps: (sets, reps) => `${sets} × ${reps}`,
      rest: (s) => `${s} sec rust`,
      previewFull: "Bekijk het volledige voorbeeldschema",
      pricingEyebrow: "Prijzen",
      pricingTitle: "Kies je plan en begin vandaag",
      pricingIntro:
        "Een nieuwe gewoonte heeft volgens onderzoek gemiddeld zo'n 66 dagen nodig. Kies je 3 maanden of langer, dan krijg je elke 4 weken een nieuw, bijgestuurd schema en betaal je minder per maand.",
      faqEyebrow: "Veelgestelde vragen",
      faqTitle: "Nog twijfels?",
      finalRisk: (days) => ` Ben je niet tevreden, dan vraag je binnen ${days} dagen je eerste betaling terug.`,
    },
    variants: {
      afvallen: {
        metaTitle: "Afvallen met een persoonlijk voedings- en trainingsschema",
        metaDescription:
          "Je persoonlijke voedings- en trainingsschema, afgestemd op jouw lichaam, smaak en agenda, en elke week bijgestuurd. Binnen 2 uur in je mailbox.",
        heroAlt: "Vrouw doet thuis een oefening op een yogamat",
        gets: [
          { title: "Jouw dagdoelen", text: "Calorieën en eiwit, berekend voor jouw lichaam en doel." },
          { title: "Weekmenu met recepten", text: "Gerechten die je lekker vindt, plus een boodschappenlijst." },
          { title: "Trainingsschema", text: "Thuis of in de sportschool, opgebouwd over 4 weken." },
          { title: "Wekelijkse bijsturing", text: "We passen je plan aan op hoe het echt gaat." },
        ],
        finalTitle: "Wacht niet weer tot maandag",
        finalText: "Beantwoord een paar vragen en ontvang binnen 2 uur je persoonlijke plan. Je betaalt pas als je een plan kiest.",
      },
      voeding: {
        metaTitle: "Persoonlijk voedingsschema: afvallen met eten dat je lekker vindt",
        metaDescription:
          "Een persoonlijk weekmenu met recepten en boodschappenlijst, afgestemd op jouw calorieën, smaak en allergieën. Binnen 2 uur in je mailbox.",
        heroAlt: "Bowl met zalm, ei en verse groente",
        gets: [
          { title: "Jouw calorie- en eiwitdoel", text: "Berekend voor jouw lichaam, activiteit en tempo." },
          { title: "7-daags weekmenu", text: "Ontbijt, lunch, avondeten en tussendoortjes met recepten." },
          { title: "Boodschappenlijst", text: "Per afdeling in de supermarkt, om af te vinken." },
          { title: "Vervangopties", text: "Voor elke maaltijd een alternatief met vergelijkbare waarden." },
        ],
        finalTitle: "Weet vanavond al wat je morgen eet",
        finalText: "Beantwoord een paar vragen en ontvang binnen 2 uur je persoonlijke weekmenu. Je betaalt pas als je een plan kiest.",
      },
      training: {
        metaTitle: "Persoonlijk trainingsschema voor thuis of de sportschool",
        metaDescription:
          "Een persoonlijk trainingsschema met duidelijke uitleg, opgebouwd over 4 weken en afgestemd op jouw niveau, materiaal en blessures.",
        heroAlt: "Vrouw doet een schouderpress met dumbbells",
        gets: [
          { title: "Schema voor jouw situatie", text: "Thuis zonder of met materiaal, of in de sportschool." },
          { title: "Opbouw over 4 weken", text: "Elke week een stap verder, zodat je blijft vooruitgaan." },
          { title: "Uitleg per oefening", text: "Sets, herhalingen, rust en techniektips, plus een alternatief." },
          { title: "Wekelijkse bijsturing", text: "Te zwaar of te licht? Dan passen we het meteen aan." },
        ],
        finalTitle: "Maak je volgende training de eerste mét plan",
        finalText: "Beantwoord een paar vragen en ontvang binnen 2 uur je persoonlijke trainingsschema. Je betaalt pas als je een plan kiest.",
      },
    },
  },
  en: {
    shared: {
      badge: "2 minutes to fill in · your plan within 2 hours",
      launchBadge: (label, discount, until) => `${label}: ${discount}, until ${until}`,
      pickTitle: "What would you like to work on?",
      previewTargets: "Daily targets in the sample",
      kcal: "kcal",
      protein: "protein",
      minutes: (n) => `${n} min`,
      setsReps: (sets, reps) => `${sets} × ${reps}`,
      rest: (s) => `${s} sec rest`,
      previewFull: "See the full sample plan",
      pricingEyebrow: "Pricing",
      pricingTitle: "Choose your plan and start today",
      pricingIntro:
        "According to research, a new habit takes around 66 days on average. Choose 3 months or longer and you get a new, fine-tuned plan every 4 weeks, at a lower monthly price.",
      faqEyebrow: "Frequently asked questions",
      faqTitle: "Still unsure?",
      finalRisk: (days) => ` Not satisfied? Request your first payment back within ${days} days.`,
    },
    variants: {
      afvallen: {
        metaTitle: "Lose weight with a personal nutrition and workout plan",
        metaDescription:
          "Your personal nutrition and workout plan, tailored to your body, taste and schedule, and adjusted every week. In your inbox within 2 hours.",
        heroAlt: "Woman doing an exercise on a yoga mat at home",
        gets: [
          { title: "Your daily targets", text: "Calories and protein, calculated for your body and goal." },
          { title: "Weekly meal plan with recipes", text: "Dishes you enjoy, plus a shopping list." },
          { title: "Workout plan", text: "At home or at the gym, built up over 4 weeks." },
          { title: "Weekly adjustments", text: "We adapt your plan to how things are really going." },
        ],
        finalTitle: "Don't wait for Monday again",
        finalText: "Answer a few questions and receive your personal plan within 2 hours. You only pay once you choose a plan.",
      },
      voeding: {
        metaTitle: "Personal nutrition plan: lose weight eating food you enjoy",
        metaDescription:
          "A personal weekly meal plan with recipes and a shopping list, tailored to your calories, taste and allergies. In your inbox within 2 hours.",
        heroAlt: "Bowl with salmon, egg and fresh vegetables",
        gets: [
          { title: "Your calorie and protein target", text: "Calculated for your body, activity and pace." },
          { title: "7-day meal plan", text: "Breakfast, lunch, dinner and snacks with recipes." },
          { title: "Shopping list", text: "Sorted by supermarket aisle, ready to tick off." },
          { title: "Swap options", text: "An alternative for every meal with similar values." },
        ],
        finalTitle: "Know tonight what you'll eat tomorrow",
        finalText: "Answer a few questions and receive your personal weekly meal plan within 2 hours. You only pay once you choose a plan.",
      },
      training: {
        metaTitle: "Personal workout plan for home or the gym",
        metaDescription:
          "A personal workout plan with clear instructions, built up over 4 weeks and tailored to your level, equipment and injuries.",
        heroAlt: "Woman doing a shoulder press with dumbbells",
        gets: [
          { title: "A plan for your situation", text: "At home with or without equipment, or at the gym." },
          { title: "Built up over 4 weeks", text: "A step further each week, so you keep progressing." },
          { title: "Instructions for every exercise", text: "Sets, reps, rest and technique tips, plus an alternative." },
          { title: "Weekly adjustments", text: "Too hard or too easy? We adjust it straight away." },
        ],
        finalTitle: "Make your next workout the first one with a plan",
        finalText: "Answer a few questions and receive your personal workout plan within 2 hours. You only pay once you choose a plan.",
      },
    },
  },
});

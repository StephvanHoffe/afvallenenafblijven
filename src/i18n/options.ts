import type { Locale } from "@/i18n/config";
import {
  activityOptions,
  allergyOptions,
  budgetOptions,
  conditionOptions,
  cookingTimeOptions,
  dietOptions,
  experienceOptions,
  goalOptions,
  locationOptions,
  paceOptions,
  sexOptions,
} from "@/lib/intake";
import { checkinOptions } from "@/lib/checkin";

/**
 * Engelse teksten bij de vaste antwoordopties. De sleutels (en bij de check-in
 * de Nederlandse waarden) blijven in de database staan; alleen wat de klant ziet
 * verschilt per taal.
 */

type Described = { label: string; description: string };
type Labels<T> = { [K in keyof T]: T[K] extends string ? string : Described };

const en = {
  goal: {
    afvallen: { label: "Lose weight", description: "Drop the kilos, in a healthy way" },
    afvallen_strakker: { label: "Lose weight and tone up", description: "Lose fat, keep your muscle" },
    afblijven: { label: "Maintain my weight", description: "Keep your results without the yo-yo effect" },
    sterker: { label: "Get stronger", description: "Build muscle and strength" },
  },
  sex: { vrouw: "Female", man: "Male" },
  pace: {
    rustig: { label: "Steady", description: "± 0.25 kg per week" },
    gemiddeld: { label: "Moderate", description: "± 0.5 kg per week (recommended)" },
    snel: { label: "Faster", description: "± 0.75 kg per week" },
  },
  activity: {
    zittend: { label: "Mostly sitting", description: "Office job, little movement" },
    licht: { label: "Lightly active", description: "Regular walking, standing or cycling" },
    actief: { label: "Active", description: "On your feet a lot, e.g. care work or hospitality" },
    zwaar: { label: "Heavy physical work", description: "E.g. construction, removals, warehouse" },
  },
  diet: {
    alles: "I eat everything",
    flexitarisch: "Flexitarian (meat now and then)",
    pescotarisch: "Pescatarian (fish, no meat)",
    vegetarisch: "Vegetarian",
    veganistisch: "Vegan",
  },
  allergy: {
    gluten: "Gluten",
    lactose: "Lactose",
    noten: "Tree nuts",
    pinda: "Peanuts",
    ei: "Egg",
    soja: "Soy",
    vis: "Fish",
    schaaldieren: "Shellfish",
  },
  cookingTime: {
    snel: { label: "Quick & simple", description: "Max. 15 minutes per meal" },
    normaal: { label: "Normal", description: "Max. 30 minutes per meal" },
    uitgebreid: { label: "I love cooking", description: "Can take a bit longer sometimes" },
  },
  budget: { zuinig: "Budget", normaal: "Normal", ruim: "Generous" },
  location: {
    thuis: { label: "At home, no equipment", description: "Just your own body weight" },
    thuis_materiaal: { label: "At home, some equipment", description: "E.g. dumbbells, resistance bands or a kettlebell" },
    sportschool: { label: "At the gym", description: "Access to machines and free weights" },
  },
  experience: {
    beginner: { label: "Beginner", description: "Little or no strength training experience" },
    gevorderd: { label: "Intermediate", description: "I've been training for a while (on and off)" },
    ervaren: { label: "Experienced", description: "I've trained consistently for years" },
  },
  condition: {
    geen: "None",
    diabetes: "Diabetes",
    hart: "Cardiovascular disease",
    bloeddruk: "High blood pressure",
    nieren: "Kidney problems",
    schildklier: "Thyroid condition",
    maagdarm: "Digestive issues (e.g. IBS)",
    anders: "Other",
  },
} satisfies {
  goal: Labels<typeof goalOptions>;
  sex: Labels<typeof sexOptions>;
  pace: Labels<typeof paceOptions>;
  activity: Labels<typeof activityOptions>;
  diet: Labels<typeof dietOptions>;
  allergy: Labels<typeof allergyOptions>;
  cookingTime: Labels<typeof cookingTimeOptions>;
  budget: Labels<typeof budgetOptions>;
  location: Labels<typeof locationOptions>;
  experience: Labels<typeof experienceOptions>;
  condition: Labels<typeof conditionOptions>;
};

function described<T extends Record<string, { label: string; description: string }>>(o: T): { [K in keyof T]: Described } {
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { label: v.label, description: v.description }])) as {
    [K in keyof T]: Described;
  };
}

const nl = {
  goal: described(goalOptions),
  sex: { ...sexOptions } as Labels<typeof sexOptions>,
  pace: described(paceOptions),
  activity: described(activityOptions),
  diet: { ...dietOptions } as Labels<typeof dietOptions>,
  allergy: { ...allergyOptions } as Labels<typeof allergyOptions>,
  cookingTime: described(cookingTimeOptions),
  budget: { ...budgetOptions } as Labels<typeof budgetOptions>,
  location: described(locationOptions),
  experience: described(experienceOptions),
  condition: { ...conditionOptions } as Labels<typeof conditionOptions>,
};

export type IntakeLabels = typeof nl;

/** Labels (en omschrijvingen) van alle intake-opties in de gegeven taal. */
export function intakeLabels(l: Locale): IntakeLabels {
  return l === "en" ? en : nl;
}

/** Engelse weergave van de check-in-antwoorden (de waarden zelf zijn Nederlands). */
const checkinEn: Record<string, string> = {
  Laag: "Low",
  Gemiddeld: "Average",
  Goed: "Good",
  Slecht: "Poor",
  Matig: "Fair",
  "Bijna altijd (90% of meer)": "Almost always (90% or more)",
  "Meestal (70-90%)": "Mostly (70-90%)",
  "Soms (50-70%)": "Sometimes (50-70%)",
  "Weinig (minder dan 50%)": "Rarely (less than 50%)",
  Vaak: "Often",
  Soms: "Sometimes",
  "Bijna nooit": "Almost never",
  "Alle trainingen": "All workouts",
  "De meeste": "Most of them",
  "Ongeveer de helft": "About half",
  "Weinig of geen": "Few or none",
  "Te zwaar": "Too hard",
  "Precies goed": "Just right",
  "Te licht": "Too easy",
};

/** Het label van een check-in-antwoord in de gegeven taal. */
export function checkinLabel(l: Locale, value: string): string {
  return l === "en" ? (checkinEn[value] ?? value) : value;
}

/** Alle antwoordopties van een check-invraag, met waarde (opgeslagen) en label (getoond). */
export function checkinChoices(l: Locale, key: keyof typeof checkinOptions): { value: string; label: string }[] {
  return checkinOptions[key].map((value) => ({ value, label: checkinLabel(l, value) }));
}

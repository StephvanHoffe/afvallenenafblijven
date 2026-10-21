import { z } from "zod";
import { PRODUCT_IDS } from "@/config/pricing";
import { defineCopy, type Locale } from "@/i18n/config";

/**
 * De intake: alles wat we van een klant weten om een persoonlijk schema te
 * maken. Wordt gedeeld door de quiz (client), de checkout (server) en de
 * schema-generator (Claude-prompt).
 */

export const goalOptions = {
  afvallen: { label: "Afvallen", description: "Kilo's kwijt, op een gezonde manier" },
  afvallen_strakker: { label: "Afvallen én strakker worden", description: "Vet verliezen, spieren behouden" },
  afblijven: { label: "Op gewicht blijven", description: "Je resultaat vasthouden zonder jojo-effect" },
  sterker: { label: "Sterker worden", description: "Spiermassa en kracht opbouwen" },
} as const;

export const sexOptions = {
  vrouw: "Vrouw",
  man: "Man",
} as const;

export const paceOptions = {
  rustig: { label: "Rustig", description: "± 0,25 kg per week", kgPerWeek: 0.25 },
  gemiddeld: { label: "Gemiddeld", description: "± 0,5 kg per week (aanbevolen)", kgPerWeek: 0.5 },
  snel: { label: "Sneller", description: "± 0,75 kg per week", kgPerWeek: 0.75 },
} as const;

export const activityOptions = {
  zittend: { label: "Vooral zittend", description: "Kantoorbaan, weinig beweging", factor: 1.25 },
  licht: { label: "Licht actief", description: "Regelmatig lopen, staan of fietsen", factor: 1.35 },
  actief: { label: "Actief", description: "Veel op de been, bijv. zorg of horeca", factor: 1.45 },
  zwaar: { label: "Zwaar lichamelijk werk", description: "Bijv. bouw, verhuizen, magazijn", factor: 1.6 },
} as const;

export const dietOptions = {
  alles: "Ik eet alles",
  flexitarisch: "Flexitarisch (af en toe vlees)",
  pescotarisch: "Pescotarisch (wel vis, geen vlees)",
  vegetarisch: "Vegetarisch",
  veganistisch: "Veganistisch",
} as const;

export const allergyOptions = {
  gluten: "Gluten",
  lactose: "Lactose",
  noten: "Noten",
  pinda: "Pinda",
  ei: "Ei",
  soja: "Soja",
  vis: "Vis",
  schaaldieren: "Schaal- en schelpdieren",
} as const;

export const cookingTimeOptions = {
  snel: { label: "Snel & simpel", description: "Max. 15 minuten per maaltijd" },
  normaal: { label: "Normaal", description: "Max. 30 minuten per maaltijd" },
  uitgebreid: { label: "Ik kook graag", description: "Mag ook eens wat langer duren" },
} as const;

export const budgetOptions = {
  zuinig: "Zuinig",
  normaal: "Normaal",
  ruim: "Ruim",
} as const;

export const locationOptions = {
  thuis: { label: "Thuis, zonder materiaal", description: "Alleen je eigen lichaamsgewicht" },
  thuis_materiaal: { label: "Thuis, met wat materiaal", description: "Bijv. dumbbells, elastieken of een kettlebell" },
  sportschool: { label: "In de sportschool", description: "Toegang tot machines en vrije gewichten" },
} as const;

export const experienceOptions = {
  beginner: { label: "Beginner", description: "Weinig of geen ervaring met krachttraining" },
  gevorderd: { label: "Gevorderd", description: "Ik train al een tijdje (af en toe)" },
  ervaren: { label: "Ervaren", description: "Ik train al jaren structureel" },
} as const;

export const conditionOptions = {
  geen: "Geen",
  diabetes: "Diabetes",
  hart: "Hart- en vaatziekten",
  bloeddruk: "Hoge bloeddruk",
  nieren: "Nierproblemen",
  schildklier: "Schildklieraandoening",
  maagdarm: "Maag-/darmklachten (bijv. PDS)",
  anders: "Anders",
} as const;

/**
 * Foutmeldingen van de schema's hieronder. De schema's gebruiken de
 * Nederlandse tekst; met intakeMessage() toon je een melding in een andere taal.
 */
const messages = defineCopy({
  nl: {
    maxLength: (max: number) => `Maximaal ${max} tekens`,
    minAge: "Je moet minimaal 18 jaar zijn",
    height: "Vul een geldige lengte in",
    weight: "Vul een geldig gewicht in",
    targetWeight: "Je streefgewicht moet lager zijn dan je huidige gewicht",
    name: "Vul je voornaam in",
    email: "Vul een geldig e-mailadres in",
    healthData: "Geef toestemming voor het verwerken van je gezondheidsgegevens",
    terms: "Bevestig dat je de vragen naar waarheid hebt ingevuld en ga akkoord met de algemene voorwaarden",
    immediateDelivery: "Geef aan dat we direct met je schema mogen beginnen",
  },
  en: {
    maxLength: (max: number) => `Maximum ${max} characters`,
    minAge: "You must be at least 18 years old",
    height: "Please enter a valid height",
    weight: "Please enter a valid weight",
    targetWeight: "Your target weight must be lower than your current weight",
    name: "Please enter your first name",
    email: "Please enter a valid email address",
    healthData: "Please give consent for us to process your health data",
    terms: "Please confirm that your answers are truthful and accept the terms and conditions",
    immediateDelivery: "Please confirm that we may start on your plan straight away",
  },
});
const m = messages.nl;

/** Een foutmelding uit de schema's hieronder in de gegeven taal (onbekende meldingen blijven ongewijzigd). */
export function intakeMessage(message: string, l: Locale = "nl"): string {
  if (l === "nl") return message;
  const max = /^Maximaal (\d+) tekens$/.exec(message);
  if (max) return messages[l].maxLength(Number(max[1]));
  const key = (Object.keys(m) as (keyof typeof m)[]).find((k) => m[k] === message);
  const translated = key ? messages[l][key] : undefined;
  return typeof translated === "string" ? translated : message;
}

type Keys<T> = [keyof T & string, ...(keyof T & string)[]];
const keys = <T extends object>(o: T) => Object.keys(o) as Keys<T>;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, m.maxLength(max))
    .optional()
    .transform((v) => (v ? v : undefined));

export const intakeSchema = z
  .object({
    product: z.enum(PRODUCT_IDS),
    goal: z.enum(keys(goalOptions)),
    sex: z.enum(keys(sexOptions)),
    age: z.coerce.number().int().min(18, m.minAge).max(99),
    heightCm: z.coerce.number().min(130, m.height).max(230, m.height),
    weightKg: z.coerce.number().min(35, m.weight).max(300, m.weight),
    targetWeightKg: z.coerce.number().min(35).max(300).optional(),
    pace: z.enum(keys(paceOptions)).default("gemiddeld"),
    activity: z.enum(keys(activityOptions)),

    // Voeding
    diet: z.enum(keys(dietOptions)).default("alles"),
    allergies: z.array(z.enum(keys(allergyOptions))).default([]),
    otherAllergies: optionalText(200),
    dislikes: optionalText(300),
    mealsPerDay: z.coerce.number().int().min(3).max(5).default(4),
    cookingTime: z.enum(keys(cookingTimeOptions)).default("normaal"),
    budget: z.enum(keys(budgetOptions)).default("normaal"),

    // Training
    location: z.enum(keys(locationOptions)).default("sportschool"),
    experience: z.enum(keys(experienceOptions)).default("beginner"),
    trainingDays: z.coerce.number().int().min(2).max(6).default(3),
    sessionMinutes: z.coerce.number().int().min(20).max(90).default(45),
    injuries: optionalText(300),

    // Gezondheid
    pregnant: z.boolean().default(false),
    eatingDisorder: z.boolean().default(false),
    conditions: z.array(z.enum(keys(conditionOptions))).default([]),
    medication: optionalText(300),
    doctorApproval: z.boolean().default(false),

    notes: optionalText(500),
  })
  .superRefine((v, ctx) => {
    if ((v.goal === "afvallen" || v.goal === "afvallen_strakker") && v.targetWeightKg !== undefined) {
      if (v.targetWeightKg >= v.weightKg) {
        ctx.addIssue({
          code: "custom",
          path: ["targetWeightKg"],
          message: m.targetWeight,
        });
      }
    }
  });

export type Intake = z.infer<typeof intakeSchema>;
export type IntakeInput = z.input<typeof intakeSchema>;

export const customerSchema = z.object({
  name: z.string().trim().min(2, m.name).max(80),
  email: z.string().trim().toLowerCase().email(m.email).max(200),
});

export const consentSchema = z.object({
  healthData: z.literal(true, { message: m.healthData }),
  terms: z.literal(true, { message: m.terms }),
  immediateDelivery: z.literal(true, { message: m.immediateDelivery }),
  marketing: z.boolean().default(false),
});

export function hasMedicalCondition(intake: Pick<Intake, "conditions">): boolean {
  return intake.conditions.some((c) => c !== "geen");
}

export function wantsWeightLoss(intake: Pick<Intake, "goal">): boolean {
  return intake.goal === "afvallen" || intake.goal === "afvallen_strakker";
}

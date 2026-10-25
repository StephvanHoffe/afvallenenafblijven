import type { Locale } from "@/i18n/config";

/**
 * Producten, looptijden en prijzen.
 *
 * Dit bestand is de enige bron van waarheid voor prijzen: de website, de
 * betalingen bij Mollie en de juridische teksten lezen allemaal hieruit. Pas je
 * hier een bedrag aan, dan geldt dat voor nieuwe klanten; lopende abonnementen
 * houden het bedrag waarmee ze zijn afgesloten.
 *
 * Alle bedragen zijn in eurocenten, inclusief 21% btw (zie vatPercent).
 */

export const PRODUCT_IDS = ["voeding", "training", "bundel"] as const;
export type ProductId = (typeof PRODUCT_IDS)[number];

export const DURATION_IDS = ["1m", "3m", "6m", "12m", "eenmalig"] as const;
export type DurationId = (typeof DURATION_IDS)[number];
export type SubscriptionDurationId = Exclude<DurationId, "eenmalig">;

/** Het btw-tarief dat in de prijzen zit; staat als "inclusief" op de facturen. */
export const vatPercent = 21;

export type PlanType = "voeding" | "training";

export interface Product {
  id: ProductId;
  name: string;
  shortName: string;
  tagline: string;
  /** Welke schema's de klant per periode ontvangt. */
  includes: PlanType[];
  features: string[];
  href: string;
  image: string;
}

export interface Duration {
  id: DurationId;
  label: string;
  /** Minimale looptijd in maanden (0 = eenmalig, geen abonnement). Afschrijving is altijd per maand. */
  months: number;
  badge?: string;
}

export const products: Record<ProductId, Product> = {
  voeding: {
    id: "voeding",
    name: "Voedingsschema",
    shortName: "Voeding",
    tagline: "Afvallen zonder honger, met eten dat je lekker vindt.",
    includes: ["voeding"],
    features: [
      "Persoonlijk calorie- en macrodoel",
      "7-daags weekmenu met recepten",
      "Boodschappenlijst per week",
      "Afgestemd op allergieën en voorkeuren",
      "Vervangopties voor elke maaltijd",
    ],
    href: "/voedingsschema",
    image: "/images/bowl-salmon.jpg",
  },
  training: {
    id: "training",
    name: "Trainingsschema",
    shortName: "Training",
    tagline: "Sterker en strakker, thuis of in de sportschool.",
    includes: ["training"],
    features: [
      "Schema voor thuis of de sportschool",
      "Opbouw over 4 weken (progressie)",
      "Sets, herhalingen en rusttijden",
      "Duidelijke uitleg per oefening",
      "Rekening met blessures en niveau",
    ],
    href: "/trainingsschema",
    image: "/images/woman-overhead-press.jpg",
  },
  bundel: {
    id: "bundel",
    name: "Bundel: Voeding + Training",
    shortName: "Bundel",
    tagline: "Voeding en training die elkaar versterken.",
    includes: ["voeding", "training"],
    features: [
      "Alles uit het voedingsschema",
      "Alles uit het trainingsschema",
      "Voeding en training op elkaar afgestemd",
      "Extra eiwitadvies op trainingsdagen",
      "Grootste voordeel t.o.v. los kopen",
    ],
    href: "/bundel",
    image: "/images/food-flatlay.jpg",
  },
};

export const durations: Record<DurationId, Duration> = {
  "1m": { id: "1m", label: "1 maand", months: 1 },
  "3m": { id: "3m", label: "3 maanden", months: 3, badge: "Populair" },
  "6m": { id: "6m", label: "6 maanden", months: 6 },
  "12m": { id: "12m", label: "12 maanden", months: 12, badge: "Meeste voordeel" },
  eenmalig: { id: "eenmalig", label: "Eenmalig", months: 0 },
};

/** Engelse teksten van de producten en looptijden; prijzen en sleutels zijn gelijk. */
const productTextEn: Record<ProductId, Pick<Product, "name" | "shortName" | "tagline" | "features">> = {
  voeding: {
    name: "Nutrition plan",
    shortName: "Nutrition",
    tagline: "Lose weight without going hungry, eating food you enjoy.",
    features: [
      "Personal calorie and macro targets",
      "7-day meal plan with recipes",
      "Weekly shopping list",
      "Tailored to allergies and preferences",
      "Swap options for every meal",
    ],
  },
  training: {
    name: "Workout plan",
    shortName: "Training",
    tagline: "Stronger and more toned, at home or at the gym.",
    features: [
      "Plan for home or the gym",
      "Built up over 4 weeks (progression)",
      "Sets, reps and rest times",
      "Clear instructions for every exercise",
      "Takes injuries and level into account",
    ],
  },
  bundel: {
    name: "Bundle: Nutrition + Training",
    shortName: "Bundle",
    tagline: "Nutrition and training that reinforce each other.",
    features: [
      "Everything in the nutrition plan",
      "Everything in the workout plan",
      "Nutrition and training aligned",
      "Extra protein advice on training days",
      "Biggest saving compared to buying separately",
    ],
  },
};

const durationTextEn: Record<DurationId, Pick<Duration, "label" | "badge">> = {
  "1m": { label: "1 month" },
  "3m": { label: "3 months", badge: "Popular" },
  "6m": { label: "6 months" },
  "12m": { label: "12 months", badge: "Best value" },
  eenmalig: { label: "One-off" },
};

/** Een product met teksten in de gegeven taal. */
export function productFor(id: ProductId, l: Locale = "nl"): Product {
  return l === "en" ? { ...products[id], ...productTextEn[id] } : products[id];
}

/** Alle producten met teksten in de gegeven taal. */
export function productsFor(l: Locale = "nl"): Record<ProductId, Product> {
  return l === "en" ? { voeding: productFor("voeding", l), training: productFor("training", l), bundel: productFor("bundel", l) } : products;
}

/** Een looptijd met teksten in de gegeven taal. */
export function durationFor(id: DurationId, l: Locale = "nl"): Duration {
  return l === "en" ? { ...durations[id], ...durationTextEn[id] } : durations[id];
}

export const SUBSCRIPTION_DURATIONS: SubscriptionDurationId[] = ["1m", "3m", "6m", "12m"];

/**
 * Prijs per maand (in centen) per product en minimale looptijd. Abonnementen
 * worden altijd per maand afgeschreven (SEPA-incasso); een langere minimale
 * looptijd geeft een lagere maandprijs. Voor "eenmalig" is dit de prijs van
 * één los schema (4 weken, geen abonnement).
 */
export const monthlyPrices: Record<ProductId, Record<DurationId, number>> = {
  voeding: { "1m": 1495, "3m": 1195, "6m": 1095, "12m": 995, eenmalig: 2295 },
  training: { "1m": 1395, "3m": 1095, "6m": 995, "12m": 895, eenmalig: 1995 },
  bundel: { "1m": 2195, "3m": 1795, "6m": 1595, "12m": 1395, eenmalig: 3295 },
};

export const DEFAULT_PRODUCT: ProductId = "bundel";
export const DEFAULT_DURATION: DurationId = "3m";

export function isProductId(v: unknown): v is ProductId {
  return typeof v === "string" && (PRODUCT_IDS as readonly string[]).includes(v);
}

export function isDurationId(v: unknown): v is DurationId {
  return typeof v === "string" && (DURATION_IDS as readonly string[]).includes(v);
}

export function isSubscription(duration: DurationId): duration is SubscriptionDurationId {
  return duration !== "eenmalig";
}

/** Prijs per maand in centen (of de losse prijs bij eenmalig). */
export function monthlyPrice(product: ProductId, duration: DurationId): number {
  return monthlyPrices[product][duration];
}

/** Wat een abonnement minimaal kost over de hele minimale looptijd (of de losse prijs). */
export function commitmentTotal(product: ProductId, duration: DurationId): number {
  const d = durations[duration];
  return d.months === 0 ? monthlyPrice(product, duration) : monthlyPrice(product, duration) * d.months;
}

/** De laagste maandprijs op de hele site, voor "vanaf"-teksten. */
export function lowestMonthlyPrice(): number {
  return Math.min(...PRODUCT_IDS.flatMap((p) => SUBSCRIPTION_DURATIONS.map((d) => monthlyPrice(p, d))));
}

/** Besparing in procenten t.o.v. het maandabonnement (afgerond). */
export function savingsPercent(product: ProductId, duration: DurationId): number {
  if (!isSubscription(duration) || duration === "1m") return 0;
  const base = monthlyPrice(product, "1m");
  return Math.round(((base - monthlyPrice(product, duration)) / base) * 100);
}

/** Wat de bundel per maand scheelt t.o.v. voeding + training los. */
export function bundleSavings(duration: DurationId): number {
  return monthlyPrice("voeding", duration) + monthlyPrice("training", duration) - monthlyPrice("bundel", duration);
}

/** Bedrag in centen na toepassing van een kortingspercentage, op hele centen afgerond. */
export function applyPercentOff(cents: number, percentOff: number): number {
  return Math.round(cents * (1 - percentOff / 100));
}

/** Hoogste besparing (in procenten) van een langere looptijd t.o.v. per maand. */
export function maxSavingsPercent(): number {
  return Math.max(...PRODUCT_IDS.flatMap((p) => SUBSCRIPTION_DURATIONS.map((d) => savingsPercent(p, d))));
}

export function billingDescription(duration: DurationId, l: Locale = "nl"): string {
  const d = durations[duration];
  if (l === "en") {
    if (d.months === 0) return "One-off payment, no subscription";
    if (d.months === 1) return "Monthly by direct debit, cancel monthly";
    return `Monthly by direct debit, minimum ${d.months} months`;
  }
  if (d.months === 0) return "Eenmalige betaling, geen abonnement";
  if (d.months === 1) return "Maandelijks via automatische incasso, maandelijks opzegbaar";
  return `Maandelijks via automatische incasso, minimaal ${d.months} maanden`;
}

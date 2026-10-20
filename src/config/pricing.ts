/**
 * Producten, looptijden en prijzen.
 *
 * Dit bestand is de enige bron van waarheid voor prijzen: de website, de
 * Stripe-checkout en de juridische teksten lezen allemaal hieruit. Stripe-
 * producten en -prijzen worden bij de eerste bestelling automatisch
 * aangemaakt (zie src/lib/stripe.ts). Pas je hier een bedrag aan, dan wordt
 * er automatisch een nieuwe Stripe-prijs gebruikt voor nieuwe klanten.
 *
 * Alle bedragen zijn in eurocenten, inclusief 21% btw.
 */

export const PRODUCT_IDS = ["voeding", "training", "bundel"] as const;
export type ProductId = (typeof PRODUCT_IDS)[number];

export const DURATION_IDS = ["1m", "3m", "6m", "12m", "eenmalig"] as const;
export type DurationId = (typeof DURATION_IDS)[number];
export type SubscriptionDurationId = Exclude<DurationId, "eenmalig">;

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
    tagline: "De snelste route naar blijvend resultaat.",
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

export const SUBSCRIPTION_DURATIONS: SubscriptionDurationId[] = ["1m", "3m", "6m", "12m"];

/**
 * Prijs per maand (in centen) per product en minimale looptijd. Abonnementen
 * worden altijd per maand afgeschreven (SEPA-incasso); een langere minimale
 * looptijd geeft een lagere maandprijs. Voor "eenmalig" is dit de prijs van
 * één los schema (4 weken, geen abonnement).
 */
export const monthlyPrices: Record<ProductId, Record<DurationId, number>> = {
  voeding: { "1m": 1295, "3m": 995, "6m": 895, "12m": 795, eenmalig: 1995 },
  training: { "1m": 1195, "3m": 895, "6m": 795, "12m": 695, eenmalig: 1795 },
  bundel: { "1m": 1795, "3m": 1395, "6m": 1195, "12m": 995, eenmalig: 2795 },
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

export function billingDescription(duration: DurationId): string {
  const d = durations[duration];
  if (d.months === 0) return "Eenmalige betaling, geen abonnement";
  if (d.months === 1) return "Maandelijks via automatische incasso, maandelijks opzegbaar";
  return `Maandelijks via automatische incasso, minimaal ${d.months} maanden`;
}

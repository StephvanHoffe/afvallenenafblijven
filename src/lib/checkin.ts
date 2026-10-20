import { site } from "@/config/site";
import { isSubscription, type DurationId } from "@/config/pricing";
import type { Intake } from "@/lib/intake";
import { formatNumber } from "@/lib/format";

/**
 * De check-in is verplicht voor elk vervolgschema. Elke periode duurt
 * site.planIntervalDays dagen; een paar dagen voor het einde opent de
 * check-in. Pas als de klant hem invult, maken we het schema voor de volgende
 * periode, afgestemd op de antwoorden.
 */

const DAY = 24 * 60 * 60 * 1000;

export const checkinOptions = {
  energy: ["Laag", "Gemiddeld", "Goed"],
  sleep: ["Slecht", "Matig", "Goed"],
  nutritionAdherence: ["Bijna altijd (90% of meer)", "Meestal (70-90%)", "Soms (50-70%)", "Weinig (minder dan 50%)"],
  hunger: ["Vaak", "Soms", "Bijna nooit"],
  trainingAdherence: ["Alle trainingen", "De meeste", "Ongeveer de helft", "Weinig of geen"],
  difficulty: ["Te zwaar", "Precies goed", "Te licht"],
} as const;

export interface CheckinData {
  weightKg?: number;
  waistCm?: number;
  goal?: Intake["goal"];
  energy?: string;
  sleep?: string;
  /** Voeding */
  nutritionAdherence?: string;
  hunger?: string;
  likedMeals?: string;
  dislikedMeals?: string;
  /** Training */
  trainingAdherence?: string;
  difficulty?: string;
  trainingDays?: number;
  injuries?: string;
  comments?: string;
}

export type CheckinStatus = "upcoming" | "open" | "overdue" | "submitted";

export interface CheckinWindow {
  /** De periode waarvoor deze check-in het nieuwe schema maakt. */
  seq: number;
  status: CheckinStatus;
  opensAt: Date;
  dueAt: Date;
}

/**
 * Bepaalt de check-in van een abonnement: wanneer hij opent en of hij al is
 * ingevuld. Geeft null als er geen check-in (meer) nodig is, bijvoorbeeld bij
 * een los schema, een mislukte betaling of een abonnement dat eindigt.
 */
export function checkinWindow(input: {
  duration: DurationId;
  status: string;
  cancelAt: Date | null;
  /** Hoogste periode met schema's, 0 als er nog geen zijn. */
  lastSeq: number;
  /** Moment waarop die periode begon (de schema's werden aangemaakt). */
  lastPeriodStart: Date | null;
  submittedForNext: boolean;
  now: number;
}): CheckinWindow | null {
  if (!isSubscription(input.duration) || input.status !== "active" || !input.lastPeriodStart || input.lastSeq < 1) {
    return null;
  }
  const dueAt = new Date(new Date(input.lastPeriodStart).getTime() + site.planIntervalDays * DAY);
  const opensAt = new Date(dueAt.getTime() - site.checkin.opensDaysBefore * DAY);
  // Eindigt het abonnement rond het einde van deze periode, dan volgt er geen nieuwe meer.
  if (input.cancelAt && new Date(input.cancelAt).getTime() <= dueAt.getTime() + 3 * DAY) return null;
  const status: CheckinStatus = input.submittedForNext
    ? "submitted"
    : input.now < opensAt.getTime()
      ? "upcoming"
      : input.now < dueAt.getTime()
        ? "open"
        : "overdue";
  return { seq: input.lastSeq + 1, status, opensAt, dueAt };
}

const goodAdherence = (value?: string) =>
  value === checkinOptions.nutritionAdherence[0] || value === checkinOptions.nutritionAdherence[1];

/**
 * Stelt het caloriedoel bij op basis van de gewichtsverandering ten opzichte
 * van wat we hadden verwacht. Bewust in kleine stappen (100 kcal) en alleen
 * als de klant het schema goed heeft gevolgd; anders ligt het niet aan de
 * hoeveelheid, maar aan de haalbaarheid.
 */
export function calorieAdjustment(input: {
  expectedKgPerWeek: number;
  fromKg: number;
  toKg: number;
  weeks: number;
  checkin: CheckinData;
}): { kcal: number; reason: string } | null {
  const { expectedKgPerWeek: expected, fromKg, toKg, weeks, checkin } = input;
  if (weeks < 2 || !Number.isFinite(fromKg) || !Number.isFinite(toKg)) return null;
  const change = toKg - fromKg;
  const rate = change / weeks;
  const kg = (n: number) => `${formatNumber(Math.abs(n), 1)} kg`;
  const tired = checkin.hunger === "Vaak" && checkin.energy === "Laag";

  if (expected < -0.05) {
    // Afvallen
    if (goodAdherence(checkin.nutritionAdherence) && rate > expected * 0.5) {
      return {
        kcal: -100,
        reason:
          change >= 0
            ? `Je gewicht daalde niet terwijl je het schema goed volgde. Daarom eet je nu 100 kcal per dag minder.`
            : `Je viel ${kg(change)} af, minder dan verwacht (${kg(expected * weeks)}), terwijl je het schema goed volgde. Daarom eet je nu 100 kcal per dag minder.`,
      };
    }
    if (rate < expected * 1.6 || tired) {
      return {
        kcal: 100,
        reason: tired
          ? "Je had vaak honger en weinig energie. Daarom eet je nu 100 kcal per dag meer, zodat je het goed volhoudt."
          : `Je viel ${kg(change)} af, sneller dan gepland. Daarom eet je nu 100 kcal per dag meer, zodat je spieren behoudt en het volhoudt.`,
      };
    }
    return null;
  }
  if (expected > 0.05) {
    // Sterker worden (klein overschot)
    if (goodAdherence(checkin.nutritionAdherence) && rate < 0.05) {
      return { kcal: 100, reason: "Je gewicht bleef gelijk terwijl je wilt opbouwen. Daarom eet je nu 100 kcal per dag meer." };
    }
    if (rate > 0.4) {
      return { kcal: -100, reason: `Je kwam ${kg(change)} aan, sneller dan nodig. Daarom eet je nu 100 kcal per dag minder.` };
    }
    return null;
  }
  // Op gewicht blijven
  if (rate > 0.2) {
    return { kcal: -100, reason: `Je kwam ${kg(change)} aan. Daarom eet je nu 100 kcal per dag minder, zodat je op gewicht blijft.` };
  }
  if (rate < -0.2) {
    return { kcal: 100, reason: `Je viel nog ${kg(change)} af. Daarom eet je nu 100 kcal per dag meer, zodat je op gewicht blijft.` };
  }
  return null;
}

/** Totale bijstelling blijft binnen deze grenzen, zodat het schema verantwoord blijft. */
export const MAX_CALORIE_OFFSET = 300;

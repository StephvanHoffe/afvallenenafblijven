import { isSubscription, type DurationId } from "@/config/pricing";
import type { Intake } from "@/lib/intake";
import { formatNumber } from "@/lib/format";
import { defineCopy, type Locale } from "@/i18n/config";
import { checkinLabel, intakeLabels } from "@/i18n/options";
import { checkinAdvisedBy, checkinOpensAt, nextPeriodStart } from "@/lib/schedule";

/**
 * De check-in is verplicht voor elk vervolgschema. Elke vervolgperiode start op
 * een maandag; de check-in opent op de donderdag ervoor (zie src/lib/schedule.ts).
 * Pas als de klant hem invult, maken we het schema voor de volgende periode,
 * afgestemd op de antwoorden. Dat schema start op de maandag (of meteen, als
 * de check-in te laat is).
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
  /** Uiterlijk deze dag invullen, dan staat het nieuwe schema op tijd klaar voor de boodschappen. */
  advisedBy: Date;
  /** Start van de nieuwe periode (een maandag). */
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
  /** Moment waarop die periode begon (of begint, als het schema al klaarstaat). */
  lastPeriodStart: Date | null;
  submittedForNext: boolean;
  now: number;
}): CheckinWindow | null {
  if (!isSubscription(input.duration) || input.status !== "active" || !input.lastPeriodStart || input.lastSeq < 1) {
    return null;
  }
  const dueAt = nextPeriodStart(new Date(input.lastPeriodStart));
  const opensAt = checkinOpensAt(dueAt);
  // Eindigt het abonnement rond het einde van deze periode, dan volgt er geen nieuwe meer.
  if (input.cancelAt && new Date(input.cancelAt).getTime() <= dueAt.getTime() + 3 * DAY) return null;
  const status: CheckinStatus = input.submittedForNext
    ? "submitted"
    : input.now < opensAt.getTime()
      ? "upcoming"
      : input.now < dueAt.getTime()
        ? "open"
        : "overdue";
  return { seq: input.lastSeq + 1, status, opensAt, advisedBy: checkinAdvisedBy(dueAt), dueAt };
}

const goodAdherence = (value?: string) =>
  value === checkinOptions.nutritionAdherence[0] || value === checkinOptions.nutritionAdherence[1];

/** Uitleg bij een bijstelling van het caloriedoel, in de taal van de klant. */
const adjustmentCopy = defineCopy({
  nl: {
    notLosing: "Je gewicht daalde niet terwijl je het schema goed volgde. Daarom eet je nu 100 kcal per dag minder.",
    slowLoss: (lost: string, expected: string) =>
      `Je viel ${lost} af, minder dan verwacht (${expected}), terwijl je het schema goed volgde. Daarom eet je nu 100 kcal per dag minder.`,
    tired: "Je had vaak honger en weinig energie. Daarom eet je nu 100 kcal per dag meer, zodat je het goed volhoudt.",
    fastLoss: (lost: string) =>
      `Je viel ${lost} af, sneller dan gepland. Daarom eet je nu 100 kcal per dag meer, zodat je spieren behoudt en het volhoudt.`,
    notGaining: "Je gewicht bleef gelijk terwijl je wilt opbouwen. Daarom eet je nu 100 kcal per dag meer.",
    fastGain: (gained: string) => `Je kwam ${gained} aan, sneller dan nodig. Daarom eet je nu 100 kcal per dag minder.`,
    maintainGain: (gained: string) => `Je kwam ${gained} aan. Daarom eet je nu 100 kcal per dag minder, zodat je op gewicht blijft.`,
    maintainLoss: (lost: string) => `Je viel nog ${lost} af. Daarom eet je nu 100 kcal per dag meer, zodat je op gewicht blijft.`,
  },
  en: {
    notLosing: "Your weight didn't go down, even though you followed the plan well. So you'll now eat 100 kcal less per day.",
    slowLoss: (lost: string, expected: string) =>
      `You lost ${lost}, less than expected (${expected}), even though you followed the plan well. So you'll now eat 100 kcal less per day.`,
    tired: "You were often hungry and low on energy. So you'll now eat 100 kcal more per day, to help you keep it up.",
    fastLoss: (lost: string) =>
      `You lost ${lost}, faster than planned. So you'll now eat 100 kcal more per day, to help you keep your muscle and keep it up.`,
    notGaining: "Your weight stayed the same while you want to build muscle. So you'll now eat 100 kcal more per day.",
    fastGain: (gained: string) => `You gained ${gained}, faster than needed. So you'll now eat 100 kcal less per day.`,
    maintainGain: (gained: string) => `You gained ${gained}. So you'll now eat 100 kcal less per day, to help you maintain your weight.`,
    maintainLoss: (lost: string) => `You lost another ${lost}. So you'll now eat 100 kcal more per day, to help you maintain your weight.`,
  },
});

/**
 * Stelt het caloriedoel bij op basis van de gewichtsverandering ten opzichte
 * van wat we hadden verwacht. Bewust in kleine stappen (100 kcal) en alleen
 * als de klant het schema goed heeft gevolgd; anders ligt het niet aan de
 * hoeveelheid, maar aan de haalbaarheid.
 */
export function calorieAdjustment(
  input: {
    expectedKgPerWeek: number;
    fromKg: number;
    toKg: number;
    weeks: number;
    checkin: CheckinData;
    /** Minimale meetperiode in weken; korter is te onbetrouwbaar door schommelingen. */
    minWeeks?: number;
  },
  l: Locale = "nl",
): { kcal: number; reason: string } | null {
  const { expectedKgPerWeek: expected, fromKg, toKg, weeks, checkin, minWeeks = 2 } = input;
  if (weeks < minWeeks || !Number.isFinite(fromKg) || !Number.isFinite(toKg)) return null;
  const c = adjustmentCopy[l];
  const change = toKg - fromKg;
  const rate = change / weeks;
  const kg = (n: number) => `${formatNumber(Math.abs(n), 1, l)} kg`;
  const tired = checkin.hunger === "Vaak" && checkin.energy === "Laag";

  if (expected < -0.05) {
    // Afvallen
    if (goodAdherence(checkin.nutritionAdherence) && rate > expected * 0.5) {
      return {
        kcal: -100,
        reason: change >= 0 ? c.notLosing : c.slowLoss(kg(change), kg(expected * weeks)),
      };
    }
    if (rate < expected * 1.6 || tired) {
      return {
        kcal: 100,
        reason: tired ? c.tired : c.fastLoss(kg(change)),
      };
    }
    return null;
  }
  if (expected > 0.05) {
    // Sterker worden (klein overschot)
    if (goodAdherence(checkin.nutritionAdherence) && rate < 0.05) {
      return { kcal: 100, reason: c.notGaining };
    }
    if (rate > 0.4) {
      return { kcal: -100, reason: c.fastGain(kg(change)) };
    }
    return null;
  }
  // Op gewicht blijven
  if (rate > 0.2) {
    return { kcal: -100, reason: c.maintainGain(kg(change)) };
  }
  if (rate < -0.2) {
    return { kcal: 100, reason: c.maintainLoss(kg(change)) };
  }
  return null;
}

/** Totale bijstelling blijft binnen deze grenzen, zodat het schema verantwoord blijft. */
export const MAX_CALORIE_OFFSET = 300;

const describeCopy = defineCopy({
  nl: {
    weight: "Gewicht",
    waist: "Taille",
    energy: "Energie",
    sleep: "Slaap",
    nutritionAdherence: "Voeding gevolgd",
    hunger: "Honger",
    likedMeals: "Vond je lekker",
    dislikedMeals: "Wil je anders",
    trainingAdherence: "Trainingen gedaan",
    difficulty: "Zwaarte",
    trainingDays: "Trainingsdagen",
    injuries: "Klachten",
    goal: "Nieuw doel",
    comments: "Opmerkingen",
    kg: (kg: number) => `${String(kg).replace(".", ",")} kg`,
    perWeek: (days: number) => `${days}x per week`,
  },
  en: {
    weight: "Weight",
    waist: "Waist",
    energy: "Energy",
    sleep: "Sleep",
    nutritionAdherence: "Nutrition plan followed",
    hunger: "Hunger",
    likedMeals: "What you enjoyed",
    dislikedMeals: "What you'd like to change",
    trainingAdherence: "Workouts done",
    difficulty: "Difficulty",
    trainingDays: "Training days",
    injuries: "Aches or injuries",
    goal: "New goal",
    comments: "Comments",
    kg: (kg: number) => `${String(kg)} kg`,
    perWeek: (days: number) => `${days} ${days === 1 ? "day" : "days"} a week`,
  },
});

/** Check-in-antwoorden als leesbare regels (alleen ingevulde velden). */
export function describeCheckin(c: CheckinData, l: Locale = "nl"): [string, string][] {
  const t = describeCopy[l];
  const answer = (v?: string) => (v ? checkinLabel(l, v) : v);
  const rows: [string, string | number | undefined][] = [
    [t.weight, c.weightKg ? t.kg(c.weightKg) : undefined],
    [t.waist, c.waistCm ? `${c.waistCm} cm` : undefined],
    [t.energy, answer(c.energy)],
    [t.sleep, answer(c.sleep)],
    [t.nutritionAdherence, answer(c.nutritionAdherence)],
    [t.hunger, answer(c.hunger)],
    [t.likedMeals, c.likedMeals],
    [t.dislikedMeals, c.dislikedMeals],
    [t.trainingAdherence, answer(c.trainingAdherence)],
    [t.difficulty, answer(c.difficulty)],
    [t.trainingDays, c.trainingDays ? t.perWeek(c.trainingDays) : undefined],
    [t.injuries, c.injuries],
    [t.goal, c.goal ? (intakeLabels(l).goal[c.goal]?.label ?? c.goal) : undefined],
    [t.comments, c.comments],
  ];
  return rows.filter((r): r is [string, string | number] => r[1] !== undefined && r[1] !== "").map(([k, v]) => [k, String(v)]);
}

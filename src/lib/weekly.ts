import type { DurationId } from "@/config/pricing";
import { calorieAdjustment, MAX_CALORIE_OFFSET, type CheckinData } from "@/lib/checkin";
import { defineCopy, type Locale } from "@/i18n/config";
import { checkinOpensAt, nextPeriodStart, shiftDays } from "@/lib/schedule";

/**
 * Het wekelijkse weegmoment. Tussen twee check-ins kan de klant elke week
 * zijn gewicht en een paar korte vragen invullen. Wijkt het verloop af, dan
 * sturen we het lopende schema meteen bij: iets meer of minder calorieën, of
 * zwaarder of lichter trainen. Een nieuw schema volgt pas na de check-in.
 *
 * Een periode duurt 4 weken en start op maandag. Er zijn drie weegmomenten,
 * rond de maandagen in de periode. Elk weegmoment opent op de zaterdag ervoor,
 * zodat een bijsturing op tijd is voor de boodschappen van de week erna. Het
 * laatste sluit als de check-in opent (donderdag).
 */

const DAY = 24 * 60 * 60 * 1000;
export const WEEKLY_MOMENTS = 3;

export interface WeeklyData {
  weightKg: number;
  waistCm?: number;
  energy?: string;
  hunger?: string;
  nutritionAdherence?: string;
  trainingAdherence?: string;
  difficulty?: string;
  comments?: string;
}

export type TrainingDirection = "zwaarder" | "lichter" | "eenvoudiger";

/** Wat we na een weegmoment hebben aangepast. */
export interface WeeklyAdjustment {
  /** Kcal per dag erbij (+) of eraf (-); 0 als de calorieën gelijk blijven. */
  kcal: number;
  /** Caloriedoel per dag na deze aanpassing (alleen bij voeding). */
  calories?: number;
  nutritionReason?: string;
  training?: TrainingDirection;
  trainingReason?: string;
  /** Concrete aanwijzingen (door Claude, of een vaste terugvaltekst). */
  nutrition?: { summary: string; swaps: { meal: string; change: string; kcal: number }[] };
  trainingPlan?: { summary: string; changes: { exercise: string; change: string }[] };
  /** Korte uitleg voor de klant. */
  message: string;
}

export interface WeeklyLog {
  seq: number;
  week: number;
  date: Date;
  data: WeeklyData;
  adjustment: WeeklyAdjustment | null;
  /** "pending" zolang de aanwijzingen nog worden gemaakt. */
  status: string;
}

export interface WeeklyWindow {
  seq: number;
  /** Het weegmoment (1-3) dat nu open is, of het eerstvolgende. */
  week: number;
  status: "open" | "done" | "upcoming";
  opensAt: Date;
  closesAt: Date;
}

/**
 * Weegmoment `week` (1-3) rond de maandag 3, 2 of 1 week voor het einde van
 * de periode. Null als die maandag te dicht op de start ligt (een korte eerste periode).
 */
function momentBounds(start: number, week: number) {
  const end = nextPeriodStart(new Date(start));
  const monday = shiftDays(end, -7 * (WEEKLY_MOMENTS + 1 - week));
  if (monday.getTime() < start + 5 * DAY) return null;
  const opens = shiftDays(monday, -2).getTime();
  // Een week later dicht, en het laatste weegmoment zodra de check-in opent.
  const closes = Math.min(shiftDays(monday, 5).getTime(), checkinOpensAt(end).getTime());
  return { opens, closes };
}

/**
 * Bepaalt welk weegmoment nu open is (of als volgende komt) voor de lopende
 * periode van een bestelling. Ook bij een los schema kan de klant wekelijks
 * bijsturen, zolang de periode loopt.
 */
export function weeklyWindow(input: {
  duration: DurationId;
  status: string;
  lastSeq: number;
  lastPeriodStart: Date | null;
  loggedWeeks: number[];
  now: number;
}): WeeklyWindow | null {
  if (!input.lastPeriodStart || input.lastSeq < 1) return null;
  const active = input.duration === "eenmalig" ? input.status === "completed" || input.status === "active" : input.status === "active";
  if (!active) return null;
  const start = new Date(input.lastPeriodStart).getTime();
  for (let week = 1; week <= WEEKLY_MOMENTS; week++) {
    const bounds = momentBounds(start, week);
    if (!bounds) continue;
    const { opens, closes } = bounds;
    if (input.now >= closes) continue;
    const status = input.now < opens ? "upcoming" : input.loggedWeeks.includes(week) ? "done" : "open";
    if (status === "done") {
      // Dit weegmoment is al ingevuld; toon het volgende (of niets als dit het laatste was).
      if (week === WEEKLY_MOMENTS) return { seq: input.lastSeq, week, status, opensAt: new Date(opens), closesAt: new Date(closes) };
      continue;
    }
    return { seq: input.lastSeq, week, status, opensAt: new Date(opens), closesAt: new Date(closes) };
  }
  return null;
}

export const isLowTrainingAdherence = (v?: string) => v === "Ongeveer de helft" || v === "Weinig of geen";

/** Uitleg bij de bijsturing na een weegmoment, in de taal van de klant. */
const decisionCopy = defineCopy({
  nl: {
    tired: "Je had vaak honger en weinig energie. Daarom eet je nu 100 kcal per dag meer, zodat je het goed volhoudt.",
    harder: "Je vond de trainingen te licht. Daarom maken we ze iets zwaarder.",
    lighter: "Je vond de trainingen te zwaar. Daarom maken we ze iets lichter, zodat je met goede techniek kunt trainen.",
    simpler: "Het lukte niet om alle trainingen te doen. Daarom maken we ze korter en eenvoudiger, zodat ze beter in je week passen.",
    adjusted: "We hebben je schema voor de rest van deze periode bijgestuurd.",
    onTrack: "Je ligt op koers. Je schema blijft zoals het is; ga zo door!",
  },
  en: {
    tired: "You were often hungry and low on energy. So you'll now eat 100 kcal more per day, to help you keep it up.",
    harder: "You found the workouts too easy. So we're making them a little harder.",
    lighter: "You found the workouts too hard. So we're making them a little lighter, so you can train with good technique.",
    simpler: "You weren't able to do all the workouts. So we're making them shorter and simpler, so they fit into your week better.",
    adjusted: "We've adjusted your plan for the rest of this period.",
    onTrack: "You're on track. Your plan stays as it is; keep it up!",
  },
});

/** Korte omschrijving van een bijsturing van de training, bijv. "zwaarder" of "harder". */
export function trainingDirectionLabel(direction: TrainingDirection, l: Locale = "nl"): string {
  return l === "en" ? { zwaarder: "harder", lichter: "lighter", eenvoudiger: "simpler" }[direction] : direction;
}

/**
 * Beslist met vaste regels of het schema na dit weegmoment wordt bijgestuurd.
 * Calorieën: pas na ongeveer twee weken sinds het begin van de periode (of
 * sinds de vorige aanpassing), omdat het gewicht van week tot week
 * schommelt. Uitzondering: veel honger en weinig energie.
 */
export function decideWeeklyAdjustment(
  input: {
    nutrition: boolean;
    training: boolean;
    expectedKgPerWeek: number;
    /** Gewicht en moment waarop we het laatst hebben gekeken (start periode of vorige aanpassing). */
    reference: { kg: number; at: Date };
    data: WeeklyData;
    now: number;
    /** Caloriedoel zoals het nu is (schema plus eerdere aanpassingen). */
    calories: number;
    /** Totale bijstelling tot nu toe, ten opzichte van de berekening. */
    totalOffset: number;
    minCalories: number;
    /** Is er deze periode al een keer verhoogd vanwege honger? */
    raisedForHunger: boolean;
  },
  l: Locale = "nl",
): Pick<WeeklyAdjustment, "kcal" | "calories" | "nutritionReason" | "training" | "trainingReason" | "message"> {
  const c = decisionCopy[l];
  let kcal = 0;
  let nutritionReason: string | undefined;
  if (input.nutrition) {
    const weeks = (input.now - new Date(input.reference.at).getTime()) / (7 * DAY);
    const decision =
      weeks >= 1.5
        ? calorieAdjustment(
            {
              expectedKgPerWeek: input.expectedKgPerWeek,
              fromKg: input.reference.kg,
              toKg: input.data.weightKg,
              weeks,
              checkin: input.data as CheckinData,
              minWeeks: 1.5,
            },
            l,
          )
        : input.data.hunger === "Vaak" && input.data.energy === "Laag" && !input.raisedForHunger
          ? { kcal: 100, reason: c.tired }
          : null;
    if (decision) {
      const capped = Math.max(-MAX_CALORIE_OFFSET, Math.min(MAX_CALORIE_OFFSET, input.totalOffset + decision.kcal)) - input.totalOffset;
      const floor = Math.max(capped, input.minCalories - input.calories);
      if (floor !== 0) {
        kcal = floor;
        nutritionReason = decision.reason.replace("100 kcal", `${Math.abs(floor)} kcal`);
      }
    }
  }

  let training: TrainingDirection | undefined;
  let trainingReason: string | undefined;
  if (input.training) {
    if (input.data.difficulty === "Te licht") {
      training = "zwaarder";
      trainingReason = c.harder;
    } else if (input.data.difficulty === "Te zwaar") {
      training = "lichter";
      trainingReason = c.lighter;
    } else if (isLowTrainingAdherence(input.data.trainingAdherence)) {
      training = "eenvoudiger";
      trainingReason = c.simpler;
    }
  }

  const message = kcal || training ? c.adjusted : c.onTrack;
  return { kcal, calories: input.nutrition ? input.calories + kcal : undefined, nutritionReason, training, trainingReason, message };
}

/** Totale kcal-bijstelling van de weegmomenten in een periode. */
export function weeklyKcal(logs: Pick<WeeklyLog, "adjustment">[]): number {
  return logs.reduce((sum, l) => sum + (l.adjustment?.kcal ?? 0), 0);
}

/** Een bijsturing zoals die bij een schema hoort (voeding of training). */
export type PlanAdjustment = WeeklyAdjustment & { week: number; date: Date; pending: boolean };

/** De bijsturingen uit de weegmomenten van één periode die voor dit soort schema gelden. */
export function adjustmentsFor(
  logs: Pick<WeeklyLog, "seq" | "week" | "date" | "adjustment" | "status">[],
  seq: number,
  type: "voeding" | "training",
): PlanAdjustment[] {
  return logs
    .filter((l) => l.seq === seq && l.adjustment && (type === "voeding" ? l.adjustment.kcal !== 0 : Boolean(l.adjustment.training)))
    .map((l) => ({ ...l.adjustment!, week: l.week, date: l.date, pending: l.status !== "ready" }));
}

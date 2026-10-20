import { defineCopy, intlLocale, type Locale } from "@/i18n/config";
import { formatNumber } from "@/lib/format";
import { adherenceAnswer, latestScaleWeight, summarizeActivity } from "@/lib/health/insights";
import { sourceName, type HealthView } from "@/lib/health/view";

/** Voorstel om een formulier alvast mee in te vullen, met de herkomst erbij. */
export interface FormSuggestion {
  weightKg?: number;
  weightNote?: string;
  /** Een (Nederlandse) waarde uit checkinOptions.trainingAdherence. */
  trainingAdherence?: string;
  trainingNote?: string;
}

const DAY = 24 * 60 * 60 * 1000;

const copy = defineCopy({
  nl: {
    weight: (source: string, day: string) => `Overgenomen uit ${source} (gewogen op ${day}). Klopt het niet? Pas het gerust aan.`,
    training: (source: string, done: number, planned: number, period: string) =>
      `Volgens ${source}: ${done} van ${planned} trainingen ${period}. Pas het aan als je zonder horloge of app trainde.`,
    week: "de afgelopen week",
    period: "deze periode",
    yourApp: "je app",
  },
  en: {
    weight: (source: string, day: string) => `Taken from ${source} (weighed on ${day}). Not right? Feel free to change it.`,
    training: (source: string, done: number, planned: number, period: string) =>
      `According to ${source}: ${done} of ${planned} workouts ${period}. Change it if you trained without your watch or app.`,
    week: "in the past week",
    period: "this period",
    yourApp: "your app",
  },
});

/**
 * Wat we uit de gekoppelde apps alvast kunnen invullen bij het weegmoment
 * (afgelopen week) of de check-in (hele periode).
 */
export function healthSuggestion(health: HealthView | null, l: Locale, scope: "week" | "period", periodStart: Date | null): FormSuggestion | undefined {
  if (!health || health.connections.length === 0) return undefined;
  const c = copy[l];
  const now = new Date(health.now);
  const out: FormSuggestion = {};

  const scale = latestScaleWeight(health.days, now, scope === "week" ? 3 : 4);
  if (scale) {
    const day = new Intl.DateTimeFormat(intlLocale(l), { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${scale.day}T12:00:00Z`));
    out.weightKg = scale.kg;
    out.weightNote = c.weight(sourceName(scale.source), day);
  }

  if (health.plannedPerWeek) {
    const from = scope === "week" || !periodStart ? new Date(now.getTime() - 7 * DAY) : new Date(periodStart);
    const summary = summarizeActivity(health.days, health.workouts, from, now, health.plannedPerWeek);
    const answer = adherenceAnswer(summary.adherence);
    if (answer && summary.plannedWorkouts) {
      const sources = [...new Set(health.connections.flatMap((x) => x.sources))].filter((s) => s !== "withings").map(sourceName);
      out.trainingAdherence = answer;
      out.trainingNote = c.training(sources.join(", ") || c.yourApp, summary.workouts, summary.plannedWorkouts, scope === "week" ? c.week : c.period);
    }
  }
  return out.weightKg !== undefined || out.trainingAdherence ? out : undefined;
}

/** Gewicht zoals het in het invoerveld hoort (komma in het Nederlands). */
export function weightInputValue(kg: number, l: Locale): string {
  return l === "en" ? String(Math.round(kg * 10) / 10) : formatNumber(kg, 1, "nl").replace(/\./g, "");
}

/**
 * Gezondheidsdata uit gekoppelde apps. We halen alleen op wat we gebruiken:
 * stappen, actieve calorieën en minuten, trainingen en gewicht.
 */

export const HEALTH_PROVIDERS = ["withings", "junction"] as const;
export type HealthProvider = (typeof HEALTH_PROVIDERS)[number];

export function isHealthProvider(v: unknown): v is HealthProvider {
  return typeof v === "string" && (HEALTH_PROVIDERS as readonly string[]).includes(v);
}

/** Eén dag uit één koppeling. Ontbrekende waarden zijn null (niet gemeten). */
export interface HealthDay {
  /** YYYY-MM-DD */
  day: string;
  /** De app of het apparaat waar de waarde vandaan komt, bijv. "garmin" of "apple_health_kit". */
  source: string;
  steps: number | null;
  activeKcal: number | null;
  activeMinutes: number | null;
  weightKg: number | null;
  /** Bron van het gewicht, als die anders is dan die van de stappen (bijv. een weegschaal). */
  weightSource?: string;
}

/** Soort training, zo grof dat we hem in beide talen kunnen tonen. */
export const WORKOUT_KINDS = ["kracht", "hardlopen", "wandelen", "fietsen", "zwemmen", "cardio", "yoga", "sport", "overig"] as const;
export type WorkoutKind = (typeof WORKOUT_KINDS)[number];

export interface HealthWorkout {
  /** Id bij de aanbieder, uniek per koppeling. */
  id: string;
  source: string;
  startedAt: Date;
  minutes: number;
  kcal: number | null;
  sport: WorkoutKind;
}

export interface HealthConnection {
  id: string;
  customer_id: string;
  provider: HealthProvider;
  external_user_id: string | null;
  /** Versleuteld (zie crypto.ts). */
  access_token: string | null;
  refresh_token: string | null;
  expires_at: Date | null;
  /** Bij Junction: de aangesloten bronnen (apple_health_kit, garmin, ...). */
  sources: string[];
  status: "active" | "pending" | "error";
  error: string | null;
  consent_at: Date;
  connected_at: Date;
  last_sync_at: Date | null;
}

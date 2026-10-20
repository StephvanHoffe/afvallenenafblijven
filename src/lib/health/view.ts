import type { HealthDay, HealthProvider, HealthWorkout } from "@/lib/health/types";

/** Wat de persoonlijke omgeving van de koppelingen toont. */
export interface HealthConnectionView {
  provider: HealthProvider;
  status: "active" | "pending" | "error";
  /** Aangesloten bronnen, bijv. ["apple_health_kit", "garmin"] of ["withings"]. */
  sources: string[];
  connectedAt: Date;
  lastSyncAt: Date | null;
  /** "ingetrokken" | "tijdelijk" | "bron" | null */
  error: string | null;
}

export interface HealthView {
  /** Welke koppelingen op deze site aanstaan. */
  available: { withings: boolean; junction: boolean; apple: boolean };
  /** Cloud-apps in de Junction-widget (slugs). */
  junctionProviders: string[];
  connections: HealthConnectionView[];
  /** Dagen en trainingen van de afgelopen ~4 maanden. */
  days: HealthDay[];
  workouts: HealthWorkout[];
  /** Ingeplande trainingen per week (uit het trainingsschema), null zonder trainingsschema. */
  plannedPerWeek: number | null;
  /** "Nu" voor de berekeningen (in de demo een vaste datum). */
  now: Date;
}

/** Leesbare naam van een bron. */
export function sourceName(slug: string): string {
  const names: Record<string, string> = {
    apple_health_kit: "Apple Health",
    health_connect: "Health Connect",
    withings: "Withings",
    garmin: "Garmin",
    fitbit: "Fitbit",
    google_fit: "Google Fit",
    oura: "Oura",
    polar: "Polar",
    whoop_v2: "Whoop",
    whoop: "Whoop",
    suunto: "Suunto",
    wahoo: "Wahoo",
    samsung_health: "Samsung Health",
    coros: "COROS",
  };
  return names[slug] ?? slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

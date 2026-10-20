import type { HealthDay, HealthWorkout, WorkoutKind } from "@/lib/health/types";
import type { HealthView } from "@/lib/health/view";

/**
 * Gekoppelde gezondheidsdata van de voorbeeldklant: Apple Health (iPhone en
 * horloge, via Junction) sinds periode 2 en een Withings-weegschaal sinds
 * periode 3. Vaste, reproduceerbare getallen, zodat de demo statisch blijft.
 */

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2027-04-20T08:00:00+02:00");
const START = "2027-02-04";

/** Kleine, voorspelbare "random" generator (mulberry32). */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (day: string, n: number) => ymd(new Date(new Date(`${day}T12:00:00Z`).getTime() + n * DAY));

/**
 * Wegingen met de Withings-weegschaal. Op de dagen van de check-ins en
 * weegmomenten precies die waarden; in weken met minder trainingen gaat het
 * gewicht wat langzamer omlaag.
 */
const SCALE: [string, number][] = [
  ["2027-03-03", 74],
  ["2027-03-06", 73.8],
  ["2027-03-08", 73.7],
  ["2027-03-10", 73.5],
  ["2027-03-13", 73.3],
  ["2027-03-15", 73.3],
  ["2027-03-17", 73.2],
  ["2027-03-20", 73.2],
  ["2027-03-22", 73],
  ["2027-03-24", 72.8],
  ["2027-03-27", 72.6],
  ["2027-03-29", 72.6],
  ["2027-03-31", 72.3],
  ["2027-04-03", 72.4],
  ["2027-04-05", 72.3],
  ["2027-04-07", 72],
  ["2027-04-10", 71.8],
  ["2027-04-12", 71.9],
  ["2027-04-14", 72.1],
  ["2027-04-17", 71.8],
  ["2027-04-19", 71.8],
];
const scaleOn = new Map(SCALE);

/** Trainingen per week (maandag als start): in februari nog wat wisselend, daarna vaker volgens schema. */
const WORKOUTS_PER_WEEK: Record<string, number> = {
  "2027-02-01": 3,
  "2027-02-08": 2,
  "2027-02-15": 3,
  "2027-02-22": 1,
  "2027-03-01": 3,
  "2027-03-08": 3,
  "2027-03-15": 2,
  "2027-03-22": 3,
  "2027-03-29": 2,
  "2027-04-05": 3,
  "2027-04-12": 3,
  "2027-04-19": 1,
};

function build(): { days: HealthDay[]; workouts: HealthWorkout[] } {
  const random = rng(20270204);
  const days: HealthDay[] = [];
  const workouts: HealthWorkout[] = [];
  const end = ymd(NOW);
  for (let day = START, i = 0; day <= end; day = addDays(day, 1), i++) {
    const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
    // Stappen lopen op van zo'n 3.500 naar 4.500 per dag (past bij "vooral zittend"); in het weekend iets meer.
    const trend = 3500 + Math.min(1, i / 60) * 1000;
    const steps = Math.round(trend * (weekday === 0 || weekday === 6 ? 1.15 : 1) * (0.8 + random() * 0.4));
    const weightKg = scaleOn.get(day) ?? null;
    days.push({
      day,
      source: "apple_health_kit",
      ...(weightKg !== null ? { weightSource: "withings" } : {}),
      steps,
      activeKcal: Math.round(steps * 0.04 + random() * 60),
      activeMinutes: Math.round(14 + random() * 22),
      weightKg,
    });
  }
  // Ingeplande trainingsdagen: maandag, woensdag, vrijdag; bij minder trainingen vallen de laatste weg.
  const kinds: WorkoutKind[] = ["kracht", "kracht", "kracht"];
  for (const [monday, count] of Object.entries(WORKOUTS_PER_WEEK)) {
    [0, 2, 4].slice(0, count).forEach((offset, n) => {
      const day = addDays(monday, offset);
      if (day < START || day > end) return;
      const startedAt = new Date(`${day}T18:${10 + n * 7}:00+01:00`);
      const minutes = 38 + Math.round(random() * 14);
      workouts.push({ id: `demo-${day}`, source: "apple_health_kit", startedAt, minutes, kcal: Math.round(minutes * 6.2), sport: kinds[n] });
    });
  }
  // Af en toe een wandeling in het weekend.
  for (const day of ["2027-03-14", "2027-03-28", "2027-04-11", "2027-04-18"]) {
    workouts.push({ id: `demo-walk-${day}`, source: "apple_health_kit", startedAt: new Date(`${day}T10:30:00+01:00`), minutes: 55, kcal: 210, sport: "wandelen" });
  }
  workouts.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  return { days, workouts };
}

const data = build();

export const demoHealth: HealthView = {
  available: { withings: true, junction: true, apple: true },
  junctionProviders: ["garmin", "fitbit", "oura", "polar"],
  connections: [
    {
      provider: "junction",
      status: "active",
      sources: ["apple_health_kit"],
      connectedAt: new Date("2027-02-04T20:12:00+01:00"),
      lastSyncAt: new Date("2027-04-20T07:40:00+02:00"),
      error: null,
    },
    {
      provider: "withings",
      status: "active",
      sources: ["withings"],
      connectedAt: new Date("2027-03-04T07:55:00+01:00"),
      lastSyncAt: new Date("2027-04-20T07:12:00+02:00"),
      error: null,
    },
  ],
  days: data.days,
  workouts: data.workouts,
  plannedPerWeek: 3,
  now: NOW,
};

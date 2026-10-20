/** Kleine weergavehulpjes die zowel de website als de PDF gebruiken. */

/** "Training A – Benen & billen" -> "Training A" */
export function workoutShortName(name: string): string {
  const short = name.split(/\s+[–—-]\s+/)[0]?.trim();
  return short && short.length <= 24 ? short : name;
}

/** 90 -> "90 s", 120 -> "2 min" */
export function restLabel(seconds: number): string {
  return seconds >= 120 && seconds % 60 === 0 ? `${seconds / 60} min` : `${seconds} s`;
}

/** Een dag met een training ("Training A …" of, in Engelse schema's, "Workout A …"). */
export const isTrainingDay = (activity: string) => /training|workout/i.test(activity);

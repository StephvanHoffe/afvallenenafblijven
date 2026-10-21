import { site } from "@/config/site";
import { amsterdamMidnight, amsterdamWeekday } from "@/lib/dates";

/**
 * Het ritme van de schema's.
 *
 * - Elke periode start op een vaste weekdag (maandag, Nederlandse tijd) en
 *   duurt 4 weken. De eerste periode start direct na de aankoop en loopt tot
 *   de maandag die het dichtst bij 4 weken later ligt (25 tot 31 dagen).
 * - De check-in voor de volgende periode opent op de donderdag ervoor. Vul je
 *   hem uiterlijk zaterdag in, dan staat het nieuwe schema met
 *   boodschappenlijst op tijd klaar voor de boodschappen in het weekend.
 *   Eerder maken we het niet: dan sluit het niet meer aan op je voortgang.
 * - Een nieuw schema is direct zichtbaar, met de startdatum erbij, en wordt
 *   op die maandag vanzelf het huidige schema. Is de check-in te laat, dan
 *   start het nieuwe schema meteen en sluit de periode daarna weer aan op
 *   maandag.
 * - De weegmomenten openen op zaterdag, zodat een bijsturing op tijd is voor
 *   de boodschappen van de week erna.
 */

/** Start van de volgende periode: de maandag die het dichtst bij 4 weken na `start` ligt. */
export function nextPeriodStart(start: Date): Date {
  const target = amsterdamMidnight(start, site.planIntervalDays);
  const forward = (site.periodStartWeekday - amsterdamWeekday(target) + 7) % 7;
  return amsterdamMidnight(target, forward <= 3 ? forward : forward - 7);
}

/** Dag (middernacht) een aantal kalenderdagen voor of na `date`. */
export function shiftDays(date: Date, days: number): Date {
  return amsterdamMidnight(date, days);
}

/** Vanaf dit moment kan de check-in voor de periode die op `nextStart` begint, worden ingevuld. */
export function checkinOpensAt(nextStart: Date): Date {
  return shiftDays(nextStart, -site.checkin.opensDaysBefore);
}

/** De dag waarop we de check-in uiterlijk adviseren (zaterdag), zodat het schema op tijd is voor de boodschappen. */
export function checkinAdvisedBy(nextStart: Date): Date {
  return shiftDays(nextStart, -site.checkin.advisedDaysBefore);
}

/** Wanneer een nieuw schema start: op de geplande maandag, of meteen als de check-in te laat is. */
export function newPeriodStartsAt(nextStart: Date, now: number = Date.now()): Date {
  return nextStart.getTime() > now ? nextStart : new Date(now);
}

/** Begin per periode (vroegste start van de schema's van die periode). */
export function periodStarts<T>(plans: T[], seq: (p: T) => number, start: (p: T) => Date): Map<number, Date> {
  const starts = new Map<number, Date>();
  for (const p of plans) {
    const s = start(p);
    const prev = starts.get(seq(p));
    if (!prev || s < prev) starts.set(seq(p), s);
  }
  return starts;
}

/**
 * De lopende periode (de hoogste die al is begonnen) en een eventuele
 * volgende die al klaarstaat maar nog moet beginnen.
 */
export function periodsAt(starts: Map<number, Date>, now: number = Date.now()): {
  current: { seq: number; start: Date } | null;
  upcoming: { seq: number; start: Date } | null;
} {
  let current: { seq: number; start: Date } | null = null;
  let upcoming: { seq: number; start: Date } | null = null;
  for (const [seq, start] of starts) {
    if (start.getTime() <= now) {
      if (!current || seq > current.seq) current = { seq, start };
    } else if (!upcoming || seq < upcoming.seq) {
      upcoming = { seq, start };
    }
  }
  // Nog niets begonnen (kan alleen met afwijkende data): toon dan de eerste als huidige.
  if (!current && upcoming) return { current: upcoming, upcoming: null };
  return { current, upcoming };
}

/** Ligt de start van deze periode nog in de toekomst (het schema staat al klaar)? */
export function startsLater(start: Date, now: number = Date.now()): boolean {
  return start.getTime() > now;
}

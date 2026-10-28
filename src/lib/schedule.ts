import { site } from "@/config/site";
import { addDaysToDay, amsterdamDay, amsterdamMidnight, amsterdamStartOfDay, amsterdamWeekday } from "@/lib/dates";

/**
 * Het ritme van de schema's.
 *
 * - Elke week loopt van maandag tot en met zondag (Nederlandse tijd) en een
 *   periode duurt 4 weken. De eerste periode start op de dag die de klant bij
 *   het afrekenen kiest (vandaag of binnen 7 dagen). Is dat geen maandag, dan
 *   duurt de eerste week langer: van de startdag tot en met de zondag van de
 *   week erna (8 tot 13 dagen). De periode duurt dan 28 tot 34 dagen.
 * - De check-in voor de volgende periode opent op de donderdag ervoor. Vul je
 *   hem uiterlijk zaterdag in, dan staat het nieuwe schema met
 *   boodschappenlijst op tijd klaar voor de boodschappen in het weekend.
 *   Eerder maken we het niet: dan sluit het niet meer aan op je voortgang.
 * - Een nieuw schema is direct zichtbaar, met de startdatum erbij, en wordt
 *   op die maandag vanzelf het huidige schema. Is de check-in te laat, dan
 *   start het nieuwe schema meteen; net als bij de eerste periode loopt de
 *   eerste week dan door tot de zondag van de week erna.
 * - De weegmomenten openen op zaterdag, zodat een bijsturing op tijd is voor
 *   de boodschappen van de week erna.
 */

/** De eerste maandag op of na `start` (middernacht, Nederlandse tijd). */
export function firstMondayFrom(start: Date): Date {
  const day = amsterdamMidnight(start);
  return amsterdamMidnight(day, (site.periodStartWeekday - amsterdamWeekday(day) + 7) % 7);
}

/** Start van de volgende periode: 4 weken na de eerste maandag van de periode die op `start` begon. */
export function nextPeriodStart(start: Date): Date {
  return amsterdamMidnight(firstMondayFrom(start), site.planIntervalDays);
}

/** Begin van week 2: start de periode niet op maandag, dan loopt week 1 t/m de zondag van de week erna. */
export function secondWeekStart(start: Date): Date {
  return amsterdamMidnight(firstMondayFrom(start), 7);
}

/** Start de periode op een andere dag dan maandag (en is de eerste week dus langer)? */
export function hasLongFirstWeek(start: Date): boolean {
  return amsterdamWeekday(start) !== site.periodStartWeekday;
}

/** Is week 1 van deze periode langer dan een week en nog niet voorbij (of nog niet begonnen)? */
export function inLongFirstWeek(start: Date, now: number = Date.now()): boolean {
  return hasLongFirstWeek(start) && now < secondWeekStart(start).getTime();
}

/** De zondag waarop week 1 eindigt. */
export function firstWeekEnd(start: Date): Date {
  return amsterdamMidnight(secondWeekStart(start), -1);
}

/** De dagen (JJJJ-MM-DD) waaruit de klant de startdatum kiest: vandaag t/m `site.startChoiceDays` dagen later. */
export function startDayOptions(now: number = Date.now()): string[] {
  const today = amsterdamDay(new Date(now));
  return Array.from({ length: site.startChoiceDays + 1 }, (_, i) => addDaysToDay(today, i));
}

/**
 * Begin van de eerste periode bij een gekozen startdag: die dag om
 * middernacht. Vandaag, een ongeldige dag of een dag die al voorbij is
 * (bijvoorbeeld door een late betaling): nu.
 */
export function firstPeriodStart(day: string | null | undefined, now: number = Date.now()): Date {
  const today = amsterdamDay(new Date(now));
  // Eén dag speling: wie op de laatste dag kiest en na middernacht betaalt, houdt zijn keuze.
  const latest = addDaysToDay(today, site.startChoiceDays + 1);
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day) || day <= today || day > latest) return new Date(now);
  return amsterdamStartOfDay(day);
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

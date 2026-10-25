/**
 * Telt maanden op bij een datum voor maandelijkse afschrijvingen: dezelfde dag
 * van de maand, of de laatste dag als die maand korter is (31 januari + 1 maand
 * = 28/29 februari).
 */
export function addMonthsClamped(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

const amsterdamParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Amsterdam",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Verschil tussen Nederlandse tijd en UTC op een moment, in milliseconden. */
export function amsterdamOffsetMs(utcMs: number): number {
  const parts = amsterdamParts.formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - (utcMs - (utcMs % 1000));
}

/**
 * Middernacht (Nederlandse tijd) van de kalenderdag van `date`, plus `days`
 * kalenderdagen. Rekent in kalenderdagen, zodat zomer- en wintertijd geen
 * uur verschuiving geven.
 */
export function amsterdamMidnight(date: Date, days = 0): Date {
  const local = new Date(date.getTime() + amsterdamOffsetMs(date.getTime()));
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + days);
  return new Date(midnight - amsterdamOffsetMs(midnight));
}

/** Dag van de week in Nederland: 0 = zondag, 1 = maandag … 6 = zaterdag. */
export function amsterdamWeekday(date: Date): number {
  return new Date(date.getTime() + amsterdamOffsetMs(date.getTime())).getUTCDay();
}

/** Uur van de dag in Nederland (0-23). */
export function amsterdamHour(date: Date): number {
  return new Date(date.getTime() + amsterdamOffsetMs(date.getTime())).getUTCHours();
}

/** Kalenderdag in Nederland als "2027-04-26". */
export function amsterdamDay(date: Date): string {
  return new Date(date.getTime() + amsterdamOffsetMs(date.getTime())).toISOString().slice(0, 10);
}

/** Telt maanden op bij een kalenderdag ("2026-01-31" + 1 = "2026-02-28"). */
export function addMonthsToDay(day: string, months: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return addMonthsClamped(new Date(Date.UTC(y, m - 1, d)), months).toISOString().slice(0, 10);
}

/** Telt dagen op bij een kalenderdag ("2026-02-28" + 1 = "2026-03-01"). */
export function addDaysToDay(day: string, days: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Middernacht (Nederlandse tijd) aan het begin van een kalenderdag ("2026-11-23"). */
export function amsterdamStartOfDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return amsterdamMidnight(new Date(Date.UTC(y, m - 1, d, 12)));
}

/**
 * Telt maanden op bij een datum zoals Stripe dat voor maandelijkse
 * afschrijvingen doet: dezelfde dag van de maand, of de laatste dag als die
 * maand korter is (31 januari + 1 maand = 28/29 februari).
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

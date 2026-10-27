import { amsterdamDay } from "@/lib/dates";

/**
 * Het wettelijke herroepingsrecht: 14 dagen bedenktijd vanaf de dag waarop de
 * overeenkomst tot stand komt (de dag van de betaling), ook als het schema dan
 * al is geleverd. De dag van de betaling telt niet mee; de termijn loopt tot en
 * met de 14e dag daarna.
 */
export const WITHDRAWAL_DAYS = 14;

/** De laatste dag (JJJJ-MM-DD, Nederlandse tijd) waarop de klant kan herroepen. */
export function withdrawalLastDay(paidAt: Date): string {
  const [y, m, d] = amsterdamDay(paidAt).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + WITHDRAWAL_DAYS)).toISOString().slice(0, 10);
}

/** Valt een herroeping op `at` binnen de termijn van een betaling op `paidAt`? */
export function withinWithdrawalPeriod(paidAt: Date, at: Date): boolean {
  return amsterdamDay(at) <= withdrawalLastDay(paidAt);
}

/** Een kalenderdag als datum om te tonen (12:00 UTC valt in Nederland altijd op dezelfde dag). */
export function dayAsDate(day: string): Date {
  return new Date(`${day}T12:00:00Z`);
}

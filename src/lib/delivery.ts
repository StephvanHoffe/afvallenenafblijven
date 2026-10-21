import { site } from "@/config/site";

/**
 * Levering van een nieuw schema (zie `site.delivery`): het schema wordt
 * direct gemaakt, maar de klant krijgt het op een willekeurig moment binnen
 * de toegezegde tijd te zien, met een e-mail erbij.
 */

/** Willekeurig moment waarop een nieuw schema voor de klant klaarstaat. */
export function deliveryTime(from: number = Date.now(), random: number = Math.random()): Date {
  const { minMinutes, maxMinutes } = site.delivery;
  return new Date(from + (minMinutes + random * (maxMinutes - minMinutes)) * 60_000);
}

/** Uiterlijk moment dat we de klant beloven ("binnen 2 uur"). */
export function deliveryDeadline(from: Date): Date {
  return new Date(from.getTime() + site.delivery.promiseHours * 60 * 60 * 1000);
}

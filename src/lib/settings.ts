import "server-only";
import { site } from "@/config/site";
import { deliveryTime } from "@/lib/delivery";
import { getSetting, setSetting } from "@/lib/repo";

/**
 * Instellingen die de beheerder in /beheer/instellingen aan- en uitzet. Zonder
 * eigen waarde gelden de standaardwaarden uit src/config/site.ts.
 */

/**
 * Schema's eerst goedkeuren: een nieuw schema gaat pas naar de klant als de
 * beheerder het heeft goedgekeurd (en het geplande moment is aangebroken).
 * Handig in de eerste weken na de lancering, als steekproef op de kwaliteit.
 */
export async function planApprovalRequired(): Promise<boolean> {
  return (await getSetting<boolean>("plan_approval")) === true;
}

export async function setPlanApproval(on: boolean): Promise<void> {
  await setSetting("plan_approval", on);
}

export interface DeliverySettings {
  minMinutes: number;
  maxMinutes: number;
  afterCheckin: boolean;
}

/** Hoe lang het duurt voordat een nieuw schema voor de klant klaarstaat. */
export async function deliverySettings(): Promise<DeliverySettings> {
  const saved = await getSetting<Partial<DeliverySettings>>("delivery").catch(() => null);
  return {
    minMinutes: saved?.minMinutes ?? site.delivery.minMinutes,
    maxMinutes: saved?.maxMinutes ?? site.delivery.maxMinutes,
    afterCheckin: saved?.afterCheckin ?? site.delivery.afterCheckin,
  };
}

export async function saveDeliverySettings(s: DeliverySettings): Promise<void> {
  await setSetting("delivery", s);
}

/** Willekeurig levermoment volgens de instellingen; na een check-in alleen als dat aanstaat. */
export async function scheduledDelivery(kind: "purchase" | "checkin"): Promise<Date> {
  const s = await deliverySettings();
  if (kind === "checkin" && !s.afterCheckin) return new Date();
  return deliveryTime(Date.now(), Math.random(), s);
}

export interface CheckoutReminderSettings {
  enabled: boolean;
  /** Na zoveel uur zonder afgeronde betaling sturen we de herinnering. */
  delayHours: number;
}

export async function checkoutReminderSettings(): Promise<CheckoutReminderSettings> {
  const saved = await getSetting<Partial<CheckoutReminderSettings>>("checkout_reminder").catch(() => null);
  return { enabled: saved?.enabled ?? false, delayHours: saved?.delayHours ?? 3 };
}

export async function saveCheckoutReminderSettings(s: CheckoutReminderSettings): Promise<void> {
  await setSetting("checkout_reminder", s);
}

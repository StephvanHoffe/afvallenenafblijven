import { applyPercentOff, isSubscription, monthlyPrice, type DurationId, type ProductId } from "@/config/pricing";
import { promotionMonths, promotionPercent, type Promotion } from "@/config/site";
import { addMonthsToDay } from "@/lib/dates";
import { discountedAmount, discountedPayments, type DiscountTerms } from "@/lib/discounts";

/**
 * Wat een klant betaalt: de eerste betaling, eventueel een paar maanden met
 * korting, en daarna het gewone maandbedrag. Mollie kent geen coupons, dus de
 * website rekent de korting zelf uit (actie of kortingscode; een code vervangt
 * de actie).
 */
export interface BillingPlan {
  /** De eerste betaling (bij een los schema de enige). */
  firstCents: number;
  /** Maandbedrag van maand 2 t/m introMonths, of null als alleen de eerste betaling korting heeft. */
  introCents: number | null;
  /** Hoeveel betalingen korting hebben, de eerste meegeteld (1 = alleen de eerste). */
  introMonths: number;
  /** Maandbedrag daarna (0 bij een los schema). */
  monthlyCents: number;
}

/** Mollie vraagt minimaal € 0,01 per betaling. */
const MIN_CENTS = 1;

export function billingPlan(
  product: ProductId,
  duration: DurationId,
  { promotion, discount }: { promotion?: Promotion | null; discount?: DiscountTerms | null } = {},
): BillingPlan {
  const price = monthlyPrice(product, duration);
  const subscription = isSubscription(duration);
  if (discount) {
    const reduced = Math.max(MIN_CENTS, discountedAmount(price, discount));
    if (!subscription) return { firstCents: reduced, introCents: null, introMonths: 1, monthlyCents: 0 };
    const payments = discountedPayments(discount);
    // Zolang het abonnement loopt: het lagere bedrag is gewoon het maandbedrag.
    if (payments === null) return { firstCents: reduced, introCents: null, introMonths: 1, monthlyCents: reduced };
    return { firstCents: reduced, introCents: payments > 1 ? reduced : null, introMonths: payments, monthlyCents: price };
  }
  const percent = promotion ? promotionPercent(promotion, duration) : 0;
  if (!promotion || percent <= 0) return { firstCents: price, introCents: null, introMonths: 1, monthlyCents: subscription ? price : 0 };
  const reduced = Math.max(MIN_CENTS, applyPercentOff(price, percent));
  if (!subscription) return { firstCents: reduced, introCents: null, introMonths: 1, monthlyCents: 0 };
  const months = promotionMonths(promotion, duration);
  return { firstCents: reduced, introCents: months > 1 ? reduced : null, introMonths: months, monthlyCents: price };
}

/**
 * Kalenderdag (JJJJ-MM-DD) van betaling nummer `n` van een abonnement: de eerste
 * betaling is op `firstDay`, daarna elke maand op dezelfde dag (of de laatste
 * dag van een kortere maand).
 */
export function chargeDay(firstDay: string, n: number): string {
  return addMonthsToDay(firstDay, n - 1);
}

/** Het bedrag van betaling nummer `n` (1 = de eerste) van een abonnement. */
export function paymentAmount(plan: Pick<BillingPlan, "firstCents" | "introCents" | "introMonths" | "monthlyCents">, n: number): number {
  if (n <= 1) return plan.firstCents;
  if (n <= plan.introMonths && plan.introCents !== null) return plan.introCents;
  return plan.monthlyCents;
}

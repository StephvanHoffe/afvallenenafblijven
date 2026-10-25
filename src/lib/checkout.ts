import "server-only";
import { durationFor, isSubscription, productFor, type DurationId, type ProductId } from "@/config/pricing";
import { activePromotion, promotionPercent, site } from "@/config/site";
import { localeUrl, type Locale } from "@/i18n/config";
import { billingPlan } from "@/lib/billing";
import { termsOf, type DiscountCodeRow } from "@/lib/discounts-server";
import { createCustomer, createPayment } from "@/lib/mollie";
import { mollieCustomerIdFor, setIntakePayment } from "@/lib/repo";

export interface CheckoutInput {
  intakeId: string;
  product: ProductId;
  duration: DurationId;
  email: string;
  name: string;
  locale?: Locale;
  /** Een geldige kortingscode; vervangt de actiekorting. */
  discount?: DiscountCodeRow | null;
}

/**
 * Start de betaling bij Mollie en geeft de link naar de betaalpagina. Bij een
 * abonnement is dit de "eerste betaling" (iDEAL | Wero of Bancontact), die
 * meteen een SEPA-incassomachtiging oplevert voor de maanden daarna. De
 * bedragen van die maanden gaan mee in de gegevens van de betaling, zodat
 * een actie die net afloopt nog geldt voor wie al aan het betalen was.
 */
export async function createCheckout(input: CheckoutInput): Promise<string> {
  const l = input.locale ?? "nl";
  const subscription = isSubscription(input.duration);
  // Een kortingscode van de klant vervangt de actiekorting.
  const promo = input.discount ? null : activePromotion(new Date());
  const promoActive = Boolean(promo && promotionPercent(promo, input.duration) > 0);
  const plan = billingPlan(input.product, input.duration, {
    promotion: promoActive ? promo : null,
    discount: input.discount ? termsOf(input.discount) : null,
  });

  const customerId =
    (await mollieCustomerIdFor(input.email)) ?? (await createCustomer({ name: input.name, email: input.email.toLowerCase(), locale: l }));
  const productName = productFor(input.product, l).name;
  const term = subscription ? durationFor(input.duration, l).label.toLowerCase() : l === "en" ? "single plan" : "los schema";

  const payment = await createPayment(
    {
      amountCents: plan.firstCents,
      description: `${site.name}: ${productName}, ${term}`,
      redirectUrl: localeUrl(site.url, l, `/bedankt?bestelling=${input.intakeId}`),
      cancelUrl: localeUrl(site.url, l, "/start?stap=plan&geannuleerd=1"),
      locale: l,
      // Voor de maandelijkse incasso is een machtiging nodig: die geven iDEAL en Bancontact.
      methods: subscription ? ["ideal", "bancontact"] : ["ideal", "bancontact", "creditcard"],
      sequenceType: subscription ? "first" : "oneoff",
      customerId,
      metadata: {
        kind: "checkout",
        intake_id: input.intakeId,
        product: input.product,
        duration: input.duration,
        promotion: promoActive ? promo!.id : null,
        discount_code: input.discount?.code ?? null,
        monthly_cents: plan.monthlyCents,
        intro_cents: plan.introCents,
        intro_months: plan.introMonths,
      },
    },
    `betaling-${input.intakeId}`,
  );
  if (!payment._links.checkout?.href) throw new Error("Mollie gaf geen betaallink terug");
  await setIntakePayment(input.intakeId, payment.id, customerId);
  return payment._links.checkout.href;
}

"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { DURATION_IDS, PRODUCT_IDS, isSubscription, type DurationId, type ProductId } from "@/config/pricing";
import { consentSchema, customerSchema, intakeMessage, intakeSchema } from "@/lib/intake";
import { campaignSchema } from "@/lib/campaign";
import { checkSafety } from "@/lib/safety";
import { isDatabaseConfigured } from "@/lib/db";
import { createIntake } from "@/lib/repo";
import { defineCopy } from "@/i18n/config";
import { requestLocale } from "@/i18n/server";
import { createCheckout } from "@/lib/checkout";
import { isMollieConfigured } from "@/lib/mollie";
import { describeDiscount, normalizeCode, type DiscountTerms } from "@/lib/discounts";
import { checkCode, getDiscountCode, type DiscountProblem } from "@/lib/discounts-server";
import { recordFunnelEvent } from "@/lib/funnel";

export interface CheckoutState {
  error?: string;
}

const copy = defineCopy({
  nl: {
    badPayload: "Er ging iets mis met je gegevens. Vernieuw de pagina en probeer het opnieuw.",
    checkDetails: "Controleer je gegevens en probeer het opnieuw.",
    checkAnswers: "Controleer je antwoorden in de vragenlijst.",
    notConfigured:
      "Betalen is nog niet geactiveerd op deze website. (Voor de beheerder: stel DATABASE_URL en MOLLIE_API_KEY in, zie README.)",
    checkoutFailed: "We konden de betaalpagina niet openen. Probeer het over een paar minuten opnieuw.",
    discount: {
      unknown: "Deze kortingscode kennen we niet. Controleer de spelling.",
      inactive: "Deze kortingscode is niet meer geldig.",
      not_started: "Deze kortingscode is nog niet geldig.",
      expired: "Deze kortingscode is verlopen.",
      used_up: "Deze kortingscode is helaas al op.",
      not_for_plan: "Deze kortingscode geldt niet voor dit plan of deze looptijd.",
      unavailable: "Kortingscodes kunnen nu niet worden gecontroleerd. Probeer het later opnieuw.",
    } satisfies Record<DiscountProblem | "unavailable", string>,
  },
  en: {
    badPayload: "Something went wrong with your details. Please refresh the page and try again.",
    checkDetails: "Please check your details and try again.",
    checkAnswers: "Please check your answers in the questionnaire.",
    notConfigured:
      "Payments haven't been activated on this website yet. (For the administrator: set DATABASE_URL and MOLLIE_API_KEY, see README.)",
    checkoutFailed: "We couldn't open the payment page. Please try again in a few minutes.",
    discount: {
      unknown: "We don't recognise this discount code. Please check the spelling.",
      inactive: "This discount code is no longer valid.",
      not_started: "This discount code isn't valid yet.",
      expired: "This discount code has expired.",
      used_up: "Sorry, this discount code has run out.",
      not_for_plan: "This discount code doesn't apply to this plan or term.",
      unavailable: "Discount codes can't be checked right now. Please try again later.",
    } satisfies Record<DiscountProblem | "unavailable", string>,
  },
});

const payloadSchema = z.object({
  intake: z.unknown(),
  customer: customerSchema,
  consents: consentSchema,
  product: z.enum(PRODUCT_IDS),
  duration: z.enum(DURATION_IDS),
  campaign: campaignSchema.nullish().catch(null),
  /** Anoniem bezoeknummer en apparaat uit de funnelmeting. */
  visitId: z.string().max(64).nullish().catch(null),
  device: z.enum(["mobiel", "tablet", "desktop"]).nullish().catch(null),
  discountCode: z.string().max(40).nullish().catch(null),
});

export type DiscountCheck = { ok: true; code: string; label: string; terms: DiscountTerms } | { ok: false; error: string };

/** Controleert een kortingscode voor het gekozen plan (voor de vragenlijst, vóór het afrekenen). */
export async function checkDiscountCode(rawCode: string, product: ProductId, duration: DurationId): Promise<DiscountCheck> {
  const locale = await requestLocale();
  const c = copy[locale];
  const code = normalizeCode(String(rawCode ?? ""));
  if (!code || !PRODUCT_IDS.includes(product) || !DURATION_IDS.includes(duration)) return { ok: false, error: c.discount.unknown };
  if (!isDatabaseConfigured()) return { ok: false, error: c.discount.unavailable };
  try {
    const result = checkCode(await getDiscountCode(code), product, duration);
    if (!result.ok) return { ok: false, error: c.discount[result.problem] };
    return { ok: true, code, label: describeDiscount(result.terms, locale, isSubscription(duration)), terms: result.terms };
  } catch (err) {
    console.error("Kortingscode controleren mislukt", err);
    return { ok: false, error: c.discount.unavailable };
  }
}

export async function startCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const locale = await requestLocale();
  const c = copy[locale];
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: c.badPayload };
  }

  const payload = payloadSchema.safeParse(raw);
  if (!payload.success) {
    return { error: intakeMessage(payload.error.issues[0]?.message ?? c.checkDetails, locale) };
  }
  const { customer, consents, product, duration } = payload.data;
  const intake = intakeSchema.safeParse({ ...(payload.data.intake as object), product });
  if (!intake.success) {
    return { error: intakeMessage(intake.error.issues[0]?.message ?? c.checkAnswers, locale) };
  }

  const safety = checkSafety(intake.data, locale);
  if (!safety.ok) return { error: safety.reason };

  if (!isDatabaseConfigured() || !isMollieConfigured()) {
    return { error: c.notConfigured };
  }

  // Een kortingscode controleren we opnieuw: hij kan inmiddels verlopen of op zijn.
  const code = payload.data.discountCode ? normalizeCode(payload.data.discountCode) : "";
  let discount = null;
  if (code) {
    const row = await getDiscountCode(code).catch(() => null);
    const result = checkCode(row, product, duration);
    if (!result.ok) return { error: c.discount[result.problem] };
    discount = row;
  }

  let url: string;
  try {
    const intakeId = await createIntake({
      email: customer.email,
      name: customer.name,
      data: intake.data,
      consents: { ...consents, acceptedAt: new Date().toISOString() },
      locale,
      campaign: payload.data.campaign ?? null,
      visitId: payload.data.visitId ?? null,
      device: payload.data.device ?? null,
      discountCode: discount?.code ?? null,
      duration,
    });
    url = await createCheckout({ intakeId, product, duration, email: customer.email, name: customer.name, locale, discount });
    await recordFunnelEvent({
      visitId: payload.data.visitId,
      event: "checkout_start",
      product,
      duration,
      locale,
      device: payload.data.device,
      source: payload.data.campaign?.source,
      campaign: payload.data.campaign?.campaign,
      landing: payload.data.campaign?.landing,
    });
  } catch (err) {
    console.error("Checkout starten mislukt", err);
    return { error: c.checkoutFailed };
  }
  redirect(url);
}

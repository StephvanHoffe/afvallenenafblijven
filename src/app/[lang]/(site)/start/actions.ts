"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { DURATION_IDS, PRODUCT_IDS } from "@/config/pricing";
import { consentSchema, customerSchema, intakeMessage, intakeSchema } from "@/lib/intake";
import { checkSafety } from "@/lib/safety";
import { isDatabaseConfigured } from "@/lib/db";
import { createIntake } from "@/lib/repo";
import { defineCopy } from "@/i18n/config";
import { requestLocale } from "@/i18n/server";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";

export interface CheckoutState {
  error?: string;
}

const copy = defineCopy({
  nl: {
    badPayload: "Er ging iets mis met je gegevens. Vernieuw de pagina en probeer het opnieuw.",
    checkDetails: "Controleer je gegevens en probeer het opnieuw.",
    checkAnswers: "Controleer je antwoorden in de vragenlijst.",
    notConfigured:
      "Betalen is nog niet geactiveerd op deze website. (Voor de beheerder: stel DATABASE_URL en STRIPE_SECRET_KEY in, zie README.)",
    checkoutFailed: "We konden de betaalpagina niet openen. Probeer het over een paar minuten opnieuw.",
  },
  en: {
    badPayload: "Something went wrong with your details. Please refresh the page and try again.",
    checkDetails: "Please check your details and try again.",
    checkAnswers: "Please check your answers in the questionnaire.",
    notConfigured:
      "Payments haven't been activated on this website yet. (For the administrator: set DATABASE_URL and STRIPE_SECRET_KEY, see README.)",
    checkoutFailed: "We couldn't open the payment page. Please try again in a few minutes.",
  },
});

const payloadSchema = z.object({
  intake: z.unknown(),
  customer: customerSchema,
  consents: consentSchema,
  product: z.enum(PRODUCT_IDS),
  duration: z.enum(DURATION_IDS),
});

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

  if (!isDatabaseConfigured() || !isStripeConfigured()) {
    return { error: c.notConfigured };
  }

  let url: string;
  try {
    const intakeId = await createIntake({
      email: customer.email,
      name: customer.name,
      data: intake.data,
      consents: { ...consents, acceptedAt: new Date().toISOString() },
      locale,
    });
    url = await createCheckoutSession({ intakeId, product, duration, email: customer.email, name: customer.name, locale });
  } catch (err) {
    console.error("Checkout starten mislukt", err);
    return { error: c.checkoutFailed };
  }
  redirect(url);
}

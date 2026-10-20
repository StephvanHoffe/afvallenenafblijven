"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { DURATION_IDS, PRODUCT_IDS } from "@/config/pricing";
import { consentSchema, customerSchema, intakeSchema } from "@/lib/intake";
import { checkSafety } from "@/lib/safety";
import { isDatabaseConfigured } from "@/lib/db";
import { createIntake } from "@/lib/repo";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";

export interface CheckoutState {
  error?: string;
}

const payloadSchema = z.object({
  intake: z.unknown(),
  customer: customerSchema,
  consents: consentSchema,
  product: z.enum(PRODUCT_IDS),
  duration: z.enum(DURATION_IDS),
});

export async function startCheckout(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "Er ging iets mis met je gegevens. Vernieuw de pagina en probeer het opnieuw." };
  }

  const payload = payloadSchema.safeParse(raw);
  if (!payload.success) {
    return { error: payload.error.issues[0]?.message ?? "Controleer je gegevens en probeer het opnieuw." };
  }
  const { customer, consents, product, duration } = payload.data;
  const intake = intakeSchema.safeParse({ ...(payload.data.intake as object), product });
  if (!intake.success) {
    return { error: intake.error.issues[0]?.message ?? "Controleer je antwoorden in de vragenlijst." };
  }

  const safety = checkSafety(intake.data);
  if (!safety.ok) return { error: safety.reason };

  if (!isDatabaseConfigured() || !isStripeConfigured()) {
    return {
      error:
        "Betalen is nog niet geactiveerd op deze website. (Voor de beheerder: stel DATABASE_URL en STRIPE_SECRET_KEY in, zie README.)",
    };
  }

  let url: string;
  try {
    const intakeId = await createIntake({
      email: customer.email,
      name: customer.name,
      data: intake.data,
      consents: { ...consents, acceptedAt: new Date().toISOString() },
    });
    url = await createCheckoutSession({ intakeId, product, duration, email: customer.email, name: customer.name });
  } catch (err) {
    console.error("Checkout starten mislukt", err);
    return { error: "We konden de betaalpagina niet openen. Probeer het over een paar minuten opnieuw." };
  }
  redirect(url);
}

"use server";

import { z } from "zod";
import { adminNotificationEmail, sendMail } from "@/lib/email";
import type { FormState } from "@/components/forms/FormStatus";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Vul je naam in").max(100),
  email: z.string().trim().email("Vul een geldig e-mailadres in").max(200),
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(10, "Je bericht is wat kort").max(5000),
});

export async function sendContact(_prev: FormState, formData: FormData): Promise<FormState> {
  // Honeypot: echte bezoekers laten dit verborgen veld leeg.
  if (formData.get("website")) return { ok: true, message: "Bedankt! We hebben je bericht ontvangen." };

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject") || undefined,
    message: formData.get("message"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  const { name, email, subject, message } = parsed.data;
  try {
    await sendMail(
      adminNotificationEmail(`Contactformulier: ${subject ?? "nieuw bericht"}`, { Naam: name, "E-mail": email, Bericht: message }, email),
    );
  } catch (err) {
    console.error("Contactformulier versturen mislukt", err);
    return { ok: false, message: "Versturen lukte niet. Mail ons gerust direct." };
  }
  return { ok: true, message: "Bedankt! We hebben je bericht ontvangen en reageren zo snel mogelijk." };
}

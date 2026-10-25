"use server";

import { z } from "zod";
import { adminNotificationEmail, sendMail } from "@/lib/email";
import type { FormState } from "@/components/forms/FormStatus";
import { defineCopy } from "@/i18n/config";
import { requestLocale } from "@/i18n/server";

const copy = defineCopy({
  nl: {
    name: "Vul je naam in",
    email: "Vul een geldig e-mailadres in",
    message: "Je bericht is wat kort",
    received: "Bedankt! We hebben je bericht ontvangen.",
    failed: "Versturen lukte niet. Mail ons gerust direct.",
    thanks: "Bedankt! We hebben je bericht ontvangen en reageren zo snel mogelijk.",
  },
  en: {
    name: "Please enter your name",
    email: "Please enter a valid email address",
    message: "Your message is a little short",
    received: "Thank you! We've received your message.",
    failed: "Sending didn't work. Feel free to email us directly.",
    thanks: "Thank you! We've received your message and will get back to you as soon as possible.",
  },
});

function contactSchema(c: (typeof copy)["nl"]) {
  return z.object({
    name: z.string().trim().min(2, c.name).max(100),
    email: z.string().trim().email(c.email).max(200),
    subject: z.string().trim().max(150).optional(),
    message: z.string().trim().min(10, c.message).max(5000),
  });
}

export async function sendContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const l = await requestLocale();
  const c = copy[l];
  // Honeypot: echte bezoekers laten dit verborgen veld leeg.
  if (formData.get("website")) return { ok: true, message: c.received };

  const parsed = contactSchema(c).safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject") || undefined,
    message: formData.get("message"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };

  const { name, email, subject, message } = parsed.data;
  try {
    await sendMail(
      adminNotificationEmail(
        `Contactformulier: ${subject ?? "nieuw bericht"}`,
        { Naam: name, "E-mail": email, Taal: l === "en" ? "Engels" : undefined, Bericht: message },
        email,
      ),
    );
  } catch (err) {
    console.error("Contactformulier versturen mislukt", err);
    return { ok: false, message: c.failed };
  }
  return { ok: true, message: c.thanks };
}

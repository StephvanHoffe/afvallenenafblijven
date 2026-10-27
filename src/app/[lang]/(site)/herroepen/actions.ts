"use server";

import { z } from "zod";
import { defineCopy, type Locale } from "@/i18n/config";
import { requestLocale } from "@/i18n/server";
import { isDatabaseConfigured } from "@/lib/db";
import { adminNotificationEmail, sendMail, withdrawalConfirmationEmail } from "@/lib/email";
import { createWithdrawal } from "@/lib/repo";

export interface WithdrawalState {
  ok?: boolean;
  message?: string;
  receipt?: { id: string; receivedAt: string };
}

const copy = defineCopy({
  nl: {
    name: "Vul je naam in",
    email: "Vul een geldig e-mailadres in",
    orderReference: "Vul je bestelnummer of besteldatum in",
    failed: "Er ging iets mis. Probeer het opnieuw of stuur je herroeping per e-mail.",
  },
  en: {
    name: "Please enter your name",
    email: "Please enter a valid email address",
    orderReference: "Please enter your order number or order date",
    failed: "Something went wrong. Please try again or send your withdrawal by email.",
  },
});

function schemaFor(l: Locale) {
  const c = copy[l];
  return z.object({
    name: z.string().trim().min(2, c.name).max(120),
    email: z.string().trim().toLowerCase().email(c.email).max(200),
    orderReference: z.string().trim().min(2, c.orderReference).max(200),
    message: z.string().trim().max(2000).optional(),
  });
}

/** Verwerkt een herroeping (art. 6:230o e.v. BW, herroepingsfunctie). */
export async function submitWithdrawal(_prev: WithdrawalState, formData: FormData): Promise<WithdrawalState> {
  const l = await requestLocale();
  const parsed = schemaFor(l).safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    orderReference: formData.get("orderReference"),
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  const input = parsed.data;

  let id: string;
  let receivedAt = new Date();
  try {
    if (isDatabaseConfigured()) {
      const row = await createWithdrawal(input);
      id = row.id;
      receivedAt = new Date(row.created_at);
    } else {
      id = `H-${receivedAt.getTime()}`;
    }
    await sendMail(withdrawalConfirmationEmail({ to: input.email, ...input, receivedAt, id }, l));
    await sendMail(
      adminNotificationEmail(
        "herroeping",
        "Herroeping ontvangen",
        {
          Naam: input.name,
          "E-mail": input.email,
          Bestelling: input.orderReference,
          Toelichting: input.message,
          Kenmerk: id,
          Taal: l === "en" ? "Engels" : undefined,
        },
        { replyTo: input.email },
      ),
    );
  } catch (err) {
    console.error("Herroeping verwerken mislukt", err);
    return { ok: false, message: copy[l].failed };
  }
  return { ok: true, receipt: { id, receivedAt: receivedAt.toISOString() } };
}

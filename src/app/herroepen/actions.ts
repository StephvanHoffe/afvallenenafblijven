"use server";

import { z } from "zod";
import { isDatabaseConfigured } from "@/lib/db";
import { adminNotificationEmail, sendMail, withdrawalConfirmationEmail } from "@/lib/email";
import { createWithdrawal } from "@/lib/repo";

export interface WithdrawalState {
  ok?: boolean;
  message?: string;
  receipt?: { id: string; receivedAt: string };
}

const schema = z.object({
  name: z.string().trim().min(2, "Vul je naam in").max(120),
  email: z.string().trim().toLowerCase().email("Vul een geldig e-mailadres in").max(200),
  orderReference: z.string().trim().min(2, "Vul je bestelnummer of besteldatum in").max(200),
  message: z.string().trim().max(2000).optional(),
});

/** Verwerkt een herroeping (art. 6:230o e.v. BW, herroepingsfunctie). */
export async function submitWithdrawal(_prev: WithdrawalState, formData: FormData): Promise<WithdrawalState> {
  const parsed = schema.safeParse({
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
    await sendMail(withdrawalConfirmationEmail({ to: input.email, ...input, receivedAt, id }));
    await sendMail(
      adminNotificationEmail(
        "Herroeping ontvangen",
        {
          Naam: input.name,
          "E-mail": input.email,
          Bestelling: input.orderReference,
          Toelichting: input.message,
          Kenmerk: id,
        },
        input.email,
      ),
    );
  } catch (err) {
    console.error("Herroeping verwerken mislukt", err);
    return { ok: false, message: "Er ging iets mis. Probeer het opnieuw of stuur je herroeping per e-mail." };
  }
  return { ok: true, receipt: { id, receivedAt: receivedAt.toISOString() } };
}

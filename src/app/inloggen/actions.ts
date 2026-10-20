"use server";

import { z } from "zod";
import { loginUrl } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { adminNotificationEmail, loginEmail, sendMail } from "@/lib/email";
import { getCustomerByEmail } from "@/lib/repo";
import type { FormState } from "@/components/forms/FormStatus";

const emailSchema = z.string().trim().toLowerCase().email("Vul een geldig e-mailadres in");

/**
 * Stuurt een inloglink. We geven altijd dezelfde melding, zodat niet te zien
 * is of een e-mailadres klant bij ons is.
 */
export async function requestLoginLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { ok: false, message: email.error.issues[0]?.message };
  const purpose = formData.get("doel") === "opzeggen" ? "opzeggen" : "inloggen";
  const reason = String(formData.get("reden") ?? "").slice(0, 1000);

  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Inloggen is nog niet beschikbaar. Neem contact met ons op." };
  }
  try {
    const customer = await getCustomerByEmail(email.data);
    if (customer) {
      const link = await loginUrl(customer.id);
      await sendMail(loginEmail({ to: customer.email, name: customer.name, link: purpose === "opzeggen" ? `${link}&naar=opzeggen` : link }));
    }
    if (purpose === "opzeggen") {
      // Vangnet: de beheerder krijgt elk opzegverzoek ook binnen.
      await sendMail(
        adminNotificationEmail("Opzegverzoek via de website", {
          "E-mail": email.data,
          "Bekende klant": customer ? "ja" : "nee (geen klant gevonden met dit adres)",
          Reden: reason || undefined,
        }),
      );
    }
  } catch (err) {
    console.error("Inloglink versturen mislukt", err);
    return { ok: false, message: "Er ging iets mis. Probeer het later opnieuw of neem contact met ons op." };
  }
  return {
    ok: true,
    message:
      purpose === "opzeggen"
        ? "Je opzegverzoek is ontvangen. Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een e-mail met een link waarmee je direct je abonnement opzegt. We bevestigen de opzegging altijd per e-mail."
        : "Check je inbox! Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een inloglink.",
  };
}

"use server";

import { z } from "zod";
import { loginUrl } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { adminNotificationEmail, loginEmail, sendMail } from "@/lib/email";
import { getCustomerByEmail } from "@/lib/repo";
import type { FormState } from "@/components/forms/FormStatus";
import { defineCopy } from "@/i18n/config";
import { requestLocale } from "@/i18n/server";

const copy = defineCopy({
  nl: {
    invalidEmail: "Vul een geldig e-mailadres in",
    unavailable: "Inloggen is nog niet beschikbaar. Neem contact met ons op.",
    failed: "Er ging iets mis. Probeer het later opnieuw of neem contact met ons op.",
    cancelReceived:
      "Je opzegverzoek is ontvangen. Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een e-mail met een link waarmee je direct je abonnement opzegt. We bevestigen de opzegging altijd per e-mail.",
    linkSent: "Check je inbox! Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een inloglink.",
  },
  en: {
    invalidEmail: "Please enter a valid email address",
    unavailable: "Logging in isn't available yet. Please get in touch with us.",
    failed: "Something went wrong. Please try again later or get in touch with us.",
    cancelReceived:
      "We've received your cancellation request. If this email address is known to us, you'll receive an email within a few minutes with a link to cancel your subscription straight away. We always confirm the cancellation by email.",
    linkSent: "Check your inbox! If this email address is known to us, you'll receive a login link within a few minutes.",
  },
});

const emailSchema = (message: string) => z.string().trim().toLowerCase().email(message);

/**
 * Stuurt een inloglink. We geven altijd dezelfde melding, zodat niet te zien
 * is of een e-mailadres klant bij ons is.
 */
export async function requestLoginLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const l = await requestLocale();
  const c = copy[l];
  const email = emailSchema(c.invalidEmail).safeParse(formData.get("email"));
  if (!email.success) return { ok: false, message: email.error.issues[0]?.message };
  const purpose = formData.get("doel") === "opzeggen" ? "opzeggen" : "inloggen";
  const reason = String(formData.get("reden") ?? "").slice(0, 1000);

  if (!isDatabaseConfigured()) {
    return { ok: false, message: c.unavailable };
  }
  try {
    const customer = await getCustomerByEmail(email.data);
    if (customer) {
      const link = await loginUrl(customer.id, undefined, l);
      await sendMail(
        loginEmail({ to: customer.email, name: customer.name, link: purpose === "opzeggen" ? `${link}&naar=opzeggen` : link }, l),
      );
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
    return { ok: false, message: c.failed };
  }
  return { ok: true, message: purpose === "opzeggen" ? c.cancelReceived : c.linkSent };
}

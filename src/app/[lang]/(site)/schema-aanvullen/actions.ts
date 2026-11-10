"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { defineCopy, localePath } from "@/i18n/config";
import { requestLocale } from "@/i18n/server";
import { isDatabaseConfigured, loadStoredConfig } from "@/lib/db";
import { createFirstPeriodPlans } from "@/lib/details";
import { recordFunnelEvent } from "@/lib/funnel";
import { DETAIL_FIELDS, intakeMessage, intakeSchema } from "@/lib/intake";
import { processOrderPlans } from "@/lib/plans";
import { completeIntakeDetails, getIntake, getOrderByIntake } from "@/lib/repo";
import { checkSafety } from "@/lib/safety";

export interface DetailsState {
  error?: string;
}

const copy = defineCopy({
  nl: {
    badPayload: "Er ging iets mis met je antwoorden. Vernieuw de pagina en probeer het opnieuw.",
    notFound: "We konden je bestelling niet vinden. Gebruik de link uit je e-mail, of neem contact met ons op.",
    unavailable: "Dit lukt nu even niet. Probeer het over een paar minuten opnieuw.",
    checkAnswers: "Controleer je antwoorden.",
  },
  en: {
    badPayload: "Something went wrong with your answers. Please refresh the page and try again.",
    notFound: "We couldn't find your order. Please use the link from your email, or get in touch with us.",
    unavailable: "This isn't working right now. Please try again in a few minutes.",
    checkAnswers: "Please check your answers.",
  },
});

const payloadSchema = z.object({
  intakeId: z.string().regex(/^[0-9a-f-]{36}$/i),
  intake: z.record(z.string(), z.unknown()),
});

/**
 * Korte route: de klant heeft betaald en vult nu de rest van de vragenlijst in.
 * Alleen de aanvullende vragen tellen (geslacht, leeftijd, activiteit, eten,
 * training); doel, lengte, gewicht en de gezondheidscheck blijven zoals bij het
 * betalen. Daarna maken we het eerste schema (binnen 2 uur klaar).
 */
export async function completeDetails(_prev: DetailsState, formData: FormData): Promise<DetailsState> {
  const locale = await requestLocale();
  const c = copy[locale];
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: c.badPayload };
  }
  const payload = payloadSchema.safeParse(raw);
  if (!payload.success) return { error: c.badPayload };

  await loadStoredConfig();
  if (!isDatabaseConfigured()) return { error: c.unavailable };

  const { intakeId } = payload.data;
  const row = await getIntake(intakeId);
  const order = row ? await getOrderByIntake(intakeId) : null;
  if (!row || !order) return { error: c.notFound };
  if (!row.details_pending) redirect(localePath(locale, `/bedankt?bestelling=${intakeId}`));

  const answers = payload.data.intake;
  const details = Object.fromEntries(DETAIL_FIELDS.filter((k) => k in answers).map((k) => [k, answers[k]]));
  const merged = intakeSchema.safeParse({ ...row.data, ...details, product: order.product });
  if (!merged.success) return { error: intakeMessage(merged.error.issues[0]?.message ?? c.checkAnswers, locale) };
  const safety = checkSafety(merged.data, locale);
  if (!safety.ok) return { error: safety.reason };

  try {
    // Maar één keer: twee keer versturen maakt geen dubbele schema's.
    if (await completeIntakeDetails(intakeId, merged.data)) {
      await createFirstPeriodPlans(order, row.start_day);
      await recordFunnelEvent({
        visitId: row.visit_id,
        event: "details_complete",
        product: order.product,
        duration: order.duration,
        locale: row.locale,
        device: row.device,
        source: row.campaign?.source ?? null,
        campaign: row.campaign?.campaign ?? null,
        landing: row.campaign?.landing ?? null,
      });
      after(() => processOrderPlans(order.id));
    }
  } catch (err) {
    console.error("Vragenlijst aanvullen mislukt", err);
    return { error: c.unavailable };
  }
  redirect(localePath(locale, `/bedankt?bestelling=${intakeId}`));
}

"use server";

import { after } from "next/server";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { currentCustomer, endSession } from "@/lib/auth";
import { checkinOptions, checkinWindow, type CheckinData } from "@/lib/checkin";
import { processOrderPlans, startNextPeriod } from "@/lib/plans";
import {
  addCheckin,
  createGuaranteeRequest,
  ordersForCustomer,
  plansForOrder,
  setCustomerLocale,
  setWeeklyReminders,
} from "@/lib/repo";
import { processWeeklyLog, recordWeeklyLog, weeklyWindowForOrder } from "@/lib/weekly-server";
import type { WeeklyData } from "@/lib/weekly";
import { billingPortalUrl, cancelSubscription as cancelStripeSubscription, resumeSubscription } from "@/lib/stripe";
import { syncSubscription } from "@/lib/fulfillment";
import { adminNotificationEmail, cancellationEmail, guaranteeRequestEmail, sendMail } from "@/lib/email";
import { guaranteeAvailable, guaranteeOrder } from "@/lib/guarantee";
import { durations, isSubscription, productFor, products } from "@/config/pricing";
import { euro, formatDate } from "@/lib/format";
import { defineCopy, localePath, type Locale } from "@/i18n/config";
import { requestLocale } from "@/i18n/server";
import { goalOptions } from "@/lib/intake";
import type { FormState } from "@/components/forms/FormStatus";

const copy = defineCopy({
  nl: {
    loggedOut: "Je bent niet (meer) ingelogd. Log opnieuw in en probeer het nog eens.",
    noSubscription: "We konden je abonnement niet vinden. Ververs de pagina en probeer het opnieuw.",
    checkinClosed: "Deze check-in is niet (meer) open. Ververs de pagina om je actuele status te zien.",
    checkinUpcoming: "Je check-in is nog niet open. Je krijgt een e-mail zodra je hem kunt invullen.",
    checkinInvalid: "Vul alle verplichte vragen in. Je gewicht noteer je in kilo's, bijvoorbeeld 74,5.",
    noPlan: "We konden je schema niet vinden. Ververs de pagina en probeer het opnieuw.",
    weeklyClosed: "Dit weegmoment is niet (meer) open. Ververs de pagina om je actuele status te zien.",
    weeklyInvalid: "Vul je gewicht in kilo's in, bijvoorbeeld 74,5.",
    guaranteeClosed: "De garantietermijn is verstreken of je hebt de garantie al aangevraagd. Ververs de pagina om je actuele status te zien.",
    guaranteeConfirm: "Vink aan dat je je eerste betaling terug wilt en dat je abonnement daarmee stopt.",
    guaranteeConfirmOneOff: "Vink aan dat je je betaling terug wilt.",
  },
  en: {
    loggedOut: "You're not logged in (anymore). Please log in again and try once more.",
    noSubscription: "We couldn't find your subscription. Refresh the page and try again.",
    checkinClosed: "This check-in isn't open (anymore). Refresh the page to see your current status.",
    checkinUpcoming: "Your check-in isn't open yet. We'll email you as soon as you can complete it.",
    checkinInvalid: "Please answer all required questions. Enter your weight in kilos, for example 74.5.",
    noPlan: "We couldn't find your plan. Refresh the page and try again.",
    weeklyClosed: "This weekly weigh-in isn't open (anymore). Refresh the page to see your current status.",
    weeklyInvalid: "Enter your weight in kilos, for example 74.5.",
    guaranteeClosed: "The guarantee period has ended or you've already made a request. Refresh the page to see your current status.",
    guaranteeConfirm: "Please tick the box to confirm you want your first payment back and that this ends your subscription.",
    guaranteeConfirmOneOff: "Please tick the box to confirm you want your payment back.",
  },
});

export async function openBillingPortal(): Promise<void> {
  const l = await requestLocale();
  const customer = await currentCustomer();
  if (!customer) redirect(localePath(l, "/inloggen"));
  if (!customer.stripe_customer_id) redirect(localePath(l, "/contact"));
  const url = await billingPortalUrl(customer.stripe_customer_id, "/account/abonnement", l);
  redirect(url);
}

/** Zoekt een bestelling van de ingelogde klant op basis van het order-ID uit het formulier. */
async function ownSubscriptionOrder(formData: FormData, l: Locale) {
  const customer = await currentCustomer();
  if (!customer) redirect(localePath(l, "/inloggen"));
  const orderId = String(formData.get("order") ?? "");
  const order = (await ordersForCustomer(customer.id)).find((o) => o.id === orderId);
  if (!order?.stripe_subscription_id) redirect(localePath(l, "/account"));
  return { customer, order, subscriptionId: order.stripe_subscription_id };
}

export async function cancelSubscription(formData: FormData): Promise<void> {
  const l = await requestLocale();
  const { customer, order, subscriptionId } = await ownSubscriptionOrder(formData, l);
  const subscription = await cancelStripeSubscription(subscriptionId, order.duration);
  await syncSubscription(subscription);
  const periodEnd = subscription.cancel_at ?? subscription.items.data[0]?.current_period_end ?? null;
  await sendMail(
    cancellationEmail(
      {
        to: customer.email,
        name: customer.name,
        productName: productFor(order.product, l).name,
        endsAt: periodEnd ? new Date(periodEnd * 1000) : null,
      },
      l,
    ),
  ).catch((err) => console.error("Opzegbevestiging versturen mislukt", err));
  redirect(localePath(l, "/account/abonnement?opgezegd=1"));
}

export async function undoCancellation(formData: FormData): Promise<void> {
  const l = await requestLocale();
  const { subscriptionId } = await ownSubscriptionOrder(formData, l);
  const subscription = await resumeSubscription(subscriptionId);
  await syncSubscription(subscription);
  redirect(localePath(l, "/account/abonnement"));
}

const choice = (options: readonly string[]) => z.enum(options as [string, ...string[]]);
const text = (max: number) => z.string().trim().max(max).optional();

const baseCheckin = z.object({
  weightKg: z.coerce.number().min(35).max(300),
  waistCm: z.coerce.number().min(40).max(200).optional(),
  energy: choice(checkinOptions.energy),
  sleep: choice(checkinOptions.sleep),
  goal: z.enum(Object.keys(goalOptions) as [keyof typeof goalOptions, ...(keyof typeof goalOptions)[]]).optional(),
  comments: text(1000),
});
const nutritionCheckin = z.object({
  nutritionAdherence: choice(checkinOptions.nutritionAdherence),
  hunger: choice(checkinOptions.hunger),
  likedMeals: text(500),
  dislikedMeals: text(500),
});
const trainingCheckin = z.object({
  trainingAdherence: choice(checkinOptions.trainingAdherence),
  difficulty: choice(checkinOptions.difficulty),
  trainingDays: z.coerce.number().int().min(2).max(6).optional(),
  injuries: text(300),
});

/**
 * Slaat de verplichte check-in op en start direct het nieuwe schema voor de
 * volgende periode. Kan alleen als de check-in voor dit abonnement open staat.
 */
export async function submitCheckin(_prev: FormState, formData: FormData): Promise<FormState> {
  const l = await requestLocale();
  const c = copy[l];
  const customer = await currentCustomer();
  if (!customer) return { ok: false, message: c.loggedOut };
  const order = (await ordersForCustomer(customer.id)).find((o) => o.id === String(formData.get("order") ?? ""));
  if (!order) return { ok: false, message: c.noSubscription };

  const plans = await plansForOrder(order.id);
  const lastSeq = plans.reduce((m, p) => Math.max(m, p.seq), 0);
  const lastStart = plans
    .filter((p) => p.seq === lastSeq)
    .reduce<Date | null>((min, p) => (!min || p.created_at < min ? p.created_at : min), null);
  const window = checkinWindow({
    duration: order.duration,
    status: order.status,
    cancelAt: order.cancel_at,
    lastSeq,
    lastPeriodStart: lastStart,
    submittedForNext: false,
    now: Date.now(),
  });
  if (!window || window.seq !== Number(formData.get("periode"))) {
    return { ok: false, message: c.checkinClosed };
  }
  if (window.status === "upcoming") {
    return { ok: false, message: c.checkinUpcoming };
  }

  const value = (k: string) => {
    const v = formData.get(k);
    return v === null || String(v).trim() === "" ? undefined : String(v).trim();
  };
  const number = (k: string) => value(k)?.replace(",", ".");
  const includes = products[order.product].includes;
  const parsed = baseCheckin
    .merge(includes.includes("voeding") ? nutritionCheckin : z.object({}))
    .merge(includes.includes("training") ? trainingCheckin : z.object({}))
    .safeParse({
      weightKg: number("weightKg"),
      waistCm: number("waistCm"),
      energy: value("energy"),
      sleep: value("sleep"),
      goal: value("goal"),
      comments: value("comments"),
      nutritionAdherence: value("nutritionAdherence"),
      hunger: value("hunger"),
      likedMeals: value("likedMeals"),
      dislikedMeals: value("dislikedMeals"),
      trainingAdherence: value("trainingAdherence"),
      difficulty: value("difficulty"),
      trainingDays: value("trainingDays"),
      injuries: value("injuries"),
    });
  if (!parsed.success) {
    return { ok: false, message: c.checkinInvalid };
  }

  // Het nieuwe schema en de e-mails volgen de taal waarin de klant de site nu gebruikt.
  await setCustomerLocale(customer.id, l);
  // Dubbel verstuurd? Dan bestaat de check-in al; het schema starten is veilig om te herhalen.
  await addCheckin(customer.id, order.id, window.seq, parsed.data as CheckinData);
  await startNextPeriod(order, window.seq);
  after(() => processOrderPlans(order.id));
  redirect(localePath(l, "/account?checkin=ontvangen"));
}

const weeklySchema = z.object({
  weightKg: z.coerce.number().min(35).max(300),
  waistCm: z.coerce.number().min(40).max(200).optional(),
  energy: choice(checkinOptions.energy).optional(),
  hunger: choice(checkinOptions.hunger).optional(),
  nutritionAdherence: choice(checkinOptions.nutritionAdherence).optional(),
  trainingAdherence: choice(checkinOptions.trainingAdherence).optional(),
  difficulty: choice(checkinOptions.difficulty).optional(),
  comments: text(500),
});

/**
 * Slaat het wekelijkse weegmoment op. Wijkt de voortgang af, dan wordt het
 * schema voor de rest van de periode bijgestuurd; de concrete aanwijzingen
 * worden op de achtergrond gemaakt.
 */
export async function submitWeeklyLog(_prev: FormState, formData: FormData): Promise<FormState> {
  const l = await requestLocale();
  const c = copy[l];
  const customer = await currentCustomer();
  if (!customer) return { ok: false, message: c.loggedOut };
  const order = (await ordersForCustomer(customer.id)).find((o) => o.id === String(formData.get("order") ?? ""));
  if (!order) return { ok: false, message: c.noPlan };
  const { window } = await weeklyWindowForOrder(order);
  if (!window || window.status !== "open" || window.seq !== Number(formData.get("periode")) || window.week !== Number(formData.get("week"))) {
    return { ok: false, message: c.weeklyClosed };
  }
  const value = (k: string) => {
    const v = formData.get(k);
    return v === null || String(v).trim() === "" ? undefined : String(v).trim();
  };
  const parsed = weeklySchema.safeParse({
    weightKg: value("weightKg")?.replace(",", "."),
    waistCm: value("waistCm")?.replace(",", "."),
    energy: value("energy"),
    hunger: value("hunger"),
    nutritionAdherence: value("nutritionAdherence"),
    trainingAdherence: value("trainingAdherence"),
    difficulty: value("difficulty"),
    comments: value("comments"),
  });
  if (!parsed.success) return { ok: false, message: c.weeklyInvalid };
  // De aanwijzingen en e-mails volgen de taal waarin de klant de site nu gebruikt.
  await setCustomerLocale(customer.id, l);
  const { id, needsInstructions } = await recordWeeklyLog({
    customer: { ...customer, locale: l },
    order,
    seq: window.seq,
    week: window.week,
    data: parsed.data as WeeklyData,
  });
  if (id && needsInstructions) after(() => processWeeklyLog(id));
  redirect(localePath(l, "/account/check-in?weegmoment=opgeslagen#weegmoment"));
}

/**
 * Tevredenheidsgarantie: de klant vraagt binnen de termijn de eerste betaling
 * terug. We leggen de aanvraag vast en mailen klant en beheerder; de beheerder
 * betaalt terug en beëindigt het abonnement in Stripe (zie /beheer/herroepingen).
 */
export async function requestGuarantee(_prev: FormState, formData: FormData): Promise<FormState> {
  const l = await requestLocale();
  const c = copy[l];
  const customer = await currentCustomer();
  if (!customer) return { ok: false, message: c.loggedOut };
  const order = guaranteeOrder(await ordersForCustomer(customer.id));
  if (!order || order.id !== String(formData.get("order") ?? "") || !guaranteeAvailable(order)) {
    return { ok: false, message: c.guaranteeClosed };
  }
  const subscription = isSubscription(order.duration);
  if (formData.get("bevestig") !== "ja") {
    return { ok: false, message: subscription ? c.guaranteeConfirm : c.guaranteeConfirmOneOff };
  }
  const reason = String(formData.get("reden") ?? "").trim().slice(0, 1000) || undefined;
  const request = await createGuaranteeRequest({ customerId: customer.id, orderId: order.id, reason });
  if (!request) return { ok: false, message: c.guaranteeClosed };

  const reference = order.id.slice(0, 8).toUpperCase();
  const product = productFor(order.product, l).name;
  await Promise.all([
    sendMail(
      guaranteeRequestEmail(
        { to: customer.email, name: customer.name, reference, productName: product, amountCents: order.amount_cents, subscription },
        l,
      ),
    ),
    sendMail(
      adminNotificationEmail(
        "Garantie-aanvraag ontvangen",
        {
          Naam: customer.name,
          "E-mail": customer.email,
          Bestelling: `${reference} · ${productFor(order.product, "nl").name} · ${durations[order.duration].label} · besteld op ${formatDate(order.created_at)}`,
          "Terug te betalen": `${euro(order.amount_cents)} (eerste betaling)`,
          Abonnement: order.stripe_subscription_id
            ? `${order.stripe_subscription_id}: direct beëindigen in Stripe`
            : subscription
              ? "Nog geen Stripe-abonnement bekend"
              : undefined,
          Reden: reason,
          Taal: l === "en" ? "Engels" : undefined,
        },
        customer.email,
      ),
    ),
  ]).catch((err) => console.error("Garantie-aanvraag mailen mislukt", err));
  redirect(localePath(l, "/account/abonnement?garantie=aangevraagd#garantie"));
}

/** Wekelijkse herinnering per e-mail aan- of uitzetten. */
export async function setWeeklyReminderPreference(formData: FormData): Promise<void> {
  const customer = await currentCustomer();
  if (!customer) redirect(localePath(await requestLocale(), "/inloggen"));
  await setWeeklyReminders(customer.id, formData.get("aan") === "1");
  // Zelfde pagina: alleen opnieuw laden, zodat de nieuwe instelling zichtbaar is.
  refresh();
}

export async function logout(): Promise<void> {
  const l = await requestLocale();
  await endSession();
  redirect(localePath(l, "/"));
}

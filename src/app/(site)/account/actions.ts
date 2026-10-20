"use server";

import { after } from "next/server";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { currentCustomer, endSession } from "@/lib/auth";
import { checkinOptions, checkinWindow, type CheckinData } from "@/lib/checkin";
import { processOrderPlans, startNextPeriod } from "@/lib/plans";
import { addCheckin, ordersForCustomer, plansForOrder, setWeeklyReminders } from "@/lib/repo";
import { processWeeklyLog, recordWeeklyLog, weeklyWindowForOrder } from "@/lib/weekly-server";
import type { WeeklyData } from "@/lib/weekly";
import { billingPortalUrl, cancelSubscription as cancelStripeSubscription, resumeSubscription } from "@/lib/stripe";
import { syncSubscription } from "@/lib/fulfillment";
import { cancellationEmail, sendMail } from "@/lib/email";
import { products } from "@/config/pricing";
import { goalOptions } from "@/lib/intake";
import type { FormState } from "@/components/forms/FormStatus";

export async function openBillingPortal(): Promise<void> {
  const customer = await currentCustomer();
  if (!customer) redirect("/inloggen");
  if (!customer.stripe_customer_id) redirect("/contact");
  const url = await billingPortalUrl(customer.stripe_customer_id);
  redirect(url);
}

/** Zoekt een bestelling van de ingelogde klant op basis van het order-ID uit het formulier. */
async function ownSubscriptionOrder(formData: FormData) {
  const customer = await currentCustomer();
  if (!customer) redirect("/inloggen");
  const orderId = String(formData.get("order") ?? "");
  const order = (await ordersForCustomer(customer.id)).find((o) => o.id === orderId);
  if (!order?.stripe_subscription_id) redirect("/account");
  return { customer, order, subscriptionId: order.stripe_subscription_id };
}

export async function cancelSubscription(formData: FormData): Promise<void> {
  const { customer, order, subscriptionId } = await ownSubscriptionOrder(formData);
  const subscription = await cancelStripeSubscription(subscriptionId, order.duration);
  await syncSubscription(subscription);
  const periodEnd = subscription.cancel_at ?? subscription.items.data[0]?.current_period_end ?? null;
  await sendMail(
    cancellationEmail({
      to: customer.email,
      name: customer.name,
      productName: products[order.product].name,
      endsAt: periodEnd ? new Date(periodEnd * 1000) : null,
    }),
  ).catch((err) => console.error("Opzegbevestiging versturen mislukt", err));
  redirect("/account/abonnement?opgezegd=1");
}

export async function undoCancellation(formData: FormData): Promise<void> {
  const { subscriptionId } = await ownSubscriptionOrder(formData);
  const subscription = await resumeSubscription(subscriptionId);
  await syncSubscription(subscription);
  redirect("/account/abonnement");
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
  const customer = await currentCustomer();
  if (!customer) return { ok: false, message: "Je bent niet (meer) ingelogd. Log opnieuw in en probeer het nog eens." };
  const order = (await ordersForCustomer(customer.id)).find((o) => o.id === String(formData.get("order") ?? ""));
  if (!order) return { ok: false, message: "We konden je abonnement niet vinden. Ververs de pagina en probeer het opnieuw." };

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
    return { ok: false, message: "Deze check-in is niet (meer) open. Ververs de pagina om je actuele status te zien." };
  }
  if (window.status === "upcoming") {
    return { ok: false, message: "Je check-in is nog niet open. Je krijgt een e-mail zodra je hem kunt invullen." };
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
    return {
      ok: false,
      message: "Vul alle verplichte vragen in. Je gewicht noteer je in kilo's, bijvoorbeeld 74,5.",
    };
  }

  // Dubbel verstuurd? Dan bestaat de check-in al; het schema starten is veilig om te herhalen.
  await addCheckin(customer.id, order.id, window.seq, parsed.data as CheckinData);
  await startNextPeriod(order, window.seq);
  after(() => processOrderPlans(order.id));
  redirect("/account?checkin=ontvangen");
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
  const customer = await currentCustomer();
  if (!customer) return { ok: false, message: "Je bent niet (meer) ingelogd. Log opnieuw in en probeer het nog eens." };
  const order = (await ordersForCustomer(customer.id)).find((o) => o.id === String(formData.get("order") ?? ""));
  if (!order) return { ok: false, message: "We konden je schema niet vinden. Ververs de pagina en probeer het opnieuw." };
  const { window } = await weeklyWindowForOrder(order);
  if (!window || window.status !== "open" || window.seq !== Number(formData.get("periode")) || window.week !== Number(formData.get("week"))) {
    return { ok: false, message: "Dit weegmoment is niet (meer) open. Ververs de pagina om je actuele status te zien." };
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
  if (!parsed.success) return { ok: false, message: "Vul je gewicht in kilo's in, bijvoorbeeld 74,5." };
  const { id, needsInstructions } = await recordWeeklyLog({
    customer,
    order,
    seq: window.seq,
    week: window.week,
    data: parsed.data as WeeklyData,
  });
  if (id && needsInstructions) after(() => processWeeklyLog(id));
  redirect("/account/check-in?weegmoment=opgeslagen#weegmoment");
}

/** Wekelijkse herinnering per e-mail aan- of uitzetten. */
export async function setWeeklyReminderPreference(formData: FormData): Promise<void> {
  const customer = await currentCustomer();
  if (!customer) redirect("/inloggen");
  await setWeeklyReminders(customer.id, formData.get("aan") === "1");
  // Zelfde pagina: alleen opnieuw laden, zodat de nieuwe instelling zichtbaar is.
  refresh();
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/");
}

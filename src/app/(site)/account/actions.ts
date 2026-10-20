"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { currentCustomer, endSession } from "@/lib/auth";
import { addCheckin, ordersForCustomer } from "@/lib/repo";
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
  redirect("/account?opgezegd=1");
}

export async function undoCancellation(formData: FormData): Promise<void> {
  const { subscriptionId } = await ownSubscriptionOrder(formData);
  const subscription = await resumeSubscription(subscriptionId);
  await syncSubscription(subscription);
  redirect("/account");
}

const checkinSchema = z.object({
  weightKg: z.coerce.number().min(35).max(300).optional(),
  energy: z.string().max(50).optional(),
  hunger: z.string().max(50).optional(),
  difficulty: z.string().max(50).optional(),
  goal: z.enum(Object.keys(goalOptions) as [keyof typeof goalOptions, ...(keyof typeof goalOptions)[]]).optional(),
  comments: z.string().trim().max(1000).optional(),
});

export async function submitCheckin(_prev: FormState, formData: FormData): Promise<FormState> {
  const customer = await currentCustomer();
  if (!customer) return { ok: false, message: "Je bent niet (meer) ingelogd." };
  const value = (k: string) => {
    const v = formData.get(k);
    return v === null || v === "" ? undefined : String(v).replace(",", ".");
  };
  const parsed = checkinSchema.safeParse({
    weightKg: value("weightKg"),
    energy: value("energy"),
    hunger: value("hunger"),
    difficulty: value("difficulty"),
    goal: value("goal"),
    comments: value("comments"),
  });
  if (!parsed.success) return { ok: false, message: "Controleer je invoer (gewicht in kilo's, bijv. 74,5)." };
  await addCheckin(customer.id, parsed.data);
  return {
    ok: true,
    message: "Dank je! Je check-in is opgeslagen. Je volgende schema wordt hierop afgestemd.",
  };
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/");
}

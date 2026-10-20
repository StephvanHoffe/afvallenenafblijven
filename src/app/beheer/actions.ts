"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { products } from "@/config/pricing";
import { endAdminSession, isAdminConfigured, isDemoMode, passwordMatches, requireAdmin, startAdminSession } from "@/lib/admin/auth";
import { loginUrl } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminNotificationEmail, cancellationEmail, loginEmail, plansReadyEmail, sendMail } from "@/lib/email";
import { syncSubscription } from "@/lib/fulfillment";
import { processOrderPlans, processPlan, startNextPeriod } from "@/lib/plans";
import { getCustomer, getOrder, plansForOrder } from "@/lib/repo";
import { cancelSubscription } from "@/lib/stripe";

export interface LoginState {
  error?: string;
}

/** Terug naar de pagina waar de actie vandaan kwam, met een melding. */
function back(formData: FormData, melding: string): never {
  const raw = String(formData.get("terug") ?? "/beheer");
  const path = raw.startsWith("/beheer") ? raw.split("?")[0] : "/beheer";
  redirect(`${path}?melding=${melding}`);
}

async function guard(formData: FormData): Promise<void> {
  await requireAdmin();
  if (isDemoMode()) back(formData, "demo");
}

export async function adminLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (isDemoMode()) redirect("/beheer");
  if (!isAdminConfigured()) {
    return { error: "Stel eerst ADMIN_PASSWORD in (minimaal 12 tekens) bij je hosting." };
  }
  if (!passwordMatches(String(formData.get("wachtwoord") ?? ""))) {
    // Vertraging maakt raden van het wachtwoord onaantrekkelijk.
    await new Promise((r) => setTimeout(r, 1200));
    return { error: "Onjuist wachtwoord." };
  }
  await startAdminSession();
  redirect("/beheer");
}

export async function adminLogout(): Promise<void> {
  await endAdminSession();
  redirect("/beheer/inloggen");
}

/** Zet een (mislukt of bestaand) schema terug in de wachtrij en maakt het opnieuw. */
export async function retryPlan(formData: FormData): Promise<void> {
  await guard(formData);
  const planId = String(formData.get("plan") ?? "");
  const sql = await db();
  const [row] = await sql<{ id: string }[]>`
    update plans set status = 'pending', attempts = 0, error = null, started_at = null
    where id = ${planId} and status <> 'generating' returning id`;
  if (!row) back(formData, "niet-gevonden");
  after(() => processPlan(planId));
  back(formData, "opnieuw-gestart");
}

/** Stuurt de "je schema staat klaar"-mail opnieuw voor de periode van dit schema. */
export async function resendPlanEmail(formData: FormData): Promise<void> {
  await guard(formData);
  const planId = String(formData.get("plan") ?? "");
  const sql = await db();
  const [plan] = await sql<{ order_id: string; seq: number; customer_id: string }[]>`
    select order_id, seq, customer_id from plans where id = ${planId}`;
  const customer = plan ? await getCustomer(plan.customer_id) : null;
  if (!plan || !customer) back(formData, "niet-gevonden");
  const period = (await plansForOrder(plan.order_id)).filter((p) => p.seq === plan.seq && p.status === "ready");
  if (period.length === 0) back(formData, "nog-niet-klaar");
  await sendMail(
    plansReadyEmail({
      to: customer.email,
      name: customer.name,
      types: period.map((p) => p.type),
      link: await loginUrl(customer.id),
      seq: plan.seq,
    }),
  );
  back(formData, "mail-verstuurd");
}

export async function sendCustomerLoginLink(formData: FormData): Promise<void> {
  await guard(formData);
  const customer = await getCustomer(String(formData.get("klant") ?? ""));
  if (!customer) back(formData, "niet-gevonden");
  await sendMail(loginEmail({ to: customer.email, name: customer.name, link: await loginUrl(customer.id) }));
  back(formData, "inloglink-verstuurd");
}

/** Zegt een abonnement op namens de klant (bijv. na een opzegverzoek per e-mail). */
export async function adminCancelSubscription(formData: FormData): Promise<void> {
  await guard(formData);
  const order = await getOrder(String(formData.get("bestelling") ?? ""));
  const customer = order ? await getCustomer(order.customer_id) : null;
  if (!order?.stripe_subscription_id || !customer) back(formData, "niet-gevonden");
  const subscription = await cancelSubscription(order.stripe_subscription_id, order.duration);
  await syncSubscription(subscription);
  const end = subscription.cancel_at ?? subscription.items.data[0]?.current_period_end ?? null;
  await sendMail(
    cancellationEmail({
      to: customer.email,
      name: customer.name,
      productName: products[order.product].name,
      endsAt: end ? new Date(end * 1000) : null,
    }),
  );
  back(formData, "opgezegd");
}

/**
 * Start de volgende periode zonder check-in, bijvoorbeeld als de klant zijn
 * gegevens per e-mail heeft doorgegeven. Het schema bouwt dan voort op de
 * vorige gegevens.
 */
export async function startPeriodWithoutCheckin(formData: FormData): Promise<void> {
  await guard(formData);
  const order = await getOrder(String(formData.get("bestelling") ?? ""));
  if (!order || order.status !== "active" || order.duration === "eenmalig") back(formData, "niet-gevonden");
  const plans = await plansForOrder(order.id);
  const next = plans.reduce((m, p) => Math.max(m, p.seq), 0) + 1;
  if (!(await startNextPeriod(order, next))) back(formData, "niet-gevonden");
  after(() => processOrderPlans(order.id));
  back(formData, "periode-gestart");
}

/** Verwijdert een klant en alle bijbehorende gegevens (AVG-verzoek). */
export async function deleteCustomer(formData: FormData): Promise<void> {
  await guard(formData);
  if (String(formData.get("bevestiging") ?? "").trim() !== "VERWIJDER") back(formData, "bevestig-verwijderen");
  const customerId = String(formData.get("klant") ?? "");
  const sql = await db();
  const active = await sql`
    select 1 from orders where customer_id = ${customerId} and status in ('active', 'past_due') and duration <> 'eenmalig'`;
  if (active.length > 0) back(formData, "eerst-opzeggen");
  await sql`delete from customers where id = ${customerId}`;
  redirect("/beheer/klanten?melding=verwijderd");
}

export async function markWithdrawalHandled(formData: FormData): Promise<void> {
  await guard(formData);
  const sql = await db();
  await sql`update withdrawals set handled_at = now() where id = ${String(formData.get("herroeping") ?? "")}`;
  back(formData, "afgehandeld");
}

export async function sendTestEmail(formData: FormData): Promise<void> {
  await guard(formData);
  const sent = await sendMail(
    adminNotificationEmail("Testmail", {
      Bericht: "Deze testmail laat zien dat het versturen van e-mail vanaf de website werkt.",
    }),
  ).catch(() => false);
  back(formData, sent ? "testmail-verstuurd" : "testmail-mislukt");
}

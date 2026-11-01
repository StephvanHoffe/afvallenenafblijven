"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { DURATION_IDS, PRODUCT_IDS, isProductId, productFor, type DurationId, type ProductId } from "@/config/pricing";
import { site } from "@/config/site";
import { localeUrl, toLocale, type Locale } from "@/i18n/config";
import {
  MIN_PASSWORD_LENGTH,
  endAdminSession,
  isAdminConfigured,
  isDemoMode,
  mustChangePassword,
  passwordMatches,
  requireAdmin,
  setAdminPassword,
  startAdminSession,
} from "@/lib/admin/auth";
import { loginUrl } from "@/lib/auth";
import { db, loadStoredConfig } from "@/lib/db";
import {
  MAIL_KINDS,
  adminEmail,
  adminNotificationEmail,
  cancellationEmail,
  checkoutReminderEmail,
  loginEmail,
  plansReadyEmail,
  sendMail,
  type MailKind,
} from "@/lib/email";
import { resetMailOverride, saveMailOverride, setAdminTopicMuted } from "@/lib/email-store";
import { adminTopicInfo, isAdminTopic } from "@/lib/admin-topics";
import { catalogEntry } from "@/lib/admin/mail-catalog";
import { describeDiscount, normalizeCode } from "@/lib/discounts";
import { createDiscountCode, deleteDiscountCode, setDiscountActive } from "@/lib/discounts-server";
import { customerSchema, intakeSchema } from "@/lib/intake";
import { recordPayment } from "@/lib/payments";
import { euro } from "@/lib/format";
import { processOrderPlans, processPlan, releaseAndNotify, startNextPeriod } from "@/lib/plans";
import { approvePlan as approvePlanInDb, getCustomer, getOrder, latestIntakeForCustomer, plansForOrder } from "@/lib/repo";
import { saveCheckoutReminderSettings, saveDeliverySettings, setPlanApproval } from "@/lib/settings";
import { cancelOrder, refundFirstPayment } from "@/lib/subscriptions";
import { connectionsForCustomer } from "@/lib/health/repo";
import { disconnect } from "@/lib/health/sync";
import { logAdminAction } from "@/lib/admin/log";
import { CONFIG_GROUPS, saveGroup, testGroup, type ConfigGroupId } from "@/lib/admin/koppelingen";
import { cancelReasonLabel, isCancelReason } from "@/lib/cancel-reasons";
import {
  AREA_LABELS,
  aiAdvice,
  generateAiAdvice,
  hideOpportunity as hideOpportunityInDb,
  markOpportunityDone as markOpportunityDoneInDb,
  showAllOpportunities as showAllOpportunitiesInDb,
  undoOpportunityDone as undoOpportunityDoneInDb,
  type KansArea,
} from "@/lib/admin/opportunities";
import { amsterdamLocalToDate } from "@/lib/dates";
import { instagramConfigured } from "@/lib/instagram/api";
import { SLIDE_KINDS, cleanHashtag, formatLabels, isPostFormat, postContentSchema, type Slide } from "@/lib/instagram/content";
import {
  createInstagramPost,
  deletePost,
  generateInstagramPost,
  publishInstagramPost,
  regeneratePost,
  schedulePost,
  unschedulePost,
  updatePostContent,
  type PublishChoice,
} from "@/lib/instagram/posts";

export interface LoginState {
  error?: string;
}

/** Terug naar de pagina waar de actie vandaan kwam, met een melding. */
function back(formData: FormData, melding: string): never {
  const raw = String(formData.get("terug") ?? "/beheer");
  // Filters in de terug-link (bijv. ?taal=en) blijven behouden; alleen de melding wordt vervangen.
  const url = new URL(raw.startsWith("/beheer") ? raw : "/beheer", "http://beheer.local");
  url.searchParams.set("melding", melding);
  redirect(`${url.pathname}?${url.searchParams.toString()}`);
}

async function guard(formData: FormData): Promise<void> {
  await requireAdmin();
  if (isDemoMode()) back(formData, "demo");
}

export async function adminLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (isDemoMode()) redirect("/beheer");
  if (!isAdminConfigured()) {
    return { error: "Koppel eerst de database bij je hosting (DATABASE_URL). Zie het stappenplan." };
  }
  let ok: boolean;
  try {
    ok = await passwordMatches(String(formData.get("wachtwoord") ?? ""));
  } catch (err) {
    console.error("Inloggen op beheer mislukt", err);
    return { error: "De database is niet bereikbaar. Controleer DATABASE_URL bij je hosting en probeer het opnieuw." };
  }
  if (!ok) {
    // Vertraging maakt raden van het wachtwoord onaantrekkelijk.
    await new Promise((r) => setTimeout(r, 1200));
    return { error: "Onjuist wachtwoord." };
  }
  await startAdminSession();
  // Met het startwachtwoord eerst een eigen wachtwoord kiezen.
  redirect((await mustChangePassword()) ? "/beheer/wachtwoord" : "/beheer");
}

export interface PasswordState {
  error?: string;
}

/** Een eigen beheerwachtwoord kiezen (verplicht na het startwachtwoord) of het wachtwoord wijzigen. */
export async function changeAdminPassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  await requireAdmin({ allowPasswordChange: true });
  if (isDemoMode()) return { error: "In de demo kun je het wachtwoord niet wijzigen." };
  const first = await mustChangePassword();
  const current = String(formData.get("huidig") ?? "");
  const next = String(formData.get("nieuw") ?? "");
  const repeat = String(formData.get("herhaal") ?? "");
  if (!first && !(await passwordMatches(current))) {
    await new Promise((r) => setTimeout(r, 1200));
    return { error: "Je huidige wachtwoord klopt niet." };
  }
  if (next.length < MIN_PASSWORD_LENGTH) return { error: `Kies een wachtwoord van minimaal ${MIN_PASSWORD_LENGTH} tekens.` };
  if (next !== repeat) return { error: "De twee nieuwe wachtwoorden zijn niet gelijk." };
  if (first && (await passwordMatches(next))) return { error: "Kies een ander wachtwoord dan het startwachtwoord." };
  await setAdminPassword(next);
  await logAdminAction(first ? "Eigen beheerwachtwoord ingesteld" : "Beheerwachtwoord gewijzigd");
  redirect(first ? "/beheer/koppelingen?welkom=1" : "/beheer/koppelingen?melding=wachtwoord-gewijzigd");
}

export async function adminLogout(): Promise<void> {
  await endAdminSession();
  redirect("/beheer/inloggen");
}

/**
 * Zet een (mislukt of bestaand) schema terug in de wachtrij en maakt het
 * opnieuw. Was het nog niet bij de klant, dan moet de nieuwe versie (als
 * goedkeuring aanstaat) opnieuw worden goedgekeurd.
 */
export async function retryPlan(formData: FormData): Promise<void> {
  await guard(formData);
  const planId = String(formData.get("plan") ?? "");
  // Met een aanwijzing ("minder vis", "hartiger ontbijt") maakt de AI het schema daarop aangepast opnieuw.
  const withInstruction = formData.has("aanwijzing");
  const instruction = String(formData.get("aanwijzing") ?? "").trim().slice(0, 1000) || null;
  const sql = await db();
  const [row] = await sql<{ id: string; customer_id: string; type: string; seq: number }[]>`
    update plans set status = 'pending', attempts = 0, error = null, started_at = null,
      admin_instruction = case when ${withInstruction} then ${instruction} else admin_instruction end,
      approved_at = case when released_at is null then null else approved_at end,
      review_requested_at = case when released_at is null then null else review_requested_at end
    where id = ${planId} and status <> 'generating' returning id, customer_id, type, seq`;
  if (!row) back(formData, "niet-gevonden");
  await logAdminAction(
    "Schema opnieuw gemaakt",
    `${row.type === "voeding" ? "Voeding" : "Training"} · periode ${row.seq}${instruction ? `, aanwijzing: ${instruction}` : ""}`,
    row.customer_id,
  );
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
  const period = (await plansForOrder(plan.order_id)).filter((p) => p.seq === plan.seq && p.status === "ready" && p.released_at);
  if (period.length === 0) back(formData, "nog-niet-klaar");
  const l = toLocale(customer.locale);
  await sendMail(
    plansReadyEmail({
      to: customer.email,
      name: customer.name,
      types: period.map((p) => p.type),
      link: await loginUrl(customer.id, undefined, l),
      seq: plan.seq,
      startsAt: period[0].starts_at,
      locale: l,
    }),
  );
  await logAdminAction("Schema-mail opnieuw verstuurd", `Periode ${plan.seq}`, customer.id);
  back(formData, "mail-verstuurd");
}

/**
 * Keurt een schema goed. Het gaat op het geplande moment naar de klant (of
 * direct als dat moment al voorbij is), samen met de andere schema's van de
 * periode. Met "nu" gaat het meteen.
 */
export async function approvePlan(formData: FormData): Promise<void> {
  await guard(formData);
  const now = formData.get("nu") === "1";
  const period = await approvePlanInDb(String(formData.get("plan") ?? ""), now);
  if (!period) back(formData, "niet-gevonden");
  const released = await releaseAndNotify({ orderId: period.order_id });
  const order = await getOrder(period.order_id);
  await logAdminAction(now ? "Schema direct naar de klant" : "Schema goedgekeurd", `Periode ${period.seq}`, order?.customer_id);
  back(formData, released > 0 ? "vrijgegeven" : "goedgekeurd");
}

/** Zet goedkeuren vóór levering aan of uit (zie /beheer/instellingen). */
export async function setApprovalMode(formData: FormData): Promise<void> {
  await guard(formData);
  const on = formData.get("aan") === "1";
  await setPlanApproval(on);
  await logAdminAction("Instellingen gewijzigd", `Schema's eerst goedkeuren: ${on ? "aan" : "uit"}`);
  // Uitgezet: wat al klaarstond en waarvan het moment voorbij is, gaat nu naar de klant.
  if (!on) await releaseAndNotify({ approval: false });
  back(formData, on ? "goedkeuring-aan" : "goedkeuring-uit");
}

export async function sendCustomerLoginLink(formData: FormData): Promise<void> {
  await guard(formData);
  const customer = await getCustomer(String(formData.get("klant") ?? ""));
  if (!customer) back(formData, "niet-gevonden");
  const l = toLocale(customer.locale);
  await sendMail(loginEmail({ to: customer.email, name: customer.name, link: await loginUrl(customer.id, undefined, l), locale: l }));
  await logAdminAction("Inloglink verstuurd", null, customer.id);
  back(formData, "inloglink-verstuurd");
}

/** Zegt een abonnement op namens de klant (bijv. na een opzegverzoek per e-mail). */
export async function adminCancelSubscription(formData: FormData): Promise<void> {
  await guard(formData);
  const order = await getOrder(String(formData.get("bestelling") ?? ""));
  const customer = order ? await getCustomer(order.customer_id) : null;
  if (!order || order.duration === "eenmalig" || order.status === "canceled" || !customer) back(formData, "niet-gevonden");
  const end = order.cancel_at ?? (await cancelOrder(order));
  await sendMail(
    cancellationEmail({
      to: customer.email,
      name: customer.name,
      productName: productFor(order.product, toLocale(customer.locale)).name,
      endsAt: end,
      locale: toLocale(customer.locale),
    }),
  );
  const category = formData.get("categorie");
  const reason = String(formData.get("reden") ?? "").trim().slice(0, 1000);
  if (isCancelReason(category) || reason) {
    const sql = await db();
    await sql`
      update orders set cancel_reason = coalesce(${isCancelReason(category) ? category : null}, cancel_reason, 'anders'),
        cancel_comment = coalesce(${reason || null}, cancel_comment)
      where id = ${order.id}`;
  }
  await logAdminAction(
    "Abonnement opgezegd namens klant",
    [isCancelReason(category) ? cancelReasonLabel(category) : null, reason || null].filter(Boolean).join(": ") || null,
    customer.id,
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
  await logAdminAction("Periode gestart zonder check-in", `Periode ${next}`, order.customer_id);
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
  // Koppelingen met gezondheidsapps eerst bij de aanbieder afmelden (Junction bewaart anders zelf data).
  for (const conn of await connectionsForCustomer(customerId)) await disconnect(conn);
  const customer = await getCustomer(customerId);
  // Ook de meldingen aan jou over deze klant (die bevatten naam, e-mailadres en berichten).
  if (customer) await sql`delete from email_log where lower(to_email) = lower(${customer.email}) or about_email = lower(${customer.email})`;
  await sql`delete from customers where id = ${customerId}`;
  await logAdminAction("Klant verwijderd (AVG)", customer ? customer.name : null);
  redirect("/beheer/klanten?melding=verwijderd");
}

export async function markWithdrawalHandled(formData: FormData): Promise<void> {
  await guard(formData);
  const sql = await db();
  await sql`update withdrawals set handled_at = now() where id = ${String(formData.get("herroeping") ?? "")}`;
  await logAdminAction("Herroeping afgehandeld");
  back(formData, "afgehandeld");
}

export async function markGuaranteeHandled(formData: FormData): Promise<void> {
  await guard(formData);
  const sql = await db();
  await sql`update guarantee_requests set handled_at = now() where id = ${String(formData.get("aanvraag") ?? "")} and handled_at is null`;
  await logAdminAction("Garantie-aanvraag afgehandeld");
  back(formData, "garantie-afgehandeld");
}

/** Zet de mail voor één soort melding aan of uit. De melding blijft altijd zichtbaar in het beheer. */
export async function setAdminTopic(formData: FormData): Promise<void> {
  await guard(formData);
  const topic = String(formData.get("onderwerp") ?? "");
  if (!isAdminTopic(topic) || adminTopicInfo(topic)?.fixed) back(formData, "niet-gevonden");
  const on = formData.get("aan") === "1";
  await setAdminTopicMuted(topic, !on);
  await logAdminAction(on ? "Melding per mail aangezet" : "Melding per mail uitgezet", adminTopicInfo(topic)!.label);
  back(formData, on ? "melding-mail-aan" : "melding-mail-uit");
}

export async function sendTestEmail(formData: FormData): Promise<void> {
  await guard(formData);
  const sent = await sendMail(
    adminNotificationEmail("test", "Testmail", {
      Bericht: "Deze testmail laat zien dat het versturen van e-mail vanaf de website werkt.",
    }),
  ).catch(() => false);
  back(formData, sent ? "testmail-verstuurd" : "testmail-mislukt");
}

// ---------- Kortingscodes ----------

const euroToCents = (v: string) => Math.round(Number(v.replace(",", ".").replace(/[^0-9.]/g, "")) * 100);
const dateOrNull = (v: FormDataEntryValue | null, endOfDay = false) => {
  const s = String(v ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return new Date(`${s}T${endOfDay ? "23:59:59" : "00:00:00"}+01:00`);
};

export async function createDiscount(formData: FormData): Promise<void> {
  await guard(formData);
  const code = normalizeCode(String(formData.get("code") ?? ""));
  if (code.length < 3) back(formData, "code-ongeldig");
  const kind = formData.get("soort") === "bedrag" ? "bedrag" : "procent";
  const raw = String(formData.get("waarde") ?? "");
  const percentOff = kind === "procent" ? Math.round(Number(raw.replace(",", "."))) : null;
  const amountOffCents = kind === "bedrag" ? euroToCents(raw) : null;
  if (percentOff !== null && !(percentOff >= 1 && percentOff <= 100)) back(formData, "code-ongeldig");
  if (amountOffCents !== null && !(amountOffCents >= 1 && amountOffCents <= 100_000)) back(formData, "code-ongeldig");
  const durationRaw = String(formData.get("duur") ?? "once");
  const duration = durationRaw === "repeating" || durationRaw === "forever" ? durationRaw : "once";
  const months = Math.round(Number(formData.get("maanden") ?? 0));
  if (duration === "repeating" && !(months >= 1 && months <= 24)) back(formData, "code-ongeldig");
  const max = Math.round(Number(formData.get("max") ?? 0));
  const created = await createDiscountCode({
    code,
    description: String(formData.get("omschrijving") ?? "").trim().slice(0, 200) || null,
    percentOff,
    amountOffCents,
    duration,
    durationMonths: duration === "repeating" ? months : null,
    products: formData.getAll("producten").map(String).filter((p): p is ProductId => (PRODUCT_IDS as readonly string[]).includes(p)),
    durations: formData.getAll("looptijden").map(String).filter((d): d is DurationId => (DURATION_IDS as readonly string[]).includes(d)),
    maxRedemptions: max > 0 ? max : null,
    startsAt: dateOrNull(formData.get("start")),
    expiresAt: dateOrNull(formData.get("eind"), true),
  });
  if (!created) back(formData, "code-bestaat");
  await logAdminAction("Kortingscode aangemaakt", `${code} (${describeDiscount({ percentOff, amountOffCents, duration, durationMonths: months || null })})`);
  back(formData, "code-aangemaakt");
}

export async function toggleDiscount(formData: FormData): Promise<void> {
  await guard(formData);
  const on = formData.get("aan") === "1";
  await setDiscountActive(String(formData.get("id") ?? ""), on);
  await logAdminAction(on ? "Kortingscode geactiveerd" : "Kortingscode gepauzeerd", String(formData.get("code") ?? ""));
  back(formData, on ? "code-aan" : "code-uit");
}

export async function removeDiscount(formData: FormData): Promise<void> {
  await guard(formData);
  const result = await deleteDiscountCode(String(formData.get("id") ?? ""));
  await logAdminAction(result === "deleted" ? "Kortingscode verwijderd" : "Kortingscode gepauzeerd", String(formData.get("code") ?? ""));
  back(formData, result === "deleted" ? "code-verwijderd" : "code-gebruikt");
}

// ---------- E-mailteksten ----------

function mailTarget(formData: FormData): { kind: MailKind; locale: Locale } {
  const kind = String(formData.get("soort") ?? "");
  if (!(MAIL_KINDS as readonly string[]).includes(kind)) back(formData, "niet-gevonden");
  return { kind: kind as MailKind, locale: toLocale(String(formData.get("taal") ?? "nl")) };
}

export async function saveMailTexts(formData: FormData): Promise<void> {
  await guard(formData);
  const { kind, locale } = mailTarget(formData);
  await saveMailOverride(kind, locale, {
    subject: String(formData.get("onderwerp") ?? ""),
    intro: String(formData.get("tekst") ?? ""),
    button: String(formData.get("knop") ?? ""),
  });
  await logAdminAction("E-mailtekst aangepast", `${catalogEntry(kind)?.label ?? kind} (${locale.toUpperCase()})`);
  back(formData, "mail-opgeslagen");
}

export async function resetMailTexts(formData: FormData): Promise<void> {
  await guard(formData);
  const { kind, locale } = mailTarget(formData);
  await resetMailOverride(kind, locale);
  await logAdminAction("E-mailtekst teruggezet naar standaard", `${catalogEntry(kind)?.label ?? kind} (${locale.toUpperCase()})`);
  back(formData, "mail-standaard");
}

export async function sendTestMail(formData: FormData): Promise<void> {
  await guard(formData);
  const { kind, locale } = mailTarget(formData);
  const entry = catalogEntry(kind);
  if (!entry) back(formData, "niet-gevonden");
  const sample = entry.sample(locale);
  const sent = await sendMail({ ...sample, to: adminEmail(), subject: `[Test] ${sample.subject}` }).catch(() => false);
  back(formData, sent ? "testmail-verstuurd" : "testmail-mislukt");
}

// ---------- Klanten ----------

export async function updateCustomerDetails(formData: FormData): Promise<void> {
  await guard(formData);
  const id = String(formData.get("klant") ?? "");
  const customer = await getCustomer(id);
  if (!customer) back(formData, "niet-gevonden");
  const parsed = customerSchema.safeParse({ name: formData.get("naam"), email: formData.get("email") });
  if (!parsed.success) back(formData, "gegevens-ongeldig");
  const sql = await db();
  const taken = await sql`select 1 from customers where lower(email) = ${parsed.data.email} and id <> ${id}`;
  if (taken.length > 0) back(formData, "email-bestaat");
  await sql`
    update customers set name = ${parsed.data.name}, email = ${parsed.data.email}, locale = ${toLocale(String(formData.get("taal") ?? "nl"))},
      marketing_consent = ${formData.get("marketing") === "1"}, weekly_reminders = ${formData.get("herinneringen") === "1"}
    where id = ${id}`;
  const changes = [
    parsed.data.name !== customer.name ? `naam: ${customer.name} → ${parsed.data.name}` : null,
    parsed.data.email !== customer.email ? `e-mail: ${customer.email} → ${parsed.data.email}` : null,
  ].filter(Boolean);
  await logAdminAction("Klantgegevens aangepast", changes.join(", ") || "voorkeuren", id);
  back(formData, "klant-opgeslagen");
}

/** Past de antwoorden uit de vragenlijst aan; het volgende schema gebruikt de nieuwe antwoorden. */
export async function updateIntakeAnswers(formData: FormData): Promise<void> {
  await guard(formData);
  const customerId = String(formData.get("klant") ?? "");
  const intake = await latestIntakeForCustomer(customerId);
  if (!intake) back(formData, "niet-gevonden");
  const text = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v ? v : undefined;
  };
  const num = (k: string) => {
    const v = text(k);
    return v === undefined ? undefined : Number(v.replace(",", "."));
  };
  const merged = {
    ...intake.data,
    targetWeightKg: num("targetWeightKg"),
    diet: text("diet") ?? intake.data.diet,
    allergies: formData.getAll("allergies").map(String),
    otherAllergies: text("otherAllergies"),
    dislikes: text("dislikes"),
    mealsPerDay: num("mealsPerDay") ?? intake.data.mealsPerDay,
    cookingTime: text("cookingTime") ?? intake.data.cookingTime,
    budget: text("budget") ?? intake.data.budget,
    location: text("location") ?? intake.data.location,
    experience: text("experience") ?? intake.data.experience,
    trainingDays: num("trainingDays") ?? intake.data.trainingDays,
    sessionMinutes: num("sessionMinutes") ?? intake.data.sessionMinutes,
    injuries: text("injuries"),
    medication: text("medication"),
    notes: text("notes"),
  };
  const parsed = intakeSchema.safeParse(merged);
  if (!parsed.success) back(formData, "vragenlijst-ongeldig");
  const before = intake.data as Record<string, unknown>;
  const after_ = parsed.data as Record<string, unknown>;
  const changed = Object.keys(after_).filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after_[k] ?? null));
  const sql = await db();
  await sql`update intakes set data = ${sql.json(parsed.data as never)} where id = ${intake.id}`;
  await logAdminAction("Vragenlijst aangepast", changed.length ? `Gewijzigd: ${changed.join(", ")}` : "Geen wijzigingen", customerId);
  back(formData, "vragenlijst-opgeslagen");
}

export async function addCustomerNote(formData: FormData): Promise<void> {
  await guard(formData);
  const customerId = String(formData.get("klant") ?? "");
  const text = String(formData.get("tekst") ?? "").trim().slice(0, 2000);
  if (!text) back(formData, "notitie-leeg");
  const sql = await db();
  await sql`insert into admin_notes (customer_id, text) values (${customerId}, ${text})`;
  await logAdminAction("Notitie toegevoegd", text.slice(0, 120), customerId);
  back(formData, "notitie-opgeslagen");
}

export async function deleteCustomerNote(formData: FormData): Promise<void> {
  await guard(formData);
  const sql = await db();
  await sql`delete from admin_notes where id = ${String(formData.get("notitie") ?? "")}`;
  back(formData, "notitie-verwijderd");
}

// ---------- Schema's ----------

export async function ratePlan(formData: FormData): Promise<void> {
  await guard(formData);
  const rating = Math.round(Number(formData.get("score") ?? 0));
  if (!(rating >= 1 && rating <= 5)) back(formData, "niet-gevonden");
  const note = String(formData.get("toelichting") ?? "").trim().slice(0, 1000) || null;
  const sql = await db();
  const [row] = await sql<{ customer_id: string; type: string; seq: number }[]>`
    update plans set rating = ${rating}, rating_note = ${note} where id = ${String(formData.get("plan") ?? "")} returning customer_id, type, seq`;
  if (!row) back(formData, "niet-gevonden");
  await logAdminAction("Schema beoordeeld", `${row.type === "voeding" ? "Voeding" : "Training"} · periode ${row.seq}: ${rating}/5`, row.customer_id);
  back(formData, "beoordeeld");
}

// ---------- Terugbetalen ----------

/** Betaalt de eerste betaling terug via Mollie (garantie of herroeping), met een creditnota, en beëindigt het abonnement desgewenst. */
export async function refundOrder(formData: FormData): Promise<void> {
  await guard(formData);
  const order = await getOrder(String(formData.get("bestelling") ?? ""));
  if (!order) back(formData, "niet-gevonden");
  if (order.refunded_cents > 0) back(formData, "al-terugbetaald");
  const cancel = formData.get("beeindigen") === "1";
  let result: { refundedCents: number; refundId: string; invoiceId: string };
  try {
    result = await refundFirstPayment(order, { cancel });
  } catch (err) {
    console.error("Terugbetalen mislukt", err);
    back(formData, "terugbetalen-mislukt");
  }
  const sql = await db();
  await sql`
    update orders set refunded_cents = refunded_cents + ${result.refundedCents},
      status = case when ${cancel} and duration <> 'eenmalig' then 'canceled' else status end,
      ended_at = case when ${cancel} and duration <> 'eenmalig' then now() else ended_at end, updated_at = now()
    where id = ${order.id}`;
  await recordPayment({
    id: result.refundId,
    orderId: order.id,
    customerId: order.customer_id,
    amountCents: -result.refundedCents,
    kind: "refund",
    description: String(formData.get("reden") ?? "terugbetaling"),
    invoiceId: result.invoiceId,
  });
  const request = String(formData.get("aanvraag") ?? "");
  if (request) await sql`update guarantee_requests set handled_at = now() where id = ${request} and handled_at is null`;
  await logAdminAction("Terugbetaald", `${euro(result.refundedCents)}${cancel ? ", abonnement beëindigd" : ""}`, order.customer_id);
  back(formData, "terugbetaald");
}

// ---------- Koppelingen (Mollie, Claude, e-mail) ----------

/** Slaat de gegevens van één koppeling op en test daarna meteen de verbinding. */
export async function saveKoppeling(formData: FormData): Promise<void> {
  await guard(formData);
  const group = String(formData.get("groep") ?? "") as ConfigGroupId;
  if (!CONFIG_GROUPS.some((g) => g.id === group)) back(formData, "niet-gevonden");
  const problem = await saveGroup(
    group,
    (name) => String(formData.get(name) ?? ""),
    (name) => formData.get(`${name}__wissen`) === "1",
  );
  if (problem) back(formData, `koppeling-${problem}`);
  // Alleen wat er is gewijzigd, nooit de waarden zelf.
  await logAdminAction("Koppeling opgeslagen", CONFIG_GROUPS.find((g) => g.id === group)!.title);
  const result = await testGroup(group);
  back(formData, result.ok ? "koppeling-werkt" : "koppeling-opgeslagen");
}

export async function testKoppeling(formData: FormData): Promise<void> {
  await guard(formData);
  const group = String(formData.get("groep") ?? "") as ConfigGroupId;
  if (!CONFIG_GROUPS.some((g) => g.id === group)) back(formData, "niet-gevonden");
  const result = await testGroup(group);
  back(formData, result.ok ? "koppeling-getest" : "koppeling-werkt-niet");
}

// ---------- Instellingen ----------

export async function saveDelivery(formData: FormData): Promise<void> {
  await guard(formData);
  const min = Math.round(Number(formData.get("min") ?? 0));
  const max = Math.round(Number(formData.get("max") ?? 0));
  // Ruim binnen de belofte blijven: de geplande taak draait elke 5 minuten.
  const limit = site.delivery.promiseHours * 60 - 10;
  if (!(min >= 0 && max >= min && max <= limit)) back(formData, "levering-ongeldig");
  await saveDeliverySettings({ minMinutes: min, maxMinutes: max, afterCheckin: formData.get("naCheckin") === "1" });
  await logAdminAction("Instellingen gewijzigd", `Levering: ${min}-${max} minuten${formData.get("naCheckin") === "1" ? ", ook na check-in" : ", na check-in direct"}`);
  back(formData, "instellingen-opgeslagen");
}

export async function saveCheckoutReminder(formData: FormData): Promise<void> {
  await guard(formData);
  const hours = Math.round(Number(formData.get("uren") ?? 3));
  if (!(hours >= 1 && hours <= 48)) back(formData, "herinnering-ongeldig");
  const enabled = formData.get("aan") === "1";
  await saveCheckoutReminderSettings({ enabled, delayHours: hours });
  await logAdminAction("Instellingen gewijzigd", `Herinnering bij niet-afgeronde betaling: ${enabled ? `aan (na ${hours} uur)` : "uit"}`);
  back(formData, "instellingen-opgeslagen");
}

/** Stuurt nu een herinnering voor één niet-afgeronde betaling (alleen met toestemming voor e-mail). */
export async function sendCheckoutReminderNow(formData: FormData): Promise<void> {
  await guard(formData);
  const sql = await db();
  const [row] = await sql<{ id: string; email: string; name: string; locale: string; product: string | null }[]>`
    update intakes i set reminded_at = now()
    where i.id = ${String(formData.get("intake") ?? "")} and i.reminded_at is null
      and coalesce((i.consents->>'marketing')::boolean, false)
      and not exists (select 1 from orders o where o.intake_id = i.id)
    returning i.id, i.email, i.name, i.locale, i.data->>'product' as product`;
  if (!row) back(formData, "herinnering-niet-mogelijk");
  const l = toLocale(row.locale);
  await sendMail(
    checkoutReminderEmail({
      to: row.email,
      name: row.name,
      link: localeUrl(site.url, l, `/start?hervat=${row.id}`),
      productName: row.product && isProductId(row.product) ? productFor(row.product, "nl").name : site.name,
      locale: l,
    }),
  );
  await logAdminAction("Herinnering afrekenen verstuurd", row.email);
  back(formData, "herinnering-verstuurd");
}

// ---------- Kansen ----------

export async function hideOpportunity(formData: FormData): Promise<void> {
  await guard(formData);
  const id = String(formData.get("kans") ?? "");
  if (!id) back(formData, "niet-gevonden");
  await hideOpportunityInDb(id);
  await logAdminAction("Kans verborgen (30 dagen)", String(formData.get("titel") ?? id).slice(0, 200));
  back(formData, "kans-verborgen");
}

export async function showAllOpportunities(formData: FormData): Promise<void> {
  await guard(formData);
  await showAllOpportunitiesInDb();
  back(formData, "kansen-hersteld");
}

/** Kans opgepakt: uit de lijst, en na 30 dagen kijken we of hij nog uit de cijfers komt. */
export async function markOpportunityDone(formData: FormData): Promise<void> {
  await guard(formData);
  const id = String(formData.get("kans") ?? "");
  const area = String(formData.get("gebied") ?? "");
  if (!id || !(area in AREA_LABELS)) back(formData, "niet-gevonden");
  const title = String(formData.get("titel") ?? id).slice(0, 200);
  await markOpportunityDoneInDb(id, { title, finding: String(formData.get("bevinding") ?? "").slice(0, 600), area: area as KansArea });
  await logAdminAction("Kans afgevinkt", title);
  back(formData, "kans-afgevinkt");
}

export async function undoOpportunityDone(formData: FormData): Promise<void> {
  await guard(formData);
  const id = String(formData.get("kans") ?? "");
  if (!id) back(formData, "niet-gevonden");
  await undoOpportunityDoneInDb(id);
  await logAdminAction("Afgevinkte kans teruggezet", String(formData.get("titel") ?? id).slice(0, 200));
  back(formData, "kans-teruggezet");
}

/** Vraagt Claude om advies op basis van de opgetelde cijfers (duurt ongeveer een minuut). */
export async function requestAiAdvice(formData: FormData): Promise<void> {
  await guard(formData);
  await loadStoredConfig();
  if (!process.env.ANTHROPIC_API_KEY) back(formData, "ai-geen-sleutel");
  const previous = await aiAdvice();
  if (previous && Date.now() - Date.parse(previous.at) < 10 * 60 * 1000) back(formData, "ai-te-snel");
  try {
    await generateAiAdvice();
  } catch (err) {
    console.error("Advies van Claude mislukt", err);
    back(formData, "ai-mislukt");
  }
  await logAdminAction("Advies gevraagd aan Claude", "Kansen");
  back(formData, "ai-klaar");
}

// ---------- Instagram ----------

/** Een moment uit een datum-tijdveld (Nederlandse tijd); alleen in de toekomst (een minuut speling). */
function futureMoment(formData: FormData): Date | null {
  const at = amsterdamLocalToDate(String(formData.get("moment") ?? ""));
  return at && at.getTime() > Date.now() - 60_000 ? at : null;
}

/** Een nieuwe post: Claude maakt hem op de achtergrond; daarna (direct, op het gekozen moment of pas na jouw klik) naar Instagram. */
export async function requestInstagramPost(formData: FormData): Promise<void> {
  await guard(formData);
  const prompt = String(formData.get("opdracht") ?? "").trim().slice(0, 4000);
  if (prompt.length < 5) back(formData, "instagram-opdracht-leeg");
  const vorm = formData.get("vorm");
  const format = isPostFormat(vorm) ? vorm : "auto";
  const when = String(formData.get("wanneer") ?? "concept");
  let publish: PublishChoice = { mode: "draft" };
  if (when === "nu") publish = { mode: "now" };
  if (when === "moment") {
    const at = futureMoment(formData);
    if (!at) back(formData, "instagram-moment-ongeldig");
    publish = { mode: "at", at };
  }
  await loadStoredConfig();
  if (!process.env.ANTHROPIC_API_KEY) back(formData, "ai-geen-sleutel");
  if (publish.mode !== "draft" && !instagramConfigured()) back(formData, "instagram-niet-gekoppeld");
  const id = await createInstagramPost({ prompt, format, publish });
  await logAdminAction(
    "Instagram-post aangevraagd",
    `${formatLabels[format]}, ${publish.mode === "now" ? "direct plaatsen" : publish.mode === "at" ? `plaatsen op ${publish.at.toISOString()}` : "concept"}: ${prompt}`,
  );
  after(() => generateInstagramPost(id));
  redirect(`/beheer/instagram/${id}?melding=instagram-wordt-gemaakt`);
}

/** Leest de slides uit het bewerkformulier; een aangevinkte slide valt weg. */
function slidesFromForm(formData: FormData): Slide[] {
  const count = Math.min(Number(formData.get("slides") ?? 0) || 0, 20);
  const slides: Slide[] = [];
  for (let i = 0; i < count; i++) {
    if (formData.get(`slide-${i}-weg`) === "1") continue;
    const field = (name: string) => String(formData.get(`slide-${i}-${name}`) ?? "");
    const kind = field("soort") as Slide["kind"];
    slides.push({
      kind: (SLIDE_KINDS as readonly string[]).includes(kind) ? kind : "tip",
      kicker: field("label"),
      title: field("kop"),
      body: field("tekst"),
      bullets: field("punten").split(/\r?\n/),
      photo: field("foto") as Slide["photo"],
    });
  }
  return slides;
}

/** Je eigen aanpassingen aan de tekst op de slides, het bijschrift en de hashtags. */
export async function saveInstagramPost(formData: FormData): Promise<void> {
  await guard(formData);
  const id = String(formData.get("post") ?? "");
  const parsed = postContentSchema.safeParse({
    slides: slidesFromForm(formData),
    caption: String(formData.get("bijschrift") ?? ""),
    hashtags: String(formData.get("hashtags") ?? "").split(/[\s,]+/).map(cleanHashtag).filter(Boolean),
    altText: String(formData.get("alt") ?? ""),
  });
  if (!parsed.success || parsed.data.slides.length === 0 || parsed.data.slides.some((s) => !s.title.trim())) back(formData, "instagram-ongeldig");
  const row = await updatePostContent(id, parsed.data);
  if (!row) back(formData, "niet-gevonden");
  await logAdminAction("Instagram-post aangepast", row.prompt.slice(0, 200));
  back(formData, "instagram-opgeslagen");
}

/** Nu op Instagram zetten (ook om een mislukte poging opnieuw te doen). */
export async function publishInstagramPostNow(formData: FormData): Promise<void> {
  await guard(formData);
  await loadStoredConfig();
  if (!instagramConfigured()) back(formData, "instagram-niet-gekoppeld");
  const row = await schedulePost(String(formData.get("post") ?? ""), null);
  if (!row) back(formData, "niet-gevonden");
  await logAdminAction("Instagram-post nu geplaatst", row.prompt.slice(0, 200));
  after(() => publishInstagramPost(row.id));
  back(formData, "instagram-wordt-geplaatst");
}

export async function scheduleInstagramPost(formData: FormData): Promise<void> {
  await guard(formData);
  const at = futureMoment(formData);
  if (!at) back(formData, "instagram-moment-ongeldig");
  await loadStoredConfig();
  if (!instagramConfigured()) back(formData, "instagram-niet-gekoppeld");
  const row = await schedulePost(String(formData.get("post") ?? ""), at);
  if (!row) back(formData, "niet-gevonden");
  await logAdminAction("Instagram-post ingepland", `${at.toISOString()}: ${row.prompt.slice(0, 200)}`);
  back(formData, "instagram-ingepland");
}

export async function unscheduleInstagramPost(formData: FormData): Promise<void> {
  await guard(formData);
  const row = await unschedulePost(String(formData.get("post") ?? ""));
  if (!row) back(formData, "niet-gevonden");
  await logAdminAction("Instagram-post teruggezet naar concept", row.prompt.slice(0, 200));
  back(formData, "instagram-concept");
}

/** Opnieuw laten maken, eventueel met een aanwijzing (bijv. "korter" of "meer over eiwit"). */
export async function regenerateInstagramPost(formData: FormData): Promise<void> {
  await guard(formData);
  await loadStoredConfig();
  if (!process.env.ANTHROPIC_API_KEY) back(formData, "ai-geen-sleutel");
  const instruction = String(formData.get("aanwijzing") ?? "").trim().slice(0, 1000) || null;
  const row = await regeneratePost(String(formData.get("post") ?? ""), instruction);
  if (!row) back(formData, "niet-gevonden");
  await logAdminAction("Instagram-post opnieuw gemaakt", instruction ? `Aanwijzing: ${instruction}` : row.prompt.slice(0, 200));
  after(() => generateInstagramPost(row.id));
  back(formData, "instagram-opnieuw");
}

export async function deleteInstagramPost(formData: FormData): Promise<void> {
  await guard(formData);
  const row = await deletePost(String(formData.get("post") ?? ""));
  if (!row) back(formData, "niet-gevonden");
  await logAdminAction("Instagram-post verwijderd", row.prompt.slice(0, 200));
  redirect("/beheer/instagram?melding=instagram-verwijderd");
}

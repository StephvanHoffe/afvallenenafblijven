import "server-only";
import { site } from "@/config/site";
import { products } from "@/config/pricing";
import { intakeSchema, type Intake } from "@/lib/intake";
import { loginUrl } from "@/lib/auth";
import { nutritionTargets, withCalorieOffset } from "@/lib/calculations";
import { MAX_CALORIE_OFFSET, calorieAdjustment, checkinWindow } from "@/lib/checkin";
import { adminNotificationEmail, checkinEmail, plansReadyEmail, sendMail, weeklyReminderEmail } from "@/lib/email";
import { generateNutritionPlan, generateTrainingPlan, summarizePlan } from "@/lib/ai/generate";
import type { ProgressContext } from "@/lib/ai/prompts";
import type { PlanContent } from "@/lib/ai/schemas";
import {
  MAX_PLAN_ATTEMPTS,
  checkinsForOrder,
  claimPlan,
  completePlan,
  createPlans,
  failPlan,
  getCustomer,
  getIntake,
  getOrder,
  markCheckinReminder,
  markPlansEmailed,
  pendingPlanIds,
  plansForOrder,
  previousReadyPlan,
  subscriptionCheckinOrders,
  weeklyLogsForOrder,
  weeklyReminderOrders,
  markWeeklyReminded,
  pendingWeeklyLogIds,
  releaseDuePeriods,
  releasedUnmailedPeriods,
  requestReview,
  type Order,
  type PeriodRef,
  type Plan,
} from "@/lib/repo";
import { deliveryDeadline } from "@/lib/delivery";
import { formatDateTime } from "@/lib/format";
import { planApprovalRequired } from "@/lib/settings";
import { sendCheckoutReminders } from "@/lib/checkout-reminders";
import { weeklyKcal, weeklyWindow } from "@/lib/weekly";
import { newPeriodStartsAt } from "@/lib/schedule";
import { processWeeklyLog } from "@/lib/weekly-server";
import { defineCopy, toLocale, type Locale } from "@/i18n/config";
import { nextActivityLevel, summarizeActivity, type ActivitySummary } from "@/lib/health/insights";
import { connectionsForCustomer, healthDaysSince, healthWorkoutsSince } from "@/lib/health/repo";
import { syncAllConnections } from "@/lib/health/sync";

const DAY = 24 * 60 * 60 * 1000;

/** Samenvatting van de gekoppelde gezondheidsdata sinds het begin van de vorige periode (null zonder koppeling). */
async function measuredActivity(customerId: string, since: Date, intake: Intake, order: Order): Promise<ActivitySummary | null> {
  try {
    const connections = await connectionsForCustomer(customerId);
    if (connections.length === 0) return null;
    const from = new Date(since);
    const [days, workouts] = await Promise.all([healthDaysSince(customerId, from), healthWorkoutsSince(customerId, from)]);
    const planned = products[order.product].includes.includes("training") ? intake.trainingDays : null;
    return summarizeActivity(days, workouts, from, new Date(), planned);
  } catch (err) {
    // Een storing bij de koppeling mag een nieuw schema nooit tegenhouden.
    console.error("Gezondheidsdata ophalen voor schema mislukt", err);
    return null;
  }
}

/**
 * Maakt één schema met Claude. Veilig om vaker aan te roepen: alleen het
 * proces dat het schema "claimt" voert de generatie uit.
 */
export async function processPlan(planId: string): Promise<void> {
  const plan = await claimPlan(planId);
  if (!plan) return;

  try {
    const order = await getOrder(plan.order_id);
    const customer = await getCustomer(plan.customer_id);
    if (!order || !customer) throw new Error("Bestelling of klant niet gevonden");
    // Het schema (en alles wat de klant erin leest) komt in de taal van de klant.
    const l = toLocale(customer.locale);
    const intakeRow = await getIntake(order.intake_id);
    if (!intakeRow) throw new Error("Intake niet gevonden");

    const previous = plan.seq > 1 ? await previousReadyPlan(order.id, plan.type, plan.seq) : null;
    // Check-ins tot en met deze periode; die van deze periode is de aanleiding voor het schema.
    const checkins = (await checkinsForOrder(order.id)).filter((c) => (c.for_seq ?? 0) <= plan.seq);
    // Weegmomenten uit de vorige periode: het weekverloop en wat er toen al is bijgestuurd.
    const prevWeekly = (await weeklyLogsForOrder(order.id)).filter((w) => w.seq === plan.seq - 1);
    const current = checkins.find((c) => c.for_seq === plan.seq) ?? null;
    const before = [...checkins].reverse().find((c) => (c.for_seq ?? 0) < plan.seq && c.data.weightKg) ?? null;
    const latest = <K extends keyof NonNullable<typeof current>["data"]>(key: K) =>
      [...checkins].reverse().find((c) => c.data[key] !== undefined)?.data[key];

    // Het profiel volgt de check-ins: nieuw gewicht, eventueel nieuw doel of aantal trainingsdagen.
    const merged: Intake = {
      ...intakeRow.data,
      product: order.product,
      weightKg: latest("weightKg") ?? intakeRow.data.weightKg,
      goal: latest("goal") ?? intakeRow.data.goal,
      trainingDays: latest("trainingDays") ?? intakeRow.data.trainingDays,
    };
    // Streefgewicht bereikt? Dan stappen we over op een onderhoudsplan (afblijven).
    if (
      (merged.goal === "afvallen" || merged.goal === "afvallen_strakker") &&
      merged.targetWeightKg !== undefined &&
      merged.targetWeightKg >= merged.weightKg
    ) {
      merged.goal = "afblijven";
    }
    const intake: Intake = intakeSchema.parse(merged);

    const progress: ProgressContext = {
      periodNumber: plan.seq,
      instruction: plan.admin_instruction ?? undefined,
      previousSummary: previous?.content ? summarizePlan(previous.content) : undefined,
      checkin: current?.data,
      earlierInjuries: checkins
        .filter((c) => c !== current && c.data.injuries)
        .map((c) => c.data.injuries!)
        .slice(-3),
      weekly: prevWeekly.map((w) => ({
        week: w.week,
        weightKg: w.data.weightKg,
        kcal: w.adjustment?.kcal ?? 0,
        training: w.adjustment?.training,
        note: w.data.comments,
      })),
    };
    // Gekoppelde gezondheidsapps: hoeveel de klant in de vorige periode echt bewoog en trainde.
    const measured = plan.seq > 1 ? await measuredActivity(customer.id, previous?.starts_at ?? order.created_at, intake, order) : null;
    const prevNutrition = previous?.content?.type === "voeding" ? previous.content : null;
    const usedActivity = nextActivityLevel(prevNutrition?.activity ?? intake.activity, measured?.measuredActivity ?? null);
    if (measured && measured.daysWithSteps + measured.workouts > 0) {
      progress.health = {
        days: Math.round((Date.now() - new Date(previous?.starts_at ?? order.created_at).getTime()) / DAY),
        avgSteps: measured.avgSteps,
        workouts: measured.workouts,
        plannedWorkouts: measured.plannedWorkouts,
        workoutMinutes: measured.workoutMinutes,
        walks: measured.byKind.wandelen ?? 0,
        ...(plan.type === "voeding" && usedActivity !== (prevNutrition?.activity ?? intake.activity)
          ? { activityChange: { from: prevNutrition?.activity ?? intake.activity, to: usedActivity } }
          : {}),
      };
    }

    const fromKg = before?.data.weightKg ?? intakeRow.data.weightKg;
    const fromDate = before?.created_at ?? order.created_at;
    if (current?.data.weightKg) {
      progress.weight = {
        fromKg,
        toKg: current.data.weightKg,
        weeks: Math.max((current.created_at.getTime() - new Date(fromDate).getTime()) / (7 * DAY), 0),
        expectedKgPerWeek: previous?.content?.type === "voeding" ? previous.content.targets.expectedKgPerWeek : undefined,
      };
    }

    let content: PlanContent;
    if (plan.type === "voeding") {
      // Het activiteitsniveau volgt de gemeten stappen (hooguit één stap per periode).
      const base = nutritionTargets(usedActivity === intake.activity ? intake : { ...intake, activity: usedActivity });
      const prev = previous?.content?.type === "voeding" ? previous.content : null;
      // Een eerdere bijstelling telt mee, behalve als het doel wezenlijk is veranderd.
      const sameDirection = prev ? Math.sign(Math.round(prev.targets.expectedKgPerWeek * 10)) === Math.sign(Math.round(base.expectedKgPerWeek * 10)) : false;
      const clamp = (n: number) => Math.max(-MAX_CALORIE_OFFSET, Math.min(MAX_CALORIE_OFFSET, n));
      // Bijstellingen uit de weegmomenten tellen mee in de volgende periode.
      let offset = sameDirection ? clamp((prev?.adjustmentKcal ?? 0) + weeklyKcal(prevWeekly)) : 0;
      if (current && progress.weight && prev && sameDirection) {
        // Is er tijdens de vorige periode al bijgestuurd, dan beoordelen we alleen de weken daarna.
        const lastWeeklyChange = [...prevWeekly].reverse().find((w) => (w.adjustment?.kcal ?? 0) !== 0);
        const ref = lastWeeklyChange
          ? { kg: lastWeeklyChange.data.weightKg, at: lastWeeklyChange.created_at.getTime() }
          : { kg: progress.weight.fromKg, at: new Date(fromDate).getTime() };
        const adjustment = calorieAdjustment(
          {
            expectedKgPerWeek: prev.targets.expectedKgPerWeek,
            fromKg: ref.kg,
            toKg: progress.weight.toKg,
            weeks: (current.created_at.getTime() - ref.at) / (7 * DAY),
            checkin: current.data,
          },
          l,
        );
        if (adjustment) {
          const next = clamp(offset + adjustment.kcal);
          if (next !== offset) progress.calorieChange = { kcal: next - offset, reason: adjustment.reason };
          offset = next;
        }
      }
      content = await generateNutritionPlan(
        customer.name,
        intake,
        progress,
        { targets: withCalorieOffset(intake, base, offset), adjustmentKcal: offset },
        l,
      );
      if (content.type === "voeding") content = { ...content, activity: usedActivity };
    } else {
      content = await generateTrainingPlan(customer.name, intake, progress, l);
    }

    await completePlan(plan.id, content);
    await afterPlanReady(order.id, plan.seq);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Schema ${plan.id} mislukt (poging ${plan.attempts})`, err);
    const failed = await failPlan(plan.id, message);
    if (failed && failed.attempts >= MAX_PLAN_ATTEMPTS) {
      await sendMail(
        adminNotificationEmail("Schema kon niet worden gemaakt", {
          Schema: plan.id,
          Bestelling: plan.order_id,
          Type: plan.type,
          Fout: message,
          "Wat te doen": `Controleer de oorzaak (meestal de API-sleutel of het tegoed bij Anthropic; zie de fout hierboven). Open daarna het schema in het beheer en klik op "Opnieuw maken": ${site.url}/beheer/schemas/${plan.id}`,
        }),
      ).catch(() => {});
    }
  }
}

/**
 * Na een klaar schema: vraag zo nodig de beheerder om goedkeuring, en geef de
 * periode direct vrij als het geplande moment al voorbij is (bijvoorbeeld na
 * een herhaalde poging). Anders doet de geplande taak dat op het juiste moment.
 */
async function afterPlanReady(orderId: string, seq: number): Promise<void> {
  const approval = await planApprovalRequired();
  if (approval) await askForReview(orderId, seq);
  await releaseAndNotify({ approval, orderId });
}

/** Mailt de beheerder dat een periode op goedkeuring wacht (één keer per periode). */
async function askForReview(orderId: string, seq: number): Promise<void> {
  const plans = await requestReview(orderId, seq);
  if (plans.length === 0) return;
  const customer = await getCustomer(plans[0].customer_id);
  const created = plans.reduce((min, p) => (p.created_at < min ? p.created_at : min), plans[0].created_at);
  const planned = plans.reduce((max, p) => (p.release_after > max ? p.release_after : max), plans[0].release_after);
  await sendMail(
    adminNotificationEmail("Schema wacht op je goedkeuring", {
      Klant: customer ? `${customer.name} (${customer.email})` : undefined,
      Periode: String(seq),
      "Gepland voor de klant": formatDateTime(planned),
      "Klant verwacht het uiterlijk": formatDateTime(deliveryDeadline(created)),
      "Schema's": plans.map((p) => `${site.url}/beheer/schemas/${p.id}`).join("  "),
      "Wat te doen":
        'Bekijk het schema en klik op "Goedkeuren". Het gaat dan op het geplande moment naar de klant, of direct als dat moment al voorbij is. Niet goed? Klik op "Opnieuw maken".',
    }),
  ).catch((err) => console.error("Goedkeuringsmail versturen mislukt", err));
}

/**
 * Geeft klare periodes vrij waarvan het geplande moment is aangebroken (en die
 * zijn goedgekeurd, als dat aanstaat) en mailt de klant. Geeft het aantal
 * vrijgegeven periodes terug.
 */
export async function releaseAndNotify(opts: { approval?: boolean; customerId?: string; orderId?: string } = {}): Promise<number> {
  const approval = opts.approval ?? (await planApprovalRequired());
  const released = await releaseDuePeriods({ approval, customerId: opts.customerId, orderId: opts.orderId });
  await notifyReleased(released);
  return released.length;
}

/**
 * Geeft de klare periodes van een klant vrij, zonder te mailen. Voor Mijn
 * schema's: de klant ziet het schema precies op het geplande moment, ook als
 * de geplande taak nog niet is langs geweest. Mail de periodes daarna met
 * notifyReleased (bijv. in after()).
 */
export async function releaseForCustomer(customerId: string): Promise<PeriodRef[]> {
  return releaseDuePeriods({ approval: await planApprovalRequired(), customerId });
}

/** Stuurt de "je schema staat klaar"-mail voor vrijgegeven periodes (dubbel versturen kan niet). */
export async function notifyReleased(periods: PeriodRef[]): Promise<void> {
  for (const p of periods) {
    await notifyPeriodReleased(p.order_id, p.seq).catch((err) => console.error(`Klaar-mail voor ${p.order_id}/${p.seq} mislukt`, err));
  }
}

/** Mailt de klant zodra alle schema's van een periode zijn vrijgegeven (één e-mail per periode). */
async function notifyPeriodReleased(orderId: string, seq: number): Promise<void> {
  const plans = (await plansForOrder(orderId)).filter((p) => p.seq === seq);
  if (plans.length === 0 || plans.some((p) => p.status !== "ready" || !p.released_at)) return;
  const newlyMarked = await markPlansEmailed(plans.map((p) => p.id));
  if (newlyMarked.length === 0) return; // al gemaild

  const customer = await getCustomer(plans[0].customer_id);
  if (!customer) return;
  const l = toLocale(customer.locale);
  await sendMail(
    plansReadyEmail({
      to: customer.email,
      name: customer.name,
      types: plans.map((p) => p.type),
      link: await loginUrl(customer.id, undefined, l),
      seq,
      startsAt: plans.reduce((min, p) => (p.starts_at < min ? p.starts_at : min), plans[0].starts_at),
      locale: l,
    }),
  );
}

/** Verwerkt alle openstaande schema's van een bestelling parallel. */
export async function processOrderPlans(orderId: string): Promise<void> {
  const plans = await plansForOrder(orderId);
  const open = plans.filter((p) => p.status === "pending" || p.status === "failed");
  await Promise.all(open.map((p) => processPlan(p.id)));
}

/**
 * Start de volgende periode van een abonnement: maakt de schema's aan en
 * zet ze in de wachtrij. Het schema wordt direct gemaakt, staat vanaf
 * `releaseAfter` voor de klant klaar en begint op `startsAt` (de maandag van
 * de nieuwe periode, of nu). Geeft de periode terug (of null als die al bestond).
 */
export async function startNextPeriod(
  order: Pick<Order, "id" | "customer_id" | "product">,
  seq: number,
  startsAt: Date = new Date(),
  releaseAfter: Date = new Date(),
): Promise<number | null> {
  const ids = await createPlans(order.id, order.customer_id, products[order.product].includes, seq, startsAt, releaseAfter);
  return ids.length > 0 ? seq : null;
}

/**
 * Geplande taak (elke 5 minuten):
 * - geeft klare schema's vrij op hun geplande moment en mailt de klant;
 * - zet schema's klaar voor check-ins die wel zijn ingevuld maar nog geen
 *   schema hebben (bijvoorbeeld na een storing);
 * - probeert mislukte of vastgelopen schema's opnieuw (steeds iets later).
 * Eén keer per dag (`daily`, 's ochtends) ook:
 * - nodigt abonnees uit voor hun check-in en herinnert ze eraan (een nieuw
 *   schema maken we pas na de check-in), plus de weegmoment-herinneringen;
 * - werkt de gekoppelde gezondheidsapps bij.
 * Stopt op tijd om binnen de maximale looptijd van de serverfunctie te blijven.
 */
export async function runScheduledWork(
  budgetMs: number,
  { daily }: { daily: boolean },
): Promise<{
  released: number;
  scheduled: number;
  reminders: number;
  weeklyReminders: number;
  checkoutReminders: number;
  healthSynced: number;
  processed: number;
}> {
  const started = Date.now();
  let scheduled = 0;
  let reminders = 0;
  let released = await releaseAndNotify();

  for (const order of await subscriptionCheckinOrders()) {
    const window = checkinWindow({
      duration: order.duration,
      status: order.status,
      cancelAt: order.cancel_at,
      lastSeq: order.last_seq,
      lastPeriodStart: order.last_start,
      submittedForNext: order.next_checkin,
      now: started,
    });
    if (!window || window.status === "upcoming") continue;
    if (window.status === "submitted") {
      // Vangnet na een storing: de klant wacht al, dus dit schema gaat zodra het klaar is naar de klant.
      if (await startNextPeriod(order, window.seq, newPeriodStartsAt(window.dueAt, started))) scheduled++;
      continue;
    }
    if (!daily) continue;
    const sent = order.checkin_reminded_seq === window.seq ? order.checkin_reminders : 0;
    const schedule = site.checkin.reminderDays;
    if (sent >= schedule.length || started - window.opensAt.getTime() < schedule[sent] * DAY) continue;
    const customer = await getCustomer(order.customer_id);
    if (!customer) continue;
    const l = toLocale(customer.locale);
    try {
      await sendMail(
        checkinEmail({
          to: customer.email,
          name: customer.name,
          link: await loginUrl(customer.id, "check-in", l),
          seq: window.seq,
          dueAt: window.dueAt,
          advisedBy: window.advisedBy,
          // De tekst volgt de datum: uitnodiging, "vandaag invullen" (za), "je periode is begonnen" (ma), daarna een laatste herinnering.
          reminder:
            started < window.advisedBy.getTime()
              ? 0
              : started < window.dueAt.getTime()
                ? 1
                : started < window.dueAt.getTime() + 7 * DAY
                  ? 2
                  : 3,
          locale: l,
        }),
      );
      await markCheckinReminder(order.id, window.seq, sent + 1);
      reminders++;
    } catch (err) {
      console.error(`Check-in-mail voor bestelling ${order.id} mislukt`, err);
    }
  }

  // Wekelijkse herinnering voor het weegmoment (klant kan dit uitzetten).
  let weeklyReminders = 0;
  for (const order of daily ? await weeklyReminderOrders() : []) {
    const window = weeklyWindow({
      duration: order.duration,
      status: order.status,
      lastSeq: order.last_seq,
      lastPeriodStart: order.last_start,
      loggedWeeks: order.logged_weeks,
      now: started,
    });
    if (window?.status !== "open") continue;
    try {
      const l = toLocale(order.locale);
      await sendMail(
        weeklyReminderEmail({
          to: order.email,
          name: order.name,
          link: await loginUrl(order.customer_id, "weegmoment", l),
          week: window.week,
          locale: l,
        }),
      );
      await markWeeklyReminded(order.id);
      weeklyReminders++;
    } catch (err) {
      console.error(`Weegmoment-herinnering voor bestelling ${order.id} mislukt`, err);
    }
  }

  // Herinnering bij een niet-afgeronde betaling (als dat aanstaat, alleen met toestemming).
  const checkoutReminders = await sendCheckoutReminders().catch((err) => {
    console.error("Herinneringen voor afrekenen mislukt", err);
    return 0;
  });

  // Gekoppelde gezondheidsapps bijwerken (vangnet naast de meldingen/webhooks).
  const healthSynced = daily
    ? await syncAllConnections(started + Math.min(60_000, budgetMs / 4)).catch((err) => {
        console.error("Gezondheidsdata synchroniseren mislukt", err);
        return 0;
      })
    : 0;

  // Aanwijzingen bij weegmomenten die nog niet klaar zijn (bijv. na een storing).
  for (const id of await pendingWeeklyLogIds(10)) {
    if (Date.now() - started > budgetMs - 230_000) break;
    await processWeeklyLog(id);
  }

  let processed = 0;
  const queue = await pendingPlanIds(20);
  // Ruwe schatting: een schema kost enkele minuten; begin geen nieuwe batch
  // als de resterende tijd daar niet meer voor genoeg is. Wat blijft liggen,
  // pakt de volgende run op.
  while (queue.length > 0 && Date.now() - started < budgetMs - 200_000) {
    const batch = queue.splice(0, 2);
    await Promise.all(batch.map((id) => processPlan(id)));
    processed += batch.length;
  }
  released += await releaseAndNotify();
  // Vangnet: vrijgegeven schema's waarvan de klaar-mail niet is verstuurd (bijv. na een storing bij het mailen).
  await notifyReleased(await releasedUnmailedPeriods(20));
  return { released, scheduled, reminders, weeklyReminders, checkoutReminders, healthSynced, processed };
}

const planTitleCopy = defineCopy({
  nl: { voeding: "Voedingsschema", training: "Trainingsschema", period: (n: number) => `periode ${n}` },
  en: { voeding: "Nutrition plan", training: "Workout plan", period: (n: number) => `period ${n}` },
});

export function planTitle(plan: Pick<Plan, "type" | "seq">, l: Locale = "nl"): string {
  const c = planTitleCopy[l];
  const name = c[plan.type];
  return plan.seq > 1 ? `${name} – ${c.period(plan.seq)}` : name;
}

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
  type Order,
  type Plan,
} from "@/lib/repo";
import { weeklyKcal, weeklyWindow } from "@/lib/weekly";
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
    const measured = plan.seq > 1 ? await measuredActivity(customer.id, previous?.created_at ?? order.created_at, intake, order) : null;
    const prevNutrition = previous?.content?.type === "voeding" ? previous.content : null;
    const usedActivity = nextActivityLevel(prevNutrition?.activity ?? intake.activity, measured?.measuredActivity ?? null);
    if (measured && measured.daysWithSteps + measured.workouts > 0) {
      progress.health = {
        days: Math.round((Date.now() - new Date(previous?.created_at ?? order.created_at).getTime()) / DAY),
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
    await notifyIfOrderPeriodReady(order.id, plan.seq);
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
          "Wat te doen":
            "Controleer de API-sleutel en logs. Zet de status in de database terug op 'pending' en attempts op 0 om het opnieuw te proberen.",
        }),
      ).catch(() => {});
    }
  }
}

/** Mailt de klant zodra alle schema's van een periode klaar zijn (één e-mail per periode). */
async function notifyIfOrderPeriodReady(orderId: string, seq: number): Promise<void> {
  const plans = (await plansForOrder(orderId)).filter((p) => p.seq === seq);
  if (plans.length === 0 || plans.some((p) => p.status !== "ready")) return;
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
 * zet ze in de wachtrij. Geeft de periode terug (of null als die al bestond).
 */
export async function startNextPeriod(order: Pick<Order, "id" | "customer_id" | "product">, seq: number): Promise<number | null> {
  const ids = await createPlans(order.id, order.customer_id, products[order.product].includes, seq);
  return ids.length > 0 ? seq : null;
}

/**
 * Dagelijkse taak:
 * - nodigt abonnees uit voor hun check-in en herinnert ze eraan (een nieuw
 *   schema maken we pas na de check-in);
 * - zet schema's klaar voor check-ins die wel zijn ingevuld maar nog geen
 *   schema hebben (bijvoorbeeld na een storing);
 * - probeert mislukte of vastgelopen schema's opnieuw.
 * Stopt op tijd om binnen de maximale looptijd van de serverfunctie te blijven.
 */
export async function runScheduledWork(
  budgetMs: number,
): Promise<{ scheduled: number; reminders: number; weeklyReminders: number; healthSynced: number; processed: number }> {
  const started = Date.now();
  let scheduled = 0;
  let reminders = 0;

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
      if (await startNextPeriod(order, window.seq)) scheduled++;
      continue;
    }
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
          reminder: sent,
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
  for (const order of await weeklyReminderOrders()) {
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

  // Gekoppelde gezondheidsapps bijwerken (vangnet naast de meldingen/webhooks).
  const healthSynced = await syncAllConnections(started + Math.min(60_000, budgetMs / 4)).catch((err) => {
    console.error("Gezondheidsdata synchroniseren mislukt", err);
    return 0;
  });

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
  return { scheduled, reminders, weeklyReminders, healthSynced, processed };
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

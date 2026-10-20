import "server-only";
import { products } from "@/config/pricing";
import { minimumCalories } from "@/lib/calculations";
import { fallbackInstructions, weeklyInstructions } from "@/lib/ai/weekly";
import type { PlanContent } from "@/lib/ai/schemas";
import {
  addWeeklyLog,
  checkinsForOrder,
  claimWeeklyLog,
  completeWeeklyLog,
  getCustomer,
  getIntake,
  getOrder,
  plansForOrder,
  weeklyLogsForOrder,
  type Customer,
  type Order,
  type Plan,
  type WeeklyLogRow,
} from "@/lib/repo";
import { decideWeeklyAdjustment, weeklyKcal, weeklyWindow, type WeeklyAdjustment, type WeeklyData, type WeeklyWindow } from "@/lib/weekly";
import { toLocale, type Locale } from "@/i18n/config";

/** De lopende periode van een bestelling: nummer, begin en de schema's. */
function currentPeriod(plans: Plan[]) {
  const seq = plans.reduce((m, p) => Math.max(m, p.seq), 0);
  const own = plans.filter((p) => p.seq === seq);
  const start = own.reduce<Date | null>((min, p) => (!min || p.created_at < min ? p.created_at : min), null);
  const content = <T extends PlanContent["type"]>(type: T) =>
    (own.find((p) => p.type === type && p.status === "ready")?.content ?? null) as Extract<PlanContent, { type: T }> | null;
  return { seq, start, nutrition: content("voeding"), training: content("training") };
}

export async function weeklyWindowForOrder(order: Order, now = Date.now()): Promise<{ window: WeeklyWindow | null; logs: WeeklyLogRow[] }> {
  const [plans, logs] = await Promise.all([plansForOrder(order.id), weeklyLogsForOrder(order.id)]);
  const period = currentPeriod(plans);
  const window = weeklyWindow({
    duration: order.duration,
    status: order.status,
    lastSeq: period.seq,
    lastPeriodStart: period.start,
    loggedWeeks: logs.filter((l) => l.seq === period.seq).map((l) => l.week),
    now,
  });
  return { window, logs };
}

/**
 * Slaat een weegmoment op en beslist meteen of het schema wordt bijgestuurd.
 * Moeten er concrete aanwijzingen gemaakt worden, dan staat het weegmoment op
 * "pending" en maakt processWeeklyLog ze op de achtergrond.
 */
export async function recordWeeklyLog(input: {
  customer: Customer;
  order: Order;
  seq: number;
  week: number;
  data: WeeklyData;
}): Promise<{ id: string | null; needsInstructions: boolean }> {
  const { customer, order, data } = input;
  const [plans, logs, checkins, intakeRow] = await Promise.all([
    plansForOrder(order.id),
    weeklyLogsForOrder(order.id),
    checkinsForOrder(order.id),
    getIntake(order.intake_id),
  ]);
  const period = currentPeriod(plans);
  const includes = products[order.product].includes;
  const earlier = logs.filter((l) => l.seq === input.seq && l.week < input.week);
  const lastChange = [...earlier].reverse().find((l) => (l.adjustment?.kcal ?? 0) !== 0);
  const startCheckin = checkins.find((c) => c.for_seq === input.seq && c.data.weightKg);
  const reference = lastChange
    ? { kg: lastChange.data.weightKg, at: lastChange.created_at }
    : startCheckin
      ? { kg: startCheckin.data.weightKg!, at: startCheckin.created_at }
      : { kg: intakeRow?.data.weightKg ?? data.weightKg, at: period.start ?? order.created_at };
  const targets = period.nutrition?.targets;
  const earlierKcal = weeklyKcal(earlier);

  const decision = decideWeeklyAdjustment(
    {
      nutrition: includes.includes("voeding") && Boolean(targets),
      training: includes.includes("training") && Boolean(period.training),
      expectedKgPerWeek: targets?.expectedKgPerWeek ?? 0,
      reference,
      data,
      now: Date.now(),
      calories: (targets?.calories ?? 0) + earlierKcal,
      totalOffset: (period.nutrition?.adjustmentKcal ?? 0) + earlierKcal,
      minCalories: minimumCalories(intakeRow?.data ?? { sex: "vrouw" }),
      raisedForHunger: earlier.some((l) => (l.adjustment?.kcal ?? 0) > 0),
    },
    toLocale(customer.locale),
  );
  const needsInstructions = decision.kcal !== 0 || Boolean(decision.training);
  const id = await addWeeklyLog({
    customerId: customer.id,
    orderId: order.id,
    seq: input.seq,
    week: input.week,
    data,
    adjustment: decision,
    status: needsInstructions ? "pending" : "ready",
  });
  return { id, needsInstructions: Boolean(id) && needsInstructions };
}

/** Maakt de concrete aanwijzingen bij een weegmoment (met een vaste tekst als terugval). */
export async function processWeeklyLog(id: string): Promise<void> {
  const log = await claimWeeklyLog(id);
  if (!log?.adjustment) return;
  const decision: WeeklyAdjustment = log.adjustment;
  let nutrition: Extract<PlanContent, { type: "voeding" }> | null = null;
  let training: Extract<PlanContent, { type: "training" }> | null = null;
  // De aanwijzingen komen in de taal van de klant (de beslissing zelf is al in die taal opgeslagen).
  let l: Locale = "nl";
  try {
    l = toLocale((await getCustomer(log.customer_id))?.locale);
    const order = await getOrder(log.order_id);
    const plans = order ? await plansForOrder(order.id) : [];
    const own = plans.filter((p) => p.seq === log.seq && p.status === "ready");
    nutrition = (own.find((p) => p.type === "voeding")?.content ?? null) as typeof nutrition;
    training = (own.find((p) => p.type === "training")?.content ?? null) as typeof training;
    const intake = order ? await getIntake(order.intake_id) : null;
    if (!intake) throw new Error("Intake niet gevonden");
    const instructions = await weeklyInstructions({ decision, data: log.data, intake: intake.data, nutrition, training }, l);
    const fallback = fallbackInstructions({ decision, nutrition, training }, l);
    await completeWeeklyLog(id, {
      ...decision,
      nutrition: instructions.nutrition ?? fallback.nutrition,
      trainingPlan: instructions.trainingPlan ?? fallback.trainingPlan,
    });
  } catch (err) {
    console.error(`Aanwijzingen voor weegmoment ${id} mislukt; vaste tekst gebruikt`, err);
    await completeWeeklyLog(id, { ...decision, ...fallbackInstructions({ decision, nutrition, training }, l) });
  }
}

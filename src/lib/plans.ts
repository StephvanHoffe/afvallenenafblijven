import "server-only";
import { site } from "@/config/site";
import { products } from "@/config/pricing";
import { intakeSchema, type Intake } from "@/lib/intake";
import { loginUrl } from "@/lib/auth";
import { adminNotificationEmail, plansReadyEmail, sendMail } from "@/lib/email";
import { generateNutritionPlan, generateTrainingPlan, summarizePlan } from "@/lib/ai/generate";
import type { ProgressContext } from "@/lib/ai/prompts";
import type { PlanContent } from "@/lib/ai/schemas";
import {
  MAX_PLAN_ATTEMPTS,
  claimPlan,
  completePlan,
  createPlans,
  dueSubscriptionOrders,
  failPlan,
  getCustomer,
  getIntake,
  getOrder,
  latestCheckin,
  markPlansEmailed,
  pendingPlanIds,
  plansForOrder,
  previousReadyPlan,
  type Plan,
} from "@/lib/repo";

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
    const intakeRow = await getIntake(order.intake_id);
    if (!intakeRow) throw new Error("Intake niet gevonden");

    const previous = plan.seq > 1 ? await previousReadyPlan(order.id, plan.type, plan.seq) : null;
    const checkin = plan.seq > 1 ? await latestCheckin(customer.id, previous?.generated_at ?? undefined) : null;

    // Verwerk een eventueel nieuw gewicht of doel uit de check-in in de berekening.
    const merged: Intake = {
      ...intakeRow.data,
      product: order.product,
      ...(checkin?.weightKg ? { weightKg: checkin.weightKg } : {}),
      ...(checkin?.goal ? { goal: checkin.goal } : {}),
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
      checkin: checkin ?? undefined,
    };

    const content: PlanContent =
      plan.type === "voeding"
        ? await generateNutritionPlan(customer.name, intake, progress)
        : await generateTrainingPlan(customer.name, intake, progress);

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
  await sendMail(
    plansReadyEmail({
      to: customer.email,
      name: customer.name,
      types: plans.map((p) => p.type),
      link: await loginUrl(customer.id),
      seq,
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
 * Dagelijkse taak: nieuwe periode klaarzetten voor abonnees en mislukte of
 * vastgelopen schema's opnieuw proberen. Stopt op tijd om binnen de maximale
 * looptijd van de serverfunctie te blijven.
 */
export async function runScheduledWork(budgetMs: number): Promise<{ scheduled: number; processed: number }> {
  const started = Date.now();
  let scheduled = 0;
  for (const order of await dueSubscriptionOrders(site.planIntervalDays)) {
    const ids = await createPlans(order.id, order.customer_id, products[order.product].includes, order.last_seq + 1);
    scheduled += ids.length;
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
  return { scheduled, processed };
}

export function planTitle(plan: Pick<Plan, "type" | "seq">): string {
  const name = plan.type === "voeding" ? "Voedingsschema" : "Trainingsschema";
  return plan.seq > 1 ? `${name} – periode ${plan.seq}` : name;
}

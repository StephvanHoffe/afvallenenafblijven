import { connection } from "next/server";
import { localePath } from "@/i18n/config";
import { requestLocale } from "@/i18n/server";
import { currentCustomer } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { pdfFileName, pdfResponse, renderPlansPdf, type PdfPlan } from "@/lib/pdf/render";
import { getPlan, weeklyLogsForOrder } from "@/lib/repo";
import { adjustmentsFor } from "@/lib/weekly";

export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Download van één schema als PDF. Met ?deel=boodschappen alleen de boodschappenlijst. */
export async function GET(request: Request, ctx: RouteContext<"/[lang]/schema/[id]/pdf">) {
  await connection();
  const l = await requestLocale();
  const notFound = () => new Response(l === "en" ? "Not found" : "Niet gevonden", { status: 404 });
  const { id } = await ctx.params;
  if (!UUID.test(id) || !isDatabaseConfigured()) return notFound();
  const customer = await currentCustomer();
  if (!customer) return Response.redirect(new URL(localePath(l, "/inloggen"), request.url), 303);
  const plan = await getPlan(id);
  if (!plan || plan.customer_id !== customer.id || plan.status !== "ready" || !plan.content || !plan.released_at) {
    return notFound();
  }
  const part = new URL(request.url).searchParams.get("deel") === "boodschappen" && plan.content.type === "voeding" ? "boodschappen" : "schema";
  const weekly = (await weeklyLogsForOrder(plan.order_id)).map((w) => ({ ...w, date: w.created_at }));
  const plans: PdfPlan[] = [
    { content: plan.content, seq: plan.seq, generatedAt: plan.released_at, adjustments: adjustmentsFor(weekly, plan.seq, plan.type) },
  ];
  return pdfResponse(await renderPlansPdf(plans, customer.name, part, l), pdfFileName(plans, part, l));
}

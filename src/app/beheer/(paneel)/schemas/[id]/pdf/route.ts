import { adminData, adminDataAvailable } from "@/lib/admin/data";
import { isAdmin } from "@/lib/admin/auth";
import { pdfFileName, pdfResponse, renderPlansPdf, type PdfPlan } from "@/lib/pdf/render";

export const maxDuration = 60;

/** Beheer: een schema downloaden als PDF, precies zoals de klant het krijgt. */
export async function GET(request: Request, ctx: RouteContext<"/beheer/schemas/[id]/pdf">) {
  if (!(await isAdmin())) return Response.redirect(new URL("/beheer/inloggen", request.url), 303);
  if (!adminDataAvailable()) return new Response("Geen database", { status: 404 });
  const { id } = await ctx.params;
  const plan = await adminData().plan(id);
  if (!plan?.content) return new Response("Niet gevonden", { status: 404 });
  const part = new URL(request.url).searchParams.get("deel") === "boodschappen" && plan.content.type === "voeding" ? "boodschappen" : "schema";
  const plans: PdfPlan[] = [{ content: plan.content, seq: plan.seq, generatedAt: plan.generatedAt }];
  return pdfResponse(await renderPlansPdf(plans, plan.customerName, part), pdfFileName(plans, part));
}

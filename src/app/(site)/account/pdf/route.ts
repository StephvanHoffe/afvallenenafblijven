import { connection } from "next/server";
import { currentCustomer } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { pdfFileName, pdfResponse, renderPlansPdf, type PdfPlan } from "@/lib/pdf/render";
import { readyPlansForPeriod } from "@/lib/repo";

export const maxDuration = 60;

/** Alle schema's van één periode in één PDF (?periode=2); zonder periode de laatste. */
export async function GET(request: Request) {
  // Altijd per verzoek: het antwoord hangt af van de ingelogde klant.
  await connection();
  if (!isDatabaseConfigured()) return new Response("Niet gevonden", { status: 404 });
  const customer = await currentCustomer();
  if (!customer) return Response.redirect(new URL("/inloggen", request.url), 303);
  const raw = Number(new URL(request.url).searchParams.get("periode"));
  const seq = Number.isInteger(raw) && raw > 0 ? raw : undefined;
  const plans: PdfPlan[] = (await readyPlansForPeriod(customer.id, seq))
    .filter((p) => p.content)
    .map((p) => ({ content: p.content!, seq: p.seq, generatedAt: p.generated_at }));
  if (plans.length === 0) return new Response("Nog geen schema's om te downloaden", { status: 404 });
  return pdfResponse(await renderPlansPdf(plans, customer.name), pdfFileName(plans));
}

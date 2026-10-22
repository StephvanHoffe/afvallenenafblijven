import { connection } from "next/server";
import { localePath } from "@/i18n/config";
import { requestLocale } from "@/i18n/server";
import { currentCustomer } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { paymentForCustomer } from "@/lib/payments";
import { invoicePdfUrl, isStripeConfigured } from "@/lib/stripe";

/** De factuur (pdf) bij een betaling van de ingelogde klant: we vragen Stripe om een verse link en sturen door. */
export async function GET(request: Request, ctx: RouteContext<"/[lang]/account/factuur/[id]">) {
  // Altijd per verzoek: het antwoord hangt af van de ingelogde klant.
  await connection();
  const l = await requestLocale();
  const notFound = new Response(l === "en" ? "Invoice not found" : "Factuur niet gevonden", { status: 404 });
  if (!isDatabaseConfigured() || !isStripeConfigured()) return notFound;
  const customer = await currentCustomer();
  if (!customer) return Response.redirect(new URL(localePath(l, "/inloggen"), request.url), 303);
  const { id } = await ctx.params;
  const payment = await paymentForCustomer(customer.id, decodeURIComponent(id));
  if (!payment?.invoice_id) return notFound;
  try {
    const url = await invoicePdfUrl(payment.invoice_id);
    if (url) return Response.redirect(url, 303);
  } catch (err) {
    console.error(`Factuur ${payment.invoice_id} ophalen mislukt`, err);
  }
  return Response.redirect(new URL(localePath(l, "/account/betalingen?factuur=fout"), request.url), 303);
}

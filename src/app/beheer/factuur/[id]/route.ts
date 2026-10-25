import { isAdmin } from "@/lib/admin/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { paymentById } from "@/lib/payments";
import { invoicePdfUrl, isStripeConfigured } from "@/lib/stripe";

/** Beheer: de factuur (pdf) bij een betaling openen via een verse Stripe-link. */
export async function GET(request: Request, ctx: RouteContext<"/beheer/factuur/[id]">) {
  if (!(await isAdmin())) return Response.redirect(new URL("/beheer/inloggen", request.url), 303);
  if (!isDatabaseConfigured() || !isStripeConfigured()) return new Response("Geen database of Stripe", { status: 404 });
  const { id } = await ctx.params;
  const payment = await paymentById(decodeURIComponent(id));
  if (!payment?.invoice_id) return new Response("Geen factuur bij deze betaling", { status: 404 });
  try {
    const url = await invoicePdfUrl(payment.invoice_id);
    if (url) return Response.redirect(url, 303);
  } catch (err) {
    console.error(`Factuur ${payment.invoice_id} ophalen mislukt`, err);
  }
  return new Response("De factuur kon niet bij Stripe worden opgehaald. Probeer het later opnieuw.", { status: 502 });
}

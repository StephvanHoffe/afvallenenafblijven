import { connection } from "next/server";
import { localePath, toLocale } from "@/i18n/config";
import { requestLocale } from "@/i18n/server";
import { currentCustomer } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getInvoice } from "@/lib/invoices";
import { paymentForCustomer } from "@/lib/payments";
import { invoiceFileName, renderInvoicePdf } from "@/lib/pdf/invoice";
import { pdfResponse } from "@/lib/pdf/render";

/** De factuur of creditnota (pdf) bij een betaling van de ingelogde klant. */
export async function GET(request: Request, ctx: RouteContext<"/[lang]/account/factuur/[id]">) {
  // Altijd per verzoek: het antwoord hangt af van de ingelogde klant.
  await connection();
  const l = await requestLocale();
  const notFound = new Response(l === "en" ? "Invoice not found" : "Factuur niet gevonden", { status: 404 });
  if (!isDatabaseConfigured()) return notFound;
  const customer = await currentCustomer();
  if (!customer) return Response.redirect(new URL(localePath(l, "/inloggen"), request.url), 303);
  const { id } = await ctx.params;
  const payment = await paymentForCustomer(customer.id, decodeURIComponent(id));
  const invoice = payment?.invoice_id ? await getInvoice(payment.invoice_id) : null;
  if (!invoice) return notFound;
  try {
    const original = invoice.credit_for ? await getInvoice(invoice.credit_for) : null;
    const pdf = await renderInvoicePdf(invoice, {
      orderReference: invoice.order_id ? invoice.order_id.slice(0, 8).toUpperCase() : null,
      creditForNumber: original?.number ?? null,
      l: toLocale(customer.locale),
    });
    return pdfResponse(pdf, invoiceFileName(invoice, l));
  } catch (err) {
    console.error(`Factuur ${invoice.number} maken mislukt`, err);
  }
  return Response.redirect(new URL(localePath(l, "/account/betalingen?factuur=fout"), request.url), 303);
}

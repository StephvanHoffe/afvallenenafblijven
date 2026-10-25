import { isAdmin } from "@/lib/admin/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { getInvoice } from "@/lib/invoices";
import { paymentById } from "@/lib/payments";
import { invoiceFileName, renderInvoicePdf } from "@/lib/pdf/invoice";
import { pdfResponse } from "@/lib/pdf/render";

/** Beheer: de factuur of creditnota (pdf) bij een betaling. */
export async function GET(request: Request, ctx: RouteContext<"/beheer/factuur/[id]">) {
  if (!(await isAdmin())) return Response.redirect(new URL("/beheer/inloggen", request.url), 303);
  if (!isDatabaseConfigured()) return new Response("Geen database", { status: 404 });
  const { id } = await ctx.params;
  const payment = await paymentById(decodeURIComponent(id));
  const invoice = payment?.invoice_id ? await getInvoice(payment.invoice_id) : null;
  if (!invoice) return new Response("Geen factuur bij deze betaling", { status: 404 });
  const original = invoice.credit_for ? await getInvoice(invoice.credit_for) : null;
  const pdf = await renderInvoicePdf(invoice, {
    orderReference: invoice.order_id ? invoice.order_id.slice(0, 8).toUpperCase() : null,
    creditForNumber: original?.number ?? null,
  });
  return pdfResponse(pdf, invoiceFileName(invoice));
}

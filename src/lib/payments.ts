import "server-only";
import { db } from "@/lib/db";
import type { Stripe } from "@/lib/stripe";

/**
 * Ontvangen betalingen en terugbetalingen, voor de omzetcijfers in het beheer.
 * Abonnementen: elke betaalde factuur (Stripe-webhook invoice.paid), dus ook de
 * eerste maand. Losse schema's: de afgeronde checkout. Terugbetalingen vanuit
 * het beheer worden als negatief bedrag vastgelegd.
 */

export async function recordPayment(p: {
  id: string;
  orderId: string | null;
  customerId: string | null;
  amountCents: number;
  kind: "payment" | "refund";
  description?: string;
  paidAt?: Date;
  /** De Stripe-factuur bij deze betaling (niet bij terugbetalingen). */
  invoiceId?: string | null;
}): Promise<void> {
  const sql = await db();
  await sql`
    insert into payments (id, order_id, customer_id, amount_cents, kind, description, paid_at, invoice_id)
    values (${p.id}, ${p.orderId}, ${p.customerId}, ${p.amountCents}, ${p.kind}, ${p.description ?? null}, ${p.paidAt ?? new Date()}, ${p.invoiceId ?? null})
    on conflict (id) do nothing`;
}

export interface PaymentRow {
  id: string;
  order_id: string | null;
  amount_cents: number;
  kind: "payment" | "refund";
  description: string | null;
  paid_at: Date;
  invoice_id: string | null;
}

/** Alle betalingen en terugbetalingen van een klant, nieuwste eerst. */
export async function paymentsForCustomer(customerId: string): Promise<PaymentRow[]> {
  const sql = await db();
  return sql<PaymentRow[]>`
    select id, order_id, amount_cents, kind, description, paid_at, invoice_id
    from payments where customer_id = ${customerId} order by paid_at desc, id`;
}

/** Eén betaling (voor het beheer). */
export async function paymentById(id: string): Promise<PaymentRow | null> {
  const sql = await db();
  const [row] = await sql<PaymentRow[]>`
    select id, order_id, amount_cents, kind, description, paid_at, invoice_id from payments where id = ${id}`;
  return row ?? null;
}

/** Eén betaling, alleen als die bij deze klant hoort. */
export async function paymentForCustomer(customerId: string, id: string): Promise<PaymentRow | null> {
  const sql = await db();
  const [row] = await sql<PaymentRow[]>`
    select id, order_id, amount_cents, kind, description, paid_at, invoice_id
    from payments where id = ${id} and customer_id = ${customerId}`;
  return row ?? null;
}

/** Een betaalde abonnementsfactuur vastleggen. */
export async function recordInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscription = invoice.parent?.subscription_details?.subscription;
  const subscriptionId = typeof subscription === "string" ? subscription : (subscription?.id ?? null);
  if (!invoice.id || !subscriptionId || invoice.amount_paid <= 0) return;
  const sql = await db();
  const [order] = await sql<{ id: string; customer_id: string }[]>`
    select id, customer_id from orders where stripe_subscription_id = ${subscriptionId}`;
  await recordPayment({
    id: invoice.id,
    orderId: order?.id ?? null,
    customerId: order?.customer_id ?? null,
    amountCents: invoice.amount_paid,
    kind: "payment",
    description: invoice.billing_reason ?? undefined,
    paidAt: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : new Date(),
    invoiceId: invoice.id,
  });
}

import "server-only";
import { db } from "@/lib/db";

/**
 * Ontvangen betalingen en terugbetalingen, voor de omzetcijfers in het beheer en
 * het tabblad Betalingen. Elke betaalde Mollie-betaling (de eerste betaling en
 * de maandelijkse afschrijvingen) komt hier via de webhook, met de factuur
 * erbij. Terugbetalingen en terugboekingen worden als negatief bedrag
 * vastgelegd, met een creditnota bij een terugbetaling.
 */

export async function recordPayment(p: {
  id: string;
  orderId: string | null;
  customerId: string | null;
  amountCents: number;
  kind: "payment" | "refund";
  description?: string;
  paidAt?: Date;
  /** De factuur (of creditnota) bij deze betaling. */
  invoiceId?: string | null;
}): Promise<boolean> {
  const sql = await db();
  const rows = await sql`
    insert into payments (id, order_id, customer_id, amount_cents, kind, description, paid_at, invoice_id)
    values (${p.id}, ${p.orderId}, ${p.customerId}, ${p.amountCents}, ${p.kind}, ${p.description ?? null}, ${p.paidAt ?? new Date()}, ${p.invoiceId ?? null})
    on conflict (id) do nothing returning id`;
  return rows.length > 0;
}

/** Is deze betaling al vastgelegd? */
export async function isPaymentRecorded(id: string): Promise<boolean> {
  const sql = await db();
  const rows = await sql`select 1 from payments where id = ${id}`;
  return rows.length > 0;
}

/** Hoeveel betalingen er voor een bestelling zijn ontvangen (zonder terugbetalingen). */
export async function paidPaymentCount(orderId: string): Promise<number> {
  const sql = await db();
  const [row] = await sql<{ n: number }[]>`select count(*)::int as n from payments where order_id = ${orderId} and kind = 'payment'`;
  return row?.n ?? 0;
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

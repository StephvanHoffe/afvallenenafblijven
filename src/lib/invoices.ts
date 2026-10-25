import "server-only";
import { vatPercent } from "@/config/pricing";
import { db } from "@/lib/db";

/**
 * Facturen en creditnota's. Mollie maakt geen facturen voor je klanten, dus de
 * website doet dat zelf bij elke ontvangen betaling (en een creditnota bij een
 * terugbetaling). Nummers lopen per jaar door zonder gaten: 2026-00001,
 * 2026-00002, … De prijzen zijn inclusief btw; de factuur laat zien hoeveel btw
 * erin zit.
 */

export interface InvoiceRow {
  id: string;
  number: string;
  payment_id: string;
  kind: "invoice" | "credit";
  credit_for: string | null;
  order_id: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  description: string;
  period_start: Date | null;
  period_end: Date | null;
  /** Inclusief btw; negatief bij een creditnota. */
  amount_cents: number;
  vat_cents: number;
  vat_percent: number;
  /** Betaalmethode bij Mollie (ideal, bancontact, creditcard, directdebit). */
  method: string | null;
  issued_at: Date;
}

/** De btw in een bedrag inclusief btw, afgerond op hele centen. */
export function vatIncluded(amountCents: number, percent: number = vatPercent): number {
  return Math.round((amountCents * percent) / (100 + percent));
}

/** Een datum als JJJJ-MM-DD in Nederlandse tijd (voor de kolommen period_start/period_end). */
function isoDay(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(d);
}

/**
 * Maakt de factuur (of creditnota) bij een betaling. Idempotent: bestaat er al
 * een factuur voor deze betaling, dan krijg je die terug.
 */
export async function createInvoice(input: {
  paymentId: string;
  kind?: "invoice" | "credit";
  creditFor?: string | null;
  orderId: string | null;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  description: string;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  amountCents: number;
  method?: string | null;
  issuedAt?: Date;
}): Promise<InvoiceRow> {
  const sql = await db();
  const issuedAt = input.issuedAt ?? new Date();
  const year = Number(isoDay(issuedAt).slice(0, 4));
  return sql.begin(async (tx) => {
    // Eén factuur per betaling, ook als de webhook twee keer tegelijk binnenkomt.
    await tx`select pg_advisory_xact_lock(hashtext(${"factuur:" + input.paymentId}))`;
    const [existing] = await tx<InvoiceRow[]>`select * from invoices where payment_id = ${input.paymentId}`;
    if (existing) return existing;
    const [{ last }] = await tx<{ last: number }[]>`
      insert into invoice_counters (year, last) values (${year}, 1)
      on conflict (year) do update set last = invoice_counters.last + 1
      returning last`;
    const number = `${year}-${String(last).padStart(5, "0")}`;
    const [row] = await tx<InvoiceRow[]>`
      insert into invoices (number, payment_id, kind, credit_for, order_id, customer_id, customer_name, customer_email, description,
                            period_start, period_end, amount_cents, vat_cents, vat_percent, method, issued_at)
      values (${number}, ${input.paymentId}, ${input.kind ?? "invoice"}, ${input.creditFor ?? null}, ${input.orderId}, ${input.customerId},
              ${input.customerName}, ${input.customerEmail}, ${input.description},
              ${input.periodStart ? isoDay(input.periodStart) : null}, ${input.periodEnd ? isoDay(input.periodEnd) : null},
              ${input.amountCents}, ${vatIncluded(input.amountCents)}, ${vatPercent}, ${input.method ?? null}, ${issuedAt})
      returning *`;
    return row;
  });
}

export async function getInvoice(id: string): Promise<InvoiceRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const sql = await db();
  const [row] = await sql<InvoiceRow[]>`select * from invoices where id = ${id}`;
  return row ?? null;
}

/** De factuur bij de eerste betaling van een bestelling (waar een creditnota naar verwijst). */
export async function invoiceForPayment(paymentId: string): Promise<InvoiceRow | null> {
  const sql = await db();
  const [row] = await sql<InvoiceRow[]>`select * from invoices where payment_id = ${paymentId}`;
  return row ?? null;
}

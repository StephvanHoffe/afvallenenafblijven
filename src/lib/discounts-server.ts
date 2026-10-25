import "server-only";
import type { DurationId, ProductId } from "@/config/pricing";
import { db } from "@/lib/db";
import { normalizeCode, type DiscountDuration, type DiscountTerms } from "@/lib/discounts";

/** Een kortingscode zoals opgeslagen, met het gebruik tot nu toe. */
export interface DiscountCodeRow {
  id: string;
  code: string;
  description: string | null;
  percent_off: number | null;
  amount_off_cents: number | null;
  duration: DiscountDuration;
  duration_months: number | null;
  /** Leeg = alle producten / looptijden. */
  products: ProductId[];
  durations: DurationId[];
  max_redemptions: number | null;
  starts_at: Date | null;
  expires_at: Date | null;
  active: boolean;
  created_at: Date;
  /** Aantal bestellingen met deze code. */
  redemptions: number;
  /** Aantal gestarte betalingen met deze code (ook niet afgerond). */
  checkouts: number;
  /** Som van de eerste betalingen met deze code. */
  revenue_cents: number;
}

export type DiscountProblem = "unknown" | "inactive" | "not_started" | "expired" | "used_up" | "not_for_plan";

export function termsOf(row: Pick<DiscountCodeRow, "code" | "percent_off" | "amount_off_cents" | "duration" | "duration_months">): DiscountTerms {
  return {
    code: row.code,
    percentOff: row.percent_off,
    amountOffCents: row.amount_off_cents,
    duration: row.duration,
    durationMonths: row.duration_months,
  };
}

export async function listDiscountCodes(): Promise<DiscountCodeRow[]> {
  const sql = await db();
  return sql<DiscountCodeRow[]>`
    select d.*,
      (select count(*)::int from orders o where o.discount_code = d.code) as redemptions,
      (select count(*)::int from intakes i where i.discount_code = d.code) as checkouts,
      (select coalesce(sum(o.amount_cents), 0)::int from orders o where o.discount_code = d.code) as revenue_cents
    from discount_codes d order by d.active desc, d.created_at desc`;
}

export async function getDiscountCode(code: string): Promise<DiscountCodeRow | null> {
  const sql = await db();
  const [row] = await sql<DiscountCodeRow[]>`
    select d.*,
      (select count(*)::int from orders o where o.discount_code = d.code) as redemptions,
      0 as checkouts, 0 as revenue_cents
    from discount_codes d where d.code = ${normalizeCode(code)}`;
  return row ?? null;
}

/** Is de code nu bruikbaar voor dit product en deze looptijd? */
export function checkCode(
  row: DiscountCodeRow | null,
  product: ProductId,
  duration: DurationId,
  now: number = Date.now(),
): { ok: true; terms: DiscountTerms } | { ok: false; problem: DiscountProblem } {
  if (!row) return { ok: false, problem: "unknown" };
  if (!row.active) return { ok: false, problem: "inactive" };
  if (row.starts_at && row.starts_at.getTime() > now) return { ok: false, problem: "not_started" };
  if (row.expires_at && row.expires_at.getTime() < now) return { ok: false, problem: "expired" };
  if (row.max_redemptions !== null && row.redemptions >= row.max_redemptions) return { ok: false, problem: "used_up" };
  if (row.products.length > 0 && !row.products.includes(product)) return { ok: false, problem: "not_for_plan" };
  if (row.durations.length > 0 && !row.durations.includes(duration)) return { ok: false, problem: "not_for_plan" };
  return { ok: true, terms: termsOf(row) };
}

export async function createDiscountCode(input: {
  code: string;
  description: string | null;
  percentOff: number | null;
  amountOffCents: number | null;
  duration: DiscountDuration;
  durationMonths: number | null;
  products: ProductId[];
  durations: DurationId[];
  maxRedemptions: number | null;
  startsAt: Date | null;
  expiresAt: Date | null;
}): Promise<boolean> {
  const sql = await db();
  const rows = await sql`
    insert into discount_codes (code, description, percent_off, amount_off_cents, duration, duration_months, products, durations,
                                max_redemptions, starts_at, expires_at)
    values (${normalizeCode(input.code)}, ${input.description}, ${input.percentOff}, ${input.amountOffCents}, ${input.duration},
            ${input.duration === "repeating" ? input.durationMonths : null}, ${input.products}, ${input.durations},
            ${input.maxRedemptions}, ${input.startsAt}, ${input.expiresAt})
    on conflict (code) do nothing returning id`;
  return rows.length > 0;
}

export async function setDiscountActive(id: string, active: boolean): Promise<void> {
  const sql = await db();
  await sql`update discount_codes set active = ${active} where id = ${id}`;
}

/** Verwijdert een code die nog nooit is gebruikt; anders wordt hij alleen gepauzeerd. */
export async function deleteDiscountCode(id: string): Promise<"deleted" | "paused"> {
  const sql = await db();
  const deleted = await sql`
    delete from discount_codes d where d.id = ${id}
      and not exists (select 1 from orders o where o.discount_code = d.code) returning id`;
  if (deleted.length > 0) return "deleted";
  await setDiscountActive(id, false);
  return "paused";
}

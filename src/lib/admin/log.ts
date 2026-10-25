import "server-only";
import { db, isDatabaseConfigured } from "@/lib/db";

/** Logboek van wat er in het beheer is gedaan (24 maanden bewaard). */
export async function logAdminAction(action: string, details?: string | null, customerId?: string | null): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    const sql = await db();
    await sql`insert into admin_log (action, details, customer_id) values (${action}, ${details?.slice(0, 1000) ?? null}, ${customerId ?? null})`;
  } catch (err) {
    console.error("Logboek bijwerken mislukt", err);
  }
}

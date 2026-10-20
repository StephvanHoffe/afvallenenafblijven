import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getCustomer, type Customer } from "@/lib/repo";
import { site } from "@/config/site";
import { localeUrl, type Locale } from "@/i18n/config";

/**
 * Inloggen zonder wachtwoord: klanten krijgen een persoonlijke inloglink per
 * e-mail. De link levert een sessiecookie op. In de database bewaren we
 * alleen hashes van tokens, nooit de tokens zelf.
 */

export const SESSION_COOKIE = "afb_sessie";
const SESSION_DAYS = 90;
const LOGIN_LINK_DAYS = 60;

function token(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createLoginToken(customerId: string, days = LOGIN_LINK_DAYS): Promise<string> {
  const sql = await db();
  const raw = token();
  await sql`
    insert into login_tokens (token_hash, customer_id, expires_at)
    values (${hashToken(raw)}, ${customerId}, now() + make_interval(days => ${days}))`;
  // Opruimen van verlopen tokens.
  await sql`delete from login_tokens where expires_at < now()`;
  return raw;
}

/**
 * Persoonlijke inloglink; met `naar` kom je direct op de juiste plek in Mijn schema's.
 * Engelstalige klanten krijgen een link naar /en/inloggen/link.
 */
export async function loginUrl(customerId: string, naar?: "opzeggen" | "check-in" | "weegmoment", l: Locale = "nl"): Promise<string> {
  const raw = await createLoginToken(customerId);
  return localeUrl(site.url, l, `/inloggen/link?token=${encodeURIComponent(raw)}${naar ? `&naar=${naar}` : ""}`);
}

export async function customerForLoginToken(raw: string): Promise<string | null> {
  const sql = await db();
  const [row] = await sql<{ customer_id: string }[]>`
    select customer_id from login_tokens where token_hash = ${hashToken(raw)} and expires_at > now()`;
  return row?.customer_id ?? null;
}

/** Maakt een sessie aan en zet het cookie (alleen in Route Handlers en Server Actions). */
export async function startSession(customerId: string): Promise<void> {
  const sql = await db();
  const raw = token();
  await sql`
    insert into sessions (token_hash, customer_id, expires_at)
    values (${hashToken(raw)}, ${customerId}, now() + make_interval(days => ${SESSION_DAYS}))`;
  await sql`delete from sessions where expires_at < now()`;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function currentCustomer(): Promise<Customer | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const sql = await db();
  const [row] = await sql<{ customer_id: string }[]>`
    select customer_id from sessions where token_hash = ${hashToken(raw)} and expires_at > now()`;
  if (!row) return null;
  return getCustomer(row.customer_id);
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) {
    const sql = await db();
    await sql`delete from sessions where token_hash = ${hashToken(raw)}`;
  }
  jar.delete(SESSION_COOKIE);
}

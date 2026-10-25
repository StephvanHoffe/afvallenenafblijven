import "server-only";
import { db, isDatabaseConfigured } from "@/lib/db";
import type { Mail, MailKind, MailTexts } from "@/lib/email";
import type { Locale } from "@/i18n/config";

/**
 * Opslag rond e-mail: aangepaste teksten uit het beheer en het log van alle
 * verstuurde mails. Fouten hier mogen het versturen nooit tegenhouden.
 */

type Override = Partial<MailTexts>;
let cache: { at: number; rows: Map<string, Override> } | null = null;
const TTL = 30_000;

/** Alle aangepaste teksten, kort gecachet (na opslaan in het beheer wordt de cache gewist). */
async function overrides(): Promise<Map<string, Override>> {
  if (cache && Date.now() - cache.at < TTL) return cache.rows;
  const sql = await db();
  const rows = await sql<{ kind: string; locale: string; subject: string | null; intro: string | null; button: string | null }[]>`
    select kind, locale, subject, intro, button from email_templates`;
  const map = new Map<string, Override>();
  for (const r of rows) {
    map.set(`${r.kind}:${r.locale}`, { subject: r.subject ?? undefined, intro: r.intro ?? undefined, button: r.button ?? undefined });
  }
  cache = { at: Date.now(), rows: map };
  return map;
}

export async function mailTextOverride(kind: MailKind, locale: Locale): Promise<Override | null> {
  if (!isDatabaseConfigured()) return null;
  const o = (await overrides()).get(`${kind}:${locale}`);
  return o && (o.subject || o.intro || o.button) ? o : null;
}

export async function allMailOverrides(): Promise<Map<string, Override>> {
  return overrides();
}

export async function saveMailOverride(kind: MailKind, locale: Locale, texts: Override): Promise<void> {
  const sql = await db();
  const clean = (v: string | undefined) => (v && v.trim() ? v.trim().slice(0, 4000) : null);
  await sql`
    insert into email_templates (kind, locale, subject, intro, button, updated_at)
    values (${kind}, ${locale}, ${clean(texts.subject)}, ${clean(texts.intro)}, ${clean(texts.button)}, now())
    on conflict (kind, locale) do update set subject = excluded.subject, intro = excluded.intro, button = excluded.button, updated_at = now()`;
  cache = null;
}

export async function resetMailOverride(kind: MailKind, locale: Locale): Promise<void> {
  const sql = await db();
  await sql`delete from email_templates where kind = ${kind} and locale = ${locale}`;
  cache = null;
}

export async function logMail(mail: Mail, status: "sent" | "skipped" | "failed", error?: string): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    const sql = await db();
    await sql`
      insert into email_log (to_email, kind, subject, status, error)
      values (${mail.to}, ${mail.kind ?? null}, ${mail.subject.slice(0, 300)}, ${status}, ${error?.slice(0, 500) ?? null})`;
  } catch (err) {
    console.error("E-mail loggen mislukt", err);
  }
}

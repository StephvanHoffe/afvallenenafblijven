import "server-only";
import { db, isDatabaseConfigured } from "@/lib/db";
import type { Mail, MailKind, MailTexts } from "@/lib/email";
import type { Locale } from "@/i18n/config";
import { adminTopicInfo, type AdminTopic } from "@/lib/admin-topics";

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

// ---------- Meldingen aan de beheerder: aan of uit ----------

const ADMIN_TOPICS_SETTING = "admin_notifications";
let mutedCache: { at: number; off: Set<string> } | null = null;

/** De soorten meldingen die je in het beheer hebt uitgezet (30 seconden in het geheugen). */
export async function mutedAdminTopics(): Promise<Set<string>> {
  if (!isDatabaseConfigured()) return new Set();
  if (mutedCache && Date.now() - mutedCache.at < TTL) return mutedCache.off;
  const sql = await db();
  const [row] = await sql<{ value: { off?: string[] } }[]>`select value from settings where key = ${ADMIN_TOPICS_SETTING}`;
  mutedCache = { at: Date.now(), off: new Set(row?.value?.off ?? []) };
  return mutedCache.off;
}

export async function isAdminTopicMuted(topic: AdminTopic): Promise<boolean> {
  if (adminTopicInfo(topic)?.fixed) return false;
  return (await mutedAdminTopics()).has(topic);
}

export async function setAdminTopicMuted(topic: AdminTopic, muted: boolean): Promise<void> {
  const off = new Set(await mutedAdminTopics());
  if (muted) off.add(topic);
  else off.delete(topic);
  const sql = await db();
  await sql`
    insert into settings (key, value) values (${ADMIN_TOPICS_SETTING}, ${sql.json({ off: [...off] })}::jsonb)
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  mutedCache = null;
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

/**
 * Legt een mail vast. Van meldingen aan de beheerder bewaren we ook de inhoud,
 * zodat je ze in het beheer kunt teruglezen; van klantmails alleen het onderwerp.
 * "disabled" = een melding die je in het beheer hebt uitgezet (niet gemaild).
 */
export async function logMail(mail: Mail, status: "sent" | "skipped" | "failed" | "disabled", error?: string): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const admin = mail.kind === "admin";
  try {
    const sql = await db();
    await sql`
      insert into email_log (to_email, kind, subject, status, error, topic, body, about_email)
      values (${mail.to}, ${mail.kind ?? null}, ${mail.subject.slice(0, 300)}, ${status}, ${error?.slice(0, 500) ?? null},
        ${admin ? (mail.topic ?? null) : null}, ${admin ? mail.text.slice(0, 8000) : null}, ${admin ? (mail.about?.toLowerCase() ?? null) : null})`;
  } catch (err) {
    console.error("E-mail loggen mislukt", err);
  }
}

import "server-only";
import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, isDatabaseConfigured } from "@/lib/db";
import { ADMIN_COOKIE, isDemoMode, looksLikeAdminCookie } from "@/lib/admin/session-cookie";

/**
 * Toegang tot /beheer met één wachtwoord. Na inloggen krijg je een
 * ondertekend cookie dat 12 uur geldig is. Wijzig je het wachtwoord, dan
 * vervallen alle bestaande sessies.
 *
 * - Het wachtwoord staat versleuteld (scrypt) in de database en wijzig je in
 *   het beheer.
 * - De eerste keer log je in met het eenmalige startwachtwoord (hier staat
 *   alleen de vingerafdruk, niet het wachtwoord zelf). Daarna moet je eerst
 *   een eigen wachtwoord kiezen; vanaf dan werkt het startwachtwoord niet meer.
 * - ADMIN_PASSWORD bij de hosting (minimaal 12 tekens) werkt altijd als
 *   noodsleutel, bijvoorbeeld als je je wachtwoord kwijt bent.
 *
 * Met BEHEER_DEMO=1 toont /beheer voorbeelddata zonder in te loggen. Alleen
 * bedoeld voor een voorbeeldweergave: echte gegevens worden dan nooit getoond.
 */

export { ADMIN_COOKIE, isDemoMode, looksLikeAdminCookie };
const SESSION_HOURS = 12;
export const MIN_PASSWORD_LENGTH = 12;
const SETTING = "beheer";
/** SHA-256 van het eenmalige startwachtwoord. */
const START_PASSWORD_SHA256 = "a7271d29c2fe53b1250db1df694d70d9fd55f8f254cc6fe9fd0de756b07f5c85";

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number, options: object) => Promise<Buffer>;
const SCRYPT = { N: 16384, r: 8, p: 1 };

interface AdminSecrets {
  /** scrypt$N$r$p$zout$hash, of null zolang er nog geen eigen wachtwoord is. */
  passwordHash: string | null;
  /** Willekeurige sleutel waarmee de sessiecookies worden ondertekend. */
  sessionKey: string;
}

declare global {
  var __afbAdminSecrets: { at: number; secrets: AdminSecrets } | undefined;
}

function envPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD ?? "";
  return value.length >= MIN_PASSWORD_LENGTH ? value : null;
}

/** Kan er worden ingelogd? Met een database altijd (eerst met het startwachtwoord), anders alleen met ADMIN_PASSWORD. */
export function isAdminConfigured(): boolean {
  return isDatabaseConfigured() || Boolean(envPassword());
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Het wachtwoord en de sessiesleutel uit de database (30 seconden in het geheugen). */
async function adminSecrets({ fresh = false }: { fresh?: boolean } = {}): Promise<AdminSecrets> {
  if (!isDatabaseConfigured()) return { passwordHash: null, sessionKey: "zonder-database" };
  const cached = globalThis.__afbAdminSecrets;
  if (!fresh && cached && Date.now() - cached.at < 30_000) return cached.secrets;
  const sql = await db();
  let [row] = await sql<{ value: Partial<AdminSecrets> }[]>`select value from settings where key = ${SETTING}`;
  if (!row?.value?.sessionKey) {
    // Eerste keer: een sessiesleutel aanmaken (één keer, ook als twee verzoeken tegelijk komen).
    const sessionKey = randomBytes(32).toString("base64url");
    await sql`
      insert into settings (key, value) values (${SETTING}, ${sql.json({ sessionKey })}::jsonb)
      on conflict (key) do update set value = settings.value || ${sql.json({ sessionKey })}::jsonb, updated_at = now()
        where not (settings.value ? 'sessionKey')`;
    [row] = await sql<{ value: Partial<AdminSecrets> }[]>`select value from settings where key = ${SETTING}`;
  }
  const secrets: AdminSecrets = { passwordHash: row.value.passwordHash ?? null, sessionKey: row.value.sessionKey! };
  globalThis.__afbAdminSecrets = { at: Date.now(), secrets };
  return secrets;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 32, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [kind, n, r, p, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64url"), expected.length, { N: Number(n), r: Number(r), p: Number(p) });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Klopt het wachtwoord (eigen wachtwoord, noodsleutel of, de eerste keer, het startwachtwoord)? */
export async function passwordMatches(input: string): Promise<boolean> {
  if (!input) return false;
  // Altijd vers uit de database: een andere server kan het wachtwoord net hebben gewijzigd.
  const secrets = await adminSecrets({ fresh: true });
  if (secrets.passwordHash && (await verifyPassword(input, secrets.passwordHash))) return true;
  const env = envPassword();
  // Vergelijk hashes, zodat de lengte van het wachtwoord niet uitlekt.
  if (env && safeEqual(sha256(input), sha256(env))) return true;
  return !secrets.passwordHash && !env && isDatabaseConfigured() && safeEqual(sha256(input), START_PASSWORD_SHA256);
}

/** Is er ingelogd met het startwachtwoord, zodat er eerst een eigen wachtwoord moet komen? */
export async function mustChangePassword(): Promise<boolean> {
  if (isDemoMode() || !isDatabaseConfigured() || envPassword()) return false;
  // Nog geen wachtwoord in het geheugen? Dan vers nakijken (misschien net op een andere server ingesteld).
  return !(await adminSecrets()).passwordHash && !(await adminSecrets({ fresh: true })).passwordHash;
}

/** Slaat een nieuw beheerwachtwoord op. Alle sessies vervallen; de huidige krijgt direct een nieuwe. */
export async function setAdminPassword(password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  const sql = await db();
  await adminSecrets();
  await sql`update settings set value = value || ${sql.json({ passwordHash })}::jsonb, updated_at = now() where key = ${SETTING}`;
  await adminSecrets({ fresh: true });
  await startAdminSession();
}

async function signingKey(fresh = false): Promise<Buffer> {
  const secrets = await adminSecrets({ fresh });
  return createHash("sha256")
    .update(`afb-beheer-sessie:${secrets.sessionKey}:${secrets.passwordHash ?? ""}:${envPassword() ?? ""}`)
    .digest();
}

async function sign(expires: number, fresh = false): Promise<string> {
  return createHmac("sha256", await signingKey(fresh)).update(`beheer:${expires}`).digest("base64url");
}

export async function startAdminSession(): Promise<void> {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, `${expires}.${await sign(expires)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/beheer",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function endAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete({ name: ADMIN_COOKIE, path: "/beheer" });
}

/** Controleert een sessiecookie volledig. */
export async function verifyAdminCookieValue(value: string | undefined): Promise<boolean> {
  if (!isAdminConfigured() || !looksLikeAdminCookie(value)) return false;
  const [exp, sig] = value!.split(".");
  try {
    if (safeEqual(sig, await sign(Number(exp)))) return true;
    // Klopt niet met wat deze server onthoudt: vers nakijken (het wachtwoord kan net op een andere server zijn gewijzigd).
    return safeEqual(sig, await sign(Number(exp), true));
  } catch (err) {
    console.error("Beheersessie controleren mislukt", err);
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  if (isDemoMode()) return true;
  return verifyAdminCookieValue((await cookies()).get(ADMIN_COOKIE)?.value);
}

/**
 * Gebruik in elke beheerpagina en elke beheeractie. Na inloggen met het
 * startwachtwoord gaat alles eerst naar de pagina om een eigen wachtwoord te kiezen.
 */
export async function requireAdmin({ allowPasswordChange = false }: { allowPasswordChange?: boolean } = {}): Promise<void> {
  if (!(await isAdmin())) redirect("/beheer/inloggen");
  if (!allowPasswordChange && (await mustChangePassword())) redirect("/beheer/wachtwoord");
}

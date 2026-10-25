import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Toegang tot /beheer met één wachtwoord (ADMIN_PASSWORD). Na inloggen krijg je
 * een ondertekend cookie dat 12 uur geldig is. Wijzig je het wachtwoord, dan
 * vervallen alle bestaande sessies.
 *
 * Met BEHEER_DEMO=1 toont /beheer voorbeelddata zonder in te loggen. Alleen
 * bedoeld voor een voorbeeldweergave: echte gegevens worden dan nooit getoond.
 */

export const ADMIN_COOKIE = "afb_beheer";
const SESSION_HOURS = 12;

export function isDemoMode(): boolean {
  return process.env.BEHEER_DEMO === "1";
}

export function isAdminConfigured(): boolean {
  return (process.env.ADMIN_PASSWORD ?? "").length >= 12;
}

function signingKey(): Buffer {
  return createHash("sha256").update(`afb-beheer-sessie:${process.env.ADMIN_PASSWORD ?? ""}`).digest();
}

function sign(expires: number): string {
  return createHmac("sha256", signingKey()).update(`beheer:${expires}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function passwordMatches(input: string): boolean {
  if (!isAdminConfigured()) return false;
  // Vergelijk hashes, zodat de lengte van het wachtwoord niet uitlekt.
  const a = createHash("sha256").update(input).digest("hex");
  const b = createHash("sha256").update(process.env.ADMIN_PASSWORD ?? "").digest("hex");
  return safeEqual(a, b);
}

export async function startAdminSession(): Promise<void> {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, `${expires}.${sign(expires)}`, {
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

/** Controleert een sessiecookie (ook bruikbaar in de proxy). */
export function verifyAdminCookieValue(value: string | undefined): boolean {
  if (!isAdminConfigured() || !value) return false;
  const [exp, sig] = value.split(".");
  const expires = Number(exp);
  if (!expires || !sig || expires < Date.now()) return false;
  return safeEqual(sig, sign(expires));
}

export async function isAdmin(): Promise<boolean> {
  if (isDemoMode()) return true;
  return verifyAdminCookieValue((await cookies()).get(ADMIN_COOKIE)?.value);
}

/** Gebruik in elke beheerpagina en elke beheeractie. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/beheer/inloggen");
}

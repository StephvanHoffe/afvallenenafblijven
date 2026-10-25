import "server-only";
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Versleuteling van toegangstokens (AES-256-GCM) en ondertekening van de
 * OAuth-state. De sleutel staat in HEALTH_ENCRYPTION_KEY (64 hextekens).
 */

function key(): Buffer {
  const hex = process.env.HEALTH_ENCRYPTION_KEY ?? "";
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new Error("HEALTH_ENCRYPTION_KEY ontbreekt of is geen 64 hextekens");
  return Buffer.from(hex, "hex");
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}

export function decrypt(value: string): string {
  const [version, iv, tag, data] = value.split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Onbekend tokenformaat");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}

function sign(payload: string): string {
  return createHmac("sha256", key()).update(`afb-koppeling:${payload}`).digest("base64url");
}

/** Ondertekende, kortlevende state voor de OAuth-terugkeer: wie koppelt en in welke taal. */
export function createState(data: { customerId: string; locale: string }): string {
  const payload = Buffer.from(
    JSON.stringify({ c: data.customerId, l: data.locale, n: randomBytes(8).toString("hex"), e: Date.now() + 15 * 60 * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readState(state: string | null): { customerId: string; locale: string } | null {
  if (!state) return null;
  const [payload, signature] = state.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { c?: string; l?: string; e?: number };
    if (!data.c || !data.e || data.e < Date.now()) return null;
    return { customerId: data.c, locale: data.l ?? "nl" };
  } catch {
    return null;
  }
}

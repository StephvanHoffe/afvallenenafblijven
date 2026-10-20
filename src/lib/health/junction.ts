import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { junctionProviders } from "@/lib/health/config";
import type { HealthDay, HealthWorkout, WorkoutKind } from "@/lib/health/types";

/**
 * Junction (voorheen Vital): één API voor Apple Health (via de Junction-app op
 * de iPhone), Garmin, Fitbit, Oura, Polar en meer. We gebruiken de EU-regio.
 * Docs: https://docs.junction.com
 */

function baseUrl(): string {
  // Alleen voor tests te overschrijven (een nagebootste server).
  if (process.env.JUNCTION_API_URL) return process.env.JUNCTION_API_URL;
  const region = process.env.JUNCTION_REGION === "us" ? "us" : "eu";
  const sandbox = process.env.JUNCTION_ENVIRONMENT === "sandbox";
  return `https://api.${sandbox ? "sandbox." : ""}${region}.junction.com`;
}

export class JunctionError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown = null,
  ) {
    super(`Junction: ${message}`);
  }
}

async function call<T>(method: "GET" | "POST" | "DELETE", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-vital-api-key": process.env.JUNCTION_API_KEY ?? "",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) throw new JunctionError(`HTTP ${res.status} op ${path}`, res.status, json);
  return json as T;
}

/**
 * Maakt een Junction-gebruiker voor een klant aan. We geven alleen ons eigen
 * klant-id mee (geen naam of e-mailadres), met een achtervoegsel: na
 * ontkoppelen blijft een verwijderde gebruiker nog even bestaan bij Junction.
 */
export async function ensureJunctionUser(customerId: string): Promise<string> {
  try {
    const user = await call<{ user_id: string }>("POST", "/v2/user", {
      client_user_id: `${customerId}-${Date.now().toString(36)}`,
      fallback_time_zone: "Europe/Amsterdam",
    });
    return user.user_id;
  } catch (err) {
    const existing = (err as JunctionError).body as { detail?: { user_id?: string } } | null;
    if (err instanceof JunctionError && err.status === 400 && existing?.detail?.user_id) return existing.detail.user_id;
    throw err;
  }
}

/** Link naar de Junction-widget waarin de klant een cloud-app kiest en inlogt. */
export async function junctionLinkUrl(userId: string, redirectUrl: string): Promise<string> {
  const providers = junctionProviders();
  const res = await call<{ link_web_url: string }>("POST", "/v2/link/token", {
    user_id: userId,
    redirect_url: redirectUrl,
    ...(providers.length ? { filter_on_providers: providers } : {}),
  });
  return res.link_web_url;
}

/** Eenmalige koppelcode voor de Junction-app op de iPhone (Apple Health). Standaard een uur geldig. */
export async function junctionPairingCode(userId: string): Promise<{ code: string; expiresAt: Date }> {
  const res = await call<{ code: string; expires_at: string }>("POST", `/v2/link/code/create?user_id=${encodeURIComponent(userId)}`);
  return { code: res.code, expiresAt: new Date(res.expires_at) };
}

/** Welke bronnen de klant bij Junction heeft aangesloten. */
export async function junctionSources(userId: string): Promise<{ slug: string; name: string; status: string }[]> {
  const res = await call<{ providers: { slug: string; name: string; status: string }[] }>(
    "GET",
    `/v2/user/providers/${encodeURIComponent(userId)}`,
  );
  return res.providers ?? [];
}

/** Verwijdert de gebruiker bij Junction: alle bronnen worden direct ontkoppeld, de data daarna gewist. */
export async function deleteJunctionUser(userId: string): Promise<void> {
  await call("DELETE", `/v2/user/${encodeURIComponent(userId)}`);
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);

interface Source {
  provider: string;
}

/** Junction-sport-slugs naar onze grove indeling. */
function workoutKind(slug: string): WorkoutKind {
  const s = slug.toLowerCase();
  if (/strength|weight|functional|crossfit|calisthenic|hiit|bootcamp|core/.test(s)) return "kracht";
  if (/run|jog|treadmill/.test(s)) return "hardlopen";
  if (/walk|hik/.test(s)) return "wandelen";
  if (/cycl|bik|spin/.test(s)) return "fietsen";
  if (/swim/.test(s)) return "zwemmen";
  if (/yoga|pilates|stretch|mobility/.test(s)) return "yoga";
  if (/elliptical|row|stair|cardio|dance|box|aerobic|zumba/.test(s)) return "cardio";
  if (/ball|tennis|padel|squash|golf|hockey|soccer|football|rugby|sport|climb|ski|skat/.test(s)) return "sport";
  return "overig";
}

/** Samenvattingen van een periode, per dag samengevoegd over alle bronnen. */
export async function fetchJunctionData(userId: string, from: Date, to: Date): Promise<{ days: HealthDay[]; workouts: HealthWorkout[] }> {
  const q = `start_date=${ymd(from)}&end_date=${ymd(to)}`;
  const id = encodeURIComponent(userId);
  const [activity, body, workouts] = await Promise.all([
    call<{
      activity: { calendar_date: string; steps?: number | null; calories_active?: number | null; medium?: number | null; high?: number | null; source: Source }[];
    }>("GET", `/v2/summary/activity/${id}?${q}`),
    call<{ body: { calendar_date: string; weight?: number | null; source: Source }[] }>("GET", `/v2/summary/body/${id}?${q}`),
    call<{
      workouts: { id: string; time_start: string; time_end: string; calories?: number | null; moving_time?: number | null; sport: { slug: string; name: string }; source: Source }[];
    }>("GET", `/v2/summary/workouts/${id}?${q}`),
  ]);

  // Meerdere bronnen op één dag (bijv. iPhone én horloge): neem per waarde het hoogste, zo tellen we niets dubbel.
  const days = new Map<string, HealthDay>();
  const day = (d: string, source: string) => {
    let v = days.get(d);
    if (!v) {
      v = { day: d, source, steps: null, activeKcal: null, activeMinutes: null, weightKg: null };
      days.set(d, v);
    }
    return v;
  };
  const max = (a: number | null, b: number | null | undefined) => (b === null || b === undefined ? a : a === null ? b : Math.max(a, b));
  for (const a of activity.activity ?? []) {
    const v = day(a.calendar_date, a.source.provider);
    if ((a.steps ?? 0) > (v.steps ?? 0)) v.source = a.source.provider;
    v.steps = max(v.steps, a.steps === null || a.steps === undefined ? null : Math.round(a.steps));
    v.activeKcal = max(v.activeKcal, a.calories_active === null || a.calories_active === undefined ? null : Math.round(a.calories_active));
    const minutes = a.medium === null && a.high === null ? null : Math.round((a.medium ?? 0) + (a.high ?? 0));
    v.activeMinutes = max(v.activeMinutes, minutes);
  }
  for (const b of body.body ?? []) {
    if (b.weight && b.weight >= 25 && b.weight <= 350) day(b.calendar_date, b.source.provider).weightKg = Math.round(b.weight * 100) / 100;
  }

  const out: HealthWorkout[] = [];
  for (const w of workouts.workouts ?? []) {
    const start = new Date(w.time_start);
    const seconds = w.moving_time ?? (new Date(w.time_end).getTime() - start.getTime()) / 1000;
    const minutes = Math.round(seconds / 60);
    if (minutes < 5) continue;
    out.push({
      id: w.id,
      source: w.source.provider,
      startedAt: start,
      minutes,
      kcal: w.calories ? Math.round(w.calories) : null,
      sport: workoutKind(w.sport?.slug ?? w.sport?.name ?? ""),
    });
  }
  return { days: [...days.values()], workouts: out };
}

/**
 * Controleert de handtekening van een Junction-webhook (Svix): HMAC-SHA256 over
 * "id.timestamp.body" met het geheim uit het Junction-dashboard.
 */
export function verifyJunctionWebhook(body: string, headers: Headers): boolean {
  const secret = process.env.JUNCTION_WEBHOOK_SECRET ?? "";
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatures = headers.get("svix-signature");
  if (!secret || !id || !timestamp || !signatures) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 5 * 60) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = Buffer.from(createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64"));
  return signatures.split(" ").some((part) => {
    const [, sig] = part.split(",");
    const given = Buffer.from(sig ?? "");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

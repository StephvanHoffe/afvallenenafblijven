import "server-only";
import { site } from "@/config/site";
import type { HealthDay, HealthWorkout, WorkoutKind } from "@/lib/health/types";

/**
 * Withings Public API (OAuth 2.0). Geen contract nodig: maak een app aan op
 * developer.withings.com met als callback-URL /api/koppelingen/withings/callback.
 * Let op: Withings antwoordt altijd met HTTP 200 en zet fouten in `status`.
 */

// De adressen zijn alleen voor tests te overschrijven (een nagebootste server).
const API = process.env.WITHINGS_API_URL ?? "https://wbsapi.withings.net";
const AUTHORIZE = process.env.WITHINGS_AUTHORIZE_URL ?? "https://account.withings.com/oauth2_user/authorize2";
const SCOPES = "user.info,user.metrics,user.activity";

/** Meldingssoorten (appli): 1 = gewicht en lichaamssamenstelling, 16 = activiteit en trainingen. */
export const WITHINGS_APPLI = { weight: 1, activity: 16, profile: 46 } as const;

export function withingsCallbackUrl(): string {
  return `${site.url}/api/koppelingen/withings/callback`;
}

export function withingsNotifyUrl(): string {
  return `${site.url}/api/koppelingen/withings/notify`;
}

export function withingsAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.WITHINGS_CLIENT_ID ?? "",
    scope: SCOPES,
    redirect_uri: withingsCallbackUrl(),
    state,
  });
  // Testen zonder apparaat: Withings levert dan een demo-account met data.
  if (process.env.WITHINGS_DEMO === "1") params.set("mode", "demo");
  return `${AUTHORIZE}?${params}`;
}

interface WithingsResponse<T> {
  status: number;
  body?: T;
  error?: string;
}

async function call<T>(path: string, params: Record<string, string>, accessToken?: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new WithingsError(`HTTP ${res.status}`, res.status);
  const json = (await res.json()) as WithingsResponse<T>;
  if (json.status !== 0 || !json.body) throw new WithingsError(json.error ?? `status ${json.status}`, json.status);
  return json.body;
}

export class WithingsError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(`Withings: ${message}`);
  }
  /** 401 = token ongeldig of ingetrokken. */
  get unauthorized(): boolean {
    return this.status === 401;
  }
}

export interface WithingsTokens {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

interface TokenBody {
  userid: string | number;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

function toTokens(b: TokenBody): WithingsTokens {
  return {
    userId: String(b.userid),
    accessToken: b.access_token,
    refreshToken: b.refresh_token,
    expiresAt: new Date(Date.now() + (b.expires_in - 60) * 1000),
  };
}

/** Wisselt de code uit de callback in voor tokens (de code is maar 30 seconden geldig). */
export async function exchangeCode(code: string): Promise<WithingsTokens> {
  const body = await call<TokenBody>("/v2/oauth2", {
    action: "requesttoken",
    grant_type: "authorization_code",
    client_id: process.env.WITHINGS_CLIENT_ID ?? "",
    client_secret: process.env.WITHINGS_CLIENT_SECRET ?? "",
    code,
    redirect_uri: withingsCallbackUrl(),
  });
  return toTokens(body);
}

/** Vernieuwt het toegangstoken; bewaar altijd het nieuwe refresh-token. */
export async function refreshTokens(refreshToken: string): Promise<WithingsTokens> {
  const body = await call<TokenBody>("/v2/oauth2", {
    action: "requesttoken",
    grant_type: "refresh_token",
    client_id: process.env.WITHINGS_CLIENT_ID ?? "",
    client_secret: process.env.WITHINGS_CLIENT_SECRET ?? "",
    refresh_token: refreshToken,
  });
  return toTokens(body);
}

/** Meldingen aanzetten, zodat nieuwe metingen vanzelf binnenkomen. */
export async function subscribe(accessToken: string): Promise<void> {
  for (const appli of [WITHINGS_APPLI.weight, WITHINGS_APPLI.activity]) {
    await call("/notify", { action: "subscribe", callbackurl: withingsNotifyUrl(), appli: String(appli) }, accessToken).catch(
      (err) => console.error("Withings-melding aanzetten mislukt", appli, err),
    );
  }
}

export async function unsubscribe(accessToken: string): Promise<void> {
  for (const appli of [WITHINGS_APPLI.weight, WITHINGS_APPLI.activity]) {
    await call("/notify", { action: "revoke", callbackurl: withingsNotifyUrl(), appli: String(appli) }, accessToken).catch(() => {});
  }
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);

interface MeasureGroup {
  date: number;
  category: number;
  measures: { value: number; type: number; unit: number }[];
}

/** Gewicht per dag (de laatste meting van die dag), in kg. */
async function fetchWeights(accessToken: string, from: Date, to: Date): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  let offset: number | undefined;
  for (let page = 0; page < 10; page++) {
    const body = await call<{ measuregrps: MeasureGroup[]; more?: number; offset?: number }>(
      "/measure",
      {
        action: "getmeas",
        meastypes: "1",
        category: "1",
        startdate: String(Math.floor(from.getTime() / 1000)),
        enddate: String(Math.floor(to.getTime() / 1000)),
        ...(offset ? { offset: String(offset) } : {}),
      },
      accessToken,
    );
    for (const g of [...body.measuregrps].sort((a, b) => a.date - b.date)) {
      const m = g.measures.find((x) => x.type === 1);
      if (!m) continue;
      const kg = m.value * 10 ** m.unit;
      if (kg >= 25 && kg <= 350) out.set(amsterdamDay(new Date(g.date * 1000)), Math.round(kg * 100) / 100);
    }
    if (!body.more || !body.offset) break;
    offset = body.offset;
  }
  return out;
}

interface Activity {
  date: string;
  steps?: number;
  calories?: number;
  soft?: number;
  moderate?: number;
  intense?: number;
}

async function fetchActivity(accessToken: string, from: Date, to: Date): Promise<Activity[]> {
  const out: Activity[] = [];
  let offset: number | undefined;
  for (let page = 0; page < 10; page++) {
    const body = await call<{ activities: Activity[]; more?: boolean; offset?: number }>(
      "/v2/measure",
      {
        action: "getactivity",
        startdateymd: ymd(from),
        enddateymd: ymd(to),
        data_fields: "steps,calories,soft,moderate,intense",
        ...(offset ? { offset: String(offset) } : {}),
      },
      accessToken,
    );
    out.push(...body.activities);
    if (!body.more || !body.offset) break;
    offset = body.offset;
  }
  return out;
}

interface Workout {
  id: number | string;
  category: number;
  startdate: number;
  enddate: number;
  data?: { calories?: number; effduration?: number };
}

/** Withings-sportcategorieën naar onze grove indeling. */
function workoutKind(category: number): WorkoutKind {
  if ([16, 17].includes(category)) return "kracht";
  if ([2, 307].includes(category)) return "hardlopen";
  if ([1, 3, 306].includes(category)) return "wandelen";
  if ([6, 308].includes(category)) return "fietsen";
  if (category === 7) return "zwemmen";
  if ([18, 187, 188, 29, 30].includes(category)) return "cardio";
  if ([19, 28].includes(category)) return "yoga";
  if ([12, 13, 14, 15, 20, 21, 22, 23, 24, 27, 191, 192, 193].includes(category)) return "sport";
  return "overig";
}

async function fetchWorkouts(accessToken: string, from: Date, to: Date): Promise<HealthWorkout[]> {
  const out: HealthWorkout[] = [];
  let offset: number | undefined;
  for (let page = 0; page < 10; page++) {
    const body = await call<{ series: Workout[]; more?: boolean; offset?: number }>(
      "/v2/measure",
      {
        action: "getworkouts",
        startdateymd: ymd(from),
        enddateymd: ymd(to),
        data_fields: "calories,effduration",
        ...(offset ? { offset: String(offset) } : {}),
      },
      accessToken,
    );
    for (const w of body.series) {
      const minutes = Math.round((w.data?.effduration ?? w.enddate - w.startdate) / 60);
      if (minutes < 5 || w.category === 128) continue;
      out.push({
        id: String(w.id),
        source: "withings",
        startedAt: new Date(w.startdate * 1000),
        minutes,
        kcal: w.data?.calories ? Math.round(w.data.calories) : null,
        sport: workoutKind(w.category),
      });
    }
    if (!body.more || !body.offset) break;
    offset = body.offset;
  }
  return out;
}

/** Datum in Nederlandse tijd, zodat een weging om 00:30 bij de juiste dag hoort. */
export function amsterdamDay(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(d);
}

/** Alle gegevens van een periode, samengevoegd per dag. */
export async function fetchWithingsData(
  accessToken: string,
  from: Date,
  to: Date,
): Promise<{ days: HealthDay[]; workouts: HealthWorkout[] }> {
  const [weights, activity, workouts] = await Promise.all([
    fetchWeights(accessToken, from, to),
    fetchActivity(accessToken, from, to),
    fetchWorkouts(accessToken, from, to),
  ]);
  const days = new Map<string, HealthDay>();
  const day = (d: string) => {
    let v = days.get(d);
    if (!v) {
      v = { day: d, source: "withings", steps: null, activeKcal: null, activeMinutes: null, weightKg: null };
      days.set(d, v);
    }
    return v;
  };
  for (const a of activity) {
    const v = day(a.date);
    v.steps = a.steps ?? null;
    v.activeKcal = a.calories !== undefined ? Math.round(a.calories) : null;
    const seconds = (a.moderate ?? 0) + (a.intense ?? 0);
    v.activeMinutes = a.moderate !== undefined || a.intense !== undefined ? Math.round(seconds / 60) : null;
  }
  for (const [d, kg] of weights) day(d).weightKg = kg;
  return { days: [...days.values()], workouts };
}

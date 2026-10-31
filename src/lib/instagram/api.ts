import "server-only";
import { loadStoredConfig } from "@/lib/db";

/**
 * De koppeling met Instagram (Graph API van Meta). Standaard via de "Instagram
 * API with Instagram Login" (graph.instagram.com, token begint met IG); een
 * token via Facebook (pagina of systeemgebruiker, begint met EAA) werkt ook,
 * dan via graph.facebook.com en met het account-ID erbij.
 *
 * Plaatsen gaat in twee stappen: eerst een container met de afbeelding(en) en
 * het bijschrift, dan publiceren. Instagram haalt de afbeeldingen zelf op via
 * een openbare URL; alleen JPEG wordt geaccepteerd.
 */

export const GRAPH_VERSION = "v26.0";

export class InstagramError extends Error {
  constructor(
    message: string,
    readonly code?: number,
  ) {
    super(message);
    this.name = "InstagramError";
  }
}

interface Credentials {
  token: string;
  /** Token via Facebook (pagina of systeemgebruiker) in plaats van Instagram-login. */
  facebook: boolean;
  host: string;
  accountId: string | null;
}

/** Is er een toegangstoken (in het beheer of bij de hosting)? Roep eerst loadStoredConfig() aan. */
export function instagramConfigured(): boolean {
  return Boolean(process.env.INSTAGRAM_ACCESS_TOKEN?.trim());
}

function credentials(): Credentials {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!token) throw new InstagramError("Vul eerst het toegangstoken van Instagram in bij Beheer → Koppelingen.");
  const facebook = token.startsWith("EAA");
  return {
    token,
    facebook,
    // Alleen voor tests tegen een nagebootste Graph API; nooit in productie.
    host: process.env.INSTAGRAM_API_BASE || (facebook ? "https://graph.facebook.com" : "https://graph.instagram.com"),
    accountId: process.env.INSTAGRAM_ACCOUNT_ID?.trim() || null,
  };
}

interface GraphErrorBody {
  message?: string;
  code?: number;
  error_subcode?: number;
  error_user_msg?: string;
}

/** Een foutmelding van Meta in gewone taal, met de oorspronkelijke melding erachter. */
function describeError(error: GraphErrorBody | undefined, status: number): string {
  const raw = (error?.error_user_msg || error?.message || `HTTP ${status}`).replace(/\s+/g, " ").slice(0, 300);
  const code = error?.code;
  const sub = error?.error_subcode;
  let advice: string | null = null;
  if (code === 190) advice = "Het toegangstoken is verlopen of ongeldig. Maak een nieuw token aan in je Meta-app en vul het in bij Koppelingen.";
  else if (code === 10 || (code !== undefined && code >= 200 && code < 300))
    advice = "Het token mag niet publiceren. Geef de app de toestemming instagram_business_content_publish en maak een nieuw token aan.";
  else if (code === 9 || sub === 2207042) advice = "De limiet van Instagram voor het aantal posts per 24 uur is bereikt. Het wordt later vanzelf opnieuw geprobeerd.";
  else if (code === 4 || code === 17 || code === 32 || code === 613) advice = "Te veel verzoeken aan Instagram. Het wordt later vanzelf opnieuw geprobeerd.";
  else if (sub === 2207052 || sub === 2207003 || sub === 2207020)
    advice = "Instagram kon de afbeelding niet ophalen. Controleer of de website online bereikbaar is op het ingestelde adres.";
  else if (sub === 2207009 || code === 36003) advice = "Instagram accepteert de verhouding van de afbeelding niet.";
  return advice ? `${advice} (Melding van Instagram: ${raw})` : `Instagram gaf een fout: ${raw}`;
}

async function graph<T>(c: Credentials, method: "GET" | "POST", path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${c.host}/${path.startsWith("refresh_access_token") ? "" : `${GRAPH_VERSION}/`}${path}`);
  const body = new URLSearchParams({ ...params, access_token: c.token });
  let res: Response;
  try {
    if (method === "GET") {
      for (const [k, v] of body) url.searchParams.set(k, v);
      res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(30_000) });
    } else {
      res = await fetch(url, { method: "POST", body, cache: "no-store", signal: AbortSignal.timeout(60_000) });
    }
  } catch (err) {
    // Nooit de URL in de melding: daar staat het token in.
    throw new InstagramError(`Instagram is niet bereikbaar (${err instanceof Error ? err.name : "netwerkfout"}). Het wordt later opnieuw geprobeerd.`);
  }
  const data = (await res.json().catch(() => ({}))) as { error?: GraphErrorBody } & T;
  if (!res.ok || data.error) throw new InstagramError(describeError(data.error, res.status), data.error?.code);
  return data;
}

export interface InstagramAccount {
  id: string;
  username: string | null;
}

/** Het account waarop we plaatsen (en meteen een controle of het token werkt). */
export async function instagramAccount(): Promise<InstagramAccount> {
  await loadStoredConfig();
  const c = credentials();
  if (c.facebook) {
    if (!c.accountId) {
      throw new InstagramError("Bij een token via Facebook (begint met EAA) is het Instagram-account-ID nodig. Vul het in bij Koppelingen → Instagram.");
    }
    const data = await graph<{ id: string; username?: string }>(c, "GET", c.accountId, { fields: "id,username" });
    return { id: data.id, username: data.username ?? null };
  }
  const me = await graph<{ id: string; user_id?: string | number; username?: string }>(c, "GET", "me", { fields: "user_id,username" });
  return { id: c.accountId || String(me.user_id ?? me.id), username: me.username ?? null };
}

/** Hoeveel posts er in de afgelopen 24 uur via de API zijn geplaatst, en het maximum. */
export async function publishingLimit(accountId: string): Promise<{ used: number; total: number } | null> {
  const c = credentials();
  const res = await graph<{ data?: { quota_usage?: number; config?: { quota_total?: number } }[] }>(c, "GET", `${accountId}/content_publishing_limit`, {
    fields: "quota_usage,config",
  });
  const row = res.data?.[0];
  return row && typeof row.quota_usage === "number" ? { used: row.quota_usage, total: row.config?.quota_total ?? 100 } : null;
}

/** Container voor één afbeelding: een losse post, of (met carouselItem) een slide van een carrousel. */
export async function createImageContainer(
  accountId: string,
  input: { imageUrl: string; caption?: string; altText?: string; carouselItem?: boolean },
): Promise<string> {
  const params: Record<string, string> = { image_url: input.imageUrl };
  if (input.carouselItem) params.is_carousel_item = "true";
  if (input.caption) params.caption = input.caption;
  if (input.altText) params.alt_text = input.altText;
  return (await graph<{ id: string }>(credentials(), "POST", `${accountId}/media`, params)).id;
}

export async function createCarouselContainer(accountId: string, children: string[], caption: string): Promise<string> {
  return (await graph<{ id: string }>(credentials(), "POST", `${accountId}/media`, { media_type: "CAROUSEL", children: children.join(","), caption })).id;
}

export type ContainerStatus = "IN_PROGRESS" | "FINISHED" | "PUBLISHED" | "ERROR" | "EXPIRED";

export async function containerStatus(containerId: string): Promise<{ code: ContainerStatus; detail: string | null }> {
  const res = await graph<{ status_code?: ContainerStatus; status?: string }>(credentials(), "GET", containerId, { fields: "status_code,status" });
  return { code: res.status_code ?? "IN_PROGRESS", detail: res.status ?? null };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Wacht tot Instagram een container heeft verwerkt (bij afbeeldingen meestal
 * direct). Duurt het te lang, dan volgt een nieuwe poging met dezelfde container.
 */
export async function waitUntilReady(containerId: string, delays = [0, 2000, 4000, 8000, 15000, 30000]): Promise<void> {
  for (const delay of delays) {
    if (delay) await sleep(delay);
    const status = await containerStatus(containerId);
    if (status.code === "FINISHED" || status.code === "PUBLISHED") return;
    if (status.code === "ERROR" || status.code === "EXPIRED") {
      throw new InstagramError(`Instagram kon de post niet verwerken${status.detail ? ` (${status.detail})` : ""}.`);
    }
  }
  throw new InstagramError("Instagram is nog bezig met het verwerken van de afbeeldingen. Het wordt zo opnieuw geprobeerd.");
}

export async function publishContainer(accountId: string, containerId: string): Promise<string> {
  return (await graph<{ id: string }>(credentials(), "POST", `${accountId}/media_publish`, { creation_id: containerId })).id;
}

export async function mediaPermalink(mediaId: string): Promise<string | null> {
  return (await graph<{ permalink?: string }>(credentials(), "GET", mediaId, { fields: "permalink" })).permalink ?? null;
}

/** De laatste posts van het account, om een al geplaatste post terug te vinden na een onderbroken poging. */
export async function recentMedia(accountId: string): Promise<{ id: string; caption: string | null; permalink: string | null }[]> {
  const res = await graph<{ data?: { id: string; caption?: string; permalink?: string }[] }>(credentials(), "GET", `${accountId}/media`, {
    fields: "id,caption,permalink",
    limit: "10",
  });
  return (res.data ?? []).map((m) => ({ id: m.id, caption: m.caption ?? null, permalink: m.permalink ?? null }));
}

/**
 * Verlengt een token van Instagram-login met 60 dagen (kan zodra het minstens
 * 24 uur oud is). Tokens via Facebook verlopen niet zo en worden overgeslagen.
 */
export async function refreshAccessToken(): Promise<{ token: string; expiresInSeconds: number } | null> {
  await loadStoredConfig();
  const c = credentials();
  if (c.facebook) return null;
  const res = await graph<{ access_token: string; expires_in: number }>(c, "GET", "refresh_access_token", { grant_type: "ig_refresh_token" });
  return { token: res.access_token, expiresInSeconds: res.expires_in };
}

/**
 * Kleine client voor de Meta Graph API (Facebook, Instagram en advertenties).
 *
 * Het token van de systeemgebruiker komt op een van deze twee manieren binnen:
 *   - als network secret in Claude Code op het web (host graph.facebook.com, header
 *     Authorization, prefix Bearer): de proxy voegt het toe aan elk verzoek, het script
 *     ziet het token zelf nooit;
 *   - als META_ACCESS_TOKEN in de omgeving of in .env.local (lokaal).
 *
 * Instellingen (omgevingsvariabelen, of in .env.local):
 *   META_ACCESS_TOKEN    token van een systeemgebruiker; niet nodig met een network secret
 *   META_AD_ACCOUNT_ID   optioneel: advertentieaccount (act_... of alleen het nummer)
 *   META_PAGE_ID         optioneel: Facebook-pagina
 *   META_IG_USER_ID      optioneel: Instagram-zakelijk account
 *   META_API_VERSION     optioneel: standaard v26.0
 *   META_API_BASE        alleen voor tests tegen een nagebootste Graph API
 *
 * Zonder de optionele id's zoekt de client ze zelf op, zolang er precies één is.
 */
import { readFileSync } from "node:fs";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // geen .env.local: dan gelden alleen de omgevingsvariabelen
  }
}

export const API_VERSION = process.env.META_API_VERSION ?? "v26.0";
const API_BASE = (process.env.META_API_BASE ?? "https://graph.facebook.com").replace(/\/$/, "");

export type Params = Record<string, string | number | boolean | object | undefined>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any;

export class GraphError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail: Json,
  ) {
    super(message);
  }
}

export class ConfigError extends Error {}

/**
 * Het token uit META_ACCESS_TOKEN. Zonder die variabele sturen we geen token mee en
 * rekenen we op de network secret: de proxy zet het token dan in de Authorization-header.
 */
export function token(): string | undefined {
  return process.env.META_ACCESS_TOKEN?.trim() || undefined;
}

export const tokenSource = (): string =>
  token() ? "META_ACCESS_TOKEN" : "network secret voor graph.facebook.com (via de proxy)";

/** Meta-foutcodes voor een ontbrekend, ongeldig of verlopen token. */
const TOKEN_ERRORS = new Set([102, 190, 2500]);

function encode(params: Params): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }
  return search;
}

function describe(status: number, body: Json): string {
  const e = body?.error;
  if (!e) return `HTTP ${status}`;
  const parts = [e.error_user_title, e.error_user_msg ?? e.message].filter(Boolean);
  const codes = [`code ${e.code}`, e.error_subcode && `subcode ${e.error_subcode}`, e.fbtrace_id && `trace ${e.fbtrace_id}`];
  return `${parts.join(": ")} (${codes.filter(Boolean).join(", ")})`;
}

async function request(method: "GET" | "POST" | "DELETE", path: string, params: Params | FormData = {}, accessToken = token()) {
  const url = path.startsWith("http") ? new URL(path) : new URL(`${API_BASE}/${API_VERSION}/${path.replace(/^\//, "")}`);
  // Een access_token in de url of de body gaat bij Meta voor op de Authorization-header.
  // Zo werken paginatokens ook als de proxy het token van de systeemgebruiker meestuurt.
  let res: Response;
  if (params instanceof FormData) {
    if (accessToken) params.set("access_token", accessToken);
    res = await fetch(url, { method, body: params });
  } else if (method === "GET") {
    for (const [key, value] of encode({ ...params, access_token: accessToken })) url.searchParams.set(key, value);
    res = await fetch(url);
  } else {
    res = await fetch(url, { method, body: encode({ ...params, access_token: accessToken }) });
  }
  const text = await res.text();
  let json: Json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok || json?.error) {
    if (!accessToken && TOKEN_ERRORS.has(json?.error?.code)) {
      throw new ConfigError(
        `Meta accepteert het token niet, of er is geen token: ${describe(res.status, json)}\n` +
          "Zet een network secret voor graph.facebook.com (header Authorization, prefix Bearer) en start een nieuwe sessie, " +
          "of zet META_ACCESS_TOKEN in de omgeving of in .env.local (zie scripts/meta/README.md).",
      );
    }
    throw new GraphError(describe(res.status, json), res.status, json);
  }
  return json;
}

export const graph = {
  get: (path: string, params?: Params, accessToken?: string) => request("GET", path, params, accessToken),
  post: (path: string, params?: Params, accessToken?: string) => request("POST", path, params, accessToken),
  delete: (path: string, params?: Params, accessToken?: string) => request("DELETE", path, params, accessToken),
  /** POST als formulier, voor het meesturen van een bestand. */
  form: (path: string, form: FormData, accessToken?: string) => request("POST", path, form, accessToken),

  /** Haalt alle pagina's van een lijst op, tot maximaal `max` items. */
  async all(path: string, params: Params = {}, max = 500, accessToken?: string): Promise<Json[]> {
    const items: Json[] = [];
    let page = await request("GET", path, { limit: Math.min(max, 100), ...params }, accessToken);
    for (;;) {
      items.push(...(page.data ?? []));
      const next = page.paging?.next;
      if (!next || items.length >= max) break;
      // de next-link bevat alle parameters al, behalve (soms) het token
      page = await request("GET", next, {}, accessToken);
    }
    return items.slice(0, max);
  },
};

/** Afbeelding (bestand of url) als base64, voor uploads naar het advertentieaccount. */
export async function imageBytes(source: string): Promise<{ name: string; base64: string }> {
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Afbeelding ophalen mislukt: HTTP ${res.status} voor ${source}`);
    const name = new URL(source).pathname.split("/").pop() || "afbeelding.jpg";
    return { name, base64: Buffer.from(await res.arrayBuffer()).toString("base64") };
  }
  return { name: source.split("/").pop() ?? source, base64: readFileSync(source).toString("base64") };
}

// --- Account, pagina en Instagram ------------------------------------------

let accountCache: Json | undefined;
let pageCache: { id: string; name: string; access_token: string } | undefined;
let igCache: string | null | undefined;

export async function adAccount(): Promise<{ id: string; name: string; currency: string; timezone_name: string }> {
  if (accountCache) return accountCache;
  const fields = "id,name,currency,timezone_name,account_status";
  const configured = process.env.META_AD_ACCOUNT_ID?.trim();
  if (configured) {
    const id = configured.startsWith("act_") ? configured : `act_${configured}`;
    return (accountCache = await graph.get(id, { fields }));
  }
  const accounts = await graph.all("me/adaccounts", { fields });
  if (accounts.length !== 1) {
    const list = accounts.map((a) => `  ${a.id}  ${a.name}`).join("\n") || "  (geen)";
    throw new ConfigError(`Kies een advertentieaccount met META_AD_ACCOUNT_ID. Gevonden:\n${list}`);
  }
  return (accountCache = accounts[0]);
}

export async function page(): Promise<{ id: string; name: string; access_token: string }> {
  if (pageCache) return pageCache;
  const configured = process.env.META_PAGE_ID?.trim();
  if (configured) {
    return (pageCache = await graph.get(configured, { fields: "id,name,access_token" }));
  }
  const pages = await graph.all("me/accounts", { fields: "id,name,access_token" });
  if (pages.length !== 1) {
    const list = pages.map((p) => `  ${p.id}  ${p.name}`).join("\n") || "  (geen)";
    throw new ConfigError(`Kies een Facebook-pagina met META_PAGE_ID. Gevonden:\n${list}`);
  }
  return (pageCache = pages[0]);
}

/** Instagram-zakelijk account dat aan de pagina hangt, of null als er geen is. */
export async function instagramId(required = true): Promise<string | null> {
  if (igCache === undefined) {
    const configured = process.env.META_IG_USER_ID?.trim();
    if (configured) {
      igCache = configured;
    } else {
      const p = await page();
      const info = await graph.get(p.id, { fields: "instagram_business_account" });
      igCache = info.instagram_business_account?.id ?? null;
    }
  }
  if (!igCache && required) {
    throw new ConfigError("Geen Instagram-zakelijk account gevonden bij de pagina. Koppel het in Meta Business Suite of zet META_IG_USER_ID.");
  }
  return igCache ?? null;
}

// --- Bedragen ----------------------------------------------------------------

// Meta rekent budgetten in de kleinste munteenheid (centen), behalve bij deze valuta.
const ZERO_DECIMAL = new Set(["JPY", "KRW", "CLP", "COP", "CRC", "HUF", "ISK", "IDR", "PYG", "TWD", "VND"]);

export function toMinor(amount: number, currency: string): number {
  return Math.round(ZERO_DECIMAL.has(currency) ? amount : amount * 100);
}

export function fromMinor(minor: number | string | undefined, currency: string): number | undefined {
  if (minor === undefined || minor === null || minor === "") return undefined;
  return ZERO_DECIMAL.has(currency) ? Number(minor) : Number(minor) / 100;
}

export function money(amount: number | string | undefined, currency = "EUR"): string {
  if (amount === undefined || amount === null || amount === "" || Number.isNaN(Number(amount))) return "-";
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency }).format(Number(amount));
}

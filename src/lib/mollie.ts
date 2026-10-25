import "server-only";
import { site } from "@/config/site";
import type { Locale } from "@/i18n/config";

/**
 * Koppeling met Mollie (API v2). Mollie regelt de betaalpagina, iDEAL | Wero,
 * Bancontact, creditcard en de maandelijkse SEPA-incasso. Er hoeft in het
 * Mollie-dashboard niets te worden aangemaakt: de website maakt klanten,
 * betalingen en abonnementen zelf aan. Kortingen, de minimale looptijd en de
 * facturen regelt de website ook zelf (Mollie kent geen coupons of facturen
 * voor je klanten).
 *
 * Een abonnement begint met een "eerste betaling" (iDEAL of Bancontact). Die
 * levert een SEPA-incassomachtiging op, waarmee Mollie de volgende maanden
 * automatisch afschrijft.
 */

export interface MollieAmount {
  currency: "EUR";
  value: string;
}

export type MolliePaymentStatus = "open" | "pending" | "authorized" | "paid" | "canceled" | "expired" | "failed";

export interface MolliePayment {
  id: string;
  status: MolliePaymentStatus;
  amount: MollieAmount;
  amountRefunded?: MollieAmount;
  amountChargedBack?: MollieAmount;
  description: string;
  method: string | null;
  sequenceType: "oneoff" | "first" | "recurring";
  metadata: Record<string, string | number | null> | null;
  customerId?: string;
  mandateId?: string;
  subscriptionId?: string;
  createdAt: string;
  paidAt?: string;
  failedAt?: string;
  _links: { checkout?: { href: string } };
}

export type MollieSubscriptionStatus = "pending" | "active" | "canceled" | "suspended" | "completed";

export interface MollieSubscription {
  id: string;
  customerId: string;
  status: MollieSubscriptionStatus;
  amount: MollieAmount;
  times: number | null;
  timesRemaining?: number | null;
  interval: string;
  startDate: string;
  /** Datum (JJJJ-MM-DD) van de volgende afschrijving; ontbreekt bij een beëindigd abonnement. */
  nextPaymentDate?: string;
  description: string;
  mandateId?: string | null;
  metadata: Record<string, string | number | null> | null;
  canceledAt?: string;
}

export interface MollieRefund {
  id: string;
  amount: MollieAmount;
  status: string;
}

export class MollieError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function isMollieConfigured(): boolean {
  return Boolean(process.env.MOLLIE_API_KEY);
}

/** "test" of "live", aan de hand van de API-sleutel (test_… of live_…). */
export function mollieMode(): "test" | "live" {
  return (process.env.MOLLIE_API_KEY ?? "").startsWith("live_") ? "live" : "test";
}

/** Een bedrag in centen als Mollie-bedrag ("14.95"). */
export function toAmount(cents: number): MollieAmount {
  return { currency: "EUR", value: (cents / 100).toFixed(2) };
}

/** Een Mollie-bedrag in centen. */
export function toCents(amount: MollieAmount | undefined | null): number {
  return amount ? Math.round(Number(amount.value) * 100) : 0;
}

/** Taal van de betaalpagina van Mollie. */
export function mollieLocale(l: Locale): string {
  return l === "en" ? "en_US" : "nl_NL";
}

/**
 * Het adres waar Mollie statuswijzigingen meldt. Mollie accepteert geen
 * localhost; lokaal laten we het weg en vangt de bedankpagina het op.
 */
export function webhookUrl(): string | undefined {
  const url = new URL("/api/webhooks/mollie", site.url);
  return /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(url.hostname) ? undefined : url.toString();
}

async function call<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: object,
  { idempotencyKey }: { idempotencyKey?: string } = {},
): Promise<T> {
  const key = process.env.MOLLIE_API_KEY;
  if (!key) throw new Error("MOLLIE_API_KEY is niet ingesteld");
  // MOLLIE_API_BASE alleen voor tests tegen een nagebootste Mollie (bijv. http://127.0.0.1:4343/v2).
  const base = (process.env.MOLLIE_API_BASE ?? "https://api.mollie.com/v2").replace(/\/$/, "");
  const headers: Record<string, string> = { authorization: `Bearer ${key}`, accept: "application/json" };
  if (body) headers["content-type"] = "application/json";
  // Mollie herkent een herhaald verzoek aan deze sleutel, zodat er nooit twee keer iets wordt aangemaakt.
  if (idempotencyKey) headers["idempotency-key"] = idempotencyKey;

  let lastError: unknown;
  // Een netwerkfout of storing bij Mollie: nog twee keer proberen (veilig dankzij de idempotentiesleutel).
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
      if (res.status === 204) return undefined as T;
      const data = (await res.json().catch(() => null)) as (T & { title?: string; detail?: string }) | null;
      if (res.ok && data) return data;
      const error = new MollieError(res.status, `Mollie ${method} ${path}: ${res.status} ${data?.detail ?? data?.title ?? ""}`.trim());
      if (res.status < 500) throw error;
      lastError = error;
    } catch (err) {
      if (err instanceof MollieError && err.status < 500) throw err;
      lastError = err;
    }
    if (method !== "GET" && !idempotencyKey) break;
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
  throw lastError;
}

export async function createCustomer(input: { name: string; email: string; locale: Locale }): Promise<string> {
  const customer = await call<{ id: string }>("POST", "/customers", {
    name: input.name,
    email: input.email,
    locale: mollieLocale(input.locale),
  });
  return customer.id;
}

export function createPayment(
  input: {
    amountCents: number;
    description: string;
    redirectUrl: string;
    cancelUrl?: string;
    locale: Locale;
    methods: string[];
    sequenceType: "oneoff" | "first";
    customerId?: string;
    metadata: Record<string, string | number | null>;
  },
  idempotencyKey?: string,
): Promise<MolliePayment> {
  return call<MolliePayment>(
    "POST",
    "/payments",
    {
      amount: toAmount(input.amountCents),
      description: input.description,
      redirectUrl: input.redirectUrl,
      cancelUrl: input.cancelUrl,
      webhookUrl: webhookUrl(),
      locale: mollieLocale(input.locale),
      method: input.methods,
      sequenceType: input.sequenceType,
      customerId: input.customerId,
      metadata: input.metadata,
    },
    { idempotencyKey },
  );
}

export function getPayment(id: string): Promise<MolliePayment> {
  return call<MolliePayment>("GET", `/payments/${encodeURIComponent(id)}`);
}

export function createRefund(paymentId: string, amountCents: number, description: string, idempotencyKey: string): Promise<MollieRefund> {
  return call<MollieRefund>(
    "POST",
    `/payments/${encodeURIComponent(paymentId)}/refunds`,
    { amount: toAmount(amountCents), description },
    { idempotencyKey },
  );
}

export function createSubscription(
  customerId: string,
  input: {
    amountCents: number;
    startDate: string;
    times?: number;
    description: string;
    mandateId?: string;
    metadata: Record<string, string | number | null>;
  },
  idempotencyKey: string,
): Promise<MollieSubscription> {
  return call<MollieSubscription>(
    "POST",
    `/customers/${encodeURIComponent(customerId)}/subscriptions`,
    {
      amount: toAmount(input.amountCents),
      interval: "1 month",
      startDate: input.startDate,
      times: input.times,
      description: input.description,
      mandateId: input.mandateId,
      webhookUrl: webhookUrl(),
      metadata: input.metadata,
    },
    { idempotencyKey },
  );
}

/** Alle abonnementen van een klant (voor het herstellen na een onderbreking). */
export async function listSubscriptions(customerId: string): Promise<MollieSubscription[]> {
  const page = await call<{ _embedded?: { subscriptions?: MollieSubscription[] } }>(
    "GET",
    `/customers/${encodeURIComponent(customerId)}/subscriptions?limit=250`,
  );
  return page._embedded?.subscriptions ?? [];
}

export function getSubscription(customerId: string, id: string): Promise<MollieSubscription> {
  return call<MollieSubscription>("GET", `/customers/${encodeURIComponent(customerId)}/subscriptions/${encodeURIComponent(id)}`);
}

export function updateSubscription(customerId: string, id: string, update: { mandateId?: string }): Promise<MollieSubscription> {
  return call<MollieSubscription>("PATCH", `/customers/${encodeURIComponent(customerId)}/subscriptions/${encodeURIComponent(id)}`, update);
}

/** Stopt een abonnement direct: er volgen geen afschrijvingen meer. Een al beëindigd abonnement is geen fout. */
export async function cancelMollieSubscription(customerId: string, id: string): Promise<void> {
  try {
    await call<MollieSubscription>("DELETE", `/customers/${encodeURIComponent(customerId)}/subscriptions/${encodeURIComponent(id)}`);
  } catch (err) {
    // 404 of 422: bestaat niet (meer) of is al gestopt.
    if (err instanceof MollieError && (err.status === 404 || err.status === 422)) return;
    throw err;
  }
}

/** Link naar een betaling of klant in het Mollie-dashboard. */
export function mollieDashboardUrl(kind: "payments" | "customers", id: string): string {
  return `https://my.mollie.com/dashboard/${kind}/${encodeURIComponent(id)}`;
}

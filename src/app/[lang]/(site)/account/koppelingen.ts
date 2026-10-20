"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { site } from "@/config/site";
import { defineCopy, localePath } from "@/i18n/config";
import { requestLocale } from "@/i18n/server";
import { currentCustomer } from "@/lib/auth";
import { isAppleHealthEnabled, isJunctionConfigured, isWithingsConfigured } from "@/lib/health/config";
import { createState } from "@/lib/health/crypto";
import { ensureJunctionUser, junctionLinkUrl, junctionPairingCode } from "@/lib/health/junction";
import { connectionsForCustomer, getConnection, saveConnection } from "@/lib/health/repo";
import { disconnect, syncConnection } from "@/lib/health/sync";
import { isHealthProvider } from "@/lib/health/types";
import { withingsAuthorizeUrl } from "@/lib/health/withings";

export interface ConnectState {
  error?: string;
  /** Koppelcode voor de Junction-app (Apple Health). */
  code?: string;
  expiresAt?: string;
}

const copy = defineCopy({
  nl: {
    consent: "Geef toestemming om je gezondheidsgegevens te gebruiken; zonder toestemming kunnen we niet koppelen.",
    unavailable: "Deze koppeling is op dit moment niet beschikbaar.",
    failed: "Het koppelen is niet gelukt. Probeer het over een paar minuten opnieuw.",
  },
  en: {
    consent: "Please give consent to use your health data; we can't connect without it.",
    unavailable: "This connection isn't available right now.",
    failed: "Connecting didn't work. Please try again in a few minutes.",
  },
});

/**
 * Start een koppeling: Withings (eigen login), een cloud-app via Junction, of
 * Apple Health via de Junction-app met een koppelcode. Toestemming is verplicht:
 * het gaat om gezondheidsgegevens (art. 9 AVG).
 */
export async function connectHealth(_prev: ConnectState, formData: FormData): Promise<ConnectState> {
  const l = await requestLocale();
  const customer = await currentCustomer();
  if (!customer) redirect(localePath(l, "/inloggen"));
  if (formData.get("toestemming") !== "ja") return { error: copy[l].consent };
  const kind = String(formData.get("koppeling") ?? "");

  if (kind === "withings") {
    if (!isWithingsConfigured()) return { error: copy[l].unavailable };
    redirect(withingsAuthorizeUrl(createState({ customerId: customer.id, locale: l })));
  }

  if (kind !== "junction" && kind !== "apple") return { error: copy[l].unavailable };
  if (!isJunctionConfigured() || (kind === "apple" && !isAppleHealthEnabled())) return { error: copy[l].unavailable };

  let target: string;
  try {
    const existing = await getConnection(customer.id, "junction");
    const userId = existing?.external_user_id ?? (await ensureJunctionUser(customer.id));
    await saveConnection({ customerId: customer.id, provider: "junction", externalUserId: userId, status: existing?.status === "active" ? "active" : "pending" });
    if (kind === "apple") {
      const { code, expiresAt } = await junctionPairingCode(userId);
      refresh();
      return { code, expiresAt: expiresAt.toISOString() };
    }
    target = await junctionLinkUrl(userId, `${site.url}/api/koppelingen/junction/terug?taal=${l}`);
  } catch (err) {
    console.error("Koppelen via Junction mislukt", err);
    return { error: copy[l].failed };
  }
  redirect(target);
}

/** Ontkoppelen: we stoppen direct met ophalen en wissen de gegevens van die koppeling. */
export async function disconnectHealth(formData: FormData): Promise<void> {
  const customer = await currentCustomer();
  const provider = formData.get("provider");
  if (!customer || !isHealthProvider(provider)) return;
  const conn = await getConnection(customer.id, provider);
  if (conn) await disconnect(conn);
  refresh();
}

/** Nu bijwerken, bijvoorbeeld net na een training. */
export async function syncHealthNow(): Promise<void> {
  const customer = await currentCustomer();
  if (!customer) return;
  for (const conn of await connectionsForCustomer(customer.id)) await syncConnection(conn, 7);
  refresh();
}

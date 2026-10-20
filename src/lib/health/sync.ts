import "server-only";
import { decrypt, encrypt } from "@/lib/health/crypto";
import { deleteJunctionUser, fetchJunctionData, JunctionError, junctionSources } from "@/lib/health/junction";
import {
  connectionsToSync,
  deleteConnection,
  saveHealthData,
  updateConnectionState,
  updateTokens,
} from "@/lib/health/repo";
import type { HealthConnection } from "@/lib/health/types";
import { fetchWithingsData, refreshTokens, unsubscribe, WithingsError } from "@/lib/health/withings";

const DAY = 24 * 60 * 60 * 1000;

/** Een geldig Withings-toegangstoken; vernieuwt het als het (bijna) verlopen is. */
async function withingsAccessToken(conn: HealthConnection): Promise<string> {
  if (!conn.access_token || !conn.refresh_token) throw new WithingsError("geen tokens", 401);
  if (conn.expires_at && new Date(conn.expires_at).getTime() > Date.now() + 60_000) return decrypt(conn.access_token);
  const fresh = await refreshTokens(decrypt(conn.refresh_token));
  await updateTokens(conn.id, {
    accessToken: encrypt(fresh.accessToken),
    refreshToken: encrypt(fresh.refreshToken),
    expiresAt: fresh.expiresAt,
  });
  return fresh.accessToken;
}

/**
 * Haalt de gegevens van de afgelopen dagen op en slaat ze op. Fouten zetten we
 * bij de koppeling, zodat de klant in Mijn gegevens ziet dat er iets mis is.
 */
export async function syncConnection(conn: HealthConnection, days = 7): Promise<boolean> {
  const to = new Date(Date.now() + DAY);
  const from = new Date(Date.now() - days * DAY);
  try {
    if (conn.provider === "withings") {
      const token = await withingsAccessToken(conn);
      await saveHealthData(conn.customer_id, "withings", await fetchWithingsData(token, from, to));
      await updateConnectionState(conn.id, { status: "active", error: null, synced: true });
    } else {
      if (!conn.external_user_id) return false;
      const sources = await junctionSources(conn.external_user_id);
      const connected = sources.filter((s) => s.status !== "error").map((s) => s.slug);
      await saveHealthData(conn.customer_id, "junction", await fetchJunctionData(conn.external_user_id, from, to));
      await updateConnectionState(conn.id, {
        status: connected.length > 0 ? "active" : "pending",
        error: sources.some((s) => s.status === "error") ? "bron" : null,
        sources: connected,
        synced: true,
      });
    }
    return true;
  } catch (err) {
    console.error("Synchroniseren gezondheidsdata mislukt", conn.provider, conn.id, err);
    const revoked = (err instanceof WithingsError && err.unauthorized) || (err instanceof JunctionError && err.status === 404);
    await updateConnectionState(conn.id, { status: revoked ? "error" : conn.status, error: revoked ? "ingetrokken" : "tijdelijk" }).catch(
      () => {},
    );
    return false;
  }
}

/** Ontkoppelen: bij de aanbieder afmelden (zo goed als het gaat) en alles bij ons wissen. */
export async function disconnect(conn: HealthConnection): Promise<void> {
  try {
    if (conn.provider === "withings" && conn.access_token) await unsubscribe(await withingsAccessToken(conn));
    if (conn.provider === "junction" && conn.external_user_id) await deleteJunctionUser(conn.external_user_id);
  } catch (err) {
    console.error("Afmelden bij aanbieder mislukt (we wissen de gegevens wel)", conn.provider, err);
  }
  await deleteConnection(conn.customer_id, conn.provider);
}

/** Voor de dagelijkse taak: alle koppelingen die een tijdje niet zijn bijgewerkt, tot de deadline. */
export async function syncAllConnections(deadline = Date.now() + 60_000): Promise<number> {
  let synced = 0;
  for (const conn of await connectionsToSync()) {
    if (Date.now() > deadline) break;
    if (await syncConnection(conn, 3)) synced++;
  }
  return synced;
}

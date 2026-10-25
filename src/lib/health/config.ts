/**
 * Welke koppelingen staan aan? Alles is optioneel: zonder sleutels verschijnt
 * er geen koppelknop. Zie README → "Gezondheidsapps koppelen".
 */

export function healthKeyConfigured(): boolean {
  return /^[0-9a-f]{64}$/i.test(process.env.HEALTH_ENCRYPTION_KEY ?? "");
}

/** Withings (weegschalen en Health Mate): eigen OAuth-koppeling, geen contract nodig. */
export function isWithingsConfigured(): boolean {
  return Boolean(process.env.WITHINGS_CLIENT_ID && process.env.WITHINGS_CLIENT_SECRET && healthKeyConfigured());
}

/** Junction: Apple Health (via de Junction-app), Garmin, Fitbit, Oura, Polar, ... */
export function isJunctionConfigured(): boolean {
  return Boolean(process.env.JUNCTION_API_KEY);
}

/** Apple Health via de Junction-app met koppelcode (Grow- of Scale-abonnement bij Junction). */
export function isAppleHealthEnabled(): boolean {
  return isJunctionConfigured() && process.env.JUNCTION_APPLE_HEALTH === "1";
}

/** Welke cloud-apps de Junction-widget toont. Strava staat er bewust niet in (de API-voorwaarden verbieden gebruik voor AI). */
export function junctionProviders(): string[] {
  const list = (process.env.JUNCTION_PROVIDERS ?? "garmin,fitbit,oura,polar")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && s !== "strava");
  return isWithingsConfigured() ? list.filter((s) => s !== "withings") : list;
}

export function isHealthEnabled(): boolean {
  return isWithingsConfigured() || isJunctionConfigured();
}

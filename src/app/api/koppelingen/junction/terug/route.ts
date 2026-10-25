import { after } from "next/server";
import { currentCustomer } from "@/lib/auth";
import { getConnection } from "@/lib/health/repo";
import { syncConnection } from "@/lib/health/sync";
import { connectionsPageUrl } from "@/lib/health/urls";

export const maxDuration = 60;

/** Terugkeer uit de Junction-widget: kijken welke bron is aangesloten en de eerste data ophalen. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("taal") ?? "nl";
  const customer = await currentCustomer();
  const conn = customer ? await getConnection(customer.id, "junction") : null;
  if (!conn) return Response.redirect(connectionsPageUrl(locale, "fout"), 303);
  // Junction zet een fout in de URL als het inloggen bij de bron mislukte.
  if (url.searchParams.get("error_type") || url.searchParams.get("error")) {
    return Response.redirect(connectionsPageUrl(locale, "geannuleerd"), 303);
  }
  after(() => syncConnection(conn, 30).then(() => undefined));
  return Response.redirect(connectionsPageUrl(locale, "gekoppeld"), 303);
}

import { after } from "next/server";
import { currentCustomer } from "@/lib/auth";
import { isWithingsConfigured } from "@/lib/health/config";
import { encrypt, readState } from "@/lib/health/crypto";
import { saveConnection } from "@/lib/health/repo";
import { syncConnection } from "@/lib/health/sync";
import { connectionsPageUrl } from "@/lib/health/urls";
import { exchangeCode, subscribe } from "@/lib/health/withings";

export const maxDuration = 60;

/** Terugkeer na inloggen bij Withings: code inwisselen, meldingen aanzetten en de laatste 30 dagen ophalen. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = isWithingsConfigured() ? readState(url.searchParams.get("state")) : null;
  const locale = state?.locale ?? "nl";
  if (!state) return Response.redirect(connectionsPageUrl(locale, "fout"), 303);
  const code = url.searchParams.get("code");
  if (!code) return Response.redirect(connectionsPageUrl(locale, "geannuleerd"), 303);

  // De koppeling hoort bij de klant die is ingelogd én die het koppelen startte.
  const customer = await currentCustomer();
  if (!customer || customer.id !== state.customerId) return Response.redirect(connectionsPageUrl(locale, "fout"), 303);

  try {
    const tokens = await exchangeCode(code);
    const conn = await saveConnection({
      customerId: customer.id,
      provider: "withings",
      externalUserId: tokens.userId,
      accessToken: encrypt(tokens.accessToken),
      refreshToken: encrypt(tokens.refreshToken),
      expiresAt: tokens.expiresAt,
      status: "active",
      sources: ["withings"],
    });
    after(async () => {
      await subscribe(tokens.accessToken);
      await syncConnection(conn, 30);
    });
    return Response.redirect(connectionsPageUrl(locale, "gekoppeld"), 303);
  } catch (err) {
    console.error("Withings koppelen mislukt", err);
    return Response.redirect(connectionsPageUrl(locale, "fout"), 303);
  }
}

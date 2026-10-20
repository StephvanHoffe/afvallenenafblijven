import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { localePath } from "@/i18n/config";
import { requestLocale } from "@/i18n/server";
import { customerForLoginToken, startSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const l = await requestLocale();
  const token = request.nextUrl.searchParams.get("token");
  const customerId = token ? await customerForLoginToken(token) : null;
  if (!customerId) redirect(localePath(l, "/inloggen?verlopen=1"));
  await startSession(customerId);
  const naar = request.nextUrl.searchParams.get("naar");
  redirect(
    localePath(
      l,
      naar === "opzeggen"
        ? "/account/abonnement?opzeggen=1"
        : naar === "check-in"
          ? "/account/check-in"
          : naar === "weegmoment"
            ? "/account/check-in#weegmoment"
            : "/account",
    ),
  );
}

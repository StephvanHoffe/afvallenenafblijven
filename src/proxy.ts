import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isDemoMode, verifyAdminCookieValue } from "@/lib/admin/auth";

/**
 * Stuurt bezoekers zonder geldige beheersessie direct naar de inlogpagina.
 * Elke beheerpagina en -actie controleert de sessie daarnaast zelf.
 */
export function proxy(request: NextRequest) {
  if (isDemoMode() || request.nextUrl.pathname.startsWith("/beheer/inloggen")) return NextResponse.next();
  if (verifyAdminCookieValue(request.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.next();
  return NextResponse.redirect(new URL("/beheer/inloggen", request.url));
}

export const config = {
  matcher: ["/beheer", "/beheer/:path*"],
};

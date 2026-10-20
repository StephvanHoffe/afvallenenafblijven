import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isDemoMode, verifyAdminCookieValue } from "@/lib/admin/auth";

/**
 * - Beheer: bezoekers zonder geldige beheersessie gaan direct naar de inlogpagina.
 *   Elke beheerpagina en -actie controleert de sessie daarnaast zelf.
 * - Talen: Nederlands staat zonder voorvoegsel (/prijzen) en wordt intern
 *   herschreven naar /nl/prijzen; Engels staat onder /en. Adressen met /nl
 *   sturen we door naar de versie zonder voorvoegsel. De header x-taal geeft
 *   Server Actions en Route Handlers de taal van het verzoek.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/beheer" || pathname.startsWith("/beheer/")) {
    if (isDemoMode() || pathname.startsWith("/beheer/inloggen")) return NextResponse.next();
    if (verifyAdminCookieValue(request.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.next();
    return NextResponse.redirect(new URL("/beheer/inloggen", request.url));
  }

  if (pathname === "/nl" || pathname.startsWith("/nl/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  const english = pathname === "/en" || pathname.startsWith("/en/");
  const headers = new Headers(request.headers);
  headers.set("x-taal", english ? "en" : "nl");
  if (english) return NextResponse.next({ request: { headers } });

  const url = request.nextUrl.clone();
  url.pathname = `/nl${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  // Alles behalve API-routes, interne Next-bestanden en bestanden met een extensie (afbeeldingen, sitemap, robots).
  matcher: ["/((?!api/|_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};

import { NextResponse, type NextRequest } from "next/server";
import { normalizeLocale } from "@petcura/shared";

const localeCookie = "petcura_locale";
const ownerHosts = new Set(["my.petcura.app"]);

function isOwnerHost(host: string | null) {
  if (!host) {
    return false;
  }

  return ownerHosts.has(host.split(":")[0]?.toLowerCase() ?? "");
}

export function proxy(request: NextRequest) {
  const explicitLocale = request.nextUrl.searchParams.get("lang");
  const cookieLocale = request.cookies.get(localeCookie)?.value;
  const acceptLanguage = request.headers.get("accept-language");
  const locale = normalizeLocale(explicitLocale ?? cookieLocale ?? acceptLanguage);
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;

  if (isOwnerHost(host) && request.nextUrl.pathname === "/") {
    const redirectUrl = request.nextUrl.clone();

    redirectUrl.pathname = "/o";

    return NextResponse.redirect(redirectUrl);
  }

  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-petcura-locale", locale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  if (explicitLocale) {
    response.cookies.set(localeCookie, locale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax"
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

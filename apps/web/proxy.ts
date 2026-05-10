import { NextResponse, type NextRequest } from "next/server";
import { normalizeLocale } from "@petcura/shared";

const localeCookie = "petcura_locale";

export function proxy(request: NextRequest) {
  const explicitLocale = request.nextUrl.searchParams.get("lang");
  const cookieLocale = request.cookies.get(localeCookie)?.value;
  const acceptLanguage = request.headers.get("accept-language");
  const locale = normalizeLocale(explicitLocale ?? cookieLocale ?? acceptLanguage);
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

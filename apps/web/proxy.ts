import { NextResponse, type NextRequest } from "next/server";
import { normalizeLocale } from "@petcura/shared";

const localeCookie = "petcura_locale";
const clinicHosts = new Set(["app.petcura.app"]);
const marketingHosts = new Set(["petcura.app", "www.petcura.app"]);
const ownerHost = "my.petcura.app";
const ownerHosts = new Set([ownerHost]);
const scannerPaths = new Set([
  "/wp-admin/install.php",
  "/wp-login.php",
  "/xmlrpc.php"
]);

function isOwnerHost(host: string | null) {
  if (!host) {
    return false;
  }

  return ownerHosts.has(host.split(":")[0]?.toLowerCase() ?? "");
}

function isClinicHost(host: string | null) {
  if (!host) {
    return false;
  }

  return clinicHosts.has(host.split(":")[0]?.toLowerCase() ?? "");
}

function isMarketingHost(host: string | null) {
  if (!host) {
    return false;
  }

  return marketingHosts.has(host.split(":")[0]?.toLowerCase() ?? "");
}

function isOwnerAppPath(pathname: string) {
  return pathname === "/o" || pathname.startsWith("/o/");
}

function isStaffAuthPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/login/") || pathname === "/auth/callback";
}

function isScannerPath(pathname: string) {
  return scannerPaths.has(pathname.toLowerCase());
}

export function proxy(request: NextRequest) {
  if (isScannerPath(request.nextUrl.pathname)) {
    return new NextResponse(null, {
      status: 404,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }

  const explicitLocale = request.nextUrl.searchParams.get("lang");
  const cookieLocale = request.cookies.get(localeCookie)?.value;
  const acceptLanguage = request.headers.get("accept-language");
  const locale = normalizeLocale(explicitLocale ?? cookieLocale ?? acceptLanguage);
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    request.nextUrl.host;

  if (isMarketingHost(host) && isStaffAuthPath(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();

    redirectUrl.hostname = "app.petcura.app";
    redirectUrl.port = "";

    return NextResponse.redirect(redirectUrl);
  }

  if (isClinicHost(host) && isOwnerAppPath(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();

    redirectUrl.hostname = ownerHost;
    redirectUrl.port = "";

    return NextResponse.redirect(redirectUrl);
  }

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

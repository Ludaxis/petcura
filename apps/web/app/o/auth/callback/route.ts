import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { normalizeLocale } from "@petcura/shared";
import { requirePublicEnv } from "@/lib/env";
import { finalizeOwnerOAuthUser } from "@/lib/owner/oauth";
import {
  ownerOAuthLoginErrorPath,
  parseOwnerOAuthProvider,
  sanitizeOwnerNextPath
} from "@/lib/owner/oauth-shared";
import { ownerSessionCookieOptions } from "@/lib/supabase/owner-session";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function getRequestOrigin(request: NextRequest, fallbackUrl: URL) {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    fallbackUrl.protocol.replace(":", "");

  return host ? `${protocol}://${host}` : fallbackUrl.origin;
}

function redirectWithCookies(url: URL, cookiesToSet: CookieToSet[]) {
  const response = NextResponse.redirect(url);

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(
      name,
      value,
      options as NonNullable<Parameters<NextResponse["cookies"]["set"]>[2]>
    );
  });

  return response;
}

export async function GET(request: NextRequest) {
  const env = requirePublicEnv();
  const requestUrl = new URL(request.url);
  const requestOrigin = getRequestOrigin(request, requestUrl);
  const locale = normalizeLocale(requestUrl.searchParams.get("lang"));
  const nextPath = sanitizeOwnerNextPath(requestUrl.searchParams.get("next"));
  const provider = parseOwnerOAuthProvider(
    requestUrl.searchParams.get("provider")
  );
  const code = requestUrl.searchParams.get("code");
  const cookiesToSet: CookieToSet[] = [];

  const loginUrl = new URL(
    ownerOAuthLoginErrorPath(locale, nextPath, "login_error"),
    requestOrigin
  );

  if (!code || !provider) {
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: ownerSessionCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(nextCookies) {
          cookiesToSet.push(...nextCookies);
        }
      }
    }
  );

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return redirectWithCookies(loginUrl, cookiesToSet);
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    await supabase.auth.signOut();
    return redirectWithCookies(loginUrl, cookiesToSet);
  }

  const linked = await finalizeOwnerOAuthUser(user, provider);

  if (!linked.ok) {
    await supabase.auth.signOut();
    const linkedErrorUrl = new URL(
      ownerOAuthLoginErrorPath(locale, nextPath, linked.error),
      requestOrigin
    );
    return redirectWithCookies(linkedErrorUrl, cookiesToSet);
  }

  const redirectUrl = new URL(nextPath, requestOrigin);
  redirectUrl.searchParams.set("lang", locale);

  return redirectWithCookies(redirectUrl, cookiesToSet);
}

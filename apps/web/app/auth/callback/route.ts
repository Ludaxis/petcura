import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { normalizeLocale } from "@petcura/shared";
import { requirePublicEnv } from "@/lib/env";

function getRequestOrigin(request: NextRequest, fallbackUrl: URL) {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    fallbackUrl.protocol.replace(":", "");

  return host ? `${protocol}://${host}` : fallbackUrl.origin;
}

export async function GET(request: NextRequest) {
  const env = requirePublicEnv();
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const tokenType = requestUrl.searchParams.get("type") ?? "email";
  const locale = normalizeLocale(requestUrl.searchParams.get("lang"));
  const rawNextPath = requestUrl.searchParams.get("next") ?? "/inbox";
  const nextPath =
    rawNextPath.startsWith("/") && !rawNextPath.startsWith("//")
      ? rawNextPath
      : "/inbox";
  const requestOrigin = getRequestOrigin(request, requestUrl);
  const redirectUrl = new URL(nextPath, requestOrigin);

  redirectUrl.searchParams.set("lang", locale);
  const loginUrl = new URL("/login", requestOrigin);

  loginUrl.searchParams.set("lang", locale);
  loginUrl.searchParams.set("next", nextPath);
  const redirectResponse = NextResponse.redirect(redirectUrl);
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      loginUrl.searchParams.set("error", "login_error");
      return NextResponse.redirect(loginUrl);
    }
  } else if (tokenHash) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: tokenType as EmailOtpType
    });

    if (error || !data.session) {
      loginUrl.searchParams.set("error", "login_error");
      return NextResponse.redirect(loginUrl);
    }

    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });
  }

  return redirectResponse;
}

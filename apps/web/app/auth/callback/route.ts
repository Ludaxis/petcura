import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { normalizeLocale } from "@petcura/shared";
import { requirePublicEnv } from "@/lib/env";
import { resolveStaffActor } from "@/lib/auth/resolve-staff-actor";
import { resolvePostLoginDestination } from "@/lib/auth/post-login-router";
import {
  STAFF_LAST_ROUTE_COOKIE,
  readStaffLastRoute
} from "@/lib/auth/last-route-cookie";
import { writeAuthEvent } from "@/lib/auth/audit-events";

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
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const tokenType = requestUrl.searchParams.get("type") ?? "email";
  const locale = normalizeLocale(requestUrl.searchParams.get("lang"));
  const nextParam = requestUrl.searchParams.get("next");
  const requestOrigin = getRequestOrigin(request, requestUrl);

  const loginUrl = new URL("/login", requestOrigin);
  loginUrl.searchParams.set("lang", locale);
  if (nextParam) loginUrl.searchParams.set("next", nextParam);

  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(next) {
          cookiesToSet.push(...next);
        }
      }
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      loginUrl.searchParams.set("error", "login_error");
      return redirectWithCookies(loginUrl, cookiesToSet);
    }
  } else if (tokenHash) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: tokenType as EmailOtpType
    });

    if (error || !data.session) {
      loginUrl.searchParams.set("error", "login_error");
      return redirectWithCookies(loginUrl, cookiesToSet);
    }

    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    loginUrl.searchParams.set("error", "login_error");
    return redirectWithCookies(loginUrl, cookiesToSet);
  }

  const actor = await resolveStaffActor(supabase, user.id);

  if (!actor) {
    loginUrl.searchParams.set("error", "no_membership");
    return redirectWithCookies(loginUrl, cookiesToSet);
  }

  const lastVisited = readStaffLastRoute(
    request.cookies.get(STAFF_LAST_ROUTE_COOKIE)?.value
  );

  const { destination, reason } = resolvePostLoginDestination({
    actor: { kind: "clinic_staff", ...actor },
    nextParam,
    lastVisitedCookie: lastVisited
  });

  await writeAuthEvent({
    eventType: "magic_link_consumed",
    actorKind: "clinic_staff",
    actorId: user.id,
    clinicId: actor.clinicId,
    metadata: { destination, post_login_reason: reason }
  });

  const redirectUrl = new URL(destination, requestOrigin);
  if (!redirectUrl.searchParams.has("lang")) {
    redirectUrl.searchParams.set("lang", locale);
  }

  return redirectWithCookies(redirectUrl, cookiesToSet);
}

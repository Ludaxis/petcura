import { NextResponse, type NextRequest } from "next/server";
import { normalizeLocale } from "@petcura/shared";
import { verifyAndConsumeJoinToken } from "@/lib/owner/join-token";
import { writeAuthEvent } from "@/lib/auth/audit-events";

function getRequestOrigin(request: NextRequest, fallbackUrl: URL) {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    fallbackUrl.protocol.replace(":", "");
  return host ? `${protocol}://${host}` : fallbackUrl.origin;
}

const JOIN_TOKEN_COOKIE = "pc_join_token";
const JOIN_TOKEN_COOKIE_MAX_AGE = 60 * 5; // 5 minutes

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");
  const locale = normalizeLocale(requestUrl.searchParams.get("lang"));
  const requestOrigin = getRequestOrigin(request, requestUrl);

  // Build the "invite expired" recovery URL once.
  function expiredUrl(opts?: { maskedPhone?: string; reason?: string }) {
    const url = new URL("/o/login", requestOrigin);
    url.searchParams.set("lang", locale);
    url.searchParams.set("reason", opts?.reason ?? "invite_expired");
    if (opts?.maskedPhone) url.searchParams.set("phone", opts.maskedPhone);
    return url;
  }

  if (!token) {
    await writeAuthEvent({
      eventType: "join_token_attempted",
      actorKind: "unknown",
      metadata: { result: "missing_token" }
    });
    return NextResponse.redirect(expiredUrl());
  }

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const result = await verifyAndConsumeJoinToken({ token, ipAddress });

  if (!result.ok) {
    await writeAuthEvent({
      eventType: "join_token_attempted",
      actorKind: "unknown",
      metadata: {
        result: result.error,
        phone_masked: result.maskedPhone
      }
    });
    const opts: { maskedPhone?: string; reason?: string } = {
      reason:
        result.error === "rate_limited" ? "rate_limited" : "invite_expired"
    };
    if (result.maskedPhone) opts.maskedPhone = result.maskedPhone;
    return NextResponse.redirect(expiredUrl(opts));
  }

  await writeAuthEvent({
    eventType: "join_token_consumed",
    actorKind: "unknown",
    clinicId: result.clinicId,
    metadata: {
      phone_masked: result.phone.slice(-2),
      pet_id: result.petId
    }
  });

  // Hand off to the confirmation page so the owner has one tap before we issue
  // a session. Token payload travels in a short-lived server-side cookie so the
  // URL doesn't keep it.
  const confirmUrl = new URL("/o/join/confirm", requestOrigin);
  confirmUrl.searchParams.set("lang", locale);

  const response = NextResponse.redirect(confirmUrl);
  response.cookies.set(JOIN_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: JOIN_TOKEN_COOKIE_MAX_AGE,
    path: "/o/join"
  });
  // Carry resolved metadata (clinic name, pet name) in a separate readable
  // cookie so the page can render without re-verifying.
  response.cookies.set(
    "pc_join_meta",
    JSON.stringify({
      clinicId: result.clinicId,
      clinicName: result.clinicName,
      petId: result.petId,
      petName: result.petName,
      petSpecies: result.petSpecies
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: JOIN_TOKEN_COOKIE_MAX_AGE,
      path: "/o/join"
    }
  );
  return response;
}

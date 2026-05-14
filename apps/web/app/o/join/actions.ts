"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeLocale } from "@petcura/shared";
import { verifyAndConsumeJoinToken } from "@/lib/owner/join-token";
import { writeAuthEvent } from "@/lib/auth/audit-events";

/**
 * Confirmation-screen action. Reads the short-lived `pc_join_token` cookie
 * set by the /o/join route handler, calls the (Codex-owned) verify+consume
 * endpoint, and redirects to /o?welcome=1. Until Codex ships, the adapter
 * returns `unknown_token` → recovery via /o/login.
 */
export async function consumeJoinToken(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const cookieStore = await cookies();
  const token = cookieStore.get("pc_join_token")?.value;

  function expiredUrl() {
    const params = new URLSearchParams({
      lang: locale,
      reason: "invite_expired"
    });
    return `/o/login?${params.toString()}`;
  }

  if (!token) {
    redirect(expiredUrl());
  }

  const requestHeaders = await headers();
  const ipAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const result = await verifyAndConsumeJoinToken({ token, ipAddress });

  if (!result.ok) {
    redirect(expiredUrl());
  }

  await writeAuthEvent({
    eventType: "join_token_consumed",
    actorKind: "owner",
    clinicId: result.clinicId,
    metadata: { destination: "/o?welcome=1" }
  });

  // Best-effort cleanup of the short-lived cookies.
  cookieStore.delete("pc_join_token");
  cookieStore.delete("pc_join_meta");

  // TODO(codex): once the verify endpoint also issues an owner session, we can
  // route directly. For now, send the owner through /o/login with the phone
  // pre-filled so OTP recovery completes the auth.
  const params = new URLSearchParams({
    lang: locale,
    phone: result.phone,
    next: "/o?welcome=1"
  });
  redirect(`/o/login?${params.toString()}`);
}

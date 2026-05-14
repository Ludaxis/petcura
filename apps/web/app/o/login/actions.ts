"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { normalizeLocale } from "@petcura/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePublicEnv } from "@/lib/env";
import { createOwnerClient } from "@/lib/supabase/owner-server";
import { normalizePhone } from "@/lib/intake/create-owner-request";
import {
  getOwnerOAuthScopes,
  ownerOAuthLoginErrorPath,
  parseOwnerOAuthProvider,
  sanitizeOwnerNextPath
} from "@/lib/owner/oauth-shared";
import {
  requestOwnerOtpDelivery,
  verifyOwnerOtpCode
} from "@/lib/owner/otp";
import { resolveOwnerActor } from "@/lib/auth/resolve-owner-actor";
import { resolvePostLoginDestination } from "@/lib/auth/post-login-router";
import {
  OWNER_LAST_ROUTE_COOKIE,
  readOwnerLastRoute
} from "@/lib/auth/last-route-cookie";
import { cookies } from "next/headers";
import { writeAuthEvent } from "@/lib/auth/audit-events";

type OwnerOtpActionResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "invalid_phone"
        | "invalid_code"
        | "not_found"
        | "otp_unavailable"
        | "login_error";
    };

const phoneRegex = /^\+?[0-9 ()-]{6,}$/;
const codeRegex = /^[0-9]{6}$/;

async function getActionOrigin() {
  const requestHeaders = await headers();
  const env = requirePublicEnv();
  return requestHeaders.get("origin") ?? env.NEXT_PUBLIC_APP_URL;
}

async function findAuthUserByPhone(phone: string) {
  const admin = createAdminClient();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000
    });

    if (error) {
      throw new Error(`Could not list auth users: ${error.message}`);
    }

    const match = data.users.find((user) => user.phone === phone);
    if (match) return match;
    if (data.users.length < 1000) return null;
  }

  return null;
}

async function ensureOwnerAuthUser(phone: string): Promise<User> {
  const admin = createAdminClient();
  const existing = await findAuthUserByPhone(phone);

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      phone,
      phone_confirm: true,
      app_metadata: {
        ...existing.app_metadata,
        petcura_actor: "owner"
      }
    });

    if (error) {
      throw new Error(`Could not update owner auth user: ${error.message}`);
    }

    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    phone,
    phone_confirm: true,
    app_metadata: {
      petcura_actor: "owner"
    },
    user_metadata: {
      petcura_source: "owner_otp"
    }
  });

  if (error) {
    const duplicate = await findAuthUserByPhone(phone);
    if (duplicate) return duplicate;
    throw new Error(`Could not create owner auth user: ${error.message}`);
  }

  return data.user;
}

async function linkOwnerUser(phone: string, userId: string) {
  const admin = createAdminClient();
  const { data: owners, error: ownersError } = await admin
    .from("owners")
    .select("id, clinic_id")
    .eq("phone", phone)
    .is("deleted_at", null);

  if (ownersError) {
    throw new Error(`Could not load owner records: ${ownersError.message}`);
  }

  if (!owners || owners.length === 0) {
    return { ok: false as const, error: "not_found" as const };
  }

  const { error: ownerUserError } = await admin
    .from("owner_users")
    .upsert({ user_id: userId }, { onConflict: "user_id" });

  if (ownerUserError) {
    throw new Error(`Could not link owner user: ${ownerUserError.message}`);
  }

  const { error: identityError } = await admin
    .from("owner_user_identities")
    .upsert(
      {
        user_id: userId,
        identity_type: "phone",
        identity_value: phone
      },
      { onConflict: "identity_type,identity_value" }
    );

  if (identityError) {
    throw new Error(`Could not link owner identity: ${identityError.message}`);
  }

  const { error: membershipError } = await admin
    .from("owner_user_memberships")
    .upsert(
      owners.map((owner) => ({
        user_id: userId,
        clinic_id: owner.clinic_id,
        owner_id: owner.id
      })),
      { onConflict: "user_id,clinic_id" }
    );

  if (membershipError) {
    throw new Error(
      `Could not link owner clinic memberships: ${membershipError.message}`
    );
  }

  return { ok: true as const };
}

export async function requestOwnerOtp(
  phoneInput: string
): Promise<OwnerOtpActionResult> {
  if (!phoneRegex.test(phoneInput)) {
    return { ok: false, error: "invalid_phone" };
  }

  const phone = normalizePhone(phoneInput);
  const result = await requestOwnerOtpDelivery(phone);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true };
}

export async function verifyOwnerOtp(
  phoneInput: string,
  code: string,
  nextPath?: string
): Promise<OwnerOtpActionResult> {
  if (!phoneRegex.test(phoneInput)) {
    return { ok: false, error: "invalid_phone" };
  }

  if (!codeRegex.test(code)) {
    return { ok: false, error: "invalid_code" };
  }

  const phone = normalizePhone(phoneInput);
  const verification = await verifyOwnerOtpCode(phone, code);

  if (!verification.ok) {
    return { ok: false, error: verification.error };
  }

  const ownerUser = await ensureOwnerAuthUser(phone);
  const linked = await linkOwnerUser(phone, ownerUser.id);

  if (!linked.ok) {
    return linked;
  }

  const password = randomBytes(32).toString("base64url");
  const admin = createAdminClient();
  const { error: passwordError } = await admin.auth.admin.updateUserById(
    ownerUser.id,
    {
      password,
      app_metadata: {
        ...ownerUser.app_metadata,
        petcura_actor: "owner"
      }
    }
  );

  if (passwordError) {
    return { ok: false, error: "login_error" };
  }

  const supabase = await createOwnerClient();
  const { error } = await supabase.auth.signInWithPassword({
    phone,
    password
  });

  if (error) {
    return { ok: false, error: "login_error" };
  }

  // Resolve post-login destination via the shared router. Falls back to /o on
  // any failure to keep verifyOwnerOtp behaviorally backward-compatible.
  let destination = "/o";
  try {
    const actor = await resolveOwnerActor(supabase, ownerUser.id);
    if (actor) {
      const cookieStore = await cookies();
      const lastVisited = readOwnerLastRoute(
        cookieStore.get(OWNER_LAST_ROUTE_COOKIE)?.value
      );
      const result = resolvePostLoginDestination({
        actor: { kind: "owner", ...actor },
        nextParam: nextPath ?? null,
        lastVisitedCookie: lastVisited
      });
      destination = result.destination;
      await writeAuthEvent({
        eventType: "otp_verified",
        actorKind: "owner",
        actorId: ownerUser.id,
        metadata: {
          post_login_reason: result.reason,
          destination: result.destination
        }
      });
    }
  } catch {
    // swallow: routing fallback is /o, audit best-effort
  }

  redirect(destination);
}

export async function startOwnerOAuth(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const nextPath = sanitizeOwnerNextPath(formData.get("next"));
  const provider = parseOwnerOAuthProvider(formData.get("provider"));

  if (!provider) {
    redirect(ownerOAuthLoginErrorPath(locale, nextPath, "login_error"));
  }

  const origin = await getActionOrigin();
  const callbackUrl = new URL("/o/auth/callback", origin);

  callbackUrl.searchParams.set("provider", provider);
  callbackUrl.searchParams.set("next", nextPath);
  callbackUrl.searchParams.set("lang", locale);

  const supabase = await createOwnerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl.toString(),
      scopes: getOwnerOAuthScopes(provider)
    }
  });

  if (error || !data.url) {
    redirect(ownerOAuthLoginErrorPath(locale, nextPath, "login_error"));
  }

  redirect(data.url);
}

export async function signOutOwner() {
  const supabase = await createOwnerClient();
  await supabase.auth.signOut();
  redirect("/o/login");
}

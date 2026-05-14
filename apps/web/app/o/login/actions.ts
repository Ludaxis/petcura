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
  authUserMatchesEmail,
  authUserMatchesPhone,
  ownerAuthEmailForPhone
} from "@/lib/owner/auth-user-match";
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

type OwnerOtpActionResult =
  | { ok: true; redirectTo?: string }
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

type OwnerLoginCredentials = { phone: string } | { email: string };

async function getActionOrigin() {
  const requestHeaders = await headers();
  const env = requirePublicEnv();
  return requestHeaders.get("origin") ?? env.NEXT_PUBLIC_APP_URL;
}

async function findAuthUserById(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error) {
    console.warn("[petcura] owner auth user lookup by id failed", {
      userId,
      message: error.message
    });
    return null;
  }

  return data.user;
}

async function findLinkedAuthUserByPhone(phone: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("owner_user_identities")
    .select("user_id")
    .eq("identity_type", "phone")
    .eq("identity_value", phone)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load owner phone identity: ${error.message}`);
  }

  return data?.user_id ? findAuthUserById(data.user_id) : null;
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

    const match = data.users.find((user) => authUserMatchesPhone(user, phone));
    if (match) return match;
    if (data.users.length < 1000) return null;
  }

  return null;
}

async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000
    });

    if (error) {
      throw new Error(`Could not list auth users: ${error.message}`);
    }

    const match = data.users.find((user) => authUserMatchesEmail(user, email));
    if (match) return match;
    if (data.users.length < 1000) return null;
  }

  return null;
}

async function markOwnerAuthUser(user: User, phone: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      petcura_actor: "owner"
    },
    user_metadata: {
      ...user.user_metadata,
      petcura_owner_phone: phone
    }
  });

  if (error) {
    throw new Error(`Could not update owner auth user: ${error.message}`);
  }

  return data.user;
}

function loginCredentialsForUser(
  user: User,
  phone: string,
  fallbackEmail: string
): OwnerLoginCredentials | null {
  if (authUserMatchesPhone(user, phone)) {
    return { phone };
  }

  if (user.email) {
    return { email: user.email };
  }

  return fallbackEmail ? { email: fallbackEmail } : null;
}

async function ensureOwnerAuthUser(phone: string): Promise<{
  user: User;
  login: OwnerLoginCredentials;
}> {
  const admin = createAdminClient();
  const internalEmail = ownerAuthEmailForPhone(phone);
  const existing =
    (await findLinkedAuthUserByPhone(phone)) ??
    (await findAuthUserByPhone(phone)) ??
    (await findAuthUserByEmail(internalEmail));

  if (existing) {
    const user = await markOwnerAuthUser(existing, phone);
    const login = loginCredentialsForUser(user, phone, internalEmail);

    if (!login) {
      throw new Error("Owner auth user has no usable login identifier.");
    }

    return { user, login };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: internalEmail,
    email_confirm: true,
    app_metadata: {
      petcura_actor: "owner"
    },
    user_metadata: {
      petcura_owner_phone: phone,
      petcura_source: "owner_otp"
    }
  });

  if (error) {
    const duplicate =
      (await findAuthUserByPhone(phone)) ??
      (await findAuthUserByEmail(internalEmail));
    if (duplicate) {
      const user = await markOwnerAuthUser(duplicate, phone);
      const login = loginCredentialsForUser(user, phone, internalEmail);

      if (!login) {
        throw new Error("Duplicate owner auth user has no usable login identifier.");
      }

      return { user, login };
    }
    throw new Error(`Could not create owner auth user: ${error.message}`);
  }

  return { user: data.user, login: { email: internalEmail } };
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
  nextPathInput?: string
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

  try {
    const { user: ownerUser, login } = await ensureOwnerAuthUser(phone);
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
      ...login,
      password
    });

    if (error) {
      console.warn("[petcura] owner OTP password login failed", {
        message: error.message
      });
      return { ok: false, error: "login_error" };
    }

    return { ok: true, redirectTo: sanitizeOwnerNextPath(nextPathInput) };
  } catch (error) {
    console.error("[petcura] owner OTP login failed", {
      message: error instanceof Error ? error.message : "Unknown owner OTP error"
    });
    return { ok: false, error: "login_error" };
  }
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

import "server-only";

import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOwnerOAuthIdentityType,
  getOwnerOAuthIdentityValue,
  hasVerifiedOwnerOAuthEmail,
  normalizeOwnerOAuthEmail,
  type OwnerOAuthProvider
} from "./oauth-shared";

type OwnerLinkError =
  | "oauth_not_linked"
  | "oauth_ambiguous_email"
  | "login_error";

type OwnerLinkResult = { ok: true } | { ok: false; error: OwnerLinkError };

type OwnerMatch = {
  id: string;
  clinic_id: string;
};

function hasDuplicateClinicMatches(owners: OwnerMatch[]) {
  const clinics = new Set<string>();

  for (const owner of owners) {
    if (clinics.has(owner.clinic_id)) return true;
    clinics.add(owner.clinic_id);
  }

  return false;
}

async function ensureIdentityAvailable(
  identityType: string,
  identityValue: string,
  userId: string
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("owner_user_identities")
    .select("user_id")
    .eq("identity_type", identityType)
    .eq("identity_value", identityValue)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not check owner identity: ${error.message}`);
  }

  return !data || data.user_id === userId;
}

async function upsertOwnerIdentity(
  identityType: string,
  identityValue: string,
  userId: string
) {
  if (!(await ensureIdentityAvailable(identityType, identityValue, userId))) {
    return false;
  }

  const admin = createAdminClient();
  const { error } = await admin.from("owner_user_identities").upsert(
    {
      user_id: userId,
      identity_type: identityType,
      identity_value: identityValue
    },
    { onConflict: "identity_type,identity_value" }
  );

  if (error) {
    throw new Error(`Could not link owner identity: ${error.message}`);
  }

  return true;
}

async function ensureOwnerActor(user: User) {
  const admin = createAdminClient();
  const metadata = (user.app_metadata ?? {}) as Record<string, unknown>;
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...metadata,
      petcura_actor: "owner"
    }
  });

  if (error) {
    throw new Error(`Could not update owner auth user: ${error.message}`);
  }
}

async function hasOwnerMembership(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("owner_user_memberships")
    .select("user_id")
    .eq("user_id", userId)
    .limit(1);

  if (error) {
    throw new Error(`Could not load owner memberships: ${error.message}`);
  }

  return Boolean(data?.length);
}

async function linkOwnerUserToMatches(
  user: User,
  provider: OwnerOAuthProvider,
  owners: OwnerMatch[],
  email: string
) {
  const admin = createAdminClient();
  const { error: ownerUserError } = await admin
    .from("owner_users")
    .upsert({ user_id: user.id }, { onConflict: "user_id" });

  if (ownerUserError) {
    throw new Error(`Could not link owner user: ${ownerUserError.message}`);
  }

  const providerLinked = await upsertOwnerIdentity(
    getOwnerOAuthIdentityType(provider),
    getOwnerOAuthIdentityValue(user, provider),
    user.id
  );
  const emailLinked = await upsertOwnerIdentity("email", email, user.id);

  if (!providerLinked || !emailLinked) {
    return false;
  }

  const { error: membershipError } = await admin
    .from("owner_user_memberships")
    .upsert(
      owners.map((owner) => ({
        user_id: user.id,
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

  await ensureOwnerActor(user);

  return true;
}

export async function finalizeOwnerOAuthUser(
  user: User,
  provider: OwnerOAuthProvider
): Promise<OwnerLinkResult> {
  if (await hasOwnerMembership(user.id)) {
    const linked = await upsertOwnerIdentity(
      getOwnerOAuthIdentityType(provider),
      getOwnerOAuthIdentityValue(user, provider),
      user.id
    );

    if (!linked) return { ok: false, error: "oauth_not_linked" };

    await ensureOwnerActor(user);
    return { ok: true };
  }

  if (!hasVerifiedOwnerOAuthEmail(user)) {
    return { ok: false, error: "oauth_not_linked" };
  }

  const email = normalizeOwnerOAuthEmail(user.email);
  if (!email) return { ok: false, error: "oauth_not_linked" };

  const admin = createAdminClient();
  const { data: owners, error } = await admin
    .from("owners")
    .select("id, clinic_id")
    .ilike("email", email)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Could not load owner records: ${error.message}`);
  }

  if (!owners?.length) {
    return { ok: false, error: "oauth_not_linked" };
  }

  if (hasDuplicateClinicMatches(owners)) {
    return { ok: false, error: "oauth_ambiguous_email" };
  }

  const linked = await linkOwnerUserToMatches(user, provider, owners, email);

  return linked ? { ok: true } : { ok: false, error: "oauth_not_linked" };
}

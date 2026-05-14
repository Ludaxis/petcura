import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { normalizeLocale, type Database, type SupportedLocale } from "@petcura/shared";
import { ownerMembershipSelect } from "@/lib/owner/membership-query";
import { createOwnerClient } from "@/lib/supabase/owner-server";

type OwnerSupabaseClient = Awaited<ReturnType<typeof createOwnerClient>>;

type ClinicRow = Pick<
  Database["public"]["Tables"]["clinics"]["Row"],
  "id" | "name" | "slug" | "timezone" | "locale"
>;

type OwnerRow = Pick<
  Database["public"]["Tables"]["owners"]["Row"],
  "id" | "name" | "email" | "phone" | "preferred_language" | "photo_url"
>;

type MembershipRow = Pick<
  Database["public"]["Tables"]["owner_user_memberships"]["Row"],
  "clinic_id" | "owner_id" | "joined_at"
> & {
  clinics: ClinicRow | null;
  owners: OwnerRow | null;
};

export type OwnerMembership = {
  clinicId: string;
  ownerId: string;
  joinedAt: string;
  clinic: ClinicRow;
  owner: OwnerRow;
};

export type OwnerContext = {
  supabase: OwnerSupabaseClient;
  user: User;
  membership: OwnerMembership;
  memberships: OwnerMembership[];
  clinic: ClinicRow;
  owner: OwnerRow;
};

function ownerLoginPath(
  locale: SupportedLocale,
  nextPath: string,
  error?: string
) {
  const params = new URLSearchParams({
    lang: locale,
    next: nextPath
  });

  if (error) {
    params.set("error", error);
  }

  return `/o/login?${params.toString()}`;
}

function isOwnerActor(user: User) {
  const metadata = user.app_metadata as Record<string, unknown>;
  return metadata.petcura_actor === "owner";
}

function toMembership(row: MembershipRow): OwnerMembership | null {
  if (!row.clinics || !row.owners) return null;

  return {
    clinicId: row.clinic_id,
    ownerId: row.owner_id,
    joinedAt: row.joined_at,
    clinic: row.clinics,
    owner: row.owners
  };
}

export async function requireOwnerContext(
  locale: SupportedLocale,
  nextPath: string
): Promise<OwnerContext> {
  const supabase = await createOwnerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(ownerLoginPath(locale, nextPath));
  }

  if (!isOwnerActor(user)) {
    redirect(ownerLoginPath(locale, nextPath, "owner_required"));
  }

  const { data, error: membershipError } = await supabase
    .from("owner_user_memberships")
    .select(ownerMembershipSelect)
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (membershipError) {
    throw new Error(
      `Could not load owner clinic memberships: ${membershipError.message}`
    );
  }

  const memberships = ((data ?? []) as unknown as MembershipRow[])
    .map(toMembership)
    .filter((membership): membership is OwnerMembership => membership !== null);

  if (memberships.length === 0) {
    redirect(ownerLoginPath(locale, nextPath, "no_membership"));
  }

  const membership = memberships[0]!;

  return {
    supabase,
    user,
    membership,
    memberships,
    clinic: {
      ...membership.clinic,
      locale: normalizeLocale(membership.clinic.locale)
    },
    owner: {
      ...membership.owner,
      preferred_language: normalizeLocale(membership.owner.preferred_language)
    }
  };
}

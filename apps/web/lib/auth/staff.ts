import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Database, SupportedLocale } from "@petcura/shared";
import { createAdminClient, getDefaultClinic } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ClinicStaffRow = Database["public"]["Tables"]["clinic_staff"]["Row"];
type ClinicRow = Pick<
  Database["public"]["Tables"]["clinics"]["Row"],
  "id" | "name" | "slug" | "timezone" | "locale"
>;

export type StaffContext = {
  supabase: ServerSupabaseClient;
  user: User;
  membership: Pick<
    ClinicStaffRow,
    "id" | "clinic_id" | "role" | "permissions" | "is_active"
  >;
  clinic: ClinicRow;
};

type MembershipWithClinic = Pick<
  ClinicStaffRow,
  "id" | "clinic_id" | "role" | "permissions" | "is_active"
> & {
  clinics: ClinicRow | null;
};

function loginPath(locale: SupportedLocale, nextPath: string, error?: string) {
  const params = new URLSearchParams({
    lang: locale,
    next: nextPath
  });

  if (error) {
    params.set("error", error);
  }

  return `/login?${params.toString()}`;
}

function getBootstrapEmails() {
  return (process.env.PETCURA_BOOTSTRAP_STAFF_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function fetchActiveMembership(
  supabase: ServerSupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("clinic_staff")
    .select(
      "id, clinic_id, role, permissions, is_active, clinics(id, name, slug, timezone, locale)"
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load staff clinic membership: ${error.message}`);
  }

  return data as MembershipWithClinic | null;
}

async function maybeBootstrapStaffMembership(user: User) {
  const email = user.email?.toLowerCase();
  const bootstrapEmails = getBootstrapEmails();

  if (!email || !bootstrapEmails.includes(email)) {
    return;
  }

  const admin = createAdminClient();
  const clinic = await getDefaultClinic();

  const { data: membership, error } = await admin
    .from("clinic_staff")
    .upsert(
      {
        clinic_id: clinic.id,
        user_id: user.id,
        role: "owner",
        is_active: true
      },
      {
        onConflict: "clinic_id,user_id"
      }
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(`Could not bootstrap staff membership: ${error.message}`);
  }

  await admin.from("audit_logs").insert({
    clinic_id: clinic.id,
    actor_id: user.id,
    action: "staff_bootstrapped",
    entity_type: "clinic_staff",
    entity_id: membership.id,
    payload_json: { email }
  });
}

export async function requireStaffContext(
  locale: SupportedLocale,
  nextPath: string
): Promise<StaffContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(loginPath(locale, nextPath));
  }

  let membership = await fetchActiveMembership(supabase, user.id);

  if (!membership) {
    await maybeBootstrapStaffMembership(user);
    membership = await fetchActiveMembership(supabase, user.id);
  }

  if (!membership?.clinics) {
    redirect(loginPath(locale, nextPath, "no_membership"));
  }

  return {
    supabase,
    user,
    membership,
    clinic: membership.clinics
  };
}

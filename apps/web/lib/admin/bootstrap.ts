import "server-only";

import type { Database } from "@petcura/shared";
import { createAdminClient } from "@/lib/supabase/admin";

type ClinicRow = Pick<
  Database["public"]["Tables"]["clinics"]["Row"],
  "id" | "name" | "slug" | "country" | "timezone" | "locale" | "created_at"
>;

type StaffRow = Pick<
  Database["public"]["Tables"]["clinic_staff"]["Row"],
  "id" | "clinic_id" | "user_id" | "role" | "is_active" | "created_at"
>;

export type AdminStaffMember = StaffRow & {
  email: string;
};

export type AdminClinic = ClinicRow & {
  staff: AdminStaffMember[];
};

export async function listAuthUserEmails() {
  const admin = createAdminClient();
  const usersById = new Map<string, string>();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000
    });

    if (error) {
      throw new Error(`Could not list auth users: ${error.message}`);
    }

    for (const user of data.users) {
      if (user.email) {
        usersById.set(user.id, user.email);
      }
    }

    if (data.users.length < 1000) {
      break;
    }
  }

  return usersById;
}

export async function listAdminClinics(): Promise<AdminClinic[]> {
  const admin = createAdminClient();

  const [{ data: clinics, error: clinicsError }, { data: staff, error: staffError }] =
    await Promise.all([
      admin
        .from("clinics")
        .select("id, name, slug, country, timezone, locale, created_at")
        .order("created_at", { ascending: true }),
      admin
        .from("clinic_staff")
        .select("id, clinic_id, user_id, role, is_active, created_at")
        .order("created_at", { ascending: true })
    ]);

  if (clinicsError) {
    throw new Error(`Could not list clinics: ${clinicsError.message}`);
  }

  if (staffError) {
    throw new Error(`Could not list clinic staff: ${staffError.message}`);
  }

  const usersById = await listAuthUserEmails();
  const staffByClinic = new Map<string, AdminStaffMember[]>();

  for (const member of staff ?? []) {
    const members = staffByClinic.get(member.clinic_id) ?? [];

    members.push({
      ...member,
      email: usersById.get(member.user_id) ?? member.user_id
    });
    staffByClinic.set(member.clinic_id, members);
  }

  return (clinics ?? []).map((clinic) => ({
    ...clinic,
    staff: staffByClinic.get(clinic.id) ?? []
  }));
}

export async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient();
  const normalizedEmail = email.toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000
    });

    if (error) {
      throw new Error(`Could not list auth users: ${error.message}`);
    }

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail
    );

    if (match) {
      return match;
    }

    if (data.users.length < 1000) {
      return null;
    }
  }

  return null;
}

export async function ensureAuthUser(email: string) {
  const existingUser = await findAuthUserByEmail(email);

  if (existingUser) {
    return existingUser;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      petcura_source: "admin_bootstrap"
    }
  });

  if (error) {
    throw new Error(`Could not create auth user: ${error.message}`);
  }

  return data.user;
}

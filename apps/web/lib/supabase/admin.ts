import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@petcura/shared";
import { requirePublicEnv } from "@/lib/env";

let adminClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createAdminClient() {
  const env = requirePublicEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing SUPABASE_SECRET_KEY for server-side writes.");
  }

  adminClient ??= createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    secretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  return adminClient;
}

export function getDefaultClinicSlug() {
  return process.env.PETCURA_DEFAULT_CLINIC_SLUG?.trim() || "alex-vet-demo";
}

export async function getDefaultClinic() {
  return getClinicBySlug(getDefaultClinicSlug());
}

export async function getClinicBySlug(slug: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clinics")
    .select("id, name, slug, timezone, locale")
    .eq("slug", slug)
    .single();

  if (error) {
    throw new Error(`Clinic is not available: ${error.message}`);
  }

  return data;
}

export async function getIntakeClinic(slug?: string) {
  return getClinicBySlug(slug?.trim() || getDefaultClinicSlug());
}

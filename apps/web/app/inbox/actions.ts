"use server";

import { redirect } from "next/navigation";
import { normalizeLocale } from "@petcura/shared";
import { createClient } from "@/lib/supabase/server";

export async function signOutStaff(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect(`/login?lang=${locale}`);
}

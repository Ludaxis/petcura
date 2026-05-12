"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  normalizeLocale,
  type SupportedLocale
} from "@petcura/shared";
import { userProfileSchema } from "@petcura/validation";
import { requireStaffContext } from "@/lib/auth/staff";
import {
  hasUsableProfileImage,
  uploadProfileImage
} from "@/lib/profile-media";
import { createAdminClient } from "@/lib/supabase/admin";

function profileRedirect(
  locale: SupportedLocale,
  params: Record<string, string>
): never {
  const searchParams = new URLSearchParams({
    lang: locale,
    ...params
  });

  redirect(`/profile?${searchParams.toString()}`);
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getPhoto(formData: FormData) {
  const value = formData.get("photo");
  return value instanceof File && hasUsableProfileImage(value) ? value : null;
}

function nullable(value: string | undefined) {
  const next = value?.trim();
  return next ? next : null;
}

export async function updateMyProfile(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const staffContext = await requireStaffContext(locale, "/profile");
  const parsed = userProfileSchema.safeParse({
    fullName: getString(formData, "fullName"),
    displayName: getString(formData, "displayName"),
    phone: getString(formData, "phone"),
    jobTitle: getString(formData, "jobTitle"),
    locale: getString(formData, "profileLocale") || locale
  });

  if (!parsed.success) {
    profileRedirect(locale, { profile_error: "invalid_profile" });
  }

  const admin = createAdminClient();
  const photo = getPhoto(formData);
  let avatarUrl: string | undefined;

  if (photo) {
    try {
      avatarUrl = await uploadProfileImage({
        clinicId: staffContext.clinic.id,
        entity: "staff",
        entityId: staffContext.user.id,
        file: photo
      });
    } catch {
      profileRedirect(locale, { profile_error: "photo_upload_failed" });
    }
  }

  const { error } = await admin.from("user_profiles").upsert(
    {
      user_id: staffContext.user.id,
      full_name: parsed.data.fullName,
      display_name: nullable(parsed.data.displayName),
      phone: nullable(parsed.data.phone),
      job_title: nullable(parsed.data.jobTitle),
      locale: parsed.data.locale,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {})
    },
    { onConflict: "user_id" }
  );

  if (error) {
    profileRedirect(locale, { profile_error: "profile_update_failed" });
  }

  await admin.from("audit_logs").insert({
    clinic_id: staffContext.clinic.id,
    actor_id: staffContext.user.id,
    action: "user_profile_updated",
    entity_type: "user_profiles",
    entity_id: staffContext.user.id,
    payload_json: {
      source: "self_profile",
      fields: {
        full_name: true,
        display_name: Boolean(parsed.data.displayName),
        phone: Boolean(parsed.data.phone),
        job_title: Boolean(parsed.data.jobTitle),
        locale: parsed.data.locale,
        avatar_url: Boolean(avatarUrl)
      }
    }
  });

  revalidatePath("/profile");
  revalidatePath("/settings");
  profileRedirect(locale, { profile_status: "saved" });
}

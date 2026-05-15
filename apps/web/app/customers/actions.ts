"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  hasClinicPermission,
  normalizeLocale,
  type StaffRole,
  type SupportedLocale
} from "@petcura/shared";
import { ownerProfileSchema } from "@petcura/validation";
import { requireStaffContext } from "@/lib/auth/staff";
import {
  hasUsableProfileImage,
  uploadProfileImage
} from "@/lib/profile-media";
import { createAdminClient } from "@/lib/supabase/admin";

function customersRedirect(
  locale: SupportedLocale,
  params: Record<string, string>,
  ownerId?: string,
  returnTo?: string
): never {
  if (
    returnTo &&
    (returnTo.startsWith("/customers/") || returnTo.startsWith("/directory"))
  ) {
    const searchParams = new URLSearchParams({ lang: locale, ...params });
    redirect(`${returnTo}?${searchParams.toString()}`);
  }

  // Remap legacy customers_* keys onto the unified directory_* keys so the
  // new /directory route renders the same status/error surface.
  const directoryParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (key === "customers_status") {
      directoryParams.directory_status = value;
    } else if (key === "customers_error") {
      directoryParams.directory_error = value;
    } else {
      directoryParams[key] = value;
    }
  }

  const searchParams = new URLSearchParams({
    lang: locale,
    tab: "owners",
    ...directoryParams
  });
  if (ownerId) searchParams.set("id", ownerId);

  redirect(`/directory?${searchParams.toString()}`);
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

export async function updateCustomerProfile(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const returnTo = getString(formData, "returnTo");
  const staffContext = await requireStaffContext(locale, "/customers");
  const actorRole = staffContext.membership.role as StaffRole;

  if (!hasClinicPermission(actorRole, "customers:manage")) {
    customersRedirect(locale, { customers_error: "forbidden" }, undefined, returnTo);
  }

  const parsed = ownerProfileSchema.safeParse({
    ownerId: getString(formData, "ownerId"),
    name: getString(formData, "name"),
    phone: getString(formData, "phone"),
    email: getString(formData, "email"),
    preferredLanguage: getString(formData, "preferredLanguage") || locale,
    notes: getString(formData, "notes")
  });

  if (!parsed.success) {
    customersRedirect(locale, { customers_error: "invalid_profile" }, undefined, returnTo);
  }

  const admin = createAdminClient();
  const { data: owner, error: ownerError } = await admin
    .from("owners")
    .select("id, clinic_id, phone")
    .eq("clinic_id", staffContext.clinic.id)
    .eq("id", parsed.data.ownerId)
    .maybeSingle();

  if (ownerError || !owner) {
    customersRedirect(locale, { customers_error: "not_found" }, undefined, returnTo);
  }

  const photo = getPhoto(formData);
  let photoUrl: string | undefined;

  if (photo) {
    try {
      photoUrl = await uploadProfileImage({
        clinicId: staffContext.clinic.id,
        entity: "owners",
        entityId: owner.id,
        file: photo
      });
    } catch {
      customersRedirect(locale, { customers_error: "photo_upload_failed" }, owner.id, returnTo);
    }
  }

  const { error } = await admin
    .from("owners")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: nullable(parsed.data.email),
      preferred_language: parsed.data.preferredLanguage,
      notes: nullable(parsed.data.notes),
      ...(photoUrl ? { photo_url: photoUrl } : {})
    })
    .eq("clinic_id", staffContext.clinic.id)
    .eq("id", owner.id);

  if (error) {
    customersRedirect(locale, { customers_error: "profile_update_failed" }, owner.id, returnTo);
  }

  await admin.from("audit_logs").insert({
    clinic_id: staffContext.clinic.id,
    actor_id: staffContext.user.id,
    action: "owner_profile_updated",
    entity_type: "owners",
    entity_id: owner.id,
    payload_json: {
      source: "customer_center",
      old_phone: owner.phone,
      new_phone: parsed.data.phone,
      avatar_url: Boolean(photoUrl)
    }
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${owner.id}`);
  revalidatePath("/directory");
  customersRedirect(locale, { customers_status: "saved" }, owner.id, returnTo);
}

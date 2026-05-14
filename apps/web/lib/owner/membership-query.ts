export const ownerMembershipSelect =
  "clinic_id, owner_id, joined_at, clinics(id, name, slug, timezone, locale), owners!owner_user_memberships_clinic_id_owner_id_fkey(id, name, email, phone, preferred_language, photo_url)";

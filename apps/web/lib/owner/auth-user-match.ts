import { createHash } from "node:crypto";
import type { User } from "@supabase/supabase-js";

const internalOwnerEmailDomain = "owner-auth.petcura.local";

function phoneComparable(value: unknown) {
  if (typeof value !== "string") return null;
  const withoutChannelPrefix = value.replace(/^whatsapp:/i, "").trim();
  const digits = withoutChannelPrefix.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

function phoneCandidates(user: User) {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;

  return [
    user.phone,
    user.new_phone,
    metadata.phone,
    metadata.phone_number,
    metadata.petcura_owner_phone,
    ...(user.identities ?? []).flatMap((identity) => {
      const data = (identity.identity_data ?? {}) as Record<string, unknown>;
      return [
        identity.id,
        data.phone,
        data.phone_number,
        data.petcura_owner_phone,
        data.sub
      ];
    })
  ];
}

export function ownerAuthEmailForPhone(phone: string) {
  const comparable = phoneComparable(phone) ?? phone.trim();
  const digest = createHash("sha256")
    .update(comparable)
    .digest("hex")
    .slice(0, 32);

  return `owner-${digest}@${internalOwnerEmailDomain}`;
}

export function authUserMatchesPhone(user: User, phone: string) {
  const target = phoneComparable(phone);
  if (!target) return false;

  return phoneCandidates(user).some(
    (candidate) => phoneComparable(candidate) === target
  );
}

export function authUserMatchesEmail(user: User, email: string) {
  return user.email?.toLowerCase() === email.toLowerCase();
}

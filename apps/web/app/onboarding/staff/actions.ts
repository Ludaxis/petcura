"use server";

import { redirect } from "next/navigation";
import { normalizeLocale, withLocale } from "@petcura/shared";
import { requireStaffContext } from "@/lib/auth/staff";
import {
  markOnboardingStep,
  CLINIC_STAFF_REQUIRED_STEPS
} from "@/lib/auth/onboarding-progress";
import {
  normalizeRoutingRole,
  resolvePostLoginDestination
} from "@/lib/auth/post-login-router";

const PUSH_OPTIONS = ["off", "urgent", "all"] as const;
const EMAIL_OPTIONS = ["off", "daily", "weekly"] as const;

type PushPref = (typeof PUSH_OPTIONS)[number];
type EmailPref = (typeof EMAIL_OPTIONS)[number];

function parsePush(value: FormDataEntryValue | null): PushPref {
  return PUSH_OPTIONS.includes(value as PushPref)
    ? (value as PushPref)
    : "urgent";
}

function parseEmail(value: FormDataEntryValue | null): EmailPref {
  return EMAIL_OPTIONS.includes(value as EmailPref)
    ? (value as EmailPref)
    : "daily";
}

export async function completeStaffOnboarding(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const ctx = await requireStaffContext(locale, "/onboarding/staff");
  const fullName = String(formData.get("name") ?? "").trim().slice(0, 200);
  const pushPref = parsePush(formData.get("push"));
  const emailPref = parseEmail(formData.get("email"));

  await markOnboardingStep({
    actorKind: "clinic_staff",
    actorId: ctx.user.id,
    clinicId: ctx.clinic.id,
    step: "profile_complete",
    status: "done",
    metadata: { full_name: fullName }
  });
  await markOnboardingStep({
    actorKind: "clinic_staff",
    actorId: ctx.user.id,
    clinicId: ctx.clinic.id,
    step: "notifications_set",
    status: "done",
    metadata: { push: pushPref, email: emailPref }
  });

  // Mark all required staff steps complete and redirect via the router.
  void CLINIC_STAFF_REQUIRED_STEPS;
  const { destination } = resolvePostLoginDestination({
    actor: {
      kind: "clinic_staff",
      userId: ctx.user.id,
      clinicId: ctx.clinic.id,
      role: normalizeRoutingRole(
        ctx.membership.role as Parameters<typeof normalizeRoutingRole>[0]
      ),
      firstRun: false
    },
    nextParam: null,
    lastVisitedCookie: null
  });
  redirect(withLocale(destination, locale));
}

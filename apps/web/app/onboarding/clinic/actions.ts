"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeLocale, type SupportedLocale } from "@petcura/shared";
import { requireStaffContext } from "@/lib/auth/staff";
import { withLocale } from "@petcura/shared";
import {
  CLINIC_OWNER_REQUIRED_STEPS,
  loadOnboardingProgress,
  markOnboardingStep,
  type ClinicOwnerStep
} from "@/lib/auth/onboarding-progress";
import { fireActivationEvent } from "@/lib/auth/activation-events";

function isClinicOwnerStep(value: string): value is ClinicOwnerStep {
  return (CLINIC_OWNER_REQUIRED_STEPS as readonly string[]).includes(value);
}

async function getActorContext(locale: SupportedLocale) {
  return requireStaffContext(locale, "/onboarding/clinic");
}

export async function markChecklistStepDone(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const step = String(formData.get("step") ?? "");
  if (!isClinicOwnerStep(step)) {
    redirect(withLocale("/onboarding/clinic", locale));
  }
  const ctx = await getActorContext(locale);
  await markOnboardingStep({
    actorKind: "clinic_owner",
    actorId: ctx.user.id,
    clinicId: ctx.clinic.id,
    step,
    status: "done"
  });
  if (step === "connect_whatsapp") {
    await fireActivationEvent({
      event: "clinic_connected_whatsapp",
      actorId: ctx.user.id,
      clinicId: ctx.clinic.id
    });
  }

  // If all required steps are resolved, route to /inbox.
  const rows = await loadOnboardingProgress({
    actorKind: "clinic_owner",
    actorId: ctx.user.id,
    clinicId: ctx.clinic.id
  });
  const resolved = new Set(
    rows.filter((r) => r.status === "done" || r.status === "skipped").map((r) => r.step)
  );
  // The freshly-marked step may not be in the snapshot yet (depending on the
  // adapter); fold it in.
  resolved.add(step);
  const allResolved = CLINIC_OWNER_REQUIRED_STEPS.every((s) => resolved.has(s));
  if (allResolved) {
    redirect(withLocale("/inbox?onboarded=1", locale));
  }
  revalidatePath("/onboarding/clinic");
  redirect(withLocale("/onboarding/clinic", locale));
}

export async function skipChecklistStep(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const step = String(formData.get("step") ?? "");
  if (!isClinicOwnerStep(step)) {
    redirect(withLocale("/onboarding/clinic", locale));
  }
  const ctx = await getActorContext(locale);
  await markOnboardingStep({
    actorKind: "clinic_owner",
    actorId: ctx.user.id,
    clinicId: ctx.clinic.id,
    step,
    status: "skipped"
  });
  revalidatePath("/onboarding/clinic");
  redirect(withLocale("/onboarding/clinic", locale));
}

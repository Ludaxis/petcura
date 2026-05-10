"use server";

import { intakeRequestSchema } from "@petcura/validation";
import { createOwnerRequest } from "@/lib/intake/create-owner-request";

export type IntakeFormState = {
  ok: boolean;
  caseId?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function submitOwnerIntake(
  _previousState: IntakeFormState,
  formData: FormData
): Promise<IntakeFormState> {
  const parsed = intakeRequestSchema.safeParse({
    clinicSlug: formData.get("clinicSlug"),
    ownerName: formData.get("ownerName"),
    phone: formData.get("phone"),
    petName: formData.get("petName"),
    petSpecies: formData.get("petSpecies"),
    category: formData.get("category"),
    message: formData.get("message"),
    preferredLanguage: formData.get("preferredLanguage")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "validation_error",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const result = await createOwnerRequest({
    ...parsed.data,
    channel: "web"
  });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    caseId: result.caseId
  };
}

import "server-only";

/**
 * Typed adapter over the (not-yet-existing) `onboarding_progress` table.
 *
 * Codex will implement the real reads/writes per
 * `docs/contracts/onboarding-progress-table.md`. Until then, the adapter
 * returns safe defaults so the frontend compiles and behaves predictably:
 *
 * - `loadOnboardingProgress` returns an empty array (every step "todo").
 * - `loadActorFirstRunSignal` returns `{ firstRun: true }` for any actor.
 * - `markOnboardingStep` no-ops with a development-mode console.warn.
 *
 * Replace this module's body — not its signatures — when the schema lands.
 */

export type ClinicOwnerStep =
  | "connect_whatsapp"
  | "choose_pms"
  | "invite_teammate"
  | "quiet_hours"
  | "test_request";

export type ClinicStaffStep = "profile_complete" | "notifications_set";

export type OwnerStep = "welcome_dismissed";

export type OnboardingActorKind = "clinic_owner" | "clinic_staff" | "owner";

export type OnboardingProgressRow = {
  step: string;
  status: "todo" | "done" | "skipped";
  completedAt: string | null;
};

export type LoadProgressArgs = {
  actorKind: OnboardingActorKind;
  actorId: string;
  clinicId?: string;
};

export type MarkStepArgs = {
  actorKind: OnboardingActorKind;
  actorId: string;
  clinicId?: string;
  step: string;
  status: "todo" | "done" | "skipped";
  metadata?: Record<string, unknown>;
};

export const CLINIC_OWNER_REQUIRED_STEPS: ReadonlyArray<ClinicOwnerStep> = [
  "connect_whatsapp",
  "choose_pms",
  "invite_teammate",
  "quiet_hours",
  "test_request"
];

export const CLINIC_STAFF_REQUIRED_STEPS: ReadonlyArray<ClinicStaffStep> = [
  "profile_complete",
  "notifications_set"
];

export const OWNER_REQUIRED_STEPS: ReadonlyArray<OwnerStep> = [
  "welcome_dismissed"
];

// TODO(codex): replace stub with Supabase query against `onboarding_progress`.
// See docs/contracts/onboarding-progress-table.md.
export async function loadOnboardingProgress(
  _args: LoadProgressArgs
): Promise<OnboardingProgressRow[]> {
  return [];
}

// TODO(codex): replace stub with upsert into `onboarding_progress`.
export async function markOnboardingStep(args: MarkStepArgs): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(
      "[onboarding-progress] stub markOnboardingStep — replace once Codex schema lands",
      args
    );
  }
}

// TODO(codex): derive from `onboarding_summary.is_first_run`.
export async function loadActorFirstRunSignal(args: {
  actorKind: "clinic_staff" | "owner";
  actorId: string;
}): Promise<{ firstRun: boolean }> {
  void args;
  return { firstRun: true };
}

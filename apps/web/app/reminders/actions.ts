"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeLocale, type ReminderStatus } from "@petcura/shared";
import { reminderStatusActionSchema } from "@petcura/validation";
import { requireStaffContext } from "@/lib/auth/staff";
import { hasStaffPermission } from "@/lib/auth/permissions";
import { isReminderFilter, type ReminderFilter } from "@/lib/reminders";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function remindersPath(
  locale: string,
  filter: ReminderFilter,
  params?: Record<string, string>
) {
  const searchParams = new URLSearchParams({
    lang: locale,
    status: filter,
    ...(params ?? {})
  });

  return `/reminders?${searchParams.toString()}`;
}

function redirectToReminders(
  locale: string,
  filter: ReminderFilter,
  params?: Record<string, string>
): never {
  redirect(remindersPath(locale, filter, params));
}

function patchForStatus(status: "acknowledged" | "completed" | "cancelled") {
  const now = new Date().toISOString();
  if (status === "acknowledged") {
    return { status, acknowledged_at: now } satisfies Partial<{
      status: ReminderStatus;
      acknowledged_at: string;
    }>;
  }
  if (status === "completed") {
    return { status, completed_at: now } satisfies Partial<{
      status: ReminderStatus;
      completed_at: string;
    }>;
  }
  return { status } satisfies Partial<{ status: ReminderStatus }>;
}

export async function updateReminderStatus(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const rawFilter = getString(formData, "filter");
  const filter: ReminderFilter = isReminderFilter(rawFilter) ? rawFilter : "all";
  const parsed = reminderStatusActionSchema.safeParse({
    reminderId: getString(formData, "reminderId"),
    status: getString(formData, "status")
  });

  if (!parsed.success) {
    redirectToReminders(locale, filter, { action_error: "reminder" });
  }

  const { reminderId, status } = parsed.data;
  const staffContext = await requireStaffContext(locale, "/reminders");
  if (!hasStaffPermission(staffContext, "reminders:manage")) {
    redirectToReminders(locale, filter, { action_error: "reminder" });
  }
  const { data: reminder, error: loadError } = await staffContext.supabase
    .from("reminders")
    .select("id, request_id, status")
    .eq("clinic_id", staffContext.clinic.id)
    .eq("id", reminderId)
    .maybeSingle();

  if (loadError) {
    throw new Error(`Could not load reminder: ${loadError.message}`);
  }

  if (!reminder) {
    redirectToReminders(locale, filter, { action_error: "reminder" });
  }

  if (reminder.status === status) {
    redirectToReminders(locale, filter);
  }

  const { error: updateError } = await staffContext.supabase
    .from("reminders")
    .update(patchForStatus(status))
    .eq("clinic_id", staffContext.clinic.id)
    .eq("id", reminderId);

  if (updateError) {
    throw new Error(`Could not update reminder: ${updateError.message}`);
  }

  if (reminder.request_id) {
    const { error: eventError } = await staffContext.supabase
      .from("request_events")
      .insert({
        clinic_id: staffContext.clinic.id,
        request_id: reminder.request_id,
        actor_type: "staff",
        actor_id: staffContext.user.id,
        event_type: `reminder_${status}`,
        payload_json: {
          reminder_id: reminderId,
          from: reminder.status,
          to: status,
          staff_id: staffContext.membership.id
        }
      });

    if (eventError) {
      throw new Error(`Could not write reminder event: ${eventError.message}`);
    }

    revalidatePath(`/requests/${reminder.request_id}`);
  }

  revalidatePath("/reminders");
  revalidatePath("/inbox");
  redirectToReminders(locale, filter, { action_status: "reminder_updated" });
}

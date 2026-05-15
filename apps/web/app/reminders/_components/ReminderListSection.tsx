import {
  createTranslator,
  type ReminderStatus,
  type SupportedLocale
} from "@petcura/shared";
import { listReminders, type ReminderFilter } from "@/lib/reminders";
import type { createClient } from "@/lib/supabase/server";
import { ReminderRow } from "./ReminderRow";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ReminderListSectionProps = {
  clinicId: string;
  filter: ReminderFilter;
  locale: SupportedLocale;
  supabase: ServerSupabaseClient;
};

const actionableStatuses = new Set<ReminderStatus>([
  "scheduled",
  "sent",
  "acknowledged",
  "missed"
]);

export async function ReminderListSection({
  clinicId,
  filter,
  locale,
  supabase
}: ReminderListSectionProps) {
  const t = createTranslator(locale);
  const rows = await listReminders(supabase, clinicId, filter);
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });
  const formatDateTime = (iso: string) =>
    dateTimeFormatter.format(new Date(iso));

  if (rows.length === 0) {
    return (
      <div className="mx-auto mt-8 max-w-xl rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-6 text-center">
        <h2 className="text-[18px] font-semibold">{t("reminders.empty")}</h2>
        <p className="mt-2 text-[13px] leading-5 text-[var(--muted)]">
          {t("reminders.emptyBody")}
        </p>
      </div>
    );
  }

  return (
    <ol className="mx-auto flex max-w-6xl flex-col gap-2">
      {rows.map((reminder) => (
        <ReminderRow
          key={reminder.id}
          reminder={reminder}
          locale={locale}
          filter={filter}
          dueAtLabel={formatDateTime(reminder.dueAt)}
          actionable={actionableStatuses.has(reminder.status)}
          labels={{
            pet: t("reminders.pet"),
            owner: t("reminders.owner"),
            due: t("reminders.due"),
            channel: t("request.reminder.channel"),
            openRequest: t("reminders.openRequest"),
            markAcknowledged: t("reminders.markAcknowledged"),
            markCompleted: t("reminders.markCompleted"),
            cancel: t("reminders.cancel")
          }}
        />
      ))}
    </ol>
  );
}

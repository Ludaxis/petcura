import {
  getReminderTypeLabel,
  normalizeLocale,
  type ReminderStatus,
  type ReminderType,
  type SupportedLocale
} from "@petcura/shared";

export const reminderDispatchDefaults: {
  batchSize: number;
  maxAttempts: number;
  retryAfterMs: number;
} = {
  batchSize: 25,
  maxAttempts: 3,
  retryAfterMs: 4 * 60 * 1000
};

export type ReminderMessageInput = {
  clinicName: string;
  petName: string;
  title: string;
  body: string | null;
  type: ReminderType;
  ownerLanguage: string | null;
};

const reminderMessageCopy: Record<
  SupportedLocale,
  {
    heading: (clinicName: string) => string;
    pet: string;
    type: string;
    reply: string;
  }
> = {
  en: {
    heading: (clinicName) => `Reminder from ${clinicName}`,
    pet: "Pet",
    type: "Type",
    reply: "Reply here if you have questions or need to reschedule."
  },
  et: {
    heading: (clinicName) => `Meeldetuletus kliinikult ${clinicName}`,
    pet: "Lemmikloom",
    type: "Tüüp",
    reply: "Vastake siia, kui teil on küsimusi või soovite aega muuta."
  },
  ru: {
    heading: (clinicName) => `Напоминание от клиники ${clinicName}`,
    pet: "Питомец",
    type: "Тип",
    reply:
      "Ответьте здесь, если у вас есть вопросы или нужно перенести время."
  }
};

export function getReminderRetryCutoff(
  now: Date,
  retryAfterMs = reminderDispatchDefaults.retryAfterMs
) {
  return new Date(now.getTime() - retryAfterMs);
}

export function shouldRetryReminder(
  lastSendAttemptAt: string | null,
  now: Date,
  retryAfterMs = reminderDispatchDefaults.retryAfterMs
) {
  if (!lastSendAttemptAt) return true;

  return new Date(lastSendAttemptAt).getTime() <= getReminderRetryCutoff(
    now,
    retryAfterMs
  ).getTime();
}

export function getFailureStatus(
  sendAttempts: number,
  maxAttempts = reminderDispatchDefaults.maxAttempts
): ReminderStatus {
  return sendAttempts >= maxAttempts ? "missed" : "scheduled";
}

export function buildReminderWhatsAppBody(input: ReminderMessageInput) {
  const locale = normalizeLocale(input.ownerLanguage);
  const copy = reminderMessageCopy[locale];
  const lines = [
    copy.heading(input.clinicName),
    "",
    input.title,
    `${copy.pet}: ${input.petName}`,
    `${copy.type}: ${getReminderTypeLabel(input.type, locale)}`,
    input.body ? "" : null,
    input.body,
    "",
    copy.reply
  ].filter((line): line is string => typeof line === "string");

  return lines.join("\n");
}

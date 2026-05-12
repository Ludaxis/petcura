import {
  getRequestCategoryLabel,
  type MessageSender,
  type RequestCategory,
  type RequestChannel,
  type SupportedLocale
} from "./i18n";

export type RequestStatus =
  | "new"
  | "waiting_staff"
  | "waiting_owner"
  | "resolved";

export type RequestUrgency = "low" | "medium" | "high";
export type InboxView = RequestStatus | "urgent";

export const requestStatusColumns = [
  { value: "new", labelKey: "new" },
  { value: "waiting_staff", labelKey: "waiting_staff" },
  { value: "waiting_owner", labelKey: "waiting_owner" },
  { value: "resolved", labelKey: "resolved" }
] as const;

export const inboxViewColumns = [
  { value: "new", labelKey: "new" },
  { value: "urgent", labelKey: "urgent" },
  { value: "waiting_staff", labelKey: "waiting_staff" },
  { value: "waiting_owner", labelKey: "waiting_owner" },
  { value: "resolved", labelKey: "resolved" }
] as const;

export function getInboxViewForRequest(request: {
  status: RequestStatus;
  urgency: RequestUrgency;
}): InboxView {
  if (request.status !== "resolved" && request.urgency === "high") {
    return "urgent";
  }

  return request.status;
}

export const requestCategories = [
  { value: "medical_question" },
  { value: "refill" },
  { value: "appointment" },
  { value: "follow_up" },
  { value: "admin" }
] as const;

export const reminderTypes = [
  { value: "follow_up" },
  { value: "recheck" },
  { value: "vaccination" },
  { value: "refill" }
] as const;

export const reminderStatuses = [
  { value: "scheduled" },
  { value: "sent" },
  { value: "acknowledged" },
  { value: "completed" },
  { value: "missed" },
  { value: "cancelled" }
] as const;

export function getLocalizedRequestCategories(locale: SupportedLocale) {
  return requestCategories.map((category) => ({
    value: category.value,
    label: getRequestCategoryLabel(category.value, locale)
  }));
}

export const pilotMetrics = {
  callReductionTarget: "25%",
  responseTimeTarget: "<=4h",
  categorizedTarget: "80%",
  aiSummaryAcceptTarget: "70%"
} as const;

export const demoRequests = [
  {
    id: "demo-luna",
    status: "new",
    urgency: "high",
    category: "medical_question",
    channel: "whatsapp",
    petName: "Luna",
    species: "Cat",
    ownerName: "Marta Tamm",
    translationAvailable: true,
    summary:
      "Luna has not eaten for 24 hours, is hiding, and seems lethargic. Owner reports normal water intake and no vomiting so far.",
    messages: [
      {
        id: "m1",
        sender: "owner",
        time: "09:12",
        body: "My cat Luna has not eaten since yesterday and she is hiding under the bed."
      },
      {
        id: "m2",
        sender: "ai",
        time: "09:13",
        body: "How long has this been happening, and has Luna vomited or stopped drinking water?"
      },
      {
        id: "m3",
        sender: "owner",
        time: "09:16",
        body: "About 24 hours. She drinks a little. No vomiting."
      }
    ]
  },
  {
    id: "demo-bruno",
    status: "waiting_staff",
    urgency: "medium",
    category: "refill",
    channel: "web",
    petName: "Bruno",
    species: "Dog",
    ownerName: "Ivan Petrov",
    translationAvailable: false,
    summary:
      "Owner requests refill for ongoing allergy medication. Staff should verify prescription status before approval.",
    messages: [
      {
        id: "m1",
        sender: "owner",
        time: "10:04",
        body: "Can we refill Bruno's allergy medicine this week?"
      }
    ]
  },
  {
    id: "demo-milo",
    status: "waiting_owner",
    urgency: "low",
    category: "appointment",
    channel: "whatsapp",
    petName: "Milo",
    species: "Rabbit",
    ownerName: "Katrin Saar",
    translationAvailable: true,
    summary:
      "Clinic offered two appointment slots for a routine checkup. Waiting for owner confirmation.",
    messages: [
      {
        id: "m1",
        sender: "staff",
        time: "11:30",
        body: "We can see Milo tomorrow at 10:30 or Friday at 14:00. Which works better?"
      }
    ]
  }
] satisfies Array<{
  id: string;
  status: RequestStatus;
  urgency: RequestUrgency;
  category: RequestCategory;
  channel: RequestChannel;
  petName: string;
  species: string;
  ownerName: string;
  translationAvailable: boolean;
  summary: string;
  messages: Array<{
    id: string;
    sender: MessageSender;
    time: string;
    body: string;
  }>;
}>;

export type { Database, Json } from "./database.types";
export * from "./permissions";
export * from "./i18n";

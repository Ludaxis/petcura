export type RequestStatus =
  | "new"
  | "urgent"
  | "waiting_staff"
  | "waiting_owner"
  | "resolved";

export type RequestUrgency = "low" | "medium" | "high";

export const requestStatusColumns = [
  { value: "new", label: "New" },
  { value: "urgent", label: "Urgent" },
  { value: "waiting_staff", label: "Waiting Staff" },
  { value: "waiting_owner", label: "Waiting Owner" },
  { value: "resolved", label: "Resolved" }
] as const;

export const requestCategories = [
  { value: "medical_question", label: "Medical question" },
  { value: "refill", label: "Refill" },
  { value: "appointment", label: "Appointment" },
  { value: "follow_up", label: "Follow-up" },
  { value: "admin", label: "Admin" }
] as const;

export const pilotMetrics = {
  callReductionTarget: "25%",
  responseTimeTarget: "<=4h",
  categorizedTarget: "80%",
  aiSummaryAcceptTarget: "70%"
} as const;

export const demoRequests = [
  {
    id: "demo-luna",
    status: "urgent",
    urgency: "high",
    category: "medical_question",
    channel: "WhatsApp",
    petName: "Luna",
    species: "Cat",
    ownerName: "Marta Tamm",
    translationAvailable: true,
    summary:
      "Luna has not eaten for 24 hours, is hiding, and seems lethargic. Owner reports normal water intake and no vomiting so far.",
    messages: [
      {
        id: "m1",
        sender: "Owner",
        time: "09:12",
        body: "My cat Luna has not eaten since yesterday and she is hiding under the bed."
      },
      {
        id: "m2",
        sender: "AI intake",
        time: "09:13",
        body: "How long has this been happening, and has Luna vomited or stopped drinking water?"
      },
      {
        id: "m3",
        sender: "Owner",
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
    channel: "Web",
    petName: "Bruno",
    species: "Dog",
    ownerName: "Ivan Petrov",
    translationAvailable: false,
    summary:
      "Owner requests refill for ongoing allergy medication. Staff should verify prescription status before approval.",
    messages: [
      {
        id: "m1",
        sender: "Owner",
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
    channel: "WhatsApp",
    petName: "Milo",
    species: "Rabbit",
    ownerName: "Katrin Saar",
    translationAvailable: true,
    summary:
      "Clinic offered two appointment slots for a routine checkup. Waiting for owner confirmation.",
    messages: [
      {
        id: "m1",
        sender: "Staff",
        time: "11:30",
        body: "We can see Milo tomorrow at 10:30 or Friday at 14:00. Which works better?"
      }
    ]
  }
] satisfies Array<{
  id: string;
  status: RequestStatus;
  urgency: RequestUrgency;
  category: string;
  channel: string;
  petName: string;
  species: string;
  ownerName: string;
  translationAvailable: boolean;
  summary: string;
  messages: Array<{
    id: string;
    sender: string;
    time: string;
    body: string;
  }>;
}>;

export type { Database } from "./database.types";

export const messageDeliveryStatuses = [
  "queued",
  "sent",
  "delivered",
  "read",
  "acknowledged",
  "failed"
] as const;

export type MessageDeliveryStatus = (typeof messageDeliveryStatuses)[number];

export type MessageDeliveryEventLike = {
  id: string;
  status: string;
  provider: string | null;
  created_at: string;
};

export function normalizeDeliveryStatus(
  status: string | null | undefined
): MessageDeliveryStatus | null {
  if (!status) return null;

  const normalized = status.toLowerCase();
  return messageDeliveryStatuses.includes(
    normalized as MessageDeliveryStatus
  )
    ? (normalized as MessageDeliveryStatus)
    : null;
}

export function getLatestDeliveryEvent<T extends MessageDeliveryEventLike>(
  events: T[]
) {
  return [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0] ?? null;
}

import { normalizeLocale, type SupportedLocale } from "@petcura/shared";

export type TwilioDeliveryStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "acknowledged"
  | "failed";

export type TwilioWhatsAppPayload = {
  from: string;
  to: string;
  body: string;
  messageSid?: string | undefined;
  profileName?: string | undefined;
  media: TwilioWhatsAppMedia[];
  preferredLanguage: SupportedLocale;
};

export type TwilioWhatsAppMedia = {
  index: number;
  url: string;
  contentType: string;
};

export type TwilioMessageStatusPayload = {
  messageSid: string;
  rawStatus: string;
  status: TwilioDeliveryStatus;
  eventId: string;
  eventType?: string | undefined;
  errorCode?: string | undefined;
  channelStatusMessage?: string | undefined;
};

export function stripTwilioWhatsAppPrefix(value: string) {
  return value.replace(/^whatsapp:/i, "").trim();
}

export function formatTwilioWhatsAppAddress(value: string) {
  return `whatsapp:${stripTwilioWhatsAppPrefix(value)}`;
}

export function mapTwilioDeliveryStatus(
  status: string | null | undefined
): TwilioDeliveryStatus {
  const normalized = status?.toLowerCase();

  if (normalized === "delivered") return "delivered";
  if (normalized === "read") return "read";
  if (normalized === "sent" || normalized === "sending") return "sent";
  if (normalized === "failed" || normalized === "undelivered") return "failed";

  return "queued";
}

export function getTwilioDeliveryEventId(
  messageSid: string,
  rawStatus: string,
  eventType?: string | undefined,
  errorCode?: string | undefined
) {
  return [messageSid, rawStatus || "unknown", eventType, errorCode]
    .filter(Boolean)
    .join(":");
}

export function formDataToRecord(params: URLSearchParams) {
  const record: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    record[key] = value;
  }

  return record;
}

export function getTwilioWebhookUrl(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? requestUrl.protocol.replace(":", "");

  if (!host) {
    return request.url;
  }

  return `${protocol}://${host}${requestUrl.pathname}${requestUrl.search}`;
}

export function parseTwilioWhatsAppPayload(
  params: URLSearchParams,
  fallbackLocale: string
): TwilioWhatsAppPayload {
  const from = stripTwilioWhatsAppPrefix(params.get("From") ?? "");
  const to = stripTwilioWhatsAppPrefix(params.get("To") ?? "");
  const body = (params.get("Body") ?? "").trim();
  const messageSid =
    params.get("MessageSid") ?? params.get("SmsMessageSid") ?? undefined;
  const profileName = params.get("ProfileName")?.trim() || undefined;
  const mediaCount = Number.parseInt(params.get("NumMedia") ?? "0", 10);
  const media = Array.from(
    { length: Number.isFinite(mediaCount) && mediaCount > 0 ? mediaCount : 0 },
    (_, index) => {
      const url = params.get(`MediaUrl${index}`)?.trim() ?? "";
      const contentType =
        params.get(`MediaContentType${index}`)?.trim() ||
        "application/octet-stream";

      return url ? { index, url, contentType } : null;
    }
  ).filter((item): item is TwilioWhatsAppMedia => item !== null);
  const preferredLanguage = normalizeLocale(fallbackLocale);

  if (!from) {
    throw new Error("missing_from");
  }

  if (!to) {
    throw new Error("missing_to");
  }

  return {
    from,
    to,
    body,
    messageSid,
    profileName,
    media,
    preferredLanguage
  };
}

export function parseTwilioMessageStatusPayload(
  params: URLSearchParams
): TwilioMessageStatusPayload {
  const messageSid = params.get("MessageSid") ?? params.get("SmsSid") ?? "";
  const rawStatus =
    params.get("MessageStatus") ?? params.get("SmsStatus") ?? "";
  const eventType = params.get("EventType") ?? undefined;
  const errorCode = params.get("ErrorCode") ?? undefined;
  const channelStatusMessage = params.get("ChannelStatusMessage") ?? undefined;

  if (!messageSid) {
    throw new Error("missing_message_sid");
  }

  if (!rawStatus) {
    throw new Error("missing_message_status");
  }

  return {
    messageSid,
    rawStatus,
    status: mapTwilioDeliveryStatus(rawStatus),
    eventId: getTwilioDeliveryEventId(
      messageSid,
      rawStatus,
      eventType,
      errorCode
    ),
    eventType,
    errorCode,
    channelStatusMessage
  };
}

export function emptyTwimlResponse() {
  return new Response("<Response></Response>", {
    status: 200,
    headers: {
      "content-type": "text/xml; charset=utf-8"
    }
  });
}

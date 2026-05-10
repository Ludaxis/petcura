import { normalizeLocale, type SupportedLocale } from "@petcura/shared";

export type TwilioWhatsAppPayload = {
  from: string;
  to: string;
  body: string;
  messageSid?: string | undefined;
  profileName?: string | undefined;
  preferredLanguage: SupportedLocale;
};

export function stripTwilioWhatsAppPrefix(value: string) {
  return value.replace(/^whatsapp:/i, "").trim();
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
    preferredLanguage
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

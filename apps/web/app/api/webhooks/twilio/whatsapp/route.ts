import twilio from "twilio";
import { normalizeLocale } from "@petcura/shared";
import {
  createOwnerRequest,
  getClinicForOwnerChannel
} from "@/lib/intake/create-owner-request";
import {
  emptyTwimlResponse,
  formDataToRecord,
  getTwilioWebhookUrl,
  parseTwilioWhatsAppPayload
} from "@/lib/twilio/whatsapp";

export const runtime = "nodejs";

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}

function badRequest(message: string) {
  return new Response(message, { status: 400 });
}

function serverError(message: string) {
  return new Response(message, { status: 500 });
}

function getTwilioMediaStoragePath(
  messageSid: string | undefined,
  index: number
) {
  const messageKey = messageSid?.replace(/[^a-zA-Z0-9_-]/g, "") || "unknown";
  return `twilio/${messageKey}/${index}`;
}

export async function POST(request: Request) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!authToken) {
    return serverError("twilio_not_configured");
  }

  const signature = request.headers.get("x-twilio-signature");

  if (!signature) {
    return unauthorized();
  }

  const rawBody = await request.text();
  const params = new URLSearchParams(rawBody);
  const paramsRecord = formDataToRecord(params);
  const webhookUrl = getTwilioWebhookUrl(request);
  const isValid = twilio.validateRequest(
    authToken,
    signature,
    webhookUrl,
    paramsRecord
  );

  if (!isValid) {
    return unauthorized();
  }

  let payload: ReturnType<typeof parseTwilioWhatsAppPayload>;

  try {
    payload = parseTwilioWhatsAppPayload(params, "en");
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "bad_request");
  }

  let clinic: Awaited<ReturnType<typeof getClinicForOwnerChannel>>;

  try {
    clinic = await getClinicForOwnerChannel("whatsapp", payload.to);
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "clinic_error");
  }

  const result = await createOwnerRequest(
    {
      clinicSlug: clinic.slug,
      ownerName: payload.profileName ?? payload.from,
      phone: payload.from,
      petName: "Unknown pet",
      petSpecies: "unknown",
      category: "medical_question",
      message: payload.body,
      preferredLanguage: normalizeLocale(clinic.locale),
      channel: "whatsapp",
      channelExternalId: payload.from,
      externalMessageId: payload.messageSid,
      attachments: payload.media.map((media) => ({
        storagePath: getTwilioMediaStoragePath(payload.messageSid, media.index),
        mimeType: media.contentType,
        sizeBytes: 0,
        providerUrl: media.url
      }))
    },
    clinic
  );

  if (!result.ok) {
    return serverError(result.message);
  }

  return emptyTwimlResponse();
}

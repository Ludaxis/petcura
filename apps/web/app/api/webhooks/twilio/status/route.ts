import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  formDataToRecord,
  getTwilioWebhookUrl,
  parseTwilioMessageStatusPayload
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

function ok() {
  return new Response("ok", { status: 200 });
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

  let payload: ReturnType<typeof parseTwilioMessageStatusPayload>;

  try {
    payload = parseTwilioMessageStatusPayload(params);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "bad_request");
  }

  const admin = createAdminClient();
  const { data: message, error: messageError } = await admin
    .from("messages")
    .select("id, clinic_id, request_id")
    .eq("external_id", payload.messageSid)
    .maybeSingle();

  if (messageError) {
    return serverError(messageError.message);
  }

  if (!message) {
    return ok();
  }

  const deliveryPayload = {
    provider_status: payload.rawStatus,
    event_type: payload.eventType,
    error_code: payload.errorCode,
    channel_status_message: payload.channelStatusMessage
  };

  const { data: deliveryRows, error: deliveryError } = await admin
    .from("message_delivery_events")
    .upsert(
      {
        message_id: message.id,
        clinic_id: message.clinic_id,
        channel: "whatsapp",
        status: payload.status,
        provider: "twilio",
        external_event_id: payload.eventId,
        payload_json: deliveryPayload
      },
      { onConflict: "provider,external_event_id", ignoreDuplicates: true }
    )
    .select("id");

  if (deliveryError) {
    return serverError(deliveryError.message);
  }

  if (!deliveryRows || deliveryRows.length === 0) {
    return ok();
  }

  const { error: eventError } = await admin.from("request_events").insert({
    clinic_id: message.clinic_id,
    request_id: message.request_id,
    actor_type: "system",
    actor_id: null,
    event_type: `message_delivery_${payload.status}`,
    payload_json: {
      message_id: message.id,
      provider: "twilio",
      external_id: payload.messageSid,
      ...deliveryPayload
    }
  });

  if (eventError) {
    return serverError(eventError.message);
  }

  return ok();
}

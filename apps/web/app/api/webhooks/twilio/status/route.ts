import twilio from "twilio";
import {
  formDataToRecord,
  getTwilioWebhookUrl,
  parseTwilioMessageStatusPayload
} from "@/lib/twilio/whatsapp";
import { recordTwilioStatusCallback } from "@/lib/twilio/outbox";

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

  try {
    await recordTwilioStatusCallback({ payload });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : "status_error");
  }

  return ok();
}

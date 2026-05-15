import "server-only";

import twilio from "twilio";
import type { Database } from "@petcura/shared";
import { createClient } from "@/lib/supabase/server";
import {
  formatTwilioWhatsAppAddress,
  mapTwilioDeliveryStatus,
  type TwilioDeliveryStatus
} from "./whatsapp";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type ClinicChannelRow = Pick<
  Database["public"]["Tables"]["clinic_channels"]["Row"],
  "external_id"
>;

export type WhatsAppSendResult = {
  sid: string;
  rawStatus: string;
  status: TwilioDeliveryStatus;
};

export type WhatsAppOwnerMessageInput = {
  supabase: ServerSupabaseClient;
  clinicId: string;
  toPhone: string;
  body: string;
};

export type TwilioOutboundChannel = "whatsapp" | "sms";

export type TwilioOwnerMessageInput = WhatsAppOwnerMessageInput & {
  channel: TwilioOutboundChannel;
};

function getTwilioStatusCallbackUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    return undefined;
  }

  try {
    return new URL("/api/webhooks/twilio/status", appUrl).toString();
  } catch {
    return undefined;
  }
}

export function requireTwilioCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("twilio_not_configured");
  }

  return { accountSid, authToken };
}

export async function resolveClinicWhatsAppSender(
  supabase: ServerSupabaseClient,
  clinicId: string
) {
  return resolveClinicTwilioSender(supabase, clinicId, "whatsapp");
}

export async function resolveClinicSmsSender(
  supabase: ServerSupabaseClient,
  clinicId: string
) {
  return resolveClinicTwilioSender(supabase, clinicId, "sms");
}

async function resolveClinicTwilioSender(
  supabase: ServerSupabaseClient,
  clinicId: string,
  channel: TwilioOutboundChannel
) {
  const { data, error } = await supabase
    .from("clinic_channels")
    .select("external_id")
    .eq("clinic_id", clinicId)
    .eq("channel", channel)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not resolve ${channel} sender: ${error.message}`);
  }

  const channelRow = data as ClinicChannelRow | null;
  if (channelRow?.external_id) {
    return channelRow.external_id;
  }

  return channel === "sms"
    ? process.env.TWILIO_SMS_FROM ?? null
    : process.env.TWILIO_WHATSAPP_FROM ?? null;
}

export async function sendTwilioOwnerMessage({
  supabase,
  clinicId,
  toPhone,
  body,
  channel
}: TwilioOwnerMessageInput): Promise<WhatsAppSendResult> {
  const { accountSid, authToken } = requireTwilioCredentials();
  const from =
    channel === "sms"
      ? await resolveClinicSmsSender(supabase, clinicId)
      : await resolveClinicWhatsAppSender(supabase, clinicId);

  if (!from) {
    throw new Error(`twilio_${channel}_sender_not_configured`);
  }

  const statusCallback = getTwilioStatusCallbackUrl();
  const client = twilio(accountSid, authToken);
  const message = await client.messages.create({
    body,
    from: channel === "sms" ? from : formatTwilioWhatsAppAddress(from),
    to: channel === "sms" ? toPhone : formatTwilioWhatsAppAddress(toPhone),
    ...(statusCallback ? { statusCallback } : {})
  });
  const rawStatus = message.status ?? "queued";

  return {
    sid: message.sid,
    rawStatus,
    status: mapTwilioDeliveryStatus(rawStatus)
  };
}

export async function sendWhatsAppOwnerMessage(
  input: WhatsAppOwnerMessageInput
): Promise<WhatsAppSendResult> {
  return sendTwilioOwnerMessage({ ...input, channel: "whatsapp" });
}

export async function sendSmsOwnerMessage(
  input: WhatsAppOwnerMessageInput
): Promise<WhatsAppSendResult> {
  return sendTwilioOwnerMessage({ ...input, channel: "sms" });
}

export async function sendWhatsAppStaffMessage(
  input: WhatsAppOwnerMessageInput
) {
  return sendWhatsAppOwnerMessage(input);
}

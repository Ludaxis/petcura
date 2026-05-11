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

function requireTwilioCredentials() {
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
  const { data, error } = await supabase
    .from("clinic_channels")
    .select("external_id")
    .eq("clinic_id", clinicId)
    .eq("channel", "whatsapp")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not resolve WhatsApp sender: ${error.message}`);
  }

  const channel = data as ClinicChannelRow | null;
  return channel?.external_id ?? process.env.TWILIO_WHATSAPP_FROM ?? null;
}

export async function sendWhatsAppOwnerMessage({
  supabase,
  clinicId,
  toPhone,
  body
}: WhatsAppOwnerMessageInput): Promise<WhatsAppSendResult> {
  const { accountSid, authToken } = requireTwilioCredentials();
  const from = await resolveClinicWhatsAppSender(supabase, clinicId);

  if (!from) {
    throw new Error("twilio_sender_not_configured");
  }

  const statusCallback = getTwilioStatusCallbackUrl();
  const client = twilio(accountSid, authToken);
  const message = await client.messages.create({
    body,
    from: formatTwilioWhatsAppAddress(from),
    to: formatTwilioWhatsAppAddress(toPhone),
    ...(statusCallback ? { statusCallback } : {})
  });
  const rawStatus = message.status ?? "queued";

  return {
    sid: message.sid,
    rawStatus,
    status: mapTwilioDeliveryStatus(rawStatus)
  };
}

export async function sendWhatsAppStaffMessage(
  input: WhatsAppOwnerMessageInput
) {
  return sendWhatsAppOwnerMessage(input);
}

import { expect, test, type APIRequestContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";
import type { Database } from "@petcura/shared";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const defaultClinicSlug =
  process.env.PETCURA_DEFAULT_CLINIC_SLUG?.trim() || "alex-vet-demo";

function adminClient() {
  if (!supabaseUrl || !secretKey) {
    throw new Error("Missing Supabase env.");
  }

  return createClient<Database>(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

function paramsToRecord(params: URLSearchParams) {
  return Object.fromEntries(params.entries());
}

async function postSignedTwilioWebhook({
  request,
  baseURL,
  authToken,
  params
}: {
  request: APIRequestContext;
  baseURL: string;
  authToken: string;
  params: URLSearchParams;
}) {
  const webhookUrl = new URL("/api/webhooks/twilio/whatsapp", baseURL).toString();
  const signature = twilio.getExpectedTwilioSignature(
    authToken,
    webhookUrl,
    paramsToRecord(params)
  );

  return request.post(webhookUrl, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-twilio-signature": signature
    },
    data: params.toString()
  });
}

test("WhatsApp webhook appends owner replies to the active request idempotently", async ({
  request,
  baseURL
}) => {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  test.skip(
    !supabaseUrl || !secretKey || !authToken || !baseURL,
    "Supabase and Twilio webhook env is required for WhatsApp lifecycle regression."
  );

  const admin = adminClient();
  const unique = Date.now();
  const ownerPhone = `+3729${unique}`;
  const clinicPhone = `+1555${String(unique).slice(-7)}`;
  const ownerName = `WhatsApp Owner ${unique}`;
  const firstSid = `SM${unique}A`;
  const secondSid = `SM${unique}B`;
  let clinicId: string | undefined;
  let ownerId: string | undefined;

  try {
    const { data: clinic, error: clinicError } = await admin
      .from("clinics")
      .select("id")
      .eq("slug", defaultClinicSlug)
      .single();

    expect(clinicError).toBeNull();
    expect(clinic?.id).toBeTruthy();
    clinicId = clinic!.id;

    await admin.from("clinic_channels").upsert(
      {
        clinic_id: clinicId,
        channel: "whatsapp",
        external_id: clinicPhone,
        display_name: "E2E WhatsApp sender",
        is_active: true
      },
      { onConflict: "clinic_id,channel,external_id" }
    );

    const firstResponse = await postSignedTwilioWebhook({
      request,
      baseURL: baseURL!,
      authToken: authToken!,
      params: new URLSearchParams({
        From: `whatsapp:${ownerPhone}`,
        To: `whatsapp:${clinicPhone}`,
        Body: "My cat is vomiting this morning.",
        MessageSid: firstSid,
        ProfileName: ownerName
      })
    });

    expect(firstResponse.status()).toBe(200);

    const { data: owner, error: ownerError } = await admin
      .from("owners")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("phone", ownerPhone)
      .single();

    expect(ownerError).toBeNull();
    expect(owner?.id).toBeTruthy();
    ownerId = owner!.id;

    const { data: firstRequests, error: firstRequestsError } = await admin
      .from("requests")
      .select("id, status")
      .eq("clinic_id", clinicId)
      .eq("owner_id", ownerId);

    expect(firstRequestsError).toBeNull();
    expect(firstRequests).toHaveLength(1);
    const requestId = firstRequests![0].id;

    await admin
      .from("requests")
      .update({ status: "waiting_owner" })
      .eq("clinic_id", clinicId)
      .eq("id", requestId);

    const secondParams = new URLSearchParams({
      From: `whatsapp:${ownerPhone}`,
      To: `whatsapp:${clinicPhone}`,
      Body: "She vomited again after drinking water.",
      MessageSid: secondSid,
      ProfileName: ownerName
    });
    const secondResponse = await postSignedTwilioWebhook({
      request,
      baseURL: baseURL!,
      authToken: authToken!,
      params: secondParams
    });
    const duplicateResponse = await postSignedTwilioWebhook({
      request,
      baseURL: baseURL!,
      authToken: authToken!,
      params: secondParams
    });

    expect(secondResponse.status()).toBe(200);
    expect(duplicateResponse.status()).toBe(200);

    const { data: requests, error: requestsError } = await admin
      .from("requests")
      .select("id, status")
      .eq("clinic_id", clinicId)
      .eq("owner_id", ownerId);

    expect(requestsError).toBeNull();
    expect(requests).toEqual([{ id: requestId, status: "waiting_staff" }]);

    const { data: messages, error: messagesError } = await admin
      .from("messages")
      .select("external_id")
      .eq("clinic_id", clinicId)
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

    expect(messagesError).toBeNull();
    expect(messages?.map((message) => message.external_id)).toEqual([
      firstSid,
      secondSid
    ]);

    const { data: events, error: eventsError } = await admin
      .from("request_events")
      .select("event_type")
      .eq("clinic_id", clinicId)
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

    expect(eventsError).toBeNull();
    expect(events?.map((event) => event.event_type)).toEqual([
      "created",
      "message_received",
      "message_received",
      "status_changed"
    ]);
  } finally {
    if (clinicId) {
      if (ownerId) {
        await admin
          .from("requests")
          .delete()
          .eq("clinic_id", clinicId)
          .eq("owner_id", ownerId);
        await admin
          .from("owner_channel_identities")
          .delete()
          .eq("clinic_id", clinicId)
          .eq("owner_id", ownerId);
        await admin
          .from("pets")
          .delete()
          .eq("clinic_id", clinicId)
          .eq("owner_id", ownerId);
        await admin
          .from("owners")
          .delete()
          .eq("clinic_id", clinicId)
          .eq("id", ownerId);
      }

      await admin
        .from("clinic_channels")
        .delete()
        .eq("clinic_id", clinicId)
        .eq("channel", "whatsapp")
        .eq("external_id", clinicPhone);
    }
  }
});

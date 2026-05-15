import "server-only";

import type { Database } from "@petcura/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  TWILIO_MEDIA_INGESTION_REQUESTED_EVENT,
  type PetCuraInngestEventUnion
} from "../../../../jobs/inngest/events";
import { sendPetCuraInngestEvent } from "@/lib/inngest/client";
import { requireTwilioCredentials } from "./outbound";

type AdminClient = ReturnType<typeof createAdminClient>;
type AttachmentRow = Database["public"]["Tables"]["attachments"]["Row"];
type SendEvent = (event: PetCuraInngestEventUnion) => Promise<unknown>;
type TwilioMediaIngestionJobRow = {
  attachment_id: string;
  clinic_id: string;
  provider_url: string;
  provider_media_id: string | null;
  status: "queued" | "processing" | "completed" | "failed" | "skipped";
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

type TwilioMediaJobClient = {
  from(table: "twilio_media_ingestion_jobs"): {
    select(columns: string): {
      eq(key: string, value: string): {
        maybeSingle(): PromiseLike<{
          data: TwilioMediaIngestionJobRow | null;
          error: { message: string } | null;
        }>;
      };
    };
    update(patch: Partial<TwilioMediaIngestionJobRow>): {
      eq(key: string, value: string): PromiseLike<{
        error: { message: string } | null;
      }>;
    };
  };
};

export type QueueTwilioMediaIngestionInput = {
  clinicId: string;
  requestId: string;
  messageId: string;
  attachmentIds: string[];
  sendEvent?: SendEvent | false;
};

export type IngestTwilioMediaAttachmentOptions = {
  attachmentId: string;
  supabase?: AdminClient;
  fetchImpl?: typeof fetch;
  now?: Date;
};

function getTwilioMediaId(providerUrl: string) {
  const parsed = new URL(providerUrl);
  const lastSegment = parsed.pathname.split("/").filter(Boolean).at(-1);
  return lastSegment || null;
}

function basicAuthHeader(accountSid: string, authToken: string) {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

function twilioMediaJobClient(admin: AdminClient) {
  return admin as unknown as TwilioMediaJobClient;
}

export async function queueTwilioMediaIngestion({
  clinicId,
  requestId,
  messageId,
  attachmentIds,
  sendEvent
}: QueueTwilioMediaIngestionInput) {
  if (sendEvent === false || attachmentIds.length === 0) return;

  const queuedAt = new Date().toISOString();
  await Promise.allSettled(
    attachmentIds.map((attachmentId) =>
      (sendEvent ?? sendPetCuraInngestEvent)({
        name: TWILIO_MEDIA_INGESTION_REQUESTED_EVENT,
        data: {
          clinicId,
          requestId,
          messageId,
          attachmentId,
          queuedAt
        },
        id: `${clinicId}:${attachmentId}:twilio-media-ingestion`
      })
    )
  );
}

async function loadAttachment(supabase: AdminClient, attachmentId: string) {
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("id", attachmentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load attachment: ${error.message}`);
  }

  return data as AttachmentRow | null;
}

async function loadTwilioMediaJob(
  supabase: AdminClient,
  attachmentId: string
) {
  const { data, error } = await twilioMediaJobClient(supabase)
    .from("twilio_media_ingestion_jobs")
    .select("*")
    .eq("attachment_id", attachmentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load media ingestion job: ${error.message}`);
  }

  return data;
}

async function markAttachmentFailed({
  supabase,
  attachment,
  error,
  now,
  job
}: {
  supabase: AdminClient;
  attachment: AttachmentRow;
  error: string;
  now: Date;
  job?: TwilioMediaIngestionJobRow | null;
}) {
  await supabase
    .from("attachments")
    .update({
      ingestion_status: "failed",
      ingestion_error: error,
      ingestion_attempts: attachment.ingestion_attempts + 1
    })
    .eq("clinic_id", attachment.clinic_id)
    .eq("id", attachment.id);

  if (job) {
    await twilioMediaJobClient(supabase)
      .from("twilio_media_ingestion_jobs")
      .update({
        status: "failed",
        attempts: job.attempts + 1,
        last_error: error
      })
      .eq("attachment_id", attachment.id);
  }

  await supabase.from("request_events").insert({
    clinic_id: attachment.clinic_id,
    request_id: attachment.request_id,
    actor_type: "system",
    actor_id: null,
    event_type: "attachment_ingestion_failed",
    payload_json: {
      attachment_id: attachment.id,
      message_id: attachment.message_id,
      provider: attachment.provider,
      error,
      recorded_at: now.toISOString()
    }
  });
}

export async function ingestTwilioMediaAttachment({
  attachmentId,
  supabase = createAdminClient(),
  fetchImpl = fetch,
  now = new Date()
}: IngestTwilioMediaAttachmentOptions) {
  const attachment = await loadAttachment(supabase, attachmentId);

  if (!attachment) {
    return { status: "missing" as const };
  }

  if (attachment.provider !== "twilio") {
    return { status: "skipped" as const, reason: "not_twilio_media" };
  }

  if (attachment.ingestion_status === "completed") {
    return { status: "skipped" as const, reason: "already_completed" };
  }

  const job = await loadTwilioMediaJob(supabase, attachment.id);

  if (!job?.provider_url) {
    return { status: "skipped" as const, reason: "missing_media_job" };
  }

  const { error: claimError } = await supabase
    .from("attachments")
    .update({
      ingestion_status: "processing",
      ingestion_error: null,
      ingestion_attempts: attachment.ingestion_attempts + 1
    })
    .eq("clinic_id", attachment.clinic_id)
    .eq("id", attachment.id)
    .in("ingestion_status", ["queued", "failed"]);

  if (claimError) {
    throw new Error(`Could not claim attachment: ${claimError.message}`);
  }

  const { error: jobClaimError } = await twilioMediaJobClient(supabase)
    .from("twilio_media_ingestion_jobs")
    .update({
      status: "processing",
      attempts: job.attempts + 1,
      last_error: null
    })
    .eq("attachment_id", attachment.id);

  if (jobClaimError) {
    throw new Error(`Could not claim media ingestion job: ${jobClaimError.message}`);
  }

  try {
    const { accountSid, authToken } = requireTwilioCredentials();
    const response = await fetchImpl(job.provider_url, {
      headers: {
        authorization: basicAuthHeader(accountSid, authToken)
      }
    });

    if (!response.ok) {
      throw new Error(`twilio_media_fetch_${response.status}`);
    }

    const contentType =
      response.headers.get("content-type") ?? attachment.mime_type;
    const bytes = Buffer.from(await response.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("request-attachments")
      .upload(attachment.storage_path, bytes, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { error: updateError } = await supabase
      .from("attachments")
      .update({
        mime_type: contentType,
        size_bytes: bytes.byteLength,
        provider_media_id:
          attachment.provider_media_id ??
          job.provider_media_id ??
          getTwilioMediaId(job.provider_url),
        ingestion_status: "completed",
        ingestion_error: null,
        ingestion_completed_at: now.toISOString()
      })
      .eq("clinic_id", attachment.clinic_id)
      .eq("id", attachment.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const { error: jobCompleteError } = await twilioMediaJobClient(supabase)
      .from("twilio_media_ingestion_jobs")
      .update({
        status: "completed",
        last_error: null
      })
      .eq("attachment_id", attachment.id);

    if (jobCompleteError) {
      throw new Error(jobCompleteError.message);
    }

    return {
      status: "completed" as const,
      attachmentId: attachment.id,
      sizeBytes: bytes.byteLength
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "media_ingestion_failed";
    await markAttachmentFailed({ supabase, attachment, error: message, now, job });
    throw error;
  }
}

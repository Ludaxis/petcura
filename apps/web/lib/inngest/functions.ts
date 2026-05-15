import "server-only";

import {
  AI_REPLY_DRAFT_REQUESTED_EVENT,
  OWNER_MESSAGE_CREATED_EVENT,
  OUTBOUND_MESSAGE_QUEUED_EVENT,
  TWILIO_MEDIA_INGESTION_REQUESTED_EVENT
} from "../../../../jobs/inngest/events";
import { processOwnerMessageAi } from "@/lib/ai/owner-message-pipeline";
import { generateReplyDraftForRequest } from "@/lib/ai/memory";
import { sendQueuedOutboundMessage } from "@/lib/twilio/outbox";
import { ingestTwilioMediaAttachment } from "@/lib/twilio/media-ingestion";
import { inngest } from "./client";

export const ownerMessageAiFunction = inngest.createFunction(
  {
    id: "petcura-owner-message-ai-v1",
    name: "PetCura owner message AI",
    triggers: [{ event: OWNER_MESSAGE_CREATED_EVENT }]
  },
  async ({ event, step }) => {
    return step.run("summary-translations-memory", () =>
      processOwnerMessageAi({
        clinicId: event.data.clinicId,
        requestId: event.data.requestId,
        messageId: event.data.messageId
      })
    );
  }
);

export const replyDraftAiFunction = inngest.createFunction(
  {
    id: "petcura-reply-draft-ai-v1",
    name: "PetCura reply draft AI",
    triggers: [{ event: AI_REPLY_DRAFT_REQUESTED_EVENT }]
  },
  async ({ event, step }) => {
    return step.run("generate-reply-draft", () =>
      generateReplyDraftForRequest({
        clinicId: event.data.clinicId,
        requestId: event.data.requestId,
        locale: event.data.targetLocale ?? "en"
      })
    );
  }
);

export const outboundMessageSendFunction = inngest.createFunction(
  {
    id: "petcura-outbound-message-send-v1",
    name: "PetCura outbound message send",
    triggers: [{ event: OUTBOUND_MESSAGE_QUEUED_EVENT }]
  },
  async ({ event, step }) => {
    return step.run("send-twilio-message", () =>
      sendQueuedOutboundMessage({
        outboundMessageId: event.data.outboundMessageId
      })
    );
  }
);

export const twilioMediaIngestionFunction = inngest.createFunction(
  {
    id: "petcura-twilio-media-ingestion-v1",
    name: "PetCura Twilio media ingestion",
    triggers: [{ event: TWILIO_MEDIA_INGESTION_REQUESTED_EVENT }]
  },
  async ({ event, step }) => {
    return step.run("download-and-store-media", () =>
      ingestTwilioMediaAttachment({
        attachmentId: event.data.attachmentId
      })
    );
  }
);

export const petcuraInngestFunctions = [
  ownerMessageAiFunction,
  replyDraftAiFunction,
  outboundMessageSendFunction,
  twilioMediaIngestionFunction
];

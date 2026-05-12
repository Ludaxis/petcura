import "server-only";

import {
  AI_REPLY_DRAFT_REQUESTED_EVENT,
  OWNER_MESSAGE_CREATED_EVENT
} from "../../../../jobs/inngest/events";
import { processOwnerMessageAi } from "@/lib/ai/owner-message-pipeline";
import { generateReplyDraftForRequest } from "@/lib/ai/memory";
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

export const petcuraInngestFunctions = [
  ownerMessageAiFunction,
  replyDraftAiFunction
];

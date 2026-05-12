export const OWNER_MESSAGE_CREATED_EVENT = "owner.message.created" as const;
export const AI_SUMMARY_REQUESTED_EVENT = "ai.summary.requested" as const;
export const AI_TRANSLATION_REQUESTED_EVENT = "ai.translation.requested" as const;
export const AI_MEMORY_EXTRACTION_REQUESTED_EVENT =
  "ai.memory_extraction.requested" as const;
export const AI_REPLY_DRAFT_REQUESTED_EVENT =
  "ai.reply_draft.requested" as const;

export const PETCURA_AI_EVENT_NAMES = [
  OWNER_MESSAGE_CREATED_EVENT,
  AI_SUMMARY_REQUESTED_EVENT,
  AI_TRANSLATION_REQUESTED_EVENT,
  AI_MEMORY_EXTRACTION_REQUESTED_EVENT,
  AI_REPLY_DRAFT_REQUESTED_EVENT
] as const;

export type PetCuraInngestEventName = (typeof PETCURA_AI_EVENT_NAMES)[number];

export type UuidString = string;
export type IsoDateTimeString = string;

export type PetCuraSupportedLocale = "en" | "et" | "ru";
export type PetCuraRequestChannel = "whatsapp" | "web" | "sms";
export type PetCuraAiRequestActorType = "system" | "staff";
export type PetCuraMemoryScope = "owner" | "pet" | "request";

export type PetCuraAiRequestActor = {
  type: PetCuraAiRequestActorType;
  id?: UuidString;
};

export type PetCuraRequestReference = {
  clinicId: UuidString;
  requestId: UuidString;
};

export type OwnerMessageCreatedEventData = PetCuraRequestReference & {
  messageId: UuidString;
  ownerId?: UuidString;
  petId?: UuidString;
  channel: PetCuraRequestChannel;
  sourceLocale?: PetCuraSupportedLocale;
  hasAttachments?: boolean;
  createdAt: IsoDateTimeString;
};

export type PetCuraAiRequestedEventData = PetCuraRequestReference & {
  requestedAt: IsoDateTimeString;
  requestedBy: PetCuraAiRequestActor;
  idempotencyKey?: string;
};

export type AiSummaryRequestedEventData = PetCuraAiRequestedEventData & {
  sourceMessageId?: UuidString;
};

export type AiTranslationRequestedEventData = PetCuraAiRequestedEventData & {
  messageId: UuidString;
  sourceLocale?: PetCuraSupportedLocale;
  targetLocales?: readonly PetCuraSupportedLocale[];
};

export type AiMemoryExtractionRequestedEventData = PetCuraAiRequestedEventData & {
  sourceMessageIds?: readonly UuidString[];
  scopes?: readonly PetCuraMemoryScope[];
};

export type AiReplyDraftRequestedEventData = PetCuraAiRequestedEventData & {
  sourceMessageId?: UuidString;
  targetLocale?: PetCuraSupportedLocale;
};

export type PetCuraInngestEventRecord = {
  [OWNER_MESSAGE_CREATED_EVENT]: {
    data: OwnerMessageCreatedEventData;
  };
  [AI_SUMMARY_REQUESTED_EVENT]: {
    data: AiSummaryRequestedEventData;
  };
  [AI_TRANSLATION_REQUESTED_EVENT]: {
    data: AiTranslationRequestedEventData;
  };
  [AI_MEMORY_EXTRACTION_REQUESTED_EVENT]: {
    data: AiMemoryExtractionRequestedEventData;
  };
  [AI_REPLY_DRAFT_REQUESTED_EVENT]: {
    data: AiReplyDraftRequestedEventData;
  };
};

export type PetCuraInngestEventData<Name extends PetCuraInngestEventName> =
  PetCuraInngestEventRecord[Name]["data"];

export type PetCuraInngestEvent<Name extends PetCuraInngestEventName> = {
  name: Name;
  data: PetCuraInngestEventData<Name>;
  id?: string;
  ts?: number;
};

export type PetCuraInngestEventUnion = {
  [Name in PetCuraInngestEventName]: PetCuraInngestEvent<Name>;
}[PetCuraInngestEventName];

import { normalizeLocale, type SupportedLocale } from "@petcura/shared";

type LocaleSourceRequest = {
  owners?: { preferred_language?: string | null } | null;
  clinics?: { locale?: string | null } | null;
};

type LocaleSourceMessage = {
  sender_type?: string | null;
  source_locale?: string | null;
};

export function resolveReplyDraftSourceLocale({
  request,
  messages
}: {
  request: LocaleSourceRequest;
  messages: LocaleSourceMessage[];
}): SupportedLocale {
  const latestOwnerLocale = [...messages]
    .reverse()
    .find(
      (message) => message.sender_type === "owner" && message.source_locale
    )?.source_locale;
  const latestMessageLocale = [...messages]
    .reverse()
    .find((message) => message.source_locale)?.source_locale;

  return normalizeLocale(
    latestOwnerLocale ??
      latestMessageLocale ??
      request.owners?.preferred_language ??
      request.clinics?.locale
  );
}

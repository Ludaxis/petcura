import { notFound } from "next/navigation";
import {
  createTranslator,
  withLocale,
  type SupportedLocale
} from "@petcura/shared";
import { loadInboxRows } from "@/app/inbox/_components/InboxStreamContent";
import { getRequestDetail } from "@/lib/requests";
import type { InboxStream } from "@/lib/inbox/queries";
import type { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import {
  generateAiReplyDraft,
  reviewAiMemoryCandidate
} from "../actions";
import type { DraftPayload } from "./AiDraftCard";
import { RequestDetail } from "./RequestDetail";
import { RequestPaneShell } from "./RequestPaneShell";
import type { ThreadMessage } from "./Thread";

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>;

type StaffContext = {
  supabase: ServerSupabaseClient;
  clinic: { id: string; timezone: string };
  user: { id: string };
  membership: { id: string };
};

type Props = {
  staffContext: StaffContext;
  requestId: string;
  locale: SupportedLocale;
  initialAnnouncement: string | null;
};

const STREAM_ORDER: InboxStream[] = [
  "all",
  "urgent",
  "today",
  "week",
  "routine",
  "mine",
  "unassigned"
];

function formatMemoryKey(
  t: ReturnType<typeof createTranslator>,
  prefix: string,
  value: string
) {
  return t(`${prefix}.${value}` as Parameters<typeof t>[0]);
}

/**
 * Async server component for the center+right detail pane. Awaits two
 * fetches in parallel:
 *
 *   1. `getRequestDetail` — the heavy join (request + owner + pet + messages
 *      + reminders + events + ai_outputs + memory context/candidates).
 *   2. `loadInboxRows` — same cached helper the left rail uses, needed here
 *      for the keyboard nav's prev/next traversal and the command palette's
 *      thread search. `React.cache` dedupes against the list loader so this
 *      is free when the list-side promise has already resolved.
 *
 * Wrapped in its own Suspense in `page.tsx` so the left rail can paint
 * before this loader finishes. Inside that Suspense, the route's
 * `loading.tsx` is no longer involved — the granular fallback is
 * `RequestDetailSkeleton`.
 *
 * Why a server component (not `use(promise)` on the client): PaneShell
 * already owns a tight client-orchestration contract (RealtimeRefresh,
 * `useOptimisticMessages(messages)` seed, CommandPalette/Keyboard with the
 * full row metadata). Lifting promises into the client and splitting that
 * contract would force every sub-tree (Thread/Composer/Keyboard/Palette) to
 * tolerate undefined data, with no operational win. Streaming on the server
 * gets us the same independent fallback without touching PaneShell's seed.
 */
export async function RequestDetailLoader({
  staffContext,
  requestId,
  locale,
  initialAnnouncement
}: Props) {
  const [request, listRows] = await Promise.all([
    getRequestDetail(
      staffContext.supabase,
      staffContext.clinic.id,
      requestId,
      locale,
      staffContext.clinic.timezone
    ),
    loadInboxRows(staffContext.supabase, staffContext.clinic.id, {
      stream: "all",
      view: "list",
      locale,
      staffMembershipId: staffContext.membership.id
    })
  ]);

  if (!request) {
    notFound();
  }

  const t = createTranslator(locale);
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });
  const formatDateTime = (iso: string) =>
    dateTimeFormatter.format(new Date(iso));

  const hrefForRow = Object.fromEntries(
    listRows.map((r) => [r.id, withLocale(`/requests/${r.id}`, locale)])
  ) as Record<string, string>;
  const rowIds = listRows.map((r) => r.id);

  const messages: ThreadMessage[] = request.messages.map((m) => ({
    id: m.id,
    senderType: m.senderType,
    body: m.body,
    bodyTranslated: m.bodyTranslated,
    sourceLocale: m.sourceLocale,
    createdAt: m.createdAt,
    deliveryStatus: m.deliveryStatus,
    deliveryProvider: m.deliveryProvider,
    deliveryUpdatedAt: m.deliveryUpdatedAt
  }));

  const draft: DraftPayload | null = request.pendingDraft
    ? {
        id: request.pendingDraft.id,
        text: request.pendingDraft.text,
        confidence: request.pendingDraft.confidence,
        sourceMessageId: request.pendingDraft.sourceMessageId,
        sourceLocale: request.pendingDraft.sourceLocale,
        targetLocale: request.pendingDraft.targetLocale,
        createdAt: request.pendingDraft.createdAt
      }
    : null;

  const streamLabels: Record<InboxStream, string> = {
    all: t("inbox.streams.all"),
    urgent: t("inbox.streams.urgent"),
    today: t("inbox.streams.today"),
    week: t("inbox.streams.week"),
    routine: t("inbox.streams.routine"),
    mine: t("inbox.streams.mine"),
    unassigned: t("inbox.streams.unassigned"),
    resolved: t("inbox.streams.resolved")
  };

  const shortcuts = [
    { keys: "J / K", description: t("inbox.kbd.navigate") },
    { keys: "R", description: t("request.kbd.send") },
    { keys: "T", description: t("request.kbd.translate") },
    { keys: "E", description: t("inbox.kbd.resolve") },
    { keys: "A", description: t("inbox.kbd.assign") },
    { keys: "⌘↵", description: t("request.composer.send") },
    { keys: "⌘K / Ctrl+K", description: t("inbox.kbd.command") },
    { keys: "?", description: t("inbox.kbd.shortcuts") }
  ];

  const paletteLabels = {
    dialogLabel: t("inbox.cmdk.dialogLabel"),
    placeholder: t("inbox.cmdk.placeholder"),
    empty: t("inbox.cmdk.empty"),
    threadsHeading: t("inbox.cmdk.threads"),
    streamsHeading: t("inbox.cmdk.streams"),
    actionsHeading: t("inbox.cmdk.actions"),
    appearanceHeading: t("inbox.cmdk.appearance"),
    openThread: t("inbox.cmdk.openThread"),
    filterStreamPrefix: t("inbox.cmdk.filterStream").replace(" {stream}", ""),
    themeLight: t("inbox.cmdk.themeLight"),
    themeDark: t("inbox.cmdk.themeDark"),
    themeSystem: t("inbox.cmdk.themeSystem"),
    themeAnnounceLight: t("inbox.cmdk.themeAnnounceLight"),
    themeAnnounceDark: t("inbox.cmdk.themeAnnounceDark"),
    themeAnnounceSystem: t("inbox.cmdk.themeAnnounceSystem"),
    resolveCurrent: t("inbox.cmdk.resolveCurrent"),
    assignCurrent: t("inbox.cmdk.assignCurrent"),
    resolved: t("inbox.toast.resolved"),
    assigned: t("inbox.toast.assigned")
  };

  const threadLabels = {
    region: t("request.thread.region"),
    showTranslation: t("request.translate.show"),
    hideTranslation: t("request.translate.hide"),
    error: t("request.translate.error"),
    system: t("request.thread.system"),
    deliveryStatus: t("request.delivery.status"),
    delivery: {
      queued: t("request.delivery.queued"),
      sent: t("request.delivery.sent"),
      delivered: t("request.delivery.delivered"),
      read: t("request.delivery.read"),
      acknowledged: t("request.delivery.acknowledged"),
      failed: t("request.delivery.failed")
    }
  };

  const draftLabels = {
    region: t("request.aiDraft.region"),
    eyebrow: t("request.aiDraft.eyebrow"),
    from: t("request.aiDraft.from"),
    confidence: t("request.aiDraft.confidence"),
    confidenceBucketLow: t("request.aiDraft.confidence.low"),
    confidenceBucketMedium: t("request.aiDraft.confidence.medium"),
    confidenceBucketHigh: t("request.aiDraft.confidence.high"),
    confidenceLabel: t("request.aiDraft.confidenceLabel"),
    locale: t("request.aiDraft.locale"),
    accept: t("request.aiDraft.accept"),
    edit: t("request.aiDraft.edit"),
    reject: t("request.aiDraft.reject"),
    cancel: t("request.aiDraft.cancel"),
    save: t("request.aiDraft.save"),
    saveAndAccept: t("request.aiDraft.saveAndAccept"),
    editLabel: t("request.aiDraft.editLabel"),
    accepted: t("request.aiDraft.accepted.toast"),
    rejected: t("request.aiDraft.rejected.toast"),
    edited: t("request.aiDraft.edited.toast"),
    errorAccept: t("request.aiDraft.error.accept"),
    errorEdit: t("request.aiDraft.error.edit"),
    errorReject: t("request.aiDraft.error.reject")
  };

  const composerLabels = {
    label: t("request.composer.label"),
    placeholder: t("request.composer.placeholder"),
    send: t("request.composer.send"),
    shortcut: t("request.composer.shortcut")
  };

  const aiMemoryLabels = {
    region: t("request.aiMemory.region"),
    title: t("request.aiMemory.title"),
    draftControls: t("request.aiMemory.draftControls"),
    generate: t("request.aiMemory.generate"),
    regenerate: t("request.aiMemory.regenerate"),
    generating: t("request.aiMemory.generating"),
    contextHeading: t("request.aiMemory.contextHeading"),
    contextEmpty: t("request.aiMemory.contextEmpty"),
    candidatesHeading: t("request.aiMemory.candidatesHeading"),
    candidatesEmpty: t("request.aiMemory.candidatesEmpty"),
    candidateReason: t("request.aiMemory.candidateReason"),
    editCandidate: t("request.aiMemory.editCandidate"),
    approveCandidate: t("request.aiMemory.approveCandidate"),
    dismissCandidate: t("request.aiMemory.dismissCandidate"),
    approveCandidateAria: t("request.aiMemory.approveCandidateAria"),
    dismissCandidateAria: t("request.aiMemory.dismissCandidateAria"),
    draftQueued: t("request.aiMemory.draftQueued"),
    candidateUpdated: t("request.aiMemory.candidateUpdated")
  };

  const aiMemory = {
    labels: aiMemoryLabels,
    contextItems: request.aiMemoryContext.map((item) => ({
      id: item.id,
      title: formatMemoryKey(t, "request.aiMemory.type", item.memoryType),
      body: item.text,
      pills: [
        {
          id: `${item.id}-scope`,
          label: formatMemoryKey(t, "request.aiMemory.scope", item.scopeType),
          tone: "teal" as const
        }
      ],
      meta: [
        item.confidence !== null
          ? t("request.aiMemory.meta.confidence").replace(
              "{confidence}",
              item.confidence.toFixed(2)
            )
          : null,
        item.updatedAt ? formatDateTime(item.updatedAt) : null
      ].filter((value): value is string => Boolean(value))
    })),
    memoryCandidates: request.aiMemoryCandidates.map((candidate) => ({
      id: candidate.id,
      title: formatMemoryKey(
        t,
        "request.aiMemory.type",
        candidate.memoryType
      ),
      body: candidate.contentText,
      status: "pending" as const,
      statusLabel: candidate.status,
      pills: [
        {
          id: `${candidate.id}-scope`,
          label: formatMemoryKey(
            t,
            "request.aiMemory.scope",
            candidate.scopeType
          ),
          tone: "amber" as const
        }
      ],
      meta: [
        candidate.confidence !== null
          ? t("request.aiMemory.meta.confidence").replace(
              "{confidence}",
              candidate.confidence.toFixed(2)
            )
          : null,
        t("request.aiMemory.meta.sources").replace(
          "{count}",
          String(candidate.sourceCount)
        ),
        formatDateTime(candidate.createdAt)
      ].filter((value): value is string => Boolean(value))
    })),
    draftControl: {
      action: generateAiReplyDraft,
      mode: draft ? ("regenerate" as const) : ("generate" as const),
      statusLabel: draft
        ? t("request.aiMemory.status.hasDraft")
        : t("request.aiMemory.status.ready"),
      hiddenFields: { lang: locale }
    },
    candidateAction: reviewAiMemoryCandidate,
    candidateActionHiddenFields: { lang: locale }
  };

  const keyboardLabels = {
    sheetTitle: t("inbox.kbdSheet.title"),
    close: t("inbox.kbdSheet.close"),
    resolved: t("inbox.toast.resolved"),
    assigned: t("inbox.toast.assigned"),
    errorResolve: t("inbox.toast.resolveError"),
    errorAssign: t("inbox.toast.assignError")
  };

  const paneShell = (
    <RequestPaneShell
      requestId={request.id}
      clinicId={staffContext.clinic.id}
      rowIds={rowIds}
      hrefForRow={hrefForRow}
      threads={listRows.map((r) => ({
        id: r.id,
        petName: r.petName,
        ownerName: r.ownerName,
        preview: r.preview,
        href: hrefForRow[r.id] ?? `/requests/${r.id}`
      }))}
      streams={STREAM_ORDER.map((value) => ({
        value,
        label: streamLabels[value]
      }))}
      locale={locale}
      messages={messages}
      draft={draft}
      initialAnnouncement={initialAnnouncement}
      paletteLabels={paletteLabels}
      threadLabels={threadLabels}
      translateAnnounce={{
        shown: t("request.translate.announce.shown"),
        hidden: t("request.translate.announce.hidden")
      }}
      draftLabels={draftLabels}
      composerLabels={composerLabels}
      keyboardLabels={keyboardLabels}
      shortcuts={shortcuts}
    />
  );

  return (
    <RequestDetail
      request={request}
      locale={locale}
      formatDateTime={formatDateTime}
      currentStaffUserId={staffContext.user.id}
      paneShell={paneShell}
      aiMemory={aiMemory}
      hasDraft={Boolean(draft)}
      closeHref={withLocale("/inbox", locale)}
      closeLabel={t("request.detail.close")}
    />
  );
}

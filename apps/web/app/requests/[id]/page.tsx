import { notFound } from "next/navigation";
import {
  createTranslator,
  withLocale,
  type SupportedLocale
} from "@petcura/shared";
import { getRequestLocale } from "@/lib/locale";
import { requireStaffContext } from "@/lib/auth/staff";
import { getRequestDetail } from "@/lib/requests";
import { listInboxRequests, type InboxStream } from "@/lib/inbox/queries";
import { getThemePreference } from "@/lib/theme";
import { RequestRail } from "./_components/RequestRail";
import { RequestList } from "./_components/RequestList";
import { RequestDetail } from "./_components/RequestDetail";
import { RequestPaneShell } from "./_components/RequestPaneShell";
import type { ThreadMessage } from "./_components/Thread";
import type { DraftPayload } from "./_components/AiDraftCard";

type RequestDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    action_error?: string | string[];
    action_status?: string | string[];
    lang?: string | string[];
  }>;
};

function makeRelativeFormatter(locale: SupportedLocale) {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  return (iso: string) => {
    const diffMs = new Date(iso).getTime() - Date.now();
    const minutes = Math.round(diffMs / 60000);
    if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
    const days = Math.round(hours / 24);
    return rtf.format(days, "day");
  };
}

const STREAM_ORDER: InboxStream[] = [
  "all",
  "urgent",
  "today",
  "week",
  "routine",
  "mine",
  "unassigned"
];

export default async function RequestDetailPage({
  params,
  searchParams
}: RequestDetailPageProps) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const langParam = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const locale = await getRequestLocale(langParam);
  const t = createTranslator(locale);

  const actionStatus = Array.isArray(sp.action_status)
    ? sp.action_status[0]
    : sp.action_status;
  const actionError = Array.isArray(sp.action_error)
    ? sp.action_error[0]
    : sp.action_error;
  // Map server-action redirect tokens to localized toast strings. We resolve
  // here (server) so the Pane shell's single aria-live region announces them
  // to SR users on the next render.
  const toastForStatus: Record<string, string> = {
    reply_sent: t("request.toast.replySent"),
    note_added: t("request.toast.noteAdded"),
    status_updated: t("request.toast.statusUpdated"),
    urgency_updated: t("request.toast.urgencyUpdated"),
    assigned: t("request.toast.assigned")
  };
  const toastForError: Record<string, string> = {
    reply: t("request.toast.error.reply"),
    note: t("request.toast.error.note"),
    status: t("request.toast.error.status"),
    urgency: t("request.toast.error.urgency"),
    assignment: t("request.toast.error.assignment"),
    delivery: t("request.toast.error.delivery"),
    not_found: t("request.toast.error.notFound")
  };
  const initialAnnouncement =
    (actionError && (toastForError[actionError] ?? t("request.toast.error.generic"))) ||
    (actionStatus && toastForStatus[actionStatus]) ||
    null;

  const staffContext = await requireStaffContext(
    locale,
    `/requests/${encodeURIComponent(id)}`
  );

  const [request, listRows, themePreference] = await Promise.all([
    getRequestDetail(staffContext.supabase, staffContext.clinic.id, id),
    listInboxRequests(staffContext.supabase, staffContext.clinic.id, {
      stream: "all",
      view: "list",
      locale,
      staffMembershipId: staffContext.membership.id
    }),
    getThemePreference()
  ]);

  if (!request) {
    notFound();
  }

  const formatRelative = makeRelativeFormatter(locale);
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

  const themeLabels = {
    light: t("inbox.theme.light"),
    dark: t("inbox.theme.dark"),
    system: t("inbox.theme.system"),
    label: t("inbox.theme.label"),
    announceLight: t("inbox.theme.announce.light"),
    announceDark: t("inbox.theme.announce.dark"),
    announceSystem: t("inbox.theme.announce.system")
  } as const;

  const streamLabels: Record<InboxStream, string> = {
    all: t("inbox.streams.all"),
    urgent: t("inbox.streams.urgent"),
    today: t("inbox.streams.today"),
    week: t("inbox.streams.week"),
    routine: t("inbox.streams.routine"),
    mine: t("inbox.streams.mine"),
    unassigned: t("inbox.streams.unassigned")
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
    <main className="flex h-screen w-full overflow-hidden bg-[var(--paper)]">
      <RequestRail
        locale={locale}
        clinicName={staffContext.clinic.name}
        staffLabel={staffContext.user.email ?? "staff"}
        labels={{
          cmdkHint: t("inbox.kbd.command"),
          backToInbox: t("request.detail.openInbox"),
          rail: t("inbox.title"),
          signedIn: t("inbox.rail.signedIn")
        }}
      />

      <RequestList
        rows={listRows}
        currentRequestId={request.id}
        locale={locale}
        hrefForRow={hrefForRow}
        formatRelative={formatRelative}
        density="comfortable"
        emptyLabel={t("inbox.empty")}
        ariaLabel={t("request.detail.list")}
      />

      <RequestDetail
        request={request}
        locale={locale}
        themePreference={themePreference}
        themeLabels={themeLabels}
        formatDateTime={formatDateTime}
        currentStaffUserId={staffContext.user.id}
        paneShell={paneShell}
      />
    </main>
  );
}

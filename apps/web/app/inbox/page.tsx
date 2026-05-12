import { Suspense } from "react";
import {
  createTranslator,
  type SupportedLocale
} from "@petcura/shared";
import { getRequestLocale } from "@/lib/locale";
import { requireStaffContext } from "@/lib/auth/staff";
import {
  isInboxStream,
  isInboxView,
  type InboxStream,
  type InboxView
} from "@/lib/inbox/queries";
import { AppShell } from "@/app/_components/AppShell";
import { InboxToolbarControls } from "./_components/InboxToolbarControls";
import {
  BoardSkeleton,
  InboxSkeleton
} from "./_components/InboxStates";
import { InboxStreamContent } from "./_components/InboxStreamContent";
import { InboxClientShellLoader } from "./_components/InboxClientShellLoader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type InboxPageProps = {
  searchParams?: Promise<{
    lang?: string | string[];
    stream?: string | string[];
    view?: string | string[];
    density?: string | string[];
    id?: string | string[];
  }>;
};

const STREAM_KEYS: Record<
  InboxStream,
  | "inbox.streams.all"
  | "inbox.streams.urgent"
  | "inbox.streams.today"
  | "inbox.streams.week"
  | "inbox.streams.routine"
  | "inbox.streams.mine"
  | "inbox.streams.unassigned"
  | "inbox.streams.resolved"
> = {
  all: "inbox.streams.all",
  urgent: "inbox.streams.urgent",
  today: "inbox.streams.today",
  week: "inbox.streams.week",
  routine: "inbox.streams.routine",
  mine: "inbox.streams.mine",
  unassigned: "inbox.streams.unassigned",
  resolved: "inbox.streams.resolved"
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

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const sp = (await searchParams) ?? {};
  const langParam = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const streamParamRaw = Array.isArray(sp.stream) ? sp.stream[0] : sp.stream;
  const viewParamRaw = Array.isArray(sp.view) ? sp.view[0] : sp.view;
  const densityRaw = Array.isArray(sp.density) ? sp.density[0] : sp.density;
  const idParamRaw = Array.isArray(sp.id) ? sp.id[0] : sp.id;

  const locale = await getRequestLocale(langParam);
  const t = createTranslator(locale);
  const staffContext = await requireStaffContext(locale, "/inbox");

  const stream: InboxStream = isInboxStream(streamParamRaw)
    ? streamParamRaw
    : "all";
  const view: InboxView = isInboxView(viewParamRaw) ? viewParamRaw : "list";
  const density: "comfortable" | "compact" =
    densityRaw === "compact" ? "compact" : "comfortable";

  // Counts live in AppShell so the sidebar renders them everywhere. The
  // page itself doesn't fetch rows synchronously — both the stream content
  // and the client-shell metadata fetch inside their own Suspense children
  // (sharing one DB round-trip via React.cache). Removing the top-level
  // await lets per-stream switches show a skeleton via the keyed Suspense
  // boundary below instead of blocking the whole page response.
  const formatRelative = makeRelativeFormatter(locale);
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });
  const formatDateTime = (iso: string) =>
    dateTimeFormatter.format(new Date(iso));

  const streamLabels = (Object.keys(STREAM_KEYS) as InboxStream[]).reduce(
    (acc, key) => {
      acc[key] = t(STREAM_KEYS[key]);
      return acc;
    },
    {} as Record<InboxStream, string>
  );

  // R/T are advertised in PR B once the composer + per-bubble translation
  // ship (QA #2/#3 — don't promise stubs in the shortcut sheet).
  const shortcuts = [
    { keys: "J / K", description: t("inbox.kbd.navigate") },
    { keys: "E", description: t("inbox.kbd.resolve") },
    { keys: "A", description: t("inbox.kbd.assign") },
    { keys: "⌘K / Ctrl+K", description: t("inbox.kbd.command") },
    { keys: "?", description: t("inbox.kbd.shortcuts") }
  ];

  // Friendly title for the in-pane heading. "All open · 9" style, mirrors
  // the count badge from the sidebar parent so users get visual continuity.
  const streamTitle = t(STREAM_KEYS[stream]);

  return (
    <AppShell locale={locale} inboxStream={stream} currentPath="/inbox">
      {/*
        Inbox owns its own scroll: the page (main + this wrapper) stays
        viewport-locked, the list scrolls inside. Without `overflow-y-auto`
        here the list rows would clip at the viewport bottom because main is
        h-svh overflow-hidden.
      */}
      <div className="mx-auto flex w-full min-h-0 max-w-7xl flex-1 flex-col gap-4 overflow-y-auto px-3 py-4 sm:gap-5 sm:px-6 sm:py-5 lg:px-8">
        {/*
          The persistent sidebar carries identity now, so the inbox no longer
          needs a top header bar (Back/title chips were absorbed into the
          sidebar brand block). The lightweight inline heading below echoes
          the active stream + count so the user always knows where they are.
        */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="flex items-baseline gap-2 text-[18px] font-semibold text-[var(--ink)]">
                <span className="truncate">{streamTitle}</span>
                {/*
                  Count chip is rendered by InboxStreamContent (inside the
                  Suspense boundary) so it stays in sync with the streamed
                  rows. The h1 itself stays in the static shell for SR
                  landmarking.
                */}
              </h1>
            </div>
            <div className="shrink-0">
              <InboxToolbarControls
                view={view}
                density={density}
                labels={{
                  list: t("inbox.view.list"),
                  board: t("inbox.view.board"),
                  comfortable: t("inbox.density.comfortable"),
                  compact: t("inbox.density.compact"),
                  viewGroup: t("inbox.view.label"),
                  densityGroup: t("inbox.density.label")
                }}
              />
            </div>
          </div>

          {/*
            Stream content lives in its own Suspense boundary keyed on the
            filter combo. When the user clicks "Urgent" or switches view, the
            URL changes, the key changes, and the skeleton renders while the
            new fetch streams in — instead of blocking the whole page.
          */}
          <Suspense
            key={`${stream}-${view}-${density}`}
            fallback={
              view === "board" ? (
                <BoardSkeleton label={t("inbox.loading.label")} />
              ) : (
                <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)]">
                  <InboxSkeleton label={t("inbox.loading.label")} />
                </div>
              )
            }
          >
            <InboxStreamContent
              supabase={staffContext.supabase}
              clinicId={staffContext.clinic.id}
              staffMembershipId={staffContext.membership.id}
              stream={stream}
              view={view}
              density={density}
              locale={locale}
              initialFocusedId={idParamRaw}
              formatRelative={formatRelative}
              formatDateTime={formatDateTime}
            />
          </Suspense>
        </section>

        {/*
          Client shell metadata (rowIds, threads, ownerNameByRowId) streams
          independently of the stream-content Suspense. fallback={null}
          keeps it invisible until ready — the user can already see and
          scroll the inbox list above before keyboard / palette wiring
          mounts.
        */}
        <Suspense fallback={null}>
          <InboxClientShellLoader
            supabase={staffContext.supabase}
            clinicId={staffContext.clinic.id}
            staffMembershipId={staffContext.membership.id}
            locale={locale}
            fetchOptions={{ stream, view, locale }}
            streams={(Object.keys(STREAM_KEYS) as InboxStream[]).map(
              (value) => ({
                value,
                label: streamLabels[value]
              })
            )}
            bulkLabels={{
              selected: t("inbox.bulk.selected"),
              resolve: t("inbox.bulk.resolve"),
              assign: t("inbox.bulk.assign"),
              cancel: t("inbox.bulk.cancel"),
              resolveDone: t("inbox.bulk.resolveDone"),
              assignDone: t("inbox.bulk.assignDone"),
              error: t("inbox.bulk.error"),
              rowToggleLabel: t("inbox.bulk.rowToggleLabel"),
              rowToggleLabelFor: t("inbox.bulk.rowToggleLabelFor")
            }}
            realtimeToastLabel={t("inbox.realtime.newRequest")}
            paletteLabels={{
              dialogLabel: t("inbox.cmdk.dialogLabel"),
              placeholder: t("inbox.cmdk.placeholder"),
              empty: t("inbox.cmdk.empty"),
              threadsHeading: t("inbox.cmdk.threads"),
              streamsHeading: t("inbox.cmdk.streams"),
              actionsHeading: t("inbox.cmdk.actions"),
              appearanceHeading: t("inbox.cmdk.appearance"),
              openThread: t("inbox.cmdk.openThread"),
              filterStreamPrefix: t("inbox.cmdk.filterStream").replace(
                " {stream}",
                ""
              ),
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
            }}
            keyboardLabels={{
              sheetTitle: t("inbox.kbdSheet.title"),
              close: t("inbox.kbdSheet.close"),
              resolved: t("inbox.toast.resolved"),
              assigned: t("inbox.toast.assigned"),
              errorResolve: t("inbox.toast.resolveError"),
              errorAssign: t("inbox.toast.assignError")
            }}
            shortcuts={shortcuts}
          />
        </Suspense>
      </div>
    </AppShell>
  );
}

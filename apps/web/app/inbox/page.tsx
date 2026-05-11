import { Suspense } from "react";
import {
  createTranslator,
  withLocale,
  type SupportedLocale
} from "@petcura/shared";
import { getRequestLocale } from "@/lib/locale";
import { requireStaffContext } from "@/lib/auth/staff";
import {
  isInboxStream,
  isInboxView,
  listInboxRequests,
  type InboxStream,
  type InboxView
} from "@/lib/inbox/queries";
import { AppShell } from "@/app/_components/AppShell";
import { InboxRow } from "./_components/InboxRow";
import { InboxToolbarControls } from "./_components/InboxToolbarControls";
import { InboxClientShell } from "./_components/InboxClientShell";
import { InboxBoard } from "./_components/InboxBoard";
import { InboxEmptyState, InboxSkeleton } from "./_components/InboxStates";

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

  // Counts now live in AppShell so the sidebar renders them everywhere; this
  // page only needs the filtered rows for the current stream.
  const rows = await listInboxRequests(
    staffContext.supabase,
    staffContext.clinic.id,
    {
      stream,
      view,
      locale,
      staffMembershipId: staffContext.membership.id
    }
  );

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

  const hrefForRow = Object.fromEntries(
    rows.map((r) => [r.id, withLocale(`/requests/${r.id}`, locale)])
  ) as Record<string, string>;

  const rowIds = rows.map((r) => r.id);

  // Seed the SSR selection from ?id= so the server-rendered row gets the
  // roving tabindex aligned with the client shell on first paint.
  const initialFocusedIndex =
    idParamRaw && rowIds.indexOf(idParamRaw) >= 0
      ? rowIds.indexOf(idParamRaw)
      : 0;

  // R/T are advertised in PR B once the composer + per-bubble translation
  // ship (QA #2/#3 — don't promise stubs in the shortcut sheet).
  const shortcuts = [
    { keys: "J / K", description: t("inbox.kbd.navigate") },
    { keys: "E", description: t("inbox.kbd.resolve") },
    { keys: "A", description: t("inbox.kbd.assign") },
    { keys: "⌘K / Ctrl+K", description: t("inbox.kbd.command") },
    { keys: "?", description: t("inbox.kbd.shortcuts") }
  ];

  const listHeadingKey = (
    {
      all: "inbox.list.heading.all",
      urgent: "inbox.list.heading.urgent",
      today: "inbox.list.heading.today",
      week: "inbox.list.heading.week",
      routine: "inbox.list.heading.routine",
      mine: "inbox.list.heading.mine",
      unassigned: "inbox.list.heading.unassigned",
      resolved: "inbox.list.heading.resolved"
    } as const
  )[stream];
  const listHeading = t(listHeadingKey).replace("{count}", String(rows.length));
  // Friendly title for the in-pane heading. "All open · 9" style, mirrors
  // the count badge from the sidebar parent so users get visual continuity.
  const streamTitle = t(STREAM_KEYS[stream]);

  return (
    <AppShell locale={locale} inboxStream={stream} currentPath="/inbox">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-6 sm:py-5 lg:px-8">
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
                <span
                  aria-hidden="true"
                  className="font-mono text-[11.5px] text-[var(--muted-2)]"
                >
                  · {rows.length}
                </span>
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

          {view === "board" ? (
            <Suspense
              fallback={<InboxSkeleton label={t("inbox.loading.label")} />}
            >
              <InboxBoard
                rows={rows}
                locale={locale}
                formatDateTime={formatDateTime}
              />
            </Suspense>
          ) : rows.length === 0 ? (
            <>
              <h2 className="sr-only">{listHeading}</h2>
              <InboxEmptyState
                message={t("inbox.empty")}
                body={t("inbox.emptyBody")}
              />
            </>
          ) : (
            <>
              {/* Heading-level landmark for screen readers navigating by H2. */}
              <h2 className="sr-only">{listHeading}</h2>
              <div
                aria-label={t("inbox.title")}
                className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)]"
              >
                {rows.map((row, i) => (
                  <InboxRow
                    key={row.id}
                    row={row}
                    index={i}
                    locale={locale}
                    selected={i === initialFocusedIndex}
                    density={density}
                    formatRelative={formatRelative}
                    href={hrefForRow[row.id] ?? `/requests/${row.id}`}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        <InboxClientShell
          clinicId={staffContext.clinic.id}
          rowIds={rowIds}
          hrefForRow={hrefForRow}
          threads={rows.map((r) => ({
            id: r.id,
            petName: r.petName,
            ownerName: r.ownerName,
            preview: r.preview,
            href: hrefForRow[r.id] ?? `/requests/${r.id}`
          }))}
          streams={(Object.keys(STREAM_KEYS) as InboxStream[]).map((value) => ({
            value,
            label: streamLabels[value]
          }))}
          locale={locale}
          bulkLabels={{
            selected: t("inbox.bulk.selected"),
            resolve: t("inbox.bulk.resolve"),
            assign: t("inbox.bulk.assign"),
            cancel: t("inbox.bulk.cancel"),
            resolveDone: t("inbox.bulk.resolveDone"),
            assignDone: t("inbox.bulk.assignDone"),
            error: t("inbox.bulk.error"),
            rowToggleLabel: t("inbox.bulk.rowToggleLabel")
          }}
          realtimeToastLabel={t("inbox.realtime.newRequest")}
          ownerNameByRowId={Object.fromEntries(
            rows.map((r) => [r.id, r.ownerName])
          )}
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
      </div>
    </AppShell>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { Badge, Button } from "@petcura/ui";
import {
  createTranslator,
  withLocale,
  type SupportedLocale
} from "@petcura/shared";
import { getRequestLocale } from "@/lib/locale";
import { requireStaffContext } from "@/lib/auth/staff";
import {
  getInboxStreamCounts,
  isInboxStream,
  isInboxView,
  listInboxRequests,
  type InboxStream,
  type InboxView
} from "@/lib/inbox/queries";
import { getThemePreference } from "@/lib/theme";
import { signOutStaff } from "./actions";
import { InboxRow } from "./_components/InboxRow";
import { StreamFilter } from "./_components/StreamFilter";
import { InboxToolbarControls } from "./_components/InboxToolbarControls";
import { InboxClientShell } from "./_components/InboxClientShell";
import { InboxBoard } from "./_components/InboxBoard";
import { InboxEmptyState, InboxSkeleton } from "./_components/InboxStates";
import { UserMenu } from "@/app/_components/UserMenu";

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
> = {
  all: "inbox.streams.all",
  urgent: "inbox.streams.urgent",
  today: "inbox.streams.today",
  week: "inbox.streams.week",
  routine: "inbox.streams.routine",
  mine: "inbox.streams.mine",
  unassigned: "inbox.streams.unassigned"
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

  const themePreference = await getThemePreference();

  const [rows, counts] = await Promise.all([
    listInboxRequests(staffContext.supabase, staffContext.clinic.id, {
      stream,
      view,
      locale,
      staffMembershipId: staffContext.membership.id
    }),
    getInboxStreamCounts(
      staffContext.supabase,
      staffContext.clinic.id,
      staffContext.membership.id
    )
  ]);

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
      unassigned: "inbox.list.heading.unassigned"
    } as const
  )[stream];
  const listHeading = t(listHeadingKey).replace("{count}", String(rows.length));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-6 sm:py-5 lg:px-8">
      <header className="flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link href={withLocale("/", locale)}>
              <ArrowLeft aria-hidden="true" size={16} />
              {t("nav.back")}
            </Link>
          </Button>
          <div>
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--primary)]">
              {t("inbox.kicker")}
            </p>
            <h1 className="text-[22px] font-semibold">
              {t("inbox.title")}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="teal">{staffContext.clinic.name}</Badge>
          <Badge tone="neutral">{t("inbox.liveBadge")}</Badge>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <StreamFilter
            stream={stream}
            counts={counts}
            labels={streamLabels}
            groupLabel={t("inbox.streams.label")}
          />
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
          <Suspense fallback={<InboxSkeleton label={t("inbox.loading.label")} />}>
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
      <UserMenu
        email={staffContext.user.email ?? ""}
        clinicName={staffContext.clinic.name}
        locale={locale}
        currentPath="/inbox"
        initialTheme={themePreference}
        labels={{
          ariaLabel: t("menu.ariaLabel"),
          signedInAs: t("menu.signedInAs"),
          theme: t("menu.theme"),
          themeLight: t("menu.themeLight"),
          themeDark: t("menu.themeDark"),
          themeSystem: t("menu.themeSystem"),
          language: t("menu.language"),
          help: t("menu.help"),
          helpHref: "mailto:support@petcura.app",
          signOut: t("auth.logout")
        }}
        signOutAction={signOutStaff}
      />
    </main>
  );
}

import { cache } from "react";
import {
  createTranslator,
  withLocale,
  type SupportedLocale
} from "@petcura/shared";
import {
  listInboxRequests,
  type InboxRowData,
  type InboxStream,
  type InboxView,
  type ListInboxRequestsOptions
} from "@/lib/inbox/queries";
import type { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { InboxRow } from "./InboxRow";
import { InboxBoard } from "./InboxBoard";
import { BoardSkeleton, InboxEmptyState } from "./InboxStates";

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>;

/**
 * Per-request memoized fetch. React.cache() dedupes the same call signature
 * across server components in one render, so InboxStreamContent and any
 * sibling that needs the same rows share a single DB round-trip. The page
 * imports this helper so the outer `await` (used for shell metadata) and the
 * Suspense child both hit the cache.
 */
export const loadInboxRows = cache(
  async (
    supabase: ServerSupabaseClient,
    clinicId: string,
    options: ListInboxRequestsOptions
  ): Promise<InboxRowData[]> => {
    return listInboxRequests(supabase, clinicId, options);
  }
);

type InboxStreamContentProps = {
  supabase: ServerSupabaseClient;
  clinicId: string;
  staffMembershipId: string;
  stream: InboxStream;
  view: InboxView;
  density: "comfortable" | "compact";
  locale: SupportedLocale;
  initialFocusedId?: string | undefined;
  formatRelative: (iso: string) => string;
};

/**
 * Async server component that fetches + renders the inbox stream (list or
 * board). Wrapped by the page in `<Suspense key={stream-view-density}>` so
 * filter changes show the skeleton fallback instead of blocking the shell.
 */
export async function InboxStreamContent({
  supabase,
  clinicId,
  staffMembershipId,
  stream,
  view,
  density,
  locale,
  initialFocusedId,
  formatRelative
}: InboxStreamContentProps) {
  const rows = await loadInboxRows(supabase, clinicId, {
    stream,
    view,
    locale,
    staffMembershipId
  });

  const t = createTranslator(locale);
  const hrefForRow = Object.fromEntries(
    rows.map((r) => [r.id, withLocale(`/requests/${r.id}`, locale)])
  ) as Record<string, string>;

  const rowIds = rows.map((r) => r.id);
  const initialFocusedIndex =
    initialFocusedId && rowIds.indexOf(initialFocusedId) >= 0
      ? rowIds.indexOf(initialFocusedId)
      : 0;

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

  if (view === "board") {
    return <InboxBoard rows={rows} locale={locale} />;
  }

  if (rows.length === 0) {
    return (
      <>
        <h2 className="sr-only">{listHeading}</h2>
        <InboxEmptyState
          message={t("inbox.empty")}
          body={t("inbox.emptyBody")}
        />
      </>
    );
  }

  return (
    <>
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
  );
}

// Suppress the unused-import warning for BoardSkeleton (used by the page).
export { BoardSkeleton };

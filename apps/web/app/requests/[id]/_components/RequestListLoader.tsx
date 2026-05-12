import {
  createTranslator,
  withLocale,
  type SupportedLocale
} from "@petcura/shared";
import { loadInboxRows } from "@/app/inbox/_components/InboxStreamContent";
import type { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { RequestList } from "./RequestList";

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>;

type Props = {
  supabase: ServerSupabaseClient;
  clinicId: string;
  staffMembershipId: string;
  currentRequestId: string;
  locale: SupportedLocale;
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

/**
 * Async server component for the left rail. Awaits `loadInboxRows` (memoized
 * via `React.cache` in `InboxStreamContent`) — the detail-side loader hits
 * the same cache key so we never round-trip twice in one render. Wrapped in
 * its own Suspense in `page.tsx` so the rail can paint independently of the
 * heavier detail fetch on the right.
 */
export async function RequestListLoader({
  supabase,
  clinicId,
  staffMembershipId,
  currentRequestId,
  locale
}: Props) {
  const rows = await loadInboxRows(supabase, clinicId, {
    stream: "all",
    view: "list",
    locale,
    staffMembershipId
  });

  const t = createTranslator(locale);
  const hrefForRow = Object.fromEntries(
    rows.map((r) => [r.id, withLocale(`/requests/${r.id}`, locale)])
  ) as Record<string, string>;
  const formatRelative = makeRelativeFormatter(locale);

  return (
    <RequestList
      rows={rows}
      currentRequestId={currentRequestId}
      locale={locale}
      hrefForRow={hrefForRow}
      formatRelative={formatRelative}
      density="comfortable"
      emptyLabel={t("inbox.empty")}
      ariaLabel={t("request.detail.list")}
    />
  );
}

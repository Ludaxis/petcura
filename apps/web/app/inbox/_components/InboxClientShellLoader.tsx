import {
  withLocale,
  type SupportedLocale
} from "@petcura/shared";
import type {
  InboxStream,
  ListInboxRequestsOptions
} from "@/lib/inbox/queries";
import type { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import {
  InboxClientShell,
  type InboxClientShellProps
} from "./InboxClientShell";
import { loadInboxRows } from "./InboxStreamContent";

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createServerSupabaseClient>
>;

type Labels = Pick<
  InboxClientShellProps,
  | "bulkLabels"
  | "realtimeToastLabel"
  | "paletteLabels"
  | "keyboardLabels"
  | "shortcuts"
> & {
  streams: { value: InboxStream; label: string }[];
};

type Props = Labels & {
  supabase: ServerSupabaseClient;
  clinicId: string;
  staffMembershipId: string;
  locale: SupportedLocale;
  fetchOptions: ListInboxRequestsOptions;
};

/**
 * Loads the row metadata (rowIds, hrefForRow, threads, ownerNameByRowId) the
 * keyboard / palette / bulk-action layer needs and renders InboxClientShell.
 * Wrapped in its own Suspense in the page so the shell doesn't block the
 * first paint of the inbox list.
 */
export async function InboxClientShellLoader({
  supabase,
  clinicId,
  staffMembershipId,
  locale,
  fetchOptions,
  streams,
  bulkLabels,
  realtimeToastLabel,
  paletteLabels,
  keyboardLabels,
  shortcuts
}: Props) {
  const rows = await loadInboxRows(supabase, clinicId, {
    ...fetchOptions,
    locale,
    staffMembershipId
  });

  const hrefForRow = Object.fromEntries(
    rows.map((r) => [r.id, withLocale(`/requests/${r.id}`, locale)])
  ) as Record<string, string>;
  const rowIds = rows.map((r) => r.id);

  return (
    <InboxClientShell
      clinicId={clinicId}
      rowIds={rowIds}
      hrefForRow={hrefForRow}
      threads={rows.map((r) => ({
        id: r.id,
        petName: r.petName,
        ownerName: r.ownerName,
        preview: r.preview,
        href: hrefForRow[r.id] ?? `/requests/${r.id}`
      }))}
      streams={streams}
      locale={locale}
      bulkLabels={bulkLabels}
      realtimeToastLabel={realtimeToastLabel}
      ownerNameByRowId={Object.fromEntries(
        rows.map((r) => [r.id, r.ownerName])
      )}
      paletteLabels={paletteLabels}
      keyboardLabels={keyboardLabels}
      shortcuts={shortcuts}
    />
  );
}

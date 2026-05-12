import { Suspense } from "react";
import {
  createTranslator,
  type SupportedLocale
} from "@petcura/shared";
import { getRequestLocale } from "@/lib/locale";
import { requireStaffContext } from "@/lib/auth/staff";
import { AppShell } from "@/app/_components/AppShell";
import { RequestListLoader } from "./_components/RequestListLoader";
import { RequestListSkeleton } from "./_components/RequestListSkeleton";
import { RequestDetailLoader } from "./_components/RequestDetailLoader";
import { RequestDetailSkeleton } from "./_components/RequestDetailSkeleton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RequestDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    action_error?: string | string[];
    action_status?: string | string[];
    lang?: string | string[];
  }>;
};

function resolveInitialAnnouncement(
  t: ReturnType<typeof createTranslator>,
  actionStatus: string | undefined,
  actionError: string | undefined
) {
  // Map server-action redirect tokens to localized toast strings. We resolve
  // here (server) so the Pane shell's single aria-live region announces them
  // to SR users on the next render.
  const toastForStatus: Record<string, string> = {
    reply_sent: t("request.toast.replySent"),
    note_added: t("request.toast.noteAdded"),
    reminder_created: t("request.toast.reminderCreated"),
    status_updated: t("request.toast.statusUpdated"),
    urgency_updated: t("request.toast.urgencyUpdated"),
    assigned: t("request.toast.assigned")
  };
  const toastForError: Record<string, string> = {
    reply: t("request.toast.error.reply"),
    note: t("request.toast.error.note"),
    reminder: t("request.toast.error.reminder"),
    status: t("request.toast.error.status"),
    urgency: t("request.toast.error.urgency"),
    assignment: t("request.toast.error.assignment"),
    delivery: t("request.toast.error.delivery"),
    not_found: t("request.toast.error.notFound")
  };
  return (
    (actionError && (toastForError[actionError] ?? t("request.toast.error.generic"))) ||
    (actionStatus && toastForStatus[actionStatus]) ||
    null
  );
}

/**
 * /requests/[id] — tri-pane: left rail (thread navigation) + center pane
 * (detail header + thread + AI draft + composer + side blocks).
 *
 * # Granular streaming (Phase 2)
 *
 * Up through Phase 1 this route awaited `getRequestDetail` and
 * `listInboxRequests` together via `Promise.all`. That blocked the entire
 * response on whichever fetch was slower (almost always the heavy detail
 * join), so the left rail couldn't paint until the right pane was ready.
 *
 * Now the page only resolves the cheap, shared prologue (locale + staff
 * context + toast token). The two heavy fetches are pushed into sibling
 * server components, each behind its own Suspense boundary:
 *
 *   - <RequestListLoader>    → `loadInboxRows` (cached)        → SkeletonList
 *   - <RequestDetailLoader>  → `getRequestDetail` + cached list → RequestDetailSkeleton
 *
 * Both loaders read the inbox-rows list through `React.cache(loadInboxRows)`
 * so they de-duplicate to a single Supabase round-trip in one render. The
 * detail loader needs the list too (for keyboard nav prev/next, palette
 * thread search, and the PaneShell's `threads` prop) — cache hits make
 * that free once the list-side promise resolves.
 *
 * # Why component split (not `use(promise)`)
 *
 * PaneShell already owns a tight client contract: `RealtimeRefresh` subs,
 * `useOptimisticMessages(messages)` (the seed must arrive synchronously so
 * the composer transition doesn't crash with "useOptimistic outside
 * transition"), `CommandPalette`/`RequestKeyboard` with the full row
 * metadata, and the shared aria-live region. Lifting promises into the
 * client and `use()`-ing them inside PaneShell would force every child to
 * tolerate undefined data with no operational win. Server-streamed
 * components give us the same independent fallback without disturbing
 * PaneShell's seed.
 *
 * # `loading.tsx` interaction
 *
 * The route-level `loading.tsx` is still the cold-navigation skeleton.
 * The two Suspense boundaries below only fire on subsequent re-renders
 * inside the segment (e.g. clicking a sibling row in the left rail).
 *
 * # View transitions
 *
 * `pc-request-{id}` on the detail header lives inside `RequestDetail`
 * (under the detail Suspense). The skeleton intentionally does NOT carry
 * that name — having two elements claim the same transition name during a
 * row click would break the row→header pairing.
 */
export default async function RequestDetailPage({
  params,
  searchParams
}: RequestDetailPageProps) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const langParam = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const locale: SupportedLocale = await getRequestLocale(langParam);
  const t = createTranslator(locale);

  const actionStatus = Array.isArray(sp.action_status)
    ? sp.action_status[0]
    : sp.action_status;
  const actionError = Array.isArray(sp.action_error)
    ? sp.action_error[0]
    : sp.action_error;
  const initialAnnouncement = resolveInitialAnnouncement(
    t,
    actionStatus,
    actionError
  );

  const staffContext = await requireStaffContext(
    locale,
    `/requests/${encodeURIComponent(id)}`
  );

  // Page title for the mobile shell header. We don't know the pet/owner
  // names yet (that requires the detail fetch we just deferred), so on
  // mobile the AppShell renders the inbox title as a stable fallback
  // until the detail loader resolves and the real header swaps in.
  // Desktop hides the title row anyway. Reusing `inbox.title` keeps the
  // EN/ET/RU triad satisfied without minting a new key for a string the
  // user only sees for a few hundred ms.
  const pageTitle = t("inbox.title");

  return (
    <AppShell
      locale={locale}
      currentPath={`/requests/${id}`}
      pageTitle={pageTitle}
    >
      {/*
        Two-pane layout below the sidebar: 320px list + flex detail. List is
        hidden below `lg` (same as before) — mobile users land on the detail
        panel and use the sidebar to walk back to /inbox.

        AppShell main is h-svh overflow-hidden, so this fills it via flex-1
        instead of redoing the viewport calc. The list and detail own their
        own scroll containers below.
      */}
      <div className="flex h-full w-full min-w-0 flex-1 overflow-hidden">
        {/*
          List Suspense — paints SkeletonList while `loadInboxRows` is in
          flight. On a sibling-row click the URL changes (?) but the row
          metadata is identical, so the cached `loadInboxRows` returns
          synchronously and this Suspense never falls back on subsequent
          navigations — the rail stays interactive.
        */}
        <Suspense
          fallback={
            <RequestListSkeleton ariaLabel={t("request.detail.list")} />
          }
        >
          <RequestListLoader
            supabase={staffContext.supabase}
            clinicId={staffContext.clinic.id}
            staffMembershipId={staffContext.membership.id}
            currentRequestId={id}
            locale={locale}
          />
        </Suspense>

        {/*
          Detail Suspense — paints RequestDetailSkeleton while the heavy
          `getRequestDetail` join is in flight. Keyed on the requestId so a
          sibling-row click forces React to remount this subtree and the
          skeleton swaps in immediately while the new detail fetch starts.
          Without the key React would attempt to reconcile against the
          previous detail tree and the skeleton would not appear.
        */}
        <Suspense
          key={id}
          fallback={
            <RequestDetailSkeleton
              label={t("request.detail.sidePanel")}
            />
          }
        >
          <RequestDetailLoader
            staffContext={staffContext}
            requestId={id}
            locale={locale}
            initialAnnouncement={initialAnnouncement}
          />
        </Suspense>
      </div>
    </AppShell>
  );
}

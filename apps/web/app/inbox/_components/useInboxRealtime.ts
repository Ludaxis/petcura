"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type UseInboxRealtimeArgs = {
  clinicId: string;
  rowIds: string[];
  /** Owner display name keyed by row id. Lets the toast personalize the
   *  message ("New request from Marie") when the INSERT matches an
   *  already-rendered row (e.g., during a router.refresh roundtrip).
   *  New rows from outside the rendered slice fall back to an empty
   *  string and the localized "{name}" placeholder is hidden. */
  ownerNameByRowId: Record<string, string>;
  /** Localized template — "New request from {name}" / "Uus pöördumine:
   *  {name}" / "Новый запрос от {name}". */
  toastLabelTemplate: string;
};

/**
 * Realtime side-effects for the inbox list:
 *   - on INSERT into `requests` filtered by the active clinic, surface a
 *     small sage-soft toast at the bottom-right ("New request from
 *     {ownerName}"); auto-dismisses after 4s
 *   - when the document is hidden (`visibilityState !== 'visible'`),
 *     swap the favicon to a dotted variant served from /favicon-dot.svg
 *     so the browser tab carries a notification; reset on focus
 *
 * The list re-render itself is handled by `<RealtimeRefresh />` so this
 * hook only owns the UX surfaces — that keeps the data-fetch path single-
 * source. We dedupe per-event-id to avoid double-toasts when the
 * RealtimeRefresh re-subscribes after a router.refresh.
 *
 * If Supabase Realtime is not configured for this project, the channel
 * subscribe will silently fail; the toast simply never fires and the
 * favicon stays the default. No additional env wiring is required.
 */
export function useInboxRealtime({
  clinicId,
  rowIds,
  ownerNameByRowId,
  toastLabelTemplate
}: UseInboxRealtimeArgs) {
  const [toast, setToast] = useState<string | null>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const initialIdsRef = useRef<Set<string>>(new Set(rowIds));
  const ownerMapRef = useRef(ownerNameByRowId);

  // Keep refs hot so the channel callback always sees the latest props.
  useEffect(() => {
    ownerMapRef.current = ownerNameByRowId;
  }, [ownerNameByRowId]);

  // Refresh the initial set so rows that arrived via realtime in this
  // session don't keep triggering toasts after the page re-renders.
  useEffect(() => {
    initialIdsRef.current = new Set(rowIds);
  }, [rowIds]);

  // Toast renderer — small in-effect state, dismissed via timeout.
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Realtime subscription. We use a dedicated channel name so we don't
  // collide with RealtimeRefresh's; that lets each surface manage its
  // own debounce + dedupe.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const supabase = createClient();
    const channel = supabase.channel(`petcura:inbox-toast:${clinicId}`);

    const onInsert = (
      payload: { new: { id?: string; ai_summary?: string | null } }
    ) => {
      const newRow = payload.new ?? {};
      const rowId = newRow.id;
      if (!rowId || seenRef.current.has(rowId)) return;
      // Suppress toasts for rows the server already rendered when the
      // page loaded — those aren't "new" to the user, they're history.
      if (initialIdsRef.current.has(rowId)) return;
      seenRef.current.add(rowId);

      const ownerName =
        ownerMapRef.current[rowId] ??
        "" /* fall back to a generic name if we don't know yet */;
      const message = toastLabelTemplate.replace(
        "{name}",
        ownerName || "—"
      );
      setToast(message);
      // Favicon dot if the tab is unfocused — staff notice without
      // looking at the browser window.
      if (document.visibilityState !== "visible") {
        applyDottedFavicon();
      }
    };

    const onPostgresChanges = channel.on.bind(channel) as (
      event: "postgres_changes",
      filter: {
        event: "INSERT";
        schema: "public";
        table: string;
        filter?: string;
      },
      callback: (payload: { new: Record<string, unknown> }) => void
    ) => typeof channel;

    onPostgresChanges(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "requests",
        filter: `clinic_id=eq.${clinicId}`
      },
      onInsert as never
    );

    channel.subscribe();

    const onVisible = () => {
      if (document.visibilityState === "visible") restoreFavicon();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [clinicId, toastLabelTemplate]);

  // Render the toast as a portal-free overlay; the hook returns nothing
  // and instead mounts a sibling node via a side-effecting Effect so
  // existing inbox layouts stay untouched.
  useEffect(() => {
    if (!toast) return;
    const host = document.createElement("div");
    host.dataset.realtimeToast = "true";
    host.setAttribute("role", "status");
    host.className =
      "fixed bottom-[calc(env(safe-area-inset-bottom)+4rem+0.5rem)] right-4 z-50 max-w-[280px] rounded-[10px] border border-[var(--line)] bg-[var(--primary-soft)] px-3.5 py-2 text-[12px] font-medium text-[var(--primary-strong)] shadow-md md:bottom-4";
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReducedMotion) {
      host.style.transition = "opacity 240ms ease";
      host.style.opacity = "0";
      requestAnimationFrame(() => {
        host.style.opacity = "1";
      });
    }
    host.textContent = toast;
    document.body.appendChild(host);
    return () => {
      host.remove();
    };
  }, [toast]);
}

/** Switch the favicon to a variant with a sage dot in the corner. The
 *  asset is shipped statically from /public/favicon-dot.svg; see the
 *  paired clean favicon at /favicon.svg. */
function applyDottedFavicon() {
  const link = ensureFaviconLink();
  if (!link) return;
  if (link.dataset.original) return;
  link.dataset.original = link.href;
  // We use a relative URL so the SVG resolves under any deployed base
  // path; Next.js serves /public/<file> at the site root.
  link.href = "/favicon-dot.svg";
}

function restoreFavicon() {
  const link = ensureFaviconLink();
  if (!link?.dataset.original) return;
  link.href = link.dataset.original;
  delete link.dataset.original;
}

function ensureFaviconLink() {
  if (typeof document === "undefined") return null;
  let link = document.querySelector<HTMLLinkElement>(
    'link[rel~="icon"]'
  );
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.href = "/favicon.ico";
    document.head.appendChild(link);
  }
  return link;
}

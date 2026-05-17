"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Languages } from "lucide-react";
import {
  StatusPill,
  UrgencyDot,
  cn
} from "@petcura/ui";
import {
  createTranslator,
  getRequestCategoryLabel,
  getRequestStatusLabel,
  getUrgencyLabel,
  type SupportedLocale
} from "@petcura/shared";
import type { InboxRowData } from "@/lib/inbox/queries";
import { useIsOptimisticallyResolved } from "./InboxOptimisticContext";

type InboxRowProps = {
  row: InboxRowData;
  locale: SupportedLocale;
  selected: boolean;
  density: "comfortable" | "compact";
  updatedAtLabel: string;
  href: string;
  index: number;
};

const tierToUrgencyLevel = {
  urgent: "urgent",
  today: "today",
  week: "week",
  routine: "routine"
} as const;

function statusPillKind(row: InboxRowData) {
  if (row.tier === "urgent" && row.status !== "resolved") return "urgent";
  if (row.status === "new") return "new";
  if (row.status === "waiting_staff") return "waiting-staff";
  if (row.status === "waiting_owner") return "waiting-owner";
  return "resolved";
}

function statusLocaleKey(
  row: InboxRowData
): "new" | "urgent" | "waiting_staff" | "waiting_owner" | "resolved" {
  if (row.tier === "urgent" && row.status !== "resolved") return "urgent";
  if (row.status === "new") return "new";
  if (row.status === "waiting_staff") return "waiting_staff";
  if (row.status === "waiting_owner") return "waiting_owner";
  return "resolved";
}

export function InboxRow({
  row,
  locale,
  selected,
  density,
  updatedAtLabel,
  href,
  index
}: InboxRowProps) {
  const t = createTranslator(locale);
  const optimisticallyResolved = useIsOptimisticallyResolved(row.id);
  // The fade-out is a two-step transition: the StatusPill flips to
  // `resolved` immediately so the action lands in the user's foveal
  // vision, then ~200ms later the row dims with a soft sage glow. The
  // delay lets the eye register the pill flip before the row fades.
  // PRM users skip the delay entirely — the dim snaps in alongside the
  // pill flip, no transition.
  //
  // The dim is a per-mount latch driven only when `optimisticallyResolved`
  // becomes true. The effect's cleanup clears the latch when the optimistic
  // flag flips back off (rollback path), which keeps the row visually in
  // sync without needing a separate setState inside the effect body.
  const [dimmed, setDimmed] = useState(false);
  useEffect(() => {
    if (!optimisticallyResolved) return;
    const prm =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // PRM users snap to dim (0ms delay); everyone else gets the 200ms
    // settle window so the StatusPill flip reads before the row fades.
    // Both paths defer via setTimeout so we never call setState
    // synchronously inside the effect — keeps `react-hooks/set-state-in-
    // effect` happy and avoids cascading renders.
    const delay = prm ? 0 : 200;
    const handle = window.setTimeout(() => setDimmed(true), delay);
    return () => {
      window.clearTimeout(handle);
      setDimmed(false);
    };
  }, [optimisticallyResolved]);

  const urgencyKey =
    row.tier === "urgent" ? "high" : row.tier === "today" ? "medium" : "low";
  const tierLabel = getUrgencyLabel(urgencyKey, locale);
  const urgencyAriaLabel = t("request.urgency.label").replace(
    "{urgency}",
    tierLabel
  );
  const effectiveStatusKey = optimisticallyResolved
    ? "resolved"
    : statusLocaleKey(row);
  const statusLabel = getRequestStatusLabel(effectiveStatusKey, locale);
  const statusAriaLabel = t("request.status.label").replace(
    "{status}",
    statusLabel
  );
  const categoryLabel = getRequestCategoryLabel(row.category, locale);
  const showTranslate = row.ownerLanguage !== locale;
  const status = optimisticallyResolved ? "resolved" : statusPillKind(row);

  const isCompact = density === "compact";

  return (
    <Link
      href={href}
      aria-label={`${row.petName} ${row.ownerName} ${row.preview}`}
      data-inbox-row
      data-row-id={row.id}
      data-row-index={index}
      data-selected={selected ? "true" : undefined}
      data-tier={row.tier}
      // Snapshot of pet + owner identity so the bulk-select checkbox
      // portal (mounted from InboxBulkLayer) can compose a row-distinct
      // aria-label without re-querying React state from the layer.
      data-row-pet={row.petName}
      data-row-owner={row.ownerName}
      tabIndex={selected ? 0 : -1}
      /*
       * Shared name for the View Transitions API. The destination route
       * (request detail header) sets the same `pc-request-{id}` on its
       * pet identity element. Because the inbox shows many rows but the
       * detail shows exactly one request, only the matching pair morphs
       * during the route swap — the rest crossfade with the root group.
       */
      style={
        {
          viewTransitionName: `pc-request-${row.id}`,
          // Drives the per-row stagger in `.pc-row-in`; capped at 20 in
          // CSS so the cascade doesn't crawl past ~600ms on long lists.
          ["--pc-row-i" as string]: String(index)
        } as React.CSSProperties
      }
      data-optimistic-resolved={optimisticallyResolved ? "true" : undefined}
      aria-busy={optimisticallyResolved ? "true" : undefined}
      className={cn(
        // `pc-row-in` plays a 280ms fade+lift staggered by `--pc-row-i`
        // when a row first mounts (initial inbox paint, or a new realtime
        // arrival). Reduced-motion users see the row pop in instantly
        // (handled by the existing `.pc-row-in` PRM block in globals.css).
        "pc-row-in",
        "group relative grid items-center gap-3 border-b border-[var(--line)] px-4 transition-[opacity,background-color,box-shadow] duration-200 motion-reduce:transition-none",
        "hover:bg-[var(--soft)] focus-visible:bg-[var(--soft)]",
        "data-[selected=true]:bg-[var(--primary-soft)]",
        isCompact ? "py-2.5 sm:py-3" : "py-3.5 sm:py-4",
        // grid: bulk-select | urgency dot | pet/owner | preview | status | meta | caret
        "grid-cols-[22px_14px_minmax(110px,max-content)_minmax(0,1fr)_auto_auto_18px]",
        "max-md:grid-cols-[22px_14px_minmax(0,1fr)_auto]",
        // Optimistic fade — sage tint over the row, dimmed to 60% so the
        // user feels the row is on its way out without losing the canonical
        // hover/focus affordances if they navigate away from it.
        dimmed &&
          "opacity-60 bg-[var(--primary-soft)]/30 shadow-[inset_0_0_0_1px_var(--primary-soft)]"
      )}
    >
      <span
        data-inbox-bulk-checkbox-slot
        data-inbox-bulk-row-id={row.id}
        className="flex h-5 w-[22px] items-center justify-start"
      />

      <span className="flex items-center justify-center">
        <UrgencyDot
          level={tierToUrgencyLevel[row.tier]}
          label={urgencyAriaLabel}
        />
      </span>

      {/* Desktop: pet · owner column */}
      <span className="hidden min-w-0 truncate text-[13.5px] font-medium text-[var(--ink)] md:block">
        {row.petName}
        <span className="mx-1.5 text-[var(--muted-2)]">·</span>
        <span className="text-[var(--ink-2)]">{row.ownerName}</span>
      </span>

      {/* Desktop: preview + category chip + language chip */}
      <span className="hidden min-w-0 items-center gap-2 md:flex">
        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--muted)]">
          {row.preview}
        </span>
        <span className="inline-flex shrink-0 items-center rounded-[var(--radius-sm)] bg-[var(--surface-soft)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--ink-2)]">
          {categoryLabel}
        </span>
        {showTranslate ? (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--surface-soft)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--muted)]"
            aria-label={t("inbox.row.sourceShort").replace(
              "{locale}",
              row.ownerLanguage.toUpperCase()
            )}
          >
            <Languages aria-hidden="true" size={10} />
            {row.ownerLanguage.toUpperCase()}
          </span>
        ) : null}
      </span>

      {/* Mobile: stacked content */}
      <span className="flex min-w-0 flex-col gap-1 md:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13.5px] font-medium text-[var(--ink)]">
            {row.petName}
          </span>
          <span className="shrink-0 truncate text-[12px] text-[var(--ink-2)]">
            · {row.ownerName}
          </span>
        </span>
        <span className="line-clamp-2 text-[12.5px] leading-[1.4] text-[var(--muted)]">
          {row.preview}
        </span>
        <span className="flex items-center gap-2">
          <StatusPill status={status} aria-label={statusAriaLabel} />
          {showTranslate ? (
            <span
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--muted)]"
              aria-label={t("inbox.row.sourceShort").replace(
                "{locale}",
                row.ownerLanguage.toUpperCase()
              )}
            >
              <Languages aria-hidden="true" size={10} />
              {row.ownerLanguage.toUpperCase()}
            </span>
          ) : null}
          <span className="ml-auto font-mono text-[10.5px] text-[var(--muted)]">
            {updatedAtLabel}
          </span>
        </span>
      </span>

      <span className="hidden md:block">
        <StatusPill status={status} aria-label={statusAriaLabel} />
      </span>

      <span
        aria-label={t("inbox.row.updatedLabel").replace(
          "{time}",
          updatedAtLabel
        )}
        className="hidden whitespace-nowrap font-mono text-[11px] text-[var(--muted)] md:block"
      >
        {updatedAtLabel}
      </span>

      <span
        aria-hidden="true"
        className="flex items-center justify-end text-[var(--muted-2)] transition-colors group-hover:text-[var(--primary)]"
      >
        <ChevronRight size={16} />
      </span>

      {showTranslate ? (
        <span className="sr-only">
          {t("inbox.row.sourceLanguage").replace(
            "{locale}",
            row.ownerLanguage.toUpperCase()
          )}
        </span>
      ) : null}
    </Link>
  );
}

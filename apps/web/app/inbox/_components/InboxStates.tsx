import { Inbox } from "lucide-react";
import { Shimmer } from "@petcura/ui";

/**
 * InboxSkeleton — N row placeholders that mirror InboxRow geometry exactly so
 * the swap to real content does not shift the layout (CLS = 0). Each cell
 * uses the shared sage shimmer (`pc-shimmer`) which falls back to a static
 * --soft block under prefers-reduced-motion.
 */
export function InboxSkeleton({
  label,
  rows = 10
}: { label?: string; rows?: number } = {}) {
  return (
    <ul
      aria-busy="true"
      aria-label={label ?? "Loading inbox"}
      className="flex flex-col"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="grid grid-cols-[14px_minmax(110px,max-content)_minmax(0,1fr)_auto_56px_18px] items-center gap-3 border-b border-[var(--line)] px-4 py-4"
        >
          <Shimmer className="h-2.5 w-2.5 rounded-full" />
          <Shimmer className="h-3 w-24 rounded" />
          <Shimmer
            className="h-3 w-full max-w-[280px] rounded"
            // Stagger the preview shimmer slightly so the rows don't pulse
            // in perfect lockstep — feels more natural without adding any
            // extra animation budget.
            slow={i % 2 === 0}
          />
          <Shimmer className="h-4 w-16 rounded-full" />
          <Shimmer className="h-3 w-12 rounded" />
          <span aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
}

/**
 * BoardSkeleton — column-based skeleton matching the 5-column board layout
 * (`lg:grid-cols-5`). Each column has a header (icon + title + count chip)
 * and 3 card-shaped placeholders so the swap to real cards is layout-stable.
 */
export function BoardSkeleton({
  columns = 5,
  cardsPerColumn = 3,
  label
}: {
  columns?: number;
  cardsPerColumn?: number;
  label?: string;
} = {}) {
  return (
    <section
      aria-busy="true"
      aria-label={label ?? "Loading board"}
      className="grid gap-4 lg:grid-cols-5"
    >
      {Array.from({ length: columns }).map((_, columnIndex) => (
        <div
          key={columnIndex}
          className="flex min-h-80 flex-col gap-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-3 shadow-sm"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Shimmer className="h-4 w-4 rounded" />
              <Shimmer className="h-3.5 w-20 rounded" />
            </div>
            <Shimmer className="h-5 w-6 rounded-full" />
          </div>
          {Array.from({ length: cardsPerColumn }).map((_, cardIndex) => (
            <div
              key={cardIndex}
              className="flex flex-col gap-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Shimmer className="h-3.5 w-24 rounded" />
                  <Shimmer className="h-2.5 w-20 rounded" />
                </div>
                <Shimmer className="h-3.5 w-3.5 rounded" />
              </div>
              <Shimmer
                className="mt-1 h-3 w-full rounded"
                slow={cardIndex % 2 === 0}
              />
              <Shimmer className="h-3 w-3/4 rounded" />
              <Shimmer className="mt-1 h-2.5 w-16 rounded" />
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}

export function InboxEmptyState({
  message,
  body
}: {
  message: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-strong)]"
      >
        <Inbox size={22} />
      </span>
      <p className="text-[15px] font-medium text-[var(--ink)]">{message}</p>
      <p className="max-w-xs text-[12.5px] leading-[1.5] text-[var(--muted)]">
        {body}
      </p>
    </div>
  );
}

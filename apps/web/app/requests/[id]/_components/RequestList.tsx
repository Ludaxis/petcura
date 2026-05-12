import type { SupportedLocale } from "@petcura/shared";
import type { InboxRowData } from "@/lib/inbox/queries";
import { InboxRow } from "@/app/inbox/_components/InboxRow";

type RequestListProps = {
  rows: InboxRowData[];
  currentRequestId: string;
  locale: SupportedLocale;
  hrefForRow: Record<string, string>;
  formatRelative: (iso: string) => string;
  density: "comfortable" | "compact";
  emptyLabel: string;
  ariaLabel: string;
};

/**
 * 320px middle column. Renders the same InboxRow as /inbox so the visual
 * model (sage left edge for selection, urgency dot, status pill, mono time)
 * stays identical — the row component itself reads `data-selected` from the
 * roving-tabindex shell and from the selected prop on initial paint.
 *
 * Hidden on mobile/tablet so detail can take the full width. PR C will add
 * the back-arrow nav and bottom-nav for switching between list and detail.
 */
export function RequestList({
  rows,
  currentRequestId,
  locale,
  hrefForRow,
  formatRelative,
  density,
  emptyLabel,
  ariaLabel
}: RequestListProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="hidden min-h-0 w-[320px] shrink-0 flex-col self-stretch overflow-hidden border-r border-[var(--line)] bg-[var(--paper)] lg:flex"
    >
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {rows.length === 0 ? (
          <p className="px-4 py-6 text-[12.5px] text-[var(--muted)]">
            {emptyLabel}
          </p>
        ) : (
          rows.map((row, i) => (
            <InboxRow
              key={row.id}
              row={row}
              index={i}
              locale={locale}
              selected={row.id === currentRequestId}
              density={density}
              formatRelative={formatRelative}
              href={hrefForRow[row.id] ?? `/requests/${row.id}`}
            />
          ))
        )}
      </div>
    </nav>
  );
}

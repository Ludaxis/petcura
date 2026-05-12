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

type InboxRowProps = {
  row: InboxRowData;
  locale: SupportedLocale;
  selected: boolean;
  density: "comfortable" | "compact";
  formatRelative: (iso: string) => string;
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
  formatRelative,
  href,
  index
}: InboxRowProps) {
  const t = createTranslator(locale);
  const urgencyKey =
    row.tier === "urgent" ? "high" : row.tier === "today" ? "medium" : "low";
  const tierLabel = getUrgencyLabel(urgencyKey, locale);
  const urgencyAriaLabel = t("request.urgency.label").replace(
    "{urgency}",
    tierLabel
  );
  const statusLabel = getRequestStatusLabel(statusLocaleKey(row), locale);
  const statusAriaLabel = t("request.status.label").replace(
    "{status}",
    statusLabel
  );
  const categoryLabel = getRequestCategoryLabel(row.category, locale);
  const showTranslate = row.ownerLanguage !== locale;
  const status = statusPillKind(row);

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
          viewTransitionName: `pc-request-${row.id}`
        } as React.CSSProperties
      }
      className={cn(
        "group relative grid items-center gap-3 border-b border-[var(--line)] px-4 transition-colors",
        "hover:bg-[var(--soft)] focus-visible:bg-[var(--soft)]",
        "data-[selected=true]:bg-[var(--primary-soft)]",
        isCompact ? "py-2.5 sm:py-3" : "py-3.5 sm:py-4",
        // grid: dot | pet/owner | preview | status | meta | caret
        "grid-cols-[14px_minmax(110px,max-content)_minmax(0,1fr)_auto_auto_18px]",
        "max-md:grid-cols-[14px_minmax(0,1fr)_auto]"
      )}
    >
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

      {/* Desktop: preview */}
      <span className="hidden min-w-0 truncate text-[13px] text-[var(--muted)] md:block">
        {row.preview}
        <span className="ml-2 inline-flex items-center gap-1 align-middle font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--muted-2)]">
          {categoryLabel}
        </span>
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
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--muted-2)]"
              aria-label={`source ${row.ownerLanguage}`}
            >
              <Languages aria-hidden="true" size={10} />
              {row.ownerLanguage.toUpperCase()}
            </span>
          ) : null}
          <span className="ml-auto font-mono text-[10.5px] text-[var(--muted-2)]">
            {formatRelative(row.updatedAt)}
          </span>
        </span>
      </span>

      <span className="hidden md:block">
        <StatusPill status={status} aria-label={statusAriaLabel} />
      </span>

      <span
        aria-label={`updated ${formatRelative(row.updatedAt)}`}
        className="hidden whitespace-nowrap font-mono text-[11px] text-[var(--muted-2)] md:block"
      >
        {formatRelative(row.updatedAt)}
      </span>

      <span
        aria-hidden="true"
        className="flex items-center justify-end text-[var(--muted-2)] transition-colors group-hover:text-[var(--primary)]"
      >
        <ChevronRight size={16} />
      </span>

      {showTranslate ? (
        <span className="sr-only">
          source language {row.ownerLanguage.toUpperCase()}
        </span>
      ) : null}
    </Link>
  );
}

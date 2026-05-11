import Link from "next/link";
import { ArrowUpRight, Inbox, Languages } from "lucide-react";
import { Badge, Panel } from "@petcura/ui";
import {
  createTranslator,
  getInboxViewForRequest,
  getRequestCategoryLabel,
  getRequestStatusLabel,
  getUrgencyLabel,
  inboxViewColumns,
  withLocale,
  type SupportedLocale
} from "@petcura/shared";
import type { InboxRowData } from "@/lib/inbox/queries";

type InboxBoardProps = {
  rows: InboxRowData[];
  locale: SupportedLocale;
  formatDateTime: (iso: string) => string;
};

export function InboxBoard({ rows, locale, formatDateTime }: InboxBoardProps) {
  const t = createTranslator(locale);

  return (
    <section className="grid gap-4 lg:grid-cols-5">
      {inboxViewColumns.map((column) => {
        const columnRequests = rows.filter(
          (request) =>
            getInboxViewForRequest({
              status: request.status,
              urgency: request.urgency
            }) === column.value
        );

        return (
          <Panel className="min-h-80 p-3" key={column.value}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Inbox aria-hidden="true" size={16} />
                <h2 className="text-sm font-semibold">
                  {getRequestStatusLabel(column.labelKey, locale)}
                </h2>
              </div>
              <span className="rounded-full bg-[var(--surface-soft)] px-2 py-1 text-xs font-semibold text-[var(--muted)]">
                {columnRequests.length}
              </span>
            </div>

            {/*
              Card-in-card removed: the column itself is the Panel surface,
              so request rows render as borderless list items separated by a
              hairline divider. Hover lifts the row with a --soft fill and a
              left-edge sage accent — matches the Design Canvas spec where
              the column is the card, not the row.
            */}
            <ul className="-mx-1 flex flex-col">
              {columnRequests.length === 0 ? (
                <li className="rounded-[var(--radius)] border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-3 text-sm leading-6 text-[var(--muted)]">
                  {t("inbox.empty")}
                </li>
              ) : null}
              {columnRequests.map((request, i) => (
                <li
                  key={request.id}
                  className={
                    i > 0 ? "border-t border-[var(--line)]" : undefined
                  }
                >
                  <Link
                    className="group block rounded-[var(--radius-sm)] border-l-2 border-l-transparent px-3 py-2.5 transition hover:bg-[var(--soft)] hover:border-l-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--primary)]"
                    href={withLocale(`/requests/${request.id}`, locale)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{request.petName}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {request.ownerName}
                        </p>
                      </div>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="text-[var(--muted)] transition group-hover:text-[var(--primary)]"
                        size={16}
                      />
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
                      {request.preview}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatDateTime(request.updatedAt)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge
                        tone={
                          request.urgency === "high"
                            ? "red"
                            : request.urgency === "medium"
                              ? "amber"
                              : "neutral"
                        }
                      >
                        {getUrgencyLabel(request.urgency, locale)}
                      </Badge>
                      <Badge tone="neutral">
                        {getRequestCategoryLabel(request.category, locale)}
                      </Badge>
                      {request.ownerLanguage !== locale ? (
                        <Badge tone="teal">
                          <Languages aria-hidden="true" size={12} />
                          {t("inbox.translation")}
                        </Badge>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        );
      })}
    </section>
  );
}

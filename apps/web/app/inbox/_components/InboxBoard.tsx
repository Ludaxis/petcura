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

            <div className="grid gap-2">
              {columnRequests.length === 0 ? (
                <p className="rounded-[var(--radius)] border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-3 text-sm leading-6 text-[var(--muted)]">
                  {t("inbox.empty")}
                </p>
              ) : null}
              {columnRequests.map((request) => (
                <Link
                  className="group rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-3 transition hover:border-[var(--primary)]"
                  href={withLocale(`/requests/${request.id}`, locale)}
                  key={request.id}
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
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
                    {request.preview}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {formatDateTime(request.updatedAt)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
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
              ))}
            </div>
          </Panel>
        );
      })}
    </section>
  );
}

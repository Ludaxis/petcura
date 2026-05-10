import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  ChevronDown,
  Languages
} from "lucide-react";
import { Badge, Button } from "@petcura/ui";
import {
  createTranslator,
  getChannelLabel,
  getRequestCategoryLabel,
  getRequestStatusLabel,
  getUrgencyLabel,
  requestStatusColumns,
  withLocale,
  type SupportedLocale
} from "@petcura/shared";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/app/_components/ThemeToggle";
import type { ThemePreference } from "@/lib/theme";
import type { RequestDetail as RequestDetailModel } from "@/lib/requests";
import {
  addInternalNote,
  assignRequest,
  updateRequestStatus,
  updateRequestUrgency
} from "../actions";

type RequestDetailProps = {
  request: RequestDetailModel;
  locale: SupportedLocale;
  themePreference: ThemePreference;
  themeLabels: React.ComponentProps<typeof ThemeToggle>["labels"];
  formatDateTime: (iso: string) => string;
  currentStaffUserId: string;
  /**
   * The right pane is composed: this server component renders the static
   * frame (pet header · staff actions · side blocks · note form), and
   * `paneShell` is the pre-built client orchestration for the thread + AI
   * card + composer + keyboard model.
   */
  paneShell: React.ReactNode;
};

const urgencyOptions = ["low", "medium", "high"] as const;

export function RequestDetail({
  request,
  locale,
  themePreference,
  themeLabels,
  formatDateTime,
  currentStaffUserId,
  paneShell
}: RequestDetailProps) {
  const t = createTranslator(locale);
  const currentAssignee = request.staffOptions.find(
    (staff) => staff.id === request.assignedStaffId
  );
  const getStaffLabel = (staff: (typeof request.staffOptions)[number]) =>
    staff.userId === currentStaffUserId
      ? `${staff.role} (${t("request.you")})`
      : staff.role;

  return (
    <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Detail header — pet identity + crumbs + actions row */}
      <header
        data-detail-head
        className="flex flex-col gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-4 py-3 sm:px-6"
      >
        <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--muted)] lg:hidden">
          <Button asChild size="sm" variant="ghost">
            <Link href={withLocale("/inbox", locale)}>
              <ArrowLeft aria-hidden="true" size={14} />
              {t("request.detail.openInbox")}
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="break-words text-[20px] font-semibold leading-tight">
                {request.petName}
              </h1>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--muted-2)]">
                {request.species}
              </span>
            </div>
            <p className="mt-0.5 break-words text-[12.5px] text-[var(--muted)]">
              {request.ownerName} ·{" "}
              <span className="font-mono">{request.ownerPhone}</span> ·{" "}
              {getChannelLabel(request.channel, locale)}
            </p>
            <p
              className="mt-0.5 break-words text-[12px] text-[var(--muted-2)]"
              data-current-assignee
            >
              {t("request.assigned")}:{" "}
              <span className="font-medium text-[var(--ink-2)]">
                {currentAssignee
                  ? getStaffLabel(currentAssignee)
                  : t("request.unassigned")}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
            <Badge tone="teal">
              {getRequestStatusLabel(request.status, locale)}
            </Badge>
            <Badge tone="neutral">
              {getRequestCategoryLabel(request.category, locale)}
            </Badge>
          </div>
        </div>

        {/* Sticky action row: status / urgency / assign — keep the existing
            forms, just lay them out as a tighter inline grid. */}
        <div className="flex flex-wrap items-end gap-3">
          <form
            action={updateRequestStatus}
            className="flex items-end gap-2"
            data-action="status"
          >
            <input name="lang" type="hidden" value={locale} />
            <input name="requestId" type="hidden" value={request.id} />
            <label
              className="flex flex-col gap-1 text-[10.5px] font-mono uppercase tracking-[0.06em] text-[var(--muted-2)]"
              htmlFor="status"
            >
              {t("request.status")}
              <select
                id="status"
                name="status"
                defaultValue={request.status}
                className="h-8 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2 text-[12.5px] text-[var(--ink)]"
              >
                {requestStatusColumns.map((status) => (
                  <option key={status.value} value={status.value}>
                    {getRequestStatusLabel(status.value, locale)}
                  </option>
                ))}
              </select>
            </label>
            <Button size="sm" variant="secondary" type="submit">
              {t("request.save")}
            </Button>
          </form>

          <form
            action={updateRequestUrgency}
            className="flex items-end gap-2"
            data-action="urgency"
          >
            <input name="lang" type="hidden" value={locale} />
            <input name="requestId" type="hidden" value={request.id} />
            <label
              className="flex flex-col gap-1 text-[10.5px] font-mono uppercase tracking-[0.06em] text-[var(--muted-2)]"
              htmlFor="urgency"
            >
              {t("request.urgency")}
              <select
                id="urgency"
                name="urgency"
                defaultValue={request.urgency}
                className="h-8 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2 text-[12.5px] text-[var(--ink)]"
              >
                {urgencyOptions.map((urgency) => (
                  <option key={urgency} value={urgency}>
                    {getUrgencyLabel(urgency, locale)}
                  </option>
                ))}
              </select>
            </label>
            <Button size="sm" variant="secondary" type="submit">
              {t("request.save")}
            </Button>
          </form>

          <form
            action={assignRequest}
            className="flex items-end gap-2"
            data-action="assign"
          >
            <input name="lang" type="hidden" value={locale} />
            <input name="requestId" type="hidden" value={request.id} />
            <label
              className="flex flex-col gap-1 text-[10.5px] font-mono uppercase tracking-[0.06em] text-[var(--muted-2)]"
              htmlFor="staffMemberId"
            >
              {t("request.assigned")}
              <select
                id="staffMemberId"
                name="staffMemberId"
                defaultValue={request.assignedStaffId ?? "unassigned"}
                className="h-8 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2 text-[12.5px] text-[var(--ink)]"
              >
                <option value="unassigned">{t("request.unassigned")}</option>
                {request.staffOptions.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {getStaffLabel(staff)}
                  </option>
                ))}
              </select>
            </label>
            <Button size="sm" variant="secondary" type="submit">
              {t("request.assign")}
            </Button>
          </form>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <LanguageSwitcher
              currentPath={`/requests/${request.id}`}
              label={t("language.label")}
              locale={locale}
            />
            <span className="hidden md:inline-flex">
              <ThemeToggle initial={themePreference} labels={themeLabels} />
            </span>
            <Button size="sm" variant="secondary">
              <CalendarClock aria-hidden="true" size={14} />
              {t("request.reminder")}
            </Button>
            <button
              type="button"
              data-details-sheet
              aria-label={t("request.detail.detailsSheet")}
              // PR C wires the sheet itself; for PR B this stub is a no-op.
              onClick={undefined}
              className="inline-flex h-7 items-center gap-1 rounded-[5px] border border-[var(--line)] bg-[var(--paper)] px-2 text-[11.5px] text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)] xl:hidden"
            >
              {t("request.detail.detailsSheet")}
              <ChevronDown aria-hidden="true" size={12} />
            </button>
          </div>
        </div>
      </header>

      {/* Body: thread+composer (left flex), side blocks (right 280px) */}
      <div
        data-detail-body
        className="flex min-h-0 flex-1 overflow-hidden"
      >
        <div className="flex min-w-0 flex-1 flex-col">{paneShell}</div>

        <aside
          aria-label="Request side panel"
          className="hidden w-[280px] shrink-0 overflow-y-auto border-l border-[var(--line)] bg-[var(--paper)] xl:block"
        >
          <details
            open
            className="border-b border-[var(--line-2)] px-4 py-3 [&[open]>summary>svg]:rotate-180"
          >
            <summary className="flex cursor-pointer items-center justify-between font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted-2)]">
              {t("request.pet")}
              <ChevronDown size={12} />
            </summary>
            <div className="mt-2.5 flex items-start gap-2.5">
              <div
                aria-hidden="true"
                className="h-14 w-14 shrink-0 rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]"
              />
              <div className="min-w-0">
                <p className="break-words text-[13.5px] font-medium text-[var(--ink)]">
                  {request.petName}
                </p>
                <p className="text-[12px] text-[var(--muted)]">
                  {request.species}
                  {request.petBreed ? ` · ${request.petBreed}` : ""}
                </p>
              </div>
            </div>
          </details>

          <details
            open
            className="border-b border-[var(--line-2)] px-4 py-3 [&[open]>summary>svg]:rotate-180"
          >
            <summary className="flex cursor-pointer items-center justify-between font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted-2)]">
              {t("request.events")}
              <ChevronDown size={12} />
            </summary>
            <ol className="mt-2.5 flex flex-col gap-1.5 text-[12px] text-[var(--ink-2)]">
              {request.events.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between gap-2 font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--muted)]"
                >
                  <span className="truncate">{event.eventType}</span>
                  <span className="text-[var(--muted-2)]">
                    {formatDateTime(event.createdAt)}
                  </span>
                </li>
              ))}
              {request.events.length === 0 ? (
                <li className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--muted-2)]">
                  —
                </li>
              ) : null}
            </ol>
          </details>

          <details
            open
            className="px-4 py-3 [&[open]>summary>svg]:rotate-180"
          >
            <summary className="flex cursor-pointer items-center justify-between font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted-2)]">
              {t("request.internalNotes")}
              <ChevronDown size={12} />
            </summary>

            <form
              action={addInternalNote}
              className="mt-2 flex flex-col gap-2"
              data-action="note"
            >
              <input name="lang" type="hidden" value={locale} />
              <input name="requestId" type="hidden" value={request.id} />
              <label htmlFor="note-body" className="sr-only">
                {t("request.addInternalNote")}
              </label>
              <textarea
                id="note-body"
                name="body"
                rows={2}
                maxLength={4000}
                placeholder={t("request.notePlaceholder")}
                required
                className="min-h-[60px] w-full resize-y rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-2 text-[12.5px] leading-5 text-[var(--ink)]"
              />
              <Button size="sm" variant="secondary" type="submit">
                {t("request.saveNote")}
              </Button>
            </form>

            {request.notes.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-2">
                {request.notes.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-[var(--radius)] bg-[var(--amber-soft)] p-2 text-[12.5px] leading-5 text-[var(--ink-2)]"
                  >
                    {note.body}
                  </li>
                ))}
              </ul>
            ) : null}
          </details>
        </aside>
      </div>

      {/* Mobile-only: surface the language switcher in the header so the
          sticky action row stays compact. */}
      <span className="sr-only">
        <Languages aria-hidden="true" size={1} />
      </span>
    </section>
  );
}

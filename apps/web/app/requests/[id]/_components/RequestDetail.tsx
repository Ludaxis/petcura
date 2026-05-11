import Link from "next/link";
import {
  ChevronDown,
  Languages,
  X
} from "lucide-react";
import { Badge, Button } from "@petcura/ui";
import {
  createTranslator,
  getChannelLabel,
  getRequestCategoryLabel,
  getRequestStatusLabel,
  getReminderStatusLabel,
  getReminderTypeLabel,
  getUrgencyLabel,
  reminderTypes,
  requestStatusColumns,
  type SupportedLocale
} from "@petcura/shared";
import type { RequestDetail as RequestDetailModel } from "@/lib/requests";
import {
  addInternalNote,
  assignRequest,
  updateRequestStatus,
  updateRequestUrgency
} from "../actions";
import { CreateReminderDialog } from "./CreateReminderDialog";
import { DetailsSheet } from "./DetailsSheet";

type RequestDetailProps = {
  request: RequestDetailModel;
  locale: SupportedLocale;
  formatDateTime: (iso: string) => string;
  currentStaffUserId: string;
  /**
   * The right pane is composed: this server component renders the static
   * frame (pet header · staff actions · side blocks · note form), and
   * `paneShell` is the pre-built client orchestration for the thread + AI
   * card + composer + keyboard model.
   */
  paneShell: React.ReactNode;
  /**
   * Localized href used by the small top-right Close affordance ("X") to
   * walk back to /inbox. The sidebar's Inbox nav is the primary back
   * affordance — this is the explicit "close this case" cue.
   */
  closeHref: string;
  /** aria-label for the Close button. */
  closeLabel: string;
};

const urgencyOptions = ["low", "medium", "high"] as const;

export function RequestDetail({
  request,
  locale,
  formatDateTime,
  currentStaffUserId,
  paneShell,
  closeHref,
  closeLabel
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
            {/*
              Small ghost "X" — explicit "close this case" affordance. The
              sidebar's Inbox row is the primary back path; this gives a
              direct exit at the top-right where users expect a close
              control in dense operational UIs.
            */}
            <Link
              href={closeHref}
              aria-label={closeLabel}
              title={closeLabel}
              data-close-request
              className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius)] text-[var(--muted)] transition hover:bg-[var(--soft)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              <X aria-hidden="true" size={14} />
            </Link>
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
            <CreateReminderDialog
              requestId={request.id}
              locale={locale}
              options={reminderTypes.map((type) => ({
                value: type.value,
                label: getReminderTypeLabel(type.value, locale)
              }))}
              channels={[
                { value: "whatsapp", label: getChannelLabel("whatsapp", locale) }
              ]}
              labels={{
                trigger: t("request.reminder"),
                title: t("request.reminder.create"),
                type: t("request.reminder.type"),
                titleField: t("request.reminder.title"),
                titlePlaceholder: t("request.reminder.titlePlaceholder"),
                dueAt: t("request.reminder.dueAt"),
                body: t("request.reminder.body"),
                bodyPlaceholder: t("request.reminder.bodyPlaceholder"),
                channel: t("request.reminder.channel"),
                submit: t("request.reminder.create"),
                cancel: t("request.reminder.cancel")
              }}
            />
            {/*
              Mobile/tablet/laptop (<xl) escape hatch: the right rail (Pet,
              Reminders, Events, Notes) lives in `xl:block`, so on narrower
              viewports it's hidden. Tapping Details slides the same content
              in from the right as a Sheet so phone/tablet/laptop users keep
              parity with desktop. Hidden on `xl+` where the inline rail is
              already visible.
            */}
            <DetailsSheet
              triggerLabel={t("request.detail.detailsSheet")}
              panelLabel={t("request.detail.sidePanel")}
              closeLabel={t("inbox.kbdSheet.close")}
            >
              <SideBlocks
                request={request}
                locale={locale}
                formatDateTime={formatDateTime}
                t={t}
                idSuffix="sheet"
              />
            </DetailsSheet>
          </div>
        </div>
      </header>

      {/* Body: thread+composer (left flex), side blocks (right 280px on xl,
          inline accordions on md–xl, hidden on <md where the Details sheet
          stub stands in until PR C wires it). */}
      <div
        data-detail-body
        className="flex min-h-0 flex-1 overflow-hidden"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          {paneShell}
          {/* Tablet (md–xl): inline accordions below the thread so users
              don't lose the side blocks when the right column is hidden. */}
          <aside
            aria-label={t("request.detail.sidePanel")}
            data-side-panel="inline"
            className="hidden border-t border-[var(--line)] bg-[var(--paper)] md:block xl:hidden"
          >
            <SideBlocks
              request={request}
              locale={locale}
              formatDateTime={formatDateTime}
              t={t}
              idSuffix="inline"
            />
          </aside>
        </div>

        <aside
          aria-label={t("request.detail.sidePanel")}
          data-side-panel="rail"
          className="hidden w-[280px] shrink-0 overflow-y-auto border-l border-[var(--line)] bg-[var(--paper)] xl:block"
        >
          <SideBlocks
            request={request}
            locale={locale}
            formatDateTime={formatDateTime}
            t={t}
            idSuffix="rail"
          />
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

type SideBlocksProps = {
  request: RequestDetailModel;
  locale: SupportedLocale;
  formatDateTime: (iso: string) => string;
  t: ReturnType<typeof createTranslator>;
  /** Disambiguates form/textarea IDs because the side panel renders twice
   *  (rail + inline tablet accordion) so both copies stay in the SSR DOM. */
  idSuffix: string;
};

/**
 * Pet card / Events / Notes side blocks. Rendered twice in the layout:
 *   - xl+: as a 280px right rail.
 *   - md–xl: inline below the thread (tablet escape hatch from W5).
 * Each block uses an `<h2>` inside `<summary>` so heading nav (JAWS/NVDA)
 * works without changing the visual mono-uppercase styling.
 */
function SideBlocks({
  request,
  locale,
  formatDateTime,
  t,
  idSuffix
}: SideBlocksProps) {
  const headingClass =
    "font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted-2)]";
  return (
    <>
      <details
        open
        className="border-b border-[var(--line-2)] px-4 py-3 [&[open]>summary>svg]:rotate-180"
      >
        <summary className="flex cursor-pointer items-center justify-between">
          <h2 className={headingClass}>{t("request.pet")}</h2>
          <ChevronDown aria-hidden="true" size={12} />
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
        <summary className="flex cursor-pointer items-center justify-between">
          <h2 className={headingClass}>{t("request.reminder.upcoming")}</h2>
          <ChevronDown aria-hidden="true" size={12} />
        </summary>
        {request.reminders.length > 0 ? (
          <ol className="mt-2.5 flex flex-col gap-2">
            {request.reminders.map((reminder) => (
              <li
                key={reminder.id}
                className="rounded-[var(--radius)] border border-[var(--line-2)] bg-[var(--soft)] p-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words text-[12.5px] font-semibold text-[var(--ink)]">
                      {reminder.title}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--muted)]">
                      {getReminderTypeLabel(reminder.type, locale)} ·{" "}
                      {formatDateTime(reminder.dueAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[var(--paper)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--muted)]">
                    {getReminderStatusLabel(reminder.status, locale)}
                  </span>
                </div>
                {reminder.body ? (
                  <p className="mt-2 break-words text-[12px] leading-5 text-[var(--ink-2)]">
                    {reminder.body}
                  </p>
                ) : null}
                {reminder.lastSendError ? (
                  <p className="mt-2 break-words rounded-[var(--radius)] bg-[var(--red-soft)] px-2 py-1 text-[11.5px] text-[var(--red)]">
                    {reminder.lastSendError}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2.5 text-[12px] text-[var(--muted)]">
            {t("request.reminder.empty")}
          </p>
        )}
      </details>

      <details
        open
        className="border-b border-[var(--line-2)] px-4 py-3 [&[open]>summary>svg]:rotate-180"
      >
        <summary className="flex cursor-pointer items-center justify-between">
          <h2 className={headingClass}>{t("request.events")}</h2>
          <ChevronDown aria-hidden="true" size={12} />
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

      <details open className="px-4 py-3 [&[open]>summary>svg]:rotate-180">
        <summary className="flex cursor-pointer items-center justify-between">
          <h2 className={headingClass}>{t("request.internalNotes")}</h2>
          <ChevronDown aria-hidden="true" size={12} />
        </summary>

        <form
          action={addInternalNote}
          className="mt-2 flex flex-col gap-2"
          data-action="note"
        >
          <input name="lang" type="hidden" value={locale} />
          <input name="requestId" type="hidden" value={request.id} />
          <label
            htmlFor={`note-body-${idSuffix}-${request.id}`}
            className="sr-only"
          >
            {t("request.addInternalNote")}
          </label>
          <textarea
            id={`note-body-${idSuffix}-${request.id}`}
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
    </>
  );
}

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
import { cn } from "@petcura/ui";
import type { RequestDetail as RequestDetailModel } from "@/lib/requests";
import {
  addInternalNote,
  assignRequest,
  editAiSummary,
  translateAiSummary,
  updateRequestStatus,
  updateRequestUrgency
} from "../actions";
import {
  cancelAppointment,
  confirmAppointmentFirstSlot,
  offerAppointmentSlots
} from "@/app/calendar/actions";
import type { AiMemoryPanelProps } from "./AiMemoryPanel";
import { CreateReminderDialog } from "./CreateReminderDialog";
import { DetailsSheet } from "./DetailsSheet";
import { RequestEditSheet } from "./RequestEditSheet";
import { SideAiMemory } from "./SideAiMemory";

/**
 * Props the page hands down for the AI memory side block. Mirrors the
 * shape previously consumed by `RequestPaneShell` minus the call-site
 * concerns (`requestId`, `locale`, `hasDraft`, `onAnnounce`) — those are
 * applied here so the page stays the single owner of the data shape.
 */
export type RequestDetailAiMemoryProps = Omit<
  AiMemoryPanelProps,
  "requestId" | "locale" | "hasDraft" | "onAnnounce"
>;

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
   * AI memory block now lives in the side rail (above Events) instead of
   * above the AI draft card in the main column. Passed through from
   * `page.tsx` and forwarded into every mount of `SideBlocks` (xl rail,
   * md–xl inline accordion, mobile sheet).
   */
  aiMemory?: RequestDetailAiMemoryProps | null;
  /** Whether the request already has a pending AI draft. Drives the
   *  panel's "Generate" vs "Regenerate" CTA when the page didn't pre-set
   *  `draftControl.mode`. */
  hasDraft: boolean;
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
  aiMemory,
  hasDraft,
  closeHref,
  closeLabel
}: RequestDetailProps) {
  const t = createTranslator(locale);
  const currentAssignee = request.staffOptions.find(
    (staff) => staff.id === request.assignedStaffId
  );
  // Display-label policy for the Assigned dropdown:
  //   * Current viewer        → "<name> (<role>) · you" / "<role> · you" fallback
  //   * Known email           → "<local-part-of-email> (<role>)" e.g. "anna (vet)"
  //   * Unknown / fixture     → "<role>" only — UUID-shaped local-parts are
  //                             treated as unknown to keep dev fixtures
  //                             ("petcura-detail-1778…") from polluting the list.
  // Before this change every non-current staff option rendered as the bare
  // role string, so a clinic with N admins surfaced N identical "admin"
  // entries and nobody could route to a specific person.
  const displayNameFromEmail = (email: string | null) => {
    if (!email) return null;
    const local = email.split("@", 1)[0];
    if (!local) return null;
    if (/^[0-9a-f-]{8,}$/i.test(local)) return null;
    return local;
  };
  const getStaffLabel = (staff: (typeof request.staffOptions)[number]) => {
    const roleLabel = t(`role.${staff.role}` as Parameters<typeof t>[0]);
    const youSuffix = ` · ${t("request.you")}`;
    const name = displayNameFromEmail(staff.email);
    if (staff.userId === currentStaffUserId) {
      return name
        ? `${name} (${roleLabel})${youSuffix}`
        : `${roleLabel}${youSuffix}`;
    }
    return name ? `${name} (${roleLabel})` : roleLabel;
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col self-stretch overflow-hidden bg-[var(--paper)]">
      {/* Detail header — pet identity + crumbs + actions row */}
      <header
        data-detail-head
        /*
         * Shared name for the View Transitions API. Pairs with the matching
         * `pc-request-{id}` on the inbox row so clicking a row morphs the
         * row into this header during the route swap. The browser pairs by
         * name; with one detail visible at a time only the source row's
         * name matches, so we never get a multi-element conflict.
         */
        style={
          {
            viewTransitionName: `pc-request-${request.id}`
          } as React.CSSProperties
        }
        className="flex shrink-0 flex-col gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-4 py-3 sm:px-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="break-words text-[18px] font-semibold leading-tight lg:text-[20px]">
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
          </div>
          <div
            className="flex flex-wrap items-center gap-2"
            data-current-assignee
          >
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
              Assignee promoted from a separate text line to a chip in the
              badge band — keeps the header to two lines below 1280px and
              tightens the visual hierarchy.
            */}
            <Badge tone="neutral">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--muted)]">
                {t("request.assigned")}
              </span>
              <span className="font-medium text-[var(--ink-2)]">
                {currentAssignee
                  ? getStaffLabel(currentAssignee)
                  : t("request.unassigned")}
              </span>
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

        {/* Sticky action row: status / urgency / assign — inline forms from
            `md+` (tablet+) so reception staff don't drop into a sheet for
            the most common edits. The Edit sheet remains the touch-target
            home for phones (< md) where inline selects would be cramped. */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="hidden flex-wrap items-end gap-3 md:flex">
            <StaffActionForms
              request={request}
              locale={locale}
              t={t}
              idSuffix="inline"
              getStaffLabel={getStaffLabel}
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Phone-only Edit trigger — opens a right-side Sheet that
                re-renders the same three forms with a stacked layout and
                taller selects so touch targets clear 44pt. Hidden on
                `md+` where the inline forms are already visible. */}
            <RequestEditSheet
              triggerLabel={t("request.detail.editActions")}
              sheetTitle={t("request.detail.editSheet.title")}
              closeLabel={t("inbox.kbdSheet.close")}
              className="md:hidden"
            >
              <StaffActionForms
                request={request}
                locale={locale}
                t={t}
                idSuffix="sheet"
                getStaffLabel={getStaffLabel}
                stack
              />
            </RequestEditSheet>
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
                aiMemory={aiMemory}
                hasDraft={hasDraft}
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
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {paneShell}
          {/* Tablet (md–xl): inline accordions below the thread so users
              don't lose the side blocks when the right column is hidden. */}
          <aside
            aria-label={t("request.detail.sidePanel")}
            data-side-panel="inline"
            className="hidden shrink-0 border-t border-[var(--line)] bg-[var(--paper)] md:block xl:hidden"
          >
            <SideBlocks
              request={request}
              locale={locale}
              formatDateTime={formatDateTime}
              t={t}
              idSuffix="inline"
              aiMemory={aiMemory}
              hasDraft={hasDraft}
            />
          </aside>
        </div>

        <aside
          aria-label={t("request.detail.sidePanel")}
          data-side-panel="rail"
          className="hidden h-full min-h-0 w-[280px] shrink-0 overflow-hidden border-l border-[var(--line)] bg-[var(--paper)] xl:flex xl:flex-col"
        >
          <div
            data-side-panel-scroll
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            <SideBlocks
              request={request}
              locale={locale}
              formatDateTime={formatDateTime}
              t={t}
              idSuffix="rail"
              aiMemory={aiMemory}
              hasDraft={hasDraft}
            />
          </div>
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
  /** AI memory panel data. When provided, an "AI memory" accordion is
   *  rendered directly above the Events block. */
  aiMemory?: RequestDetailAiMemoryProps | null | undefined;
  /** Whether the request has a pending AI draft (drives generate vs.
   *  regenerate CTA inside the panel). */
  hasDraft?: boolean | undefined;
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
  idSuffix,
  aiMemory,
  hasDraft = false
}: SideBlocksProps) {
  const headingClass =
    "font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--muted-2)]";
  const formatToken = (value: string) => value.replaceAll("_", " ");
  return (
    <>
      {request.aiIntake ? (
        <details
          open
          data-ai-intake
          className="border-b border-[var(--line-2)] px-4 py-3 [&[open]>summary>svg]:rotate-180"
        >
          <summary className="flex cursor-pointer items-center justify-between">
            <h2 className={headingClass}>{t("request.intakeHandoff")}</h2>
            <ChevronDown aria-hidden="true" size={12} />
          </summary>
          <div className="mt-2.5 rounded-[var(--radius)] border border-[var(--line-2)] bg-[var(--soft)] p-3">
            <p className="break-words text-[12.5px] leading-5 text-[var(--ink-2)]">
              {request.aiIntake.handoffSummary}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-[var(--primary-soft)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--primary-strong)]">
                {t("request.intakeRoute")}:{" "}
                {formatToken(request.aiIntake.routingSuggestion)}
              </span>
              <span className="rounded-full bg-[var(--paper)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--muted)]">
                {t("request.intakeService")}:{" "}
                {formatToken(request.aiIntake.serviceIntent)}
              </span>
              <span className="rounded-full bg-[var(--paper)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--muted)]">
                {t("request.intakeCategorySuggestion")}:{" "}
                {getRequestCategoryLabel(
                  request.aiIntake.categorySuggestion,
                  locale
                )}
              </span>
              {request.aiIntake.urgencySuggestion ? (
                <span className="rounded-full bg-[var(--amber-soft)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--amber)]">
                  {t("request.aiUrgencySuggestion")}:{" "}
                  {getUrgencyLabel(request.aiIntake.urgencySuggestion, locale)}
                </span>
              ) : null}
              {request.aiIntake.emergencySignal ? (
                <span className="rounded-full bg-[var(--red-soft)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--red)]">
                  {t("request.intakeEmergencySignal")}
                </span>
              ) : null}
            </div>
            {request.aiIntake.clarifyingQuestions.length > 0 ? (
              <div className="mt-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted-2)]">
                  {t("request.intakeQuestions")}
                </p>
                <ul className="mt-1.5 grid gap-1 text-[12px] leading-5 text-[var(--ink-2)]">
                  {request.aiIntake.clarifyingQuestions.map((question) => (
                    <li key={question}>• {question}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {request.aiIntake.missingFields.length > 0 ? (
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--muted)]">
                {t("request.intakeMissing")}:{" "}
                {request.aiIntake.missingFields.map(formatToken).join(", ")}
              </p>
            ) : null}
            <p className="mt-2 text-[11.5px] leading-5 text-[var(--muted)]">
              {t("request.intakeAdvisoryNotice")}{" "}
              {t("request.intakeConfidence")}:{" "}
              {Math.round(request.aiIntake.confidence * 100)}%
            </p>
          </div>
        </details>
      ) : null}

      {request.aiSummary ? (
        <details
          open
          data-ai-summary
          className="border-b border-[var(--line-2)] px-4 py-3 [&[open]>summary>svg]:rotate-180"
        >
          <summary className="flex cursor-pointer items-center justify-between">
            <h2 className={headingClass}>{t("request.aiSummary")}</h2>
            <ChevronDown aria-hidden="true" size={12} />
          </summary>
          <div className="mt-2.5 rounded-[var(--radius)] border border-[var(--line-2)] bg-[var(--soft)] p-3">
            <p className="break-words text-[12.5px] leading-5 text-[var(--ink-2)]">
              {request.aiSummary}
            </p>
            {request.riskFlags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {request.riskFlags.map((flag) => (
                  <span
                    key={flag}
                    className="rounded-full bg-[var(--red-soft)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--red)]"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            ) : null}
            {request.urgencySuggestion ? (
              <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--muted)]">
                {t("request.aiUrgencySuggestion")}:{" "}
                {getUrgencyLabel(request.urgencySuggestion, locale)}
              </p>
            ) : null}
            <p className="mt-2 text-[11.5px] leading-5 text-[var(--muted)]">
              {t("request.aiNotice")}
            </p>
            {request.aiSummaryVersion ? (
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--muted-2)]">
                {t("request.aiVersion").replace(
                  "{version}",
                  request.aiSummaryVersion
                )}
              </p>
            ) : null}
            <div className="mt-3 border-t border-[var(--line-2)] pt-3">
              {locale !== "en" && !request.aiSummaryHasTranslation ? (
                <form action={translateAiSummary} className="mb-2">
                  <input name="lang" type="hidden" value={locale} />
                  <input name="requestId" type="hidden" value={request.id} />
                  <input name="targetLocale" type="hidden" value={locale} />
                  <Button size="sm" variant="secondary" type="submit">
                    {t("request.aiTranslateTo").replace(
                      "{locale}",
                      locale.toUpperCase()
                    )}
                  </Button>
                </form>
              ) : locale !== "en" ? (
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--primary)]">
                  {t("request.aiTranslated")}
                </p>
              ) : null}
              <details className="[&[open]>summary>svg]:rotate-180">
                <summary className="flex cursor-pointer items-center justify-between font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted-2)]">
                  {t("request.aiEdit")}
                  <ChevronDown aria-hidden="true" size={11} />
                </summary>
                <form action={editAiSummary} className="mt-2 grid gap-2">
                  <input name="lang" type="hidden" value={locale} />
                  <input name="requestId" type="hidden" value={request.id} />
                  <input name="targetLocale" type="hidden" value={locale} />
                  <label
                    className="grid gap-1 text-[10px] uppercase tracking-[0.04em] text-[var(--muted)]"
                    htmlFor={`ai-summary-text-${idSuffix}`}
                  >
                    {t("request.aiSummaryText")}
                    <textarea
                      id={`ai-summary-text-${idSuffix}`}
                      name="summaryText"
                      defaultValue={request.aiSummary}
                      className="min-h-24 resize-y rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-[12px] normal-case leading-5 tracking-normal text-[var(--ink)]"
                    />
                  </label>
                  <label
                    className="grid gap-1 text-[10px] uppercase tracking-[0.04em] text-[var(--muted)]"
                    htmlFor={`ai-risk-flags-${idSuffix}`}
                  >
                    {t("request.aiRiskFlagsEdit")}
                    <textarea
                      id={`ai-risk-flags-${idSuffix}`}
                      name="riskFlagsText"
                      defaultValue={request.riskFlags.join("\n")}
                      className="min-h-20 resize-y rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 font-mono text-[11px] normal-case leading-5 tracking-normal text-[var(--ink)]"
                    />
                  </label>
                  <Button size="sm" variant="secondary" type="submit">
                    {t("request.aiSaveSummary")}
                  </Button>
                </form>
              </details>
            </div>
          </div>
        </details>
      ) : null}

      {request.appointmentContext ? (
        <details
          open
          data-appointment-panel
          className="border-b border-[var(--line-2)] px-4 py-3 [&[open]>summary>svg]:rotate-180"
        >
          <summary className="flex cursor-pointer items-center justify-between">
            <h2 className={headingClass}>Appointment</h2>
            <ChevronDown aria-hidden="true" size={12} />
          </summary>
          <div className="mt-2.5 grid gap-3">
            <div className="rounded-[var(--radius)] border border-[var(--line-2)] bg-[var(--soft)] p-3">
              <p className="text-[13px] font-semibold text-[var(--ink)]">
                {request.appointmentContext.appointment.serviceName}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-[var(--muted)]">
                Status: {request.appointmentContext.appointment.status}
                {request.appointmentContext.appointment.scheduledAt
                  ? ` · ${formatDateTime(request.appointmentContext.appointment.scheduledAt)}`
                  : ""}
              </p>
              {request.appointmentContext.appointment.notes ? (
                <p className="mt-2 text-[12px] leading-5 text-[var(--ink-2)]">
                  {request.appointmentContext.appointment.notes}
                </p>
              ) : null}
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                Earliest valid slots
              </p>
              <ol className="mt-2 grid gap-2">
                {request.appointmentContext.suggestedSlots.length > 0 ? (
                  request.appointmentContext.suggestedSlots.map((slot, index) => (
                    <li
                      key={`${slot.staffId}-${slot.startsAt}`}
                      className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-2"
                    >
                      <p className="text-[12.5px] font-semibold text-[var(--ink)]">
                        {index + 1}. {formatDateTime(slot.startsAt)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                        {slot.staffLabel} · {slot.durationMinutes}m
                      </p>
                    </li>
                  ))
                ) : (
                  <li className="rounded-[var(--radius)] border border-dashed border-[var(--line)] p-3 text-[12px] text-[var(--muted)]">
                    No valid slots yet. Add availability in Settings.
                  </li>
                )}
              </ol>
            </div>

            {request.appointmentContext.suggestedSlots.length > 0 ? (
              <form action={offerAppointmentSlots} className="grid gap-2">
                <input name="lang" type="hidden" value={locale} />
                <input name="requestId" type="hidden" value={request.id} />
                <input
                  name="appointmentId"
                  type="hidden"
                  value={request.appointmentContext.appointment.id}
                />
                <input
                  name="slotsJson"
                  type="hidden"
                  value={JSON.stringify(
                    request.appointmentContext.suggestedSlots.slice(0, 3)
                  )}
                />
                <textarea
                  name="messageBody"
                  defaultValue={`We found these appointment options:\n${request.appointmentContext.suggestedSlots
                    .slice(0, 3)
                    .map((slot, index) => `${index + 1}. ${formatDateTime(slot.startsAt)} with ${slot.staffLabel}`)
                    .join("\n")}\n\nReply with 1, 2, or 3 to confirm, or tell us another preferred time.`}
                  className="min-h-28 resize-y rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2 py-2 text-[12px] leading-5 text-[var(--ink)]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" type="submit">
                    Offer slots
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    formAction={confirmAppointmentFirstSlot}
                    type="submit"
                  >
                    Confirm first
                  </Button>
                </div>
              </form>
            ) : null}

            {request.appointmentContext.offers.length > 0 ? (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                  Active offers
                </p>
                <ol className="mt-2 grid gap-2">
                  {request.appointmentContext.offers.slice(0, 2).map((offer) => (
                    <li
                      key={offer.id}
                      className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-2 text-[12px] text-[var(--muted)]"
                    >
                      {offer.status} · expires {formatDateTime(offer.expiresAt)}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {request.appointmentContext.appointment.status !== "cancelled" ? (
              <form action={cancelAppointment}>
                <input name="lang" type="hidden" value={locale} />
                <input name="requestId" type="hidden" value={request.id} />
                <input
                  name="appointmentId"
                  type="hidden"
                  value={request.appointmentContext.appointment.id}
                />
                <Button size="sm" variant="ghost" type="submit">
                  Cancel appointment
                </Button>
              </form>
            ) : null}
          </div>
        </details>
      ) : null}

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

      {aiMemory ? (
        <details
          open
          data-ai-memory
          className="border-b border-[var(--line-2)] px-4 py-3 [&[open]>summary>svg]:rotate-180"
        >
          <summary className="flex cursor-pointer items-center justify-between">
            {/* Use the panel's own localized title — keeps EN/ET/RU in
                lockstep with the panel header without adding parallel
                translation keys. */}
            <h2 className={headingClass}>{aiMemory.labels.title}</h2>
            <ChevronDown aria-hidden="true" size={12} />
          </summary>
          <div className="mt-2.5">
            {/* The panel ships with its own outer card chrome
                (`mx-4 mt-3 rounded ... bg-[var(--paper)]`). Inside an
                accordion that already pads `px-4 py-3`, those margins
                double up — so we mount it through a client wrapper that
                drops the outer wrapper styles while leaving the panel's
                internals untouched. */}
            <SideAiMemory
              requestId={request.id}
              locale={locale}
              hasDraft={hasDraft}
              {...aiMemory}
            />
          </div>
        </details>
      ) : null}

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

type StaffActionFormsProps = {
  request: RequestDetailModel;
  locale: SupportedLocale;
  t: ReturnType<typeof createTranslator>;
  /** Disambiguates `<label htmlFor>` + `<select id>` because the same
   *  three forms render twice in the SSR DOM (inline on `lg+` and inside
   *  RequestEditSheet on smaller viewports). Without this we'd ship
   *  duplicate HTML ids and break label/select association for assistive
   *  tech. */
  idSuffix: string;
  getStaffLabel: (staff: RequestDetailModel["staffOptions"][number]) => string;
  /** When true, lays the three forms out vertically (column flex) and
   *  bumps select height to `h-9` so touch targets clear 44pt inside the
   *  edit sheet. */
  stack?: boolean;
};

/**
 * The three operational forms — status, urgency, assignee — extracted so
 * the same JSX renders inline (sticky action row on `lg+`) and inside the
 * mobile/tablet RequestEditSheet. Both instances share the same server
 * actions; the only differences are layout (`stack`) and the `idSuffix`
 * the parent supplies to keep DOM ids unique across both mounts.
 */
function StaffActionForms({
  request,
  locale,
  t,
  idSuffix,
  getStaffLabel,
  stack = false
}: StaffActionFormsProps) {
  const selectClass = cn(
    "rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2 text-[12.5px] text-[var(--ink)]",
    stack ? "h-9 w-full" : "h-8"
  );
  const formClass = cn(
    "items-end gap-2",
    stack ? "flex flex-col items-stretch" : "flex"
  );
  const labelClass = cn(
    "flex flex-col gap-1 text-[10.5px] font-mono uppercase tracking-[0.06em] text-[var(--muted-2)]",
    stack && "w-full"
  );

  return (
    <>
      <form
        action={updateRequestStatus}
        className={formClass}
        data-action="status"
      >
        <input name="lang" type="hidden" value={locale} />
        <input name="requestId" type="hidden" value={request.id} />
        <label className={labelClass} htmlFor={`status-${idSuffix}`}>
          {t("request.status")}
          <select
            id={`status-${idSuffix}`}
            name="status"
            defaultValue={request.status}
            className={selectClass}
          >
            {requestStatusColumns.map((status) => (
              <option key={status.value} value={status.value}>
                {getRequestStatusLabel(status.value, locale)}
              </option>
            ))}
          </select>
        </label>
        <Button
          size={stack ? "md" : "sm"}
          variant="secondary"
          type="submit"
          className={stack ? "w-full" : undefined}
        >
          {t("request.save")}
        </Button>
      </form>

      <form
        action={updateRequestUrgency}
        className={formClass}
        data-action="urgency"
      >
        <input name="lang" type="hidden" value={locale} />
        <input name="requestId" type="hidden" value={request.id} />
        <label className={labelClass} htmlFor={`urgency-${idSuffix}`}>
          {t("request.urgency")}
          <select
            id={`urgency-${idSuffix}`}
            name="urgency"
            defaultValue={request.urgency}
            className={selectClass}
          >
            {urgencyOptions.map((urgency) => (
              <option key={urgency} value={urgency}>
                {getUrgencyLabel(urgency, locale)}
              </option>
            ))}
          </select>
        </label>
        <Button
          size={stack ? "md" : "sm"}
          variant="secondary"
          type="submit"
          className={stack ? "w-full" : undefined}
        >
          {t("request.save")}
        </Button>
      </form>

      <form
        action={assignRequest}
        className={formClass}
        data-action="assign"
      >
        <input name="lang" type="hidden" value={locale} />
        <input name="requestId" type="hidden" value={request.id} />
        <label className={labelClass} htmlFor={`staffMemberId-${idSuffix}`}>
          {t("request.assigned")}
          <select
            id={`staffMemberId-${idSuffix}`}
            name="staffMemberId"
            defaultValue={request.assignedStaffId ?? "unassigned"}
            className={selectClass}
          >
            <option value="unassigned">{t("request.unassigned")}</option>
            {request.staffOptions.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {getStaffLabel(staff)}
              </option>
            ))}
          </select>
        </label>
        <Button
          size={stack ? "md" : "sm"}
          variant="secondary"
          type="submit"
          className={stack ? "w-full" : undefined}
        >
          {t("request.assign")}
        </Button>
      </form>
    </>
  );
}

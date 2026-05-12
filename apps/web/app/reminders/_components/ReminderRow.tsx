"use client";

import { useOptimistic } from "react";
import Link from "next/link";
import { Check, Clock, X } from "lucide-react";
import { Badge, Button, cn } from "@petcura/ui";
import {
  getChannelLabel,
  getReminderStatusLabel,
  getReminderTypeLabel,
  withLocale,
  type ReminderStatus,
  type SupportedLocale
} from "@petcura/shared";
import type { ReminderFilter, ReminderListItem } from "@/lib/reminders";
import { PendingSubmitButton } from "@/app/_components/forms/PendingSubmitButton";
import { updateReminderStatus } from "../actions";

type Labels = {
  pet: string;
  owner: string;
  due: string;
  channel: string;
  openRequest: string;
  markAcknowledged: string;
  markCompleted: string;
  cancel: string;
};

type Props = {
  reminder: ReminderListItem;
  locale: SupportedLocale;
  filter: ReminderFilter;
  dueAtLabel: string;
  actionable: boolean;
  labels: Labels;
};

const actionableStatuses = new Set<ReminderStatus>([
  "scheduled",
  "sent",
  "acknowledged",
  "missed"
]);

function statusTone(
  status: ReminderStatus
): "neutral" | "teal" | "amber" | "red" {
  if (status === "missed") return "amber";
  if (status === "cancelled") return "red";
  if (status === "sent" || status === "acknowledged") return "teal";
  return "neutral";
}

/**
 * Optimistic-status reminder row.
 *
 * The reminder list is server-rendered, but each row's snooze/complete/
 * cancel action goes through a server action that redirects back to
 * `/reminders` (~600-900ms in the field). Without optimistic state the
 * status badge and action buttons sit unchanged until the redirect lands,
 * which feels broken on a list with many rows.
 *
 * We bridge the gap with `useOptimistic`:
 *   - Each row owns its own optimistic status seeded from the server.
 *   - On submit, the row immediately flips its `Badge` to the target
 *     status, dims to 60% opacity, and the affected action button shows
 *     the inline `<Spinner>` via `PendingSubmitButton`.
 *   - The server action ALWAYS redirects (success or error). Once the
 *     redirect re-renders the page, the row remounts with the canonical
 *     status and `useOptimistic` resets to the seed. On
 *     `?action_error=reminder`, the parent already announces the failure
 *     via aria-live; the optimistic flip is discarded naturally by the
 *     redirect.
 *
 * `prefers-reduced-motion: reduce` is respected via Tailwind's
 * `motion-reduce` modifier — the dim still applies (it's a state cue, not
 * decoration), but the transition is removed.
 */
export function ReminderRow({
  reminder,
  locale,
  filter,
  dueAtLabel,
  actionable,
  labels
}: Props) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic<
    ReminderStatus,
    ReminderStatus
  >(reminder.status, (_prev, next) => next);

  const isOptimistic = optimisticStatus !== reminder.status;
  const showActions = actionable && actionableStatuses.has(optimisticStatus);

  return (
    <li
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-3 shadow-sm transition-opacity duration-200 motion-reduce:transition-none",
        isOptimistic && "opacity-60"
      )}
      aria-busy={isOptimistic || undefined}
    >
      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone(optimisticStatus)}>
              {getReminderStatusLabel(optimisticStatus, locale)}
            </Badge>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--muted)]">
              {getReminderTypeLabel(reminder.type, locale)}
            </span>
          </div>
          <h2 className="mt-2 break-words text-[15px] font-semibold text-[var(--ink)]">
            {reminder.title}
          </h2>
          {reminder.body ? (
            <p className="mt-1 break-words text-[12.5px] leading-5 text-[var(--ink-2)]">
              {reminder.body}
            </p>
          ) : null}
          {reminder.lastSendError ? (
            <p className="mt-2 break-words rounded-[var(--radius)] bg-[var(--red-soft)] px-2 py-1 text-[12px] text-[var(--red)]">
              {reminder.lastSendError}
            </p>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] text-[var(--ink-2)] sm:grid-cols-4 lg:grid-cols-2">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
              {labels.pet}
            </dt>
            <dd className="mt-0.5 truncate">
              {reminder.petName} · {reminder.species}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
              {labels.owner}
            </dt>
            <dd className="mt-0.5 truncate">{reminder.ownerName}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
              {labels.due}
            </dt>
            <dd className="mt-0.5">{dueAtLabel}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
              {labels.channel}
            </dt>
            <dd className="mt-0.5">{getChannelLabel(reminder.channel, locale)}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {reminder.requestId ? (
            <Button asChild size="sm" variant="secondary">
              <Link
                href={withLocale(`/requests/${reminder.requestId}`, locale)}
              >
                {labels.openRequest}
              </Link>
            </Button>
          ) : null}
          {showActions ? (
            <>
              {optimisticStatus !== "acknowledged" ? (
                <OptimisticActionForm
                  reminder={reminder}
                  locale={locale}
                  filter={filter}
                  status="acknowledged"
                  icon="check"
                  label={labels.markAcknowledged}
                  onOptimistic={setOptimisticStatus}
                />
              ) : null}
              <OptimisticActionForm
                reminder={reminder}
                locale={locale}
                filter={filter}
                status="completed"
                icon="complete"
                label={labels.markCompleted}
                onOptimistic={setOptimisticStatus}
              />
              <OptimisticActionForm
                reminder={reminder}
                locale={locale}
                filter={filter}
                status="cancelled"
                icon="cancel"
                label={labels.cancel}
                onOptimistic={setOptimisticStatus}
              />
            </>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/**
 * Per-action submit form. Reuses `PendingSubmitButton` so the clicked
 * button itself shows the inline Spinner + sage pulse ring via
 * `useFormStatus`. The form's async action body calls
 * `setOptimisticStatus` synchronously before awaiting the server action,
 * which keeps React's transition open and the optimistic state alive
 * until the redirect re-renders the page.
 */
function OptimisticActionForm({
  reminder,
  locale,
  filter,
  status,
  icon,
  label,
  onOptimistic
}: {
  reminder: ReminderListItem;
  locale: SupportedLocale;
  filter: ReminderFilter;
  status: "acknowledged" | "completed" | "cancelled";
  icon: "check" | "complete" | "cancel";
  label: string;
  onOptimistic: (next: ReminderStatus) => void;
}) {
  const Icon = icon === "cancel" ? X : icon === "complete" ? Check : Clock;
  return (
    <form
      action={async (formData: FormData) => {
        onOptimistic(status);
        await updateReminderStatus(formData);
      }}
    >
      <input name="lang" type="hidden" value={locale} />
      <input name="filter" type="hidden" value={filter} />
      <input name="reminderId" type="hidden" value={reminder.id} />
      <input name="status" type="hidden" value={status} />
      <PendingSubmitButton
        variant="secondary"
        size="sm"
        icon={<Icon aria-hidden="true" size={13} />}
      >
        {label}
      </PendingSubmitButton>
    </form>
  );
}

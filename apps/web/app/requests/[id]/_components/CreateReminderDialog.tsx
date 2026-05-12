"use client";

import { useId, useState } from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "@petcura/ui";
import type { ReminderType, RequestChannel } from "@petcura/shared";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { createReminder } from "../actions";

type ReminderOption = {
  value: ReminderType;
  label: string;
};

type ChannelOption = {
  value: Extract<RequestChannel, "whatsapp" | "sms">;
  label: string;
};

type CreateReminderDialogProps = {
  requestId: string;
  locale: string;
  options: ReminderOption[];
  channels: ChannelOption[];
  labels: {
    trigger: string;
    title: string;
    type: string;
    titleField: string;
    titlePlaceholder: string;
    dueAt: string;
    body: string;
    bodyPlaceholder: string;
    channel: string;
    submit: string;
    cancel: string;
  };
};

function toDateTimeLocal(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function CreateReminderDialog({
  requestId,
  locale,
  options,
  channels,
  labels
}: CreateReminderDialogProps) {
  // Migrated from a native `<dialog>` to the project's Radix-based Dialog
  // primitive so the open state carries `data-slot="dialog-content"`
  // `data-state="open"` — the matching selector the inbox + request
  // keyboard guards use to suppress global hotkeys (J/K/?/⌘K/E/A) while
  // a modal is up. Without this, pressing `J` while the reminder dialog
  // was open navigated the request beneath it, and a user could
  // submit the reminder against the wrong record.
  const [open, setOpen] = useState(false);
  const [dueAtLocal, setDueAtLocal] = useState("");
  const [minDueAt, setMinDueAt] = useState("");
  const dueAtIso = dueAtLocal ? new Date(dueAtLocal).toISOString() : "";
  const formId = useId();
  const typeId = `${formId}-type`;
  const titleFieldId = `${formId}-title`;
  const dueId = `${formId}-due`;
  const channelId = `${formId}-channel`;
  const bodyId = `${formId}-body`;

  const handleOpenChange = (next: boolean) => {
    if (next) {
      const now = Date.now();
      setMinDueAt(toDateTimeLocal(new Date(now)));
      setDueAtLocal((current) =>
        current || toDateTimeLocal(new Date(now + 24 * 60 * 60 * 1000))
      );
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        size="sm"
        variant="secondary"
        type="button"
        onClick={() => handleOpenChange(true)}
      >
        <CalendarClock aria-hidden="true" size={14} />
        {labels.trigger}
      </Button>

      <DialogContent
        size="sm"
        closeLabel={labels.cancel}
        // Title labels the dialog; the body is the form itself, so no
        // separate description is needed. Pass undefined explicitly to
        // silence Radix's dev-time missing-description warning.
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
        </DialogHeader>
        <form action={createReminder} className="contents">
          <DialogBody className="flex flex-col gap-4">
            <input name="lang" type="hidden" value={locale} />
            <input name="requestId" type="hidden" value={requestId} />
            <input name="dueAt" type="hidden" value={dueAtIso} />

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={typeId}
                className="text-[12px] font-medium text-[var(--ink)]"
              >
                {labels.type}
              </label>
              <select
                id={typeId}
                name="type"
                required
                className="h-9 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2 text-[13px] text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              >
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={titleFieldId}
                className="text-[12px] font-medium text-[var(--ink)]"
              >
                {labels.titleField}
              </label>
              <input
                id={titleFieldId}
                name="title"
                required
                maxLength={160}
                placeholder={labels.titlePlaceholder}
                className="h-9 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2 text-[13px] text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={dueId}
                className="text-[12px] font-medium text-[var(--ink)]"
              >
                {labels.dueAt}
              </label>
              <input
                id={dueId}
                type="datetime-local"
                required
                min={minDueAt}
                value={dueAtLocal}
                onChange={(event) => setDueAtLocal(event.target.value)}
                className="h-9 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2 text-[13px] text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={channelId}
                className="text-[12px] font-medium text-[var(--ink)]"
              >
                {labels.channel}
              </label>
              <select
                id={channelId}
                name="channel"
                defaultValue="whatsapp"
                className="h-9 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2 text-[13px] text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              >
                {channels.map((channel) => (
                  <option key={channel.value} value={channel.value}>
                    {channel.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={bodyId}
                className="text-[12px] font-medium text-[var(--ink)]"
              >
                {labels.body}
              </label>
              <textarea
                id={bodyId}
                name="body"
                rows={3}
                maxLength={1000}
                placeholder={labels.bodyPlaceholder}
                className="min-h-[84px] rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-2 text-[13px] leading-5 text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              size="sm"
              variant="secondary"
              type="button"
              onClick={() => handleOpenChange(false)}
            >
              {labels.cancel}
            </Button>
            <Button size="sm" type="submit">
              {labels.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

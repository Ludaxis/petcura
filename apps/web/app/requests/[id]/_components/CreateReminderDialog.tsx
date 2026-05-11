"use client";

import { useRef, useState } from "react";
import { CalendarClock, X } from "lucide-react";
import { Button } from "@petcura/ui";
import type { ReminderType, RequestChannel } from "@petcura/shared";
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dueAtLocal, setDueAtLocal] = useState("");
  const [minDueAt, setMinDueAt] = useState("");
  const dueAtIso = dueAtLocal ? new Date(dueAtLocal).toISOString() : "";

  const openDialog = () => {
    const now = Date.now();
    setMinDueAt(toDateTimeLocal(new Date(now)));
    setDueAtLocal((current) =>
      current || toDateTimeLocal(new Date(now + 24 * 60 * 60 * 1000))
    );
    dialogRef.current?.showModal();
  };

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        type="button"
        onClick={openDialog}
      >
        <CalendarClock aria-hidden="true" size={14} />
        {labels.trigger}
      </Button>

      <dialog
        ref={dialogRef}
        className="w-[min(92vw,440px)] rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-0 text-[var(--ink)] shadow-xl backdrop:bg-black/20"
      >
        <form action={createReminder} className="flex flex-col gap-4 p-4">
          <input name="lang" type="hidden" value={locale} />
          <input name="requestId" type="hidden" value={requestId} />
          <input name="dueAt" type="hidden" value={dueAtIso} />
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[17px] font-semibold">{labels.title}</h2>
            <button
              type="button"
              aria-label={labels.cancel}
              className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius)] text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)]"
              onClick={() => dialogRef.current?.close()}
            >
              <X aria-hidden="true" size={14} />
            </button>
          </div>

          <label className="flex flex-col gap-1.5 text-[12px] font-medium">
            {labels.type}
            <select
              name="type"
              required
              className="h-9 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2 text-[13px] text-[var(--ink)]"
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-[12px] font-medium">
            {labels.titleField}
            <input
              name="title"
              required
              maxLength={160}
              placeholder={labels.titlePlaceholder}
              className="h-9 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2 text-[13px] text-[var(--ink)]"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-[12px] font-medium">
            {labels.dueAt}
            <input
              type="datetime-local"
              required
              min={minDueAt}
              value={dueAtLocal}
              onChange={(event) => setDueAtLocal(event.target.value)}
              className="h-9 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2 text-[13px] text-[var(--ink)]"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-[12px] font-medium">
            {labels.channel}
            <select
              name="channel"
              defaultValue="whatsapp"
              className="h-9 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2 text-[13px] text-[var(--ink)]"
            >
              {channels.map((channel) => (
                <option key={channel.value} value={channel.value}>
                  {channel.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-[12px] font-medium">
            {labels.body}
            <textarea
              name="body"
              rows={3}
              maxLength={1000}
              placeholder={labels.bodyPlaceholder}
              className="min-h-[84px] rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-2 text-[13px] leading-5 text-[var(--ink)]"
            />
          </label>

          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              type="button"
              onClick={() => dialogRef.current?.close()}
            >
              {labels.cancel}
            </Button>
            <Button size="sm" type="submit">
              {labels.submit}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}

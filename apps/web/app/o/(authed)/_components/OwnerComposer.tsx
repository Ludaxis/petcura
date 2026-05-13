"use client";

import { useState, type FormEvent } from "react";
import { Paperclip, PaperPlaneTilt } from "@phosphor-icons/react";
import { cn } from "@petcura/ui";

type Props = {
  placeholder: string;
  sendLabel: string;
  attachLabel: string;
  onSubmitText?: (text: string) => Promise<void> | void;
};

export function OwnerComposer({ placeholder, sendLabel, attachLabel, onSubmitText }: Props) {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text || pending) return;
    setPending(true);
    setValue("");
    try {
      await onSubmitText?.(text);
    } finally {
      setPending(false);
    }
  }

  const disabled = pending || value.trim().length === 0;

  return (
    <form
      onSubmit={onSubmit}
      className="sticky bottom-0 z-10 mt-4 flex items-end gap-2 border-t border-[var(--line)] bg-[var(--paper)] p-3 pb-[max(env(safe-area-inset-bottom),12px)]"
      aria-label={placeholder}
    >
      <button
        type="button"
        aria-label={attachLabel}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--muted)]",
          "hover:bg-[var(--soft)] hover:text-[var(--ink)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
        )}
      >
        <Paperclip size={18} weight="regular" aria-hidden />
      </button>
      <label className="sr-only" htmlFor="owner-composer-input">{placeholder}</label>
      <textarea
        id="owner-composer-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={1}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            (e.currentTarget.form as HTMLFormElement)?.requestSubmit();
          }
        }}
        className={cn(
          "min-h-11 max-h-40 flex-1 resize-none rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 text-sm leading-6 text-[var(--ink)]",
          "placeholder:text-[var(--muted-2)]",
          "focus-visible:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
        )}
      />
      <button
        type="submit"
        disabled={disabled}
        aria-label={sendLabel}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--paper)]",
          "transition-colors hover:bg-[var(--primary-strong)] disabled:opacity-40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
        )}
      >
        <PaperPlaneTilt size={16} weight="fill" aria-hidden />
      </button>
    </form>
  );
}

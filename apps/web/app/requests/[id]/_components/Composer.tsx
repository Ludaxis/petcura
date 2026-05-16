"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useTransition,
  type FormEvent
} from "react";
import { Send } from "lucide-react";
import { Button, Spinner, cn } from "@petcura/ui";
import type { SupportedLocale } from "@petcura/shared";
import { sendStaffReply } from "../actions";

export type ComposerRef = {
  focus: () => void;
  setText: (text: string) => void;
  insertText: (text: string) => void;
  submit: () => void;
};

type ComposerProps = {
  requestId: string;
  locale: SupportedLocale;
  initialText?: string | undefined;
  /**
   * Called synchronously inside the submit transition with the trimmed
   * body, BEFORE awaiting `sendStaffReply`. The parent shell appends a
   * pending sage bubble to the thread; React resets that optimistic
   * state automatically when the server action's redirect settles
   * (success or `?action_error=`).
   */
  onOptimisticAppend?: ((body: string) => void) | undefined;
  labels: {
    label: string;
    placeholder: string;
    send: string;
    shortcut: string;
  };
};

/**
 * Sticky bottom composer. Wraps `sendStaffReply` so existing Twilio outbound
 * stays untouched. Handles ⌘↵ to submit; the parent shell calls focus() on
 * R, and setText() when AiDraftCard.Accept / Edit completes.
 */
export const Composer = forwardRef<ComposerRef, ComposerProps>(
  function Composer(
    { requestId, locale, initialText, onOptimisticAppend, labels }: ComposerProps,
    ref
  ) {
    const formRef = useRef<HTMLFormElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [pending, startTransition] = useTransition();

    // Wrap the server action so we can flip aria-busy + disabled on the
    // form during submission. The action itself redirects on completion, so
    // the transition resolves on the navigation that follows.
    //
    // Inside the transition we:
    //   1. Append an optimistic bubble to the thread (parent shell). This
    //      MUST run before the server action so the bubble is mounted
    //      before the awaited promise yields.
    //   2. Clear the textarea so staff can keep typing without seeing
    //      stale text in a disabled field. If the server rejects, the
    //      redirect re-renders the page; we don't restore the text
    //      because the page-level error toast (driven by `?action_error=`)
    //      is the rollback channel — restoring text would silently mask
    //      the failure for keyboard users.
    const submitAction = (formData: FormData) => {
      const body = (formData.get("body") ?? "").toString().trim();
      startTransition(async () => {
        if (body.length > 0) {
          onOptimisticAppend?.(body);
          if (textareaRef.current) {
            textareaRef.current.value = "";
          }
        }
        await sendStaffReply(formData);
      });
    };

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          textareaRef.current?.focus();
          textareaRef.current?.scrollIntoView({ block: "nearest" });
        },
        setText: (text: string) => {
          if (!textareaRef.current) return;
          textareaRef.current.value = text;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(text.length, text.length);
        },
        insertText: (text: string) => {
          if (!textareaRef.current) return;
          const el = textareaRef.current;
          const current = el.value;
          el.value = current.length === 0 ? text : `${current}\n${text}`;
          el.focus();
          el.setSelectionRange(el.value.length, el.value.length);
        },
        submit: () => {
          formRef.current?.requestSubmit();
        }
      }),
      []
    );

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (pending) return;
        formRef.current?.requestSubmit();
      }
    };

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
      const value = textareaRef.current?.value.trim() ?? "";
      if (value.length === 0 || pending) {
        e.preventDefault();
      }
    };

    return (
      <form
        ref={formRef}
        action={submitAction}
        onSubmit={onSubmit}
        data-composer-form
        aria-busy={pending}
        className="z-10 flex shrink-0 flex-col gap-2 border-t border-[var(--line)] bg-[var(--paper)] px-4 py-3 sm:px-6"
      >
        <input name="lang" type="hidden" value={locale} />
        <input name="requestId" type="hidden" value={requestId} />
        <label
          htmlFor="composer-textarea"
          className="sr-only"
        >
          {labels.label}
        </label>
        <textarea
          ref={textareaRef}
          id="composer-textarea"
          data-composer-textarea
          name="body"
          rows={2}
          maxLength={4000}
          required
          disabled={pending}
          defaultValue={initialText ?? ""}
          placeholder={labels.placeholder}
          aria-label={labels.label}
          onKeyDown={onKeyDown}
          className={cn(
            "min-h-[56px] w-full resize-y rounded-[10px] border border-transparent bg-[var(--soft)] px-3 py-2 text-[13.5px] leading-[1.5] text-[var(--ink)] placeholder:text-[var(--muted-2)]",
            "focus-visible:border-[var(--line)] focus-visible:bg-[var(--paper)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          )}
        />
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--muted-2)]"
          >
            {labels.shortcut}
          </span>
          <div className="flex-1" />
          <Button
            type="submit"
            size="sm"
            disabled={pending}
            aria-disabled={pending}
            data-composer-send
            /*
             * Pending state stays at full sage with a soft pulsing ring so
             * the user has a strong "something is happening" signal even
             * before reading the 16px rotating spinner. The label gets an
             * ellipsis to confirm the action is in flight. `min-w` prevents
             * width jitter between idle ("Send reply") and pending
             * ("Send reply…").
             */
            className={cn(
              "min-w-[112px]",
              pending &&
                "!opacity-100 ring-2 ring-offset-1 ring-[var(--primary-soft)] ring-offset-[var(--paper)] animate-pulse motion-reduce:animate-none"
            )}
          >
            {pending ? (
              <Spinner size={16} label={labels.send} />
            ) : (
              <Send aria-hidden="true" size={13} />
            )}
            <span>{pending ? `${labels.send}…` : labels.send}</span>
          </Button>
        </div>
      </form>
    );
  }
);

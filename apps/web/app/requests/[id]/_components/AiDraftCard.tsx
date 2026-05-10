"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button, cn } from "@petcura/ui";
import { acceptAiDraft, editAiDraft, rejectAiDraft } from "../actions";
import { trapTabKey } from "@/app/_components/useFocusTrap";

export type DraftPayload = {
  id: string;
  text: string;
  confidence: number | null;
  sourceMessageId: string | null;
  sourceLocale: string | null;
  targetLocale: string | null;
  createdAt: string;
};

type AiDraftCardProps = {
  requestId: string;
  draft: DraftPayload;
  locale: string;
  onAccept: (text: string) => void;
  onEditAccepted: (text: string) => void;
  onAnnounce: (msg: string) => void;
  labels: {
    region: string;
    eyebrow: string;
    /** Template "from message {time}" — substituted client-side. */
    from: string;
    /** Template "conf {confidence}" — substituted client-side. */
    confidence: string;
    /** Template "{source} → {target}" — substituted client-side. */
    locale: string;
    accept: string;
    edit: string;
    reject: string;
    cancel: string;
    save: string;
    editLabel: string;
    accepted: string;
    rejected: string;
    edited: string;
    errorAccept: string;
    errorEdit: string;
    errorReject: string;
  };
};

export function AiDraftCard({
  requestId,
  draft,
  locale,
  onAccept,
  onEditAccepted,
  onAnnounce,
  labels
}: AiDraftCardProps) {
  const timeFormatter = new Intl.DateTimeFormat(locale, { timeStyle: "short" });
  const formatTime = (iso: string) => timeFormatter.format(new Date(iso));
  const [hidden, setHidden] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(draft.text);
  const [pending, startTransition] = useTransition();
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Focus management for the inline edit dialog.
  useEffect(() => {
    if (!editing) return;
    lastFocusedRef.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;
    const id = window.setTimeout(() => {
      editTextareaRef.current?.focus();
      editTextareaRef.current?.setSelectionRange(
        draftText.length,
        draftText.length
      );
    }, 0);
    return () => window.clearTimeout(id);
  }, [editing, draftText.length]);

  const closeEdit = () => {
    setEditing(false);
    const target = lastFocusedRef.current;
    if (target && typeof target.focus === "function") {
      target.focus();
    }
  };

  if (hidden) return null;

  const sourceLocale = (draft.sourceLocale ?? "??").toUpperCase();
  const targetLocale = (draft.targetLocale ?? draft.sourceLocale ?? "??").toUpperCase();
  const confidenceLabel =
    typeof draft.confidence === "number"
      ? labels.confidence.replace("{confidence}", draft.confidence.toFixed(2))
      : null;
  const localeLabel = labels.locale
    .replace("{source}", sourceLocale)
    .replace("{target}", targetLocale);

  const handleAccept = () => {
    startTransition(async () => {
      const result = await acceptAiDraft({
        requestId,
        aiOutputId: draft.id
      });
      if (!result.ok) {
        onAnnounce(labels.errorAccept);
        return;
      }
      onAccept(draft.text);
      onAnnounce(labels.accepted);
      setHidden(true);
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectAiDraft({
        requestId,
        aiOutputId: draft.id
      });
      if (!result.ok) {
        onAnnounce(labels.errorReject);
        return;
      }
      onAnnounce(labels.rejected);
      setHidden(true);
    });
  };

  const handleSaveEdit = () => {
    if (draftText.trim().length === 0) return;
    startTransition(async () => {
      const result = await editAiDraft({
        requestId,
        aiOutputId: draft.id,
        editedText: draftText
      });
      if (!result.ok) {
        onAnnounce(labels.errorEdit);
        return;
      }
      onEditAccepted(draftText);
      onAnnounce(labels.edited);
      setEditing(false);
      setHidden(true);
    });
  };

  return (
    <section
      role="region"
      aria-label={labels.region}
      data-ai-draft-card
      className="mx-4 mt-3 rounded-[10px] border border-[var(--line)] border-l-2 border-l-[var(--primary)] bg-[var(--paper)] px-3.5 py-3 sm:mx-6"
    >
      <header className="flex flex-wrap items-center gap-2">
        <Sparkles
          aria-hidden="true"
          size={13}
          className="text-[var(--primary)]"
        />
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--ink)]">
          {labels.eyebrow}
        </span>
        <span className="ml-auto flex flex-wrap items-center gap-2 font-mono text-[10.5px] text-[var(--muted-2)]">
          {draft.sourceMessageId ? (
            <span>
              {labels.from.replace("{time}", formatTime(draft.createdAt))}
            </span>
          ) : null}
          {confidenceLabel ? <span>{confidenceLabel}</span> : null}
          <span>{localeLabel}</span>
        </span>
      </header>
      <p
        className="mt-2 break-words text-[13.5px] leading-[1.55] text-[var(--ink-2)] whitespace-pre-wrap"
        data-ai-draft-text
      >
        {draft.text}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Button
          size="sm"
          onClick={handleAccept}
          disabled={pending}
          data-ai-draft-action="accept"
        >
          {labels.accept}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setEditing(true)}
          disabled={pending}
          data-ai-draft-action="edit"
        >
          {labels.edit}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReject}
          disabled={pending}
          data-ai-draft-action="reject"
        >
          {labels.reject}
        </Button>
      </div>

      {editing ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={labels.editLabel}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center"
          onClick={closeEdit}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              trapTabKey(e, dialogRef.current);
              return;
            }
            if (e.key === "Escape") {
              e.preventDefault();
              closeEdit();
              return;
            }
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleSaveEdit();
            }
          }}
        >
          <div
            ref={dialogRef}
            className="w-full max-w-lg rounded-[12px] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-[var(--ink)]">
                {labels.editLabel}
              </h2>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-[var(--radius)] px-2 py-1 text-[12px] text-[var(--muted)] hover:bg-[var(--soft)]"
              >
                {labels.cancel}
              </button>
            </div>
            <textarea
              ref={editTextareaRef}
              aria-label={labels.editLabel}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className={cn(
                "min-h-32 w-full resize-y rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-3 text-[13.5px] leading-6 text-[var(--ink)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              )}
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={closeEdit}
                disabled={pending}
              >
                {labels.cancel}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={pending || draftText.trim().length === 0}
              >
                {labels.save}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

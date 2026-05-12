"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import {
  AiTypingCaret,
  Button,
  Spinner,
  StreamingDots,
  cn
} from "@petcura/ui";
import { acceptAiDraft, editAiDraft, rejectAiDraft } from "../actions";
import { useAiDraftStream } from "./useAiDraftStream";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

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
    /** Bucket labels for confidence (text alternative to numeric value). */
    confidenceBucketLow: string;
    confidenceBucketMedium: string;
    confidenceBucketHigh: string;
    /** Template "AI confidence {bucket} ({value})" — substituted client-side. */
    confidenceLabel: string;
    /** Template "{source} → {target}" — substituted client-side. */
    locale: string;
    accept: string;
    edit: string;
    reject: string;
    cancel: string;
    save: string;
    saveAndAccept: string;
    editLabel: string;
    accepted: string;
    rejected: string;
    edited: string;
    errorAccept: string;
    errorEdit: string;
    errorReject: string;
  };
};

/**
 * Map a numeric confidence (0–1) into a coarse text bucket so the AI draft
 * card communicates certainty without relying on color or numeric literacy
 * alone (WCAG 1.4.1 — use of color). The bucket text is the primary signal;
 * the color hint applied at the call site is purely reinforcement.
 */
function confidenceBucket(value: number): "low" | "medium" | "high" {
  if (value >= 0.8) return "high";
  if (value >= 0.5) return "medium";
  return "low";
}

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
  // Track which action is in flight so we can show a Spinner inside the
  // specific button (Accept / Edit / Reject) rather than dimming everything
  // equally — gives staff a clearer "this is the one I clicked".
  const [activeAction, setActiveAction] = useState<
    "accept" | "reject" | "save" | null
  >(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // "Fresh draft" = arrived within the last 30s. Fresh drafts attempt the
  // real SSE token stream (see /docs/contracts/ai-draft-stream.md). On any
  // stream failure (404, 401, network drop, premature close) the card
  // falls back to the static timer-based reveal so the perceived "AI is
  // typing" feel is preserved even when the backend is unreachable. Older
  // drafts skip the stream entirely and render instantly.
  //
  // useState lazy init captures `Date.now()` once on mount so the value is
  // pure across re-renders (React's purity rules disallow Date.now() in
  // render bodies).
  const [isFresh] = useState(() => {
    const ageMs = Date.now() - new Date(draft.createdAt).getTime();
    return ageMs >= 0 && ageMs < 30_000;
  });

  // Live SSE stream. Inert when the draft is not fresh.
  const stream = useAiDraftStream(requestId, locale, { enabled: isFresh });
  // Once the stream has produced characters we trust its content. The
  // `draftText` mirror is still the canonical value used for edit, accept,
  // and final render — we sync stream text into it on completion or on
  // fallback we keep the prop-derived value.
  const streamActive =
    isFresh && (stream.isStreaming || stream.isComplete) && stream.error === null;
  const streamHasText = stream.text.length > 0;
  // Fall back to the timer reveal when the stream is enabled but produced
  // an error before any text arrived, OR when the draft is fresh but the
  // hook is disabled / never started.
  const useTimerFallback = isFresh && !streamActive;

  const [revealedChars, setRevealedChars] = useState(
    useTimerFallback ? 0 : draftText.length
  );

  // Reset mirror + reveal when a different draft arrives (different id).
  // Render-time state reset is the React 19 recommended pattern for
  // "deriveStateFromProps"; it avoids the cascading-render lint that the
  // useEffect equivalent triggers.
  const [trackedDraftId, setTrackedDraftId] = useState(draft.id);
  if (trackedDraftId !== draft.id) {
    setTrackedDraftId(draft.id);
    setDraftText(draft.text);
    setRevealedChars(draft.text.length);
  }

  // What the card actually shows:
  //   - while the SSE stream is in flight or complete: render stream.text
  //     incrementally with the caret.
  //   - otherwise: fall back to draftText, either revealed instantly (old
  //     draft) or via the timer-based typewriter (fresh draft but stream
  //     unavailable).
  const displayText = streamActive && streamHasText ? stream.text : draftText;
  const isStreaming = streamActive
    ? stream.isStreaming
    : revealedChars < draftText.length;

  useEffect(() => {
    if (!useTimerFallback) return;
    if (revealedChars >= draftText.length) return;
    if (typeof window === "undefined") return;
    // Reveal ~8 chars per tick so a 280-character draft completes in
    // ~35 ticks (~840ms). Long drafts stay snappy; short ones still
    // register the caret blink before finishing.
    const id = window.setTimeout(() => {
      setRevealedChars((n) => Math.min(draftText.length, n + 8));
    }, 24);
    return () => window.clearTimeout(id);
  }, [useTimerFallback, revealedChars, draftText]);

  // Focus the textarea (and place caret at end) once Radix has mounted the
  // Dialog content. Radix already handles focus restoration to the trigger
  // on close, so no lastFocused ref is needed.
  useEffect(() => {
    if (!editing) return;
    const id = window.setTimeout(() => {
      editTextareaRef.current?.focus();
      editTextareaRef.current?.setSelectionRange(
        draftText.length,
        draftText.length
      );
    }, 0);
    return () => window.clearTimeout(id);
  }, [editing, draftText.length]);

  if (hidden) return null;

  const sourceLocale = (
    draft.sourceLocale ??
    draft.targetLocale ??
    locale
  ).toUpperCase();
  const targetLocale = (
    draft.targetLocale ??
    draft.sourceLocale ??
    locale
  ).toUpperCase();
  // Build the confidence display as { numeric, bucket, aria } so we can keep
  // the numeric value visible (familiar to staff) while adding a text bucket
  // label that satisfies WCAG 1.4.1 — the meaning is not encoded by color
  // alone. The aria string condenses both into a single SR announcement so
  // assistive tech doesn't read "conf 0.86 high" as two unrelated tokens.
  const confidenceDisplay = (() => {
    if (typeof draft.confidence !== "number") return null;
    const valueText = draft.confidence.toFixed(2);
    const bucket = confidenceBucket(draft.confidence);
    const bucketText =
      bucket === "high"
        ? labels.confidenceBucketHigh
        : bucket === "medium"
          ? labels.confidenceBucketMedium
          : labels.confidenceBucketLow;
    const bucketToneClass =
      bucket === "high"
        ? "text-[var(--primary-strong)]"
        : bucket === "medium"
          ? "text-[var(--amber)]"
          : "text-[var(--red)]";
    return {
      bucket,
      numericText: labels.confidence.replace("{confidence}", valueText),
      bucketText,
      bucketToneClass,
      ariaLabel: labels.confidenceLabel
        .replace("{bucket}", bucketText)
        .replace("{value}", valueText)
    };
  })();
  const localeLabel = labels.locale
    .replace("{source}", sourceLocale)
    .replace("{target}", targetLocale);

  const handleAccept = () => {
    setActiveAction("accept");
    startTransition(async () => {
      const result = await acceptAiDraft({
        requestId,
        aiOutputId: draft.id
      });
      if (!result.ok) {
        onAnnounce(labels.errorAccept);
        setActiveAction(null);
        return;
      }
      onAccept(draftText);
      onAnnounce(labels.accepted);
      setHidden(true);
    });
  };

  const handleReject = () => {
    setActiveAction("reject");
    startTransition(async () => {
      const result = await rejectAiDraft({
        requestId,
        aiOutputId: draft.id
      });
      if (!result.ok) {
        onAnnounce(labels.errorReject);
        setActiveAction(null);
        return;
      }
      onAnnounce(labels.rejected);
      setHidden(true);
    });
  };

  const handleSaveEdit = (mode: "saveOnly" | "saveAndAccept") => {
    if (draftText.trim().length === 0) return;
    setActiveAction("save");
    startTransition(async () => {
      const result = await editAiDraft({
        requestId,
        aiOutputId: draft.id,
        editedText: draftText,
        saveOnly: mode === "saveOnly"
      });
      if (!result.ok) {
        onAnnounce(labels.errorEdit);
        setActiveAction(null);
        return;
      }
      onAnnounce(labels.edited);
      if (mode === "saveAndAccept") {
        onEditAccepted(draftText);
        setEditing(false);
        setHidden(true);
      } else {
        setEditing(false);
        setActiveAction(null);
      }
    });
  };

  return (
    <section
      role="region"
      aria-label={labels.region}
      data-ai-draft-card
      aria-busy={pending}
      className={cn(
        "mx-4 mt-3 rounded-[10px] border border-[var(--line)] border-l-2 border-l-[var(--primary)] bg-[var(--paper)] px-3.5 py-3 transition-colors sm:mx-6",
        // Optimistic tint while a server action is in flight — the card
        // settles into the accepted/rejected state on resolve. Sage on
        // accept/save, neutral on reject, no flash on first paint.
        pending && activeAction !== "reject" && "bg-[var(--primary-soft)]/40",
        pending && activeAction === "reject" && "opacity-70"
      )}
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
        {isStreaming ? (
          <StreamingDots className="ml-1" label={labels.eyebrow} />
        ) : null}
        <span className="ml-auto flex flex-wrap items-center gap-2 font-mono text-[10.5px] text-[var(--muted-2)]">
          {draft.sourceMessageId ? (
            <span>
              {labels.from.replace("{time}", formatTime(draft.createdAt))}
            </span>
          ) : null}
          {confidenceDisplay ? (
            <span
              className="inline-flex items-center gap-1"
              aria-label={confidenceDisplay.ariaLabel}
              data-ai-draft-confidence-bucket={confidenceDisplay.bucket}
            >
              <span aria-hidden="true">{confidenceDisplay.numericText}</span>
              <span aria-hidden="true" className="text-[var(--muted-2)]">
                ·
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "font-semibold uppercase tracking-[0.06em]",
                  confidenceDisplay.bucketToneClass
                )}
              >
                {confidenceDisplay.bucketText}
              </span>
            </span>
          ) : null}
          <span>{localeLabel}</span>
        </span>
      </header>
      <p
        className="mt-2 break-words text-[13.5px] leading-[1.55] text-[var(--ink-2)] whitespace-pre-wrap"
        data-ai-draft-text
        data-streaming={isStreaming ? "true" : undefined}
      >
        {/*
          Visible token-by-token reveal for fresh drafts; instant render for
          existing ones. The full text is mirrored to screen readers via the
          sr-only span below so SR users hear the whole draft once instead
          of each character.
        */}
        <span aria-hidden={isStreaming ? "true" : undefined}>
          {streamActive && streamHasText
            ? stream.text
            : isStreaming
              ? draftText.slice(0, revealedChars)
              : draftText}
        </span>
        {isStreaming ? <AiTypingCaret className="ml-px" /> : null}
        {isStreaming ? (
          <span className="sr-only" role="status">
            {displayText.length > 0 ? displayText : draftText}
          </span>
        ) : null}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Button
          size="sm"
          onClick={handleAccept}
          disabled={pending}
          data-ai-draft-action="accept"
        >
          {activeAction === "accept" ? (
            <Spinner size={12} label={labels.accept} tone="current" />
          ) : null}
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
          /* Override ghost's --muted text color so Reject hits AA in dark mode
             (--muted is too low against dark --paper). Keeps disabled
             default which dims via opacity-50. */
          className="text-[var(--ink-2)] aria-disabled:text-[var(--muted)]"
        >
          {activeAction === "reject" ? (
            <Spinner size={12} label={labels.reject} tone="current" />
          ) : null}
          {labels.reject}
        </Button>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent
          size="md"
          closeLabel={labels.cancel}
          // The body is a single labeled textarea; the title is sufficient
          // labeling. Pass undefined explicitly so Radix doesn't log a
          // missing-description warning at dev time.
          aria-describedby={undefined}
          onKeyDown={(e) => {
            // Keep the ⌘↵ contract from the hand-rolled shell: save only by
            // default, save-and-accept with Shift held. Radix owns Tab, Escape,
            // and click-outside; we only intercept the save shortcut here so
            // the textarea's own keystrokes are otherwise untouched.
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleSaveEdit(e.shiftKey ? "saveAndAccept" : "saveOnly");
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{labels.editLabel}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <textarea
              ref={editTextareaRef}
              aria-label={labels.editLabel}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              className={cn(
                "min-h-32 w-full resize-y rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-3 text-[13.5px] leading-6 text-[var(--ink)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              )}
            />
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditing(false)}
                disabled={pending}
              >
                {labels.cancel}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleSaveEdit("saveOnly")}
                disabled={pending || draftText.trim().length === 0}
                data-ai-draft-action="save"
              >
                {labels.save}
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveEdit("saveAndAccept")}
                disabled={pending || draftText.trim().length === 0}
                data-ai-draft-action="save-accept"
              >
                {labels.saveAndAccept}
              </Button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </section>
  );
}

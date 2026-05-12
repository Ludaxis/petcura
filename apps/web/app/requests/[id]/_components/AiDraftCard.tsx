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

  // "Fresh draft" = arrived within the last 30s. We use this to drive the
  // typewriter reveal so realtime drafts feel like the AI is typing, while
  // returning to a thread with an existing draft renders the text instantly.
  // The real SSE token stream lives behind a Codex-owned contract; until
  // that endpoint exists this client-side reveal gives the right *feel*
  // without coupling to backend timing.
  //
  // useState lazy init captures `Date.now()` once on mount so the value is
  // pure across re-renders (React's purity rules disallow Date.now() in
  // render bodies).
  const [isFresh] = useState(() => {
    const ageMs = Date.now() - new Date(draft.createdAt).getTime();
    return ageMs >= 0 && ageMs < 30_000;
  });

  const [revealedChars, setRevealedChars] = useState(
    isFresh ? 0 : draftText.length
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

  const isStreaming = revealedChars < draftText.length;

  useEffect(() => {
    if (!isFresh) return;
    if (revealedChars >= draftText.length) return;
    if (typeof window === "undefined") return;
    // Reveal ~8 chars per tick so a 280-character draft completes in
    // ~35 ticks (~840ms). Long drafts stay snappy; short ones still
    // register the caret blink before finishing.
    const id = window.setTimeout(() => {
      setRevealedChars((n) => Math.min(draftText.length, n + 8));
    }, 24);
    return () => window.clearTimeout(id);
  }, [isFresh, revealedChars, draftText]);

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
  const confidenceLabel =
    typeof draft.confidence === "number"
      ? labels.confidence.replace("{confidence}", draft.confidence.toFixed(2))
      : null;
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
          {confidenceLabel ? <span>{confidenceLabel}</span> : null}
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
          {isStreaming ? draftText.slice(0, revealedChars) : draftText}
        </span>
        {isStreaming ? <AiTypingCaret className="ml-px" /> : null}
        {isStreaming ? (
          <span className="sr-only" role="status">
            {draftText}
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
                "focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
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

"use client";

import { useCallback, useRef, useState } from "react";
import { CommandPalette, type CommandPaletteRef } from "@/app/inbox/_components/CommandPalette";
import type { InboxStream } from "@/lib/inbox/queries";
import type { SupportedLocale } from "@petcura/shared";
import { Thread, type ThreadMessage } from "./Thread";
import { AiDraftCard, type DraftPayload } from "./AiDraftCard";
import { Composer, type ComposerRef } from "./Composer";
import { RequestKeyboard } from "./RequestKeyboard";

type RequestPaneShellProps = {
  requestId: string;
  rowIds: string[];
  hrefForRow: Record<string, string>;
  threads: Array<{
    id: string;
    petName: string;
    ownerName: string;
    preview: string;
    href: string;
  }>;
  streams: Array<{ value: InboxStream; label: string }>;
  locale: SupportedLocale;
  messages: ThreadMessage[];
  draft: DraftPayload | null;
  paletteLabels: React.ComponentProps<typeof CommandPalette>["labels"];
  threadLabels: React.ComponentProps<typeof Thread>["labels"];
  draftLabels: React.ComponentProps<typeof AiDraftCard>["labels"];
  composerLabels: React.ComponentProps<typeof Composer>["labels"];
  keyboardLabels: React.ComponentProps<typeof RequestKeyboard>["labels"];
  shortcuts: React.ComponentProps<typeof RequestKeyboard>["shortcuts"];
};

/**
 * Client orchestration for the right pane. Owns the composer ref, the
 * announcement live region, the focused-bubble cursor for `T`, and the
 * shared shortcut sheet. Falls back to PR A patterns wherever they apply.
 */
export function RequestPaneShell({
  requestId,
  rowIds,
  hrefForRow,
  threads,
  streams,
  locale,
  messages,
  draft,
  paletteLabels,
  threadLabels,
  draftLabels,
  composerLabels,
  keyboardLabels,
  shortcuts
}: RequestPaneShellProps) {
  const composerRef = useRef<ComposerRef>(null);
  const paletteRef = useRef<CommandPaletteRef>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const [announce, setAnnounce] = useState("");

  const announceMessage = useCallback((msg: string) => {
    setAnnounce(msg);
    if (liveRef.current) {
      liveRef.current.textContent = "";
      liveRef.current.textContent = msg;
    }
    window.setTimeout(() => setAnnounce((cur) => (cur === msg ? "" : cur)), 2000);
  }, []);

  const handleAccept = useCallback((text: string) => {
    composerRef.current?.setText(text);
  }, []);
  const handleEditAccepted = useCallback((text: string) => {
    composerRef.current?.setText(text);
  }, []);

  const focusComposer = useCallback(() => {
    composerRef.current?.focus();
  }, []);

  const sendComposer = useCallback(() => {
    composerRef.current?.submit();
  }, []);

  const toggleTranslationOnFocused = useCallback(() => {
    // Pick the first translatable owner bubble in the visible thread, or
    // the bubble closest to focus. The Thread component renders each
    // toggle as `[data-translate-toggle][data-message-id]`, so we just
    // click whichever one is in/near focus.
    const active =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;
    const fromFocus = active?.closest<HTMLElement>("[data-message-id]");
    const target =
      fromFocus?.querySelector<HTMLElement>("[data-translate-toggle]") ??
      document.querySelector<HTMLElement>("[data-translate-toggle]");
    target?.click();
  }, []);

  return (
    <>
      <div
        ref={liveRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announce}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Thread
          requestId={requestId}
          messages={messages}
          locale={locale}
          labels={threadLabels}
        />

        {draft ? (
          <AiDraftCard
            key={draft.id}
            requestId={requestId}
            draft={draft}
            locale={locale}
            onAccept={handleAccept}
            onEditAccepted={handleEditAccepted}
            onAnnounce={announceMessage}
            labels={draftLabels}
          />
        ) : null}

        <Composer
          ref={composerRef}
          requestId={requestId}
          locale={locale}
          labels={composerLabels}
        />
      </div>

      <CommandPalette
        ref={paletteRef}
        threads={threads}
        streams={streams}
        currentRowId={requestId}
        locale={locale}
        labels={paletteLabels}
      />

      <button
        type="button"
        data-testid="cmdk-trigger"
        aria-hidden="true"
        tabIndex={-1}
        onClick={() => paletteRef.current?.toggle()}
        className="sr-only"
      />

      <RequestKeyboard
        requestId={requestId}
        rowIds={rowIds}
        hrefForRow={(id) => hrefForRow[id] ?? `/requests/${id}`}
        locale={locale}
        onOpenPalette={() => paletteRef.current?.toggle()}
        onFocusComposer={focusComposer}
        onToggleTranslation={toggleTranslationOnFocused}
        onSendComposer={sendComposer}
        shortcuts={shortcuts}
        labels={keyboardLabels}
      />
    </>
  );
}

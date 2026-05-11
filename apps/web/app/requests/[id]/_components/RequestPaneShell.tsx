"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CommandPalette, type CommandPaletteRef } from "@/app/inbox/_components/CommandPalette";
import { RealtimeRefresh } from "@/app/_components/RealtimeRefresh";
import type { InboxStream } from "@/lib/inbox/queries";
import { eqFilter, makeRealtimeChannelName } from "@/lib/realtime-refresh";
import type { SupportedLocale } from "@petcura/shared";
import { Thread, type ThreadMessage } from "./Thread";
import { AiDraftCard, type DraftPayload } from "./AiDraftCard";
import { Composer, type ComposerRef } from "./Composer";
import { RequestKeyboard } from "./RequestKeyboard";

type RequestPaneShellProps = {
  requestId: string;
  clinicId: string;
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
  /** Initial server-action toast (from `?action_status=` searchParam). */
  initialAnnouncement?: string | null;
  paletteLabels: React.ComponentProps<typeof CommandPalette>["labels"];
  threadLabels: React.ComponentProps<typeof Thread>["labels"];
  translateAnnounce: { shown: string; hidden: string };
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
  clinicId,
  rowIds,
  hrefForRow,
  threads,
  streams,
  locale,
  messages,
  draft,
  initialAnnouncement,
  paletteLabels,
  threadLabels,
  translateAnnounce,
  draftLabels,
  composerLabels,
  keyboardLabels,
  shortcuts
}: RequestPaneShellProps) {
  const composerRef = useRef<ComposerRef>(null);
  const paletteRef = useRef<CommandPaletteRef>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const focusedBubbleIdRef = useRef<string | null>(null);
  // Token guards a stale setTimeout from clearing a newer announcement.
  const announceTokenRef = useRef(0);
  const [announce, setAnnounce] = useState("");

  const announceMessage = useCallback((msg: string) => {
    const token = ++announceTokenRef.current;
    setAnnounce(msg);
    if (liveRef.current) {
      liveRef.current.textContent = "";
      liveRef.current.textContent = msg;
    }
    window.setTimeout(() => {
      if (announceTokenRef.current === token) setAnnounce("");
    }, 2000);
  }, []);

  // Route a server-action toast (status / urgency / assign / send / note)
  // through the same single live region so SR users hear it. The token guard
  // above prevents an older toast clearing a newer one. We schedule via
  // queueMicrotask so the announcement runs after commit (no cascading
  // setState during the effect body).
  useEffect(() => {
    if (!initialAnnouncement) return;
    const msg = initialAnnouncement;
    queueMicrotask(() => announceMessage(msg));
  }, [initialAnnouncement, announceMessage]);

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

  const handleBubbleFocus = useCallback((id: string) => {
    focusedBubbleIdRef.current = id;
  }, []);

  const toggleTranslationOnFocused = useCallback(() => {
    // 1) explicit cursor (last article bubble that received focus)
    // 2) bubble closest to current DOM focus (e.g. from Tab nav into Thread)
    // 3) the most recent translatable owner bubble in the DOM
    let bubble: HTMLElement | null = null;
    if (focusedBubbleIdRef.current) {
      bubble = document.querySelector<HTMLElement>(
        `[data-message-id="${focusedBubbleIdRef.current}"]`
      );
    }
    if (!bubble && typeof document !== "undefined") {
      const active = document.activeElement as HTMLElement | null;
      bubble = active?.closest<HTMLElement>("[data-message-id]") ?? null;
    }
    if (!bubble) {
      const all = document.querySelectorAll<HTMLElement>(
        '[data-message-id][data-translatable="true"]'
      );
      bubble = all.length > 0 ? all[all.length - 1] ?? null : null;
    }
    const toggle =
      bubble?.querySelector<HTMLElement>("[data-translate-toggle]") ?? null;
    if (!toggle) return;
    const wasPressed = toggle.getAttribute("aria-pressed") === "true";
    toggle.click();
    announceMessage(
      wasPressed ? translateAnnounce.hidden : translateAnnounce.shown
    );
  }, [announceMessage, translateAnnounce.hidden, translateAnnounce.shown]);

  return (
    <>
      <RealtimeRefresh
        channelName={makeRealtimeChannelName("request-detail", requestId)}
        targets={[
          { table: "requests", filter: eqFilter("id", requestId) },
          { table: "messages", filter: eqFilter("request_id", requestId) },
          {
            table: "request_events",
            filter: eqFilter("request_id", requestId)
          },
          {
            table: "reminders",
            filter: eqFilter("request_id", requestId)
          },
          {
            table: "message_delivery_events",
            filter: eqFilter("clinic_id", clinicId)
          },
          {
            table: "message_translations",
            filter: eqFilter("clinic_id", clinicId)
          }
        ]}
        pollMs={5_000}
      />

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
          onBubbleFocus={handleBubbleFocus}
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

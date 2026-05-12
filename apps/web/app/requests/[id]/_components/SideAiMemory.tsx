"use client";

import { useCallback } from "react";
import { AiMemoryPanel, type AiMemoryPanelProps } from "./AiMemoryPanel";
import {
  REQUEST_ANNOUNCE_EVENT,
  type RequestAnnounceDetail
} from "./RequestPaneShell";

/**
 * Side-rail wrapper around `AiMemoryPanel`.
 *
 * Two jobs:
 *
 *  1. Bridge announcements back to the shared aria-live region.
 *     The panel used to live inside `RequestPaneShell` and called
 *     `announceMessage` directly. Now that it's mounted in the side rail
 *     (and in the mobile Details sheet) — outside the shell's React tree —
 *     it dispatches a `petcura:request-announce` window event scoped by
 *     `requestId`, which `RequestPaneShell` listens for and pipes through
 *     the same single live region every other toast uses.
 *
 *  2. Drop the panel's outer card chrome inside an accordion body.
 *     The panel ships with `mx-4 mt-3 rounded ... bg-[var(--paper)]` so it
 *     can stand alone in the main column. Inside a side-rail `<details>`
 *     that already pads `px-4 py-3` and sits on `bg-[var(--paper)]`, those
 *     margins read as double padding. The wrapper sets compound selectors
 *     to neutralize the outer-only styles without touching the panel
 *     internals (which are out of scope per the task brief).
 */
export type SideAiMemoryProps = AiMemoryPanelProps;

export function SideAiMemory({
  requestId,
  locale,
  hasDraft,
  ...rest
}: SideAiMemoryProps) {
  const handleAnnounce = useCallback(
    (message: string) => {
      if (typeof window === "undefined") return;
      window.dispatchEvent(
        new CustomEvent<RequestAnnounceDetail>(REQUEST_ANNOUNCE_EVENT, {
          detail: { requestId, message }
        })
      );
    },
    [requestId]
  );

  return (
    // Compound child selectors strip the panel's outer card so it nests
    // cleanly inside the accordion body. We keep the panel's two-column
    // grid (`lg:grid-cols-2`) — at the rail's 280px width it collapses to
    // one column on its own.
    <div
      data-ai-memory-side-wrapper
      className="[&>section]:mx-0 [&>section]:mt-0 [&>section]:rounded-none [&>section]:border-0 [&>section]:bg-transparent [&>section]:p-0 sm:[&>section]:mx-0"
    >
      <AiMemoryPanel
        requestId={requestId}
        locale={locale}
        hasDraft={hasDraft}
        onAnnounce={handleAnnounce}
        {...rest}
      />
    </div>
  );
}

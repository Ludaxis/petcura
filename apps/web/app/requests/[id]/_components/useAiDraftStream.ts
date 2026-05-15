"use client";

/**
 * useAiDraftStream — consume the SSE stub at
 * /api/ai/draft/<requestId>/stream?lang=<locale>.
 *
 * Returns:
 *   text         — accumulated payload so far
 *   isStreaming  — request is in flight (fetch open, not yet done/error)
 *   isComplete   — terminal `done` event received
 *   error        — null until something fails (network, non-200, parse)
 *
 * The hook is intentionally tolerant: any non-200, network error, abort
 * other than our own unmount, or premature close flips `error` and lets
 * the caller fall back to the static timer-based reveal.
 *
 * Contract reference: /docs/contracts/ai-draft-stream.md
 */

import { useEffect, useRef, useState } from "react";

export type AiDraftStreamState = {
  text: string;
  isStreaming: boolean;
  isComplete: boolean;
  error: Error | null;
};

type UseAiDraftStreamOptions = {
  /** When false, the hook is inert — no fetch, idle state. */
  enabled?: boolean;
};

const DEFAULT_STATE: AiDraftStreamState = {
  text: "",
  isStreaming: false,
  isComplete: false,
  error: null
};

/** Parse one SSE "event block" (already split on \n\n) into a normalized
 *  shape. Supports `event:` and one or more `data:` lines per event. */
function parseEventBlock(raw: string): { event: string; data: string } | null {
  if (!raw.trim()) return null;
  let event = "message";
  const dataLines: string[] = [];
  for (const line of raw.split("\n")) {
    if (line.startsWith(":")) continue; // SSE comment
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      // SSE spec: trim ONE leading space if present.
      const v = line.slice(5);
      dataLines.push(v.startsWith(" ") ? v.slice(1) : v);
    }
  }
  return { event, data: dataLines.join("\n") };
}

export function useAiDraftStream(
  requestId: string,
  draftId: string,
  locale: string,
  options: UseAiDraftStreamOptions = {}
): AiDraftStreamState {
  const { enabled = true } = options;
  const streamKey = enabled ? `${requestId}::${draftId}::${locale}` : "";
  // Use a ref to accumulate text synchronously across event chunks before
  // we publish to React state. This avoids dropping tokens if multiple
  // events arrive in the same microtask.
  const accumulatedRef = useRef("");

  const [state, setState] = useState<AiDraftStreamState>(() =>
    streamKey
      ? { text: "", isStreaming: true, isComplete: false, error: null }
      : DEFAULT_STATE
  );

  // Render-time reset when the stream identity changes (different request
  // or locale). This is React 19's recommended pattern for "derive state
  // from props" and avoids the cascading-render lint that an in-effect
  // reset triggers.
  const [trackedKey, setTrackedKey] = useState(streamKey);
  if (trackedKey !== streamKey) {
    setTrackedKey(streamKey);
    setState(
      streamKey
        ? { text: "", isStreaming: true, isComplete: false, error: null }
        : DEFAULT_STATE
    );
  }

  useEffect(() => {
    if (!streamKey) return;
    if (typeof window === "undefined") return;

    // Recover the route pieces from the composite key so the effect's only
    // dependency stays `streamKey` (keeps exhaustive-deps happy).
    const sep = streamKey.indexOf("::");
    const effectRequestId = streamKey.slice(0, sep);
    const rest = streamKey.slice(sep + 2);
    const draftSep = rest.indexOf("::");
    const effectDraftId = rest.slice(0, draftSep);
    const effectLocale = rest.slice(draftSep + 2);

    accumulatedRef.current = "";
    const controller = new AbortController();
    let cancelled = false;

    const run = async () => {
      try {
        const response = await fetch(
          `/api/ai/draft/${encodeURIComponent(effectRequestId)}/stream?lang=${encodeURIComponent(effectLocale)}&draftId=${encodeURIComponent(effectDraftId)}`,
          {
            method: "GET",
            credentials: "same-origin",
            headers: { Accept: "text/event-stream" },
            signal: controller.signal,
            // Don't let the platform/edge cache an event stream.
            cache: "no-store"
          }
        );

        if (!response.ok || !response.body) {
          throw new Error(`ai_draft_stream_http_${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (!cancelled) {
          const { value, done } = await reader.read();
          if (done) break;
          // stream: true keeps the decoder's internal state so multi-byte
          // characters that span chunks (common with Cyrillic / Estonian
          // diacritics) decode correctly.
          buffer += decoder.decode(value, { stream: true });

          // Drain complete events. SSE event delimiter is a blank line:
          // either \n\n or \r\n\r\n.
          let delimIdx: number;
          while (
            (delimIdx = buffer.indexOf("\n\n")) !== -1 ||
            (delimIdx = buffer.indexOf("\r\n\r\n")) !== -1
          ) {
            const isCrlf = buffer.slice(delimIdx, delimIdx + 4) === "\r\n\r\n";
            const block = buffer.slice(0, delimIdx);
            buffer = buffer.slice(delimIdx + (isCrlf ? 4 : 2));

            const parsed = parseEventBlock(block);
            if (!parsed) continue;

            if (parsed.event === "done") {
              if (cancelled) return;
              setState((prev) => ({
                ...prev,
                isStreaming: false,
                isComplete: true
              }));
              return;
            }

            // Default `message` event: append the token chunk.
            accumulatedRef.current += parsed.data;
            if (!cancelled) {
              const next = accumulatedRef.current;
              setState((prev) => ({ ...prev, text: next }));
            }
          }
        }

        // Stream ended without a `done` event — treat as error so the card
        // falls back to the static reveal rather than hanging.
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            error: prev.isComplete ? null : new Error("ai_draft_stream_premature_close")
          }));
        }
      } catch (err) {
        if (cancelled) return;
        // AbortError on unmount is expected — not a real failure.
        if (err instanceof DOMException && err.name === "AbortError") return;
        const error = err instanceof Error ? err : new Error(String(err));
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error
        }));
      }
    };

    void run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [streamKey]);

  return state;
}

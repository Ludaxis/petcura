/**
 * AI Draft SSE Stream
 *
 * This route streams the exact text already persisted in ai_outputs for a
 * specific draft ID. Provider calls and ai_outputs writes happen before this
 * route is opened, so aborting the stream never leaves a partial AI row.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";

// Force the route to be dynamic — streaming responses cannot be statically
// rendered or cached at the edge.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Locale = "en" | "et" | "ru";

function parseLocale(raw: string | null): Locale {
  if (raw === "et" || raw === "ru") return raw;
  return "en";
}

function isUuid(value: string | null): value is string {
  return Boolean(
    value?.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  );
}

function pickDraftText(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const text = (value as Record<string, unknown>).text;
  return typeof text === "string" ? text.trim() : "";
}

/** Split text into ~3–8 character "token" chunks, preserving UTF-8 grapheme
 *  boundaries via `Intl.Segmenter` (so we don't slice mid-character on
 *  Cyrillic or composed glyphs). Falls back to chunked slice if Segmenter
 *  isn't available in the runtime. */
function tokenize(text: string): string[] {
  const segments: string[] =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment)
      : Array.from(text);

  const out: string[] = [];
  let i = 0;
  while (i < segments.length) {
    // Pseudo-random chunk size between 3 and 8 graphemes. Deterministic-ish
    // (no RNG state across requests) is fine for a stub.
    const size = 3 + ((i * 7) % 6);
    out.push(segments.slice(i, i + size).join(""));
    i += size;
  }
  return out;
}

function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store, no-transform",
    Connection: "keep-alive",
    // Disable buffering on proxies (nginx-style hint).
    "X-Accel-Buffering": "no"
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ requestId: string }> }
): Promise<Response> {
  // Auth gate. We deliberately do NOT call `requireStaffContext` because that
  // helper `redirect()`s — wrong shape for an API route. We re-implement the
  // minimal check here.
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { requestId } = await context.params;
  if (!isUuid(requestId)) {
    return new Response(JSON.stringify({ error: "invalid_request_id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const url = new URL(request.url);
  parseLocale(url.searchParams.get("lang"));
  const draftId = url.searchParams.get("draftId");
  if (!isUuid(draftId)) {
    return new Response(JSON.stringify({ error: "draft_stream_requires_draft_id" }), {
      status: 409,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { data: draft, error: draftError } = await supabase
    .from("ai_outputs")
    .select("id, output_json, confidence")
    .eq("id", draftId)
    .eq("request_id", requestId)
    .eq("kind", "reply_draft")
    .in("status", ["success", "fallback"])
    .is("accepted", null)
    .maybeSingle();

  if (draftError) {
    return new Response(JSON.stringify({ error: "draft_load_failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const draftText = pickDraftText(draft?.output_json);
  if (!draft || draftText.length === 0) {
    return new Response(JSON.stringify({ error: "draft_not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  const tokens = tokenize(draftText);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const signal = request.signal;
      let cancelled = false;

      const onAbort = () => {
        cancelled = true;
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort, { once: true });

      // ~40ms between tokens × ~20–35 tokens → 600–1200ms total.
      const intervalMs = 40;

      try {
        for (const token of tokens) {
          if (cancelled) return;
          // SSE data frame. Each line that begins with "data:" is a payload
          // line; the blank line terminates the event.
          controller.enqueue(encoder.encode(`data: ${token}\n\n`));
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }

        if (cancelled) return;

        // Terminal event. Clients listen for `event: done` to flip into the
        // "stream complete" state and reveal action buttons.
        const donePayload = JSON.stringify({
          draftId: draft.id,
          confidence: draft.confidence
        });
        controller.enqueue(
          encoder.encode(`event: done\ndata: ${donePayload}\n\n`)
        );
      } finally {
        signal.removeEventListener("abort", onAbort);
        if (!cancelled) {
          try {
            controller.close();
          } catch {
            // ignore double-close
          }
        }
      }
    }
  });

  return new Response(stream, { status: 200, headers: sseHeaders() });
}

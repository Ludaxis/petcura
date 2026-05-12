/**
 * AI Draft SSE Stream — STUB
 *
 * Contract (documented in /docs/contracts/ai-draft-stream.md):
 *
 *   GET /api/ai/draft/:requestId/stream?lang=<en|et|ru>
 *
 *   Response headers:
 *     Content-Type:  text/event-stream; charset=utf-8
 *     Cache-Control: no-store
 *     Connection:    keep-alive
 *     X-Accel-Buffering: no
 *
 *   Wire format (one SSE event per token, then a terminal `done` event):
 *
 *     data: <token-chunk>\n\n
 *     ...
 *     event: done
 *     data: {"draftId":"<uuid>","confidence":0.78}
 *
 *   Abort semantics:
 *     If the client closes the connection (`request.signal.aborted`) the
 *     stream stops emitting and closes the controller immediately. No
 *     side effects fire after abort.
 *
 *   Auth:
 *     401 if no authenticated Supabase user. Once Codex wires the real
 *     thing it must additionally scope by clinic_id from clinic_staff
 *     membership (RLS enforced).
 *
 * What this stub does NOT do:
 *   - Call an LLM
 *   - Read or write the database
 *   - Persist anything to `ai_outputs`
 *   - Verify the requestId belongs to the caller's clinic
 *
 * It exists so the client-side consumer (useAiDraftStream + AiDraftCard)
 * can be built, tested, and shipped while the real backend contract is
 * finalized.
 *
 * Where the real version lives:
 *   This same path. The route file stays here; Codex replaces the body
 *   with an actual provider-routed LLM call and ai_outputs persistence.
 *   The SSE event shape above must NOT change — clients are already wired
 *   to it.
 *
 * HANDOFF: Codex owns the real implementation. Replace the body with the
 * actual streaming LLM call + ai_outputs INSERT. The SSE event shape must
 * stay identical.
 */

import "server-only";
import { createClient } from "@/lib/supabase/server";

// Force the route to be dynamic — streaming responses cannot be statically
// rendered or cached at the edge.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Locale = "en" | "et" | "ru";

const FILLER_BY_LOCALE: Record<Locale, string> = {
  en: "Hi! Thanks for reaching out about your pet. We can fit you in tomorrow morning at 9:30 — does that work? If anything changes before then, please send us a quick update so we can adjust the schedule.",
  et: "Tere! Aitäh kirjutamast oma lemmiklooma kohta. Saame teid vastu võtta homme hommikul kell 9.30 — kas see sobib? Kui midagi muutub, andke palun teada, et saaksime aja ümber tõsta.",
  ru: "Здравствуйте! Спасибо, что написали о вашем питомце. Мы можем принять вас завтра утром в 9:30 — подойдёт? Если что-то изменится, дайте нам знать, чтобы мы скорректировали расписание."
};

function parseLocale(raw: string | null): Locale {
  if (raw === "et" || raw === "ru") return raw;
  return "en";
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

/** Stable-ish UUID-v4 without pulling a dependency. */
function pseudoUuid(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // RFC 4122 v4
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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
  if (!requestId || typeof requestId !== "string") {
    return new Response(JSON.stringify({ error: "invalid_request_id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const url = new URL(request.url);
  const locale = parseLocale(url.searchParams.get("lang"));
  const tokens = tokenize(FILLER_BY_LOCALE[locale]);
  const draftId = pseudoUuid();
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
        const donePayload = JSON.stringify({ draftId, confidence: 0.78 });
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

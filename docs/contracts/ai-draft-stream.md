# AI Draft Stream — SSE Contract

**Status:** stub shipped by Claude; production implementation owned by Codex.
**Date:** 2026-05-12

The clinic Request Detail view shows AI-drafted replies. When a fresh draft
exists (created in the last 30 s) the `AiDraftCard` opens a Server-Sent
Events stream so staff see the reply typed out character-by-character. This
document is the wire contract between the client (Claude-owned) and the
backend (Codex-owned).

---

## Endpoint

```
GET /api/ai/draft/:requestId/stream?lang=<locale>
```

| Element     | Value                                                       |
| ----------- | ----------------------------------------------------------- |
| Method      | `GET` only                                                  |
| `requestId` | UUID of the request whose draft is being streamed           |
| `lang`      | `en` \| `et` \| `ru` (defaults to `en` when missing/invalid)|
| Cookies     | Supabase auth cookies on the same origin                    |

### Auth

- 401 JSON `{ "error": "unauthorized" }` when there is no Supabase user.
- The real implementation **must** additionally verify the caller has an
  active `clinic_staff` membership whose `clinic_id` matches the request's
  clinic (RLS-backed). The stub does not.

### Validation

- 400 JSON `{ "error": "invalid_request_id" }` when `requestId` is missing
  or malformed.

---

## Response

### Headers

```
Content-Type:       text/event-stream; charset=utf-8
Cache-Control:      no-store, no-transform
Connection:         keep-alive
X-Accel-Buffering:  no
```

`X-Accel-Buffering: no` tells nginx and Vercel's proxy not to buffer the
response, which is essential for sub-second token delivery.

### Event format

The stream emits two kinds of SSE events:

#### 1. Token events (`message` — the default)

One event per token chunk. Token chunks are 3–8 graphemes long. UTF-8
boundaries are preserved server-side; clients must use a streaming
`TextDecoder` to handle multi-byte characters that span TCP frames.

```
data: Hi! Th
\n
data: anks fo
\n
data: r reach
\n
```

(Blank lines represent the SSE event terminator `\n\n`.)

#### 2. Terminal `done` event

Emitted exactly once, after the last token, immediately before the stream
closes:

```
event: done
data: {"draftId":"<uuid>","confidence":0.78}

```

`draftId` is the `ai_outputs.id` the staff actions (accept / edit / reject)
will then target. `confidence` is the model's reported confidence in [0,1].

### Sample bytes-over-wire (3 lines)

```
data: Hi! Th\n\ndata: anks fo\n\nevent: done\ndata: {"draftId":"01HZK...","confidence":0.78}\n\n
```

---

## Abort semantics

The route honors `request.signal`. If the client closes the underlying
fetch (component unmount, navigation away, manual cancel) the route stops
emitting and closes the controller within one event tick. The real
implementation **must not** persist a partial `ai_outputs` row on abort —
either persist the full draft on completion or roll back.

---

## Client expectations

The `useAiDraftStream` hook in
`apps/web/app/requests/[id]/_components/useAiDraftStream.ts` consumes this
endpoint and exposes `{ text, isStreaming, isComplete, error }`. Any of the
following flip the card into the static timer-based fallback reveal:

- HTTP status ≠ 200
- Missing response body
- Network error / fetch rejection
- Stream ends without a `done` event ("premature close")

The client never retries — the fallback path is the retry. Backend can
assume a single attempt per draft per page load.

---

## Stub → real handoff

The current handler in `apps/web/app/api/ai/draft/[requestId]/stream/route.ts`
is a **stub**: it generates 80–120 characters of locale-aware filler text,
emits it as fake tokens with a ~40 ms gap, and returns a synthetic
`draftId`. It does not call any LLM and does not touch the database.

When Codex replaces it the route file stays at the same path. Only the
**body** changes:

1. Look up the request, verify clinic scoping.
2. Pull the latest queued `ai_outputs` row (or generate one) for this request.
3. Stream tokens from the provider-routed model layer (with the prompt
   version + model id stamped onto the `ai_outputs` row).
4. On success: finalize the `ai_outputs` row (model, prompt version,
   input, output, confidence, tokens, latency, review status = pending).
5. Emit the `done` event with the real `draftId` and confidence.
6. On client abort: do not persist a partial draft.

The **SSE event shape above is frozen**. The client is wired to it.
Changing the event names, the order, or the `done` payload shape requires
a coordinated client change in the same PR.

---

## Ownership

- **Backend (real implementation):** Codex
- **Frontend consumer:** Claude
- **Wire contract changes:** require both, documented in this file.

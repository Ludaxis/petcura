# AI Draft Stream — SSE Contract

**Status:** persisted-output stream implemented by Codex.
**Date:** 2026-05-15

The clinic Request Detail view shows AI-drafted replies. When a fresh draft
exists (created in the last 30 s) the `AiDraftCard` opens a Server-Sent
Events stream so staff see the reply typed out character-by-character. This
document is the wire contract between the client (Claude-owned) and the
backend (Codex-owned).

---

## Endpoint

```
GET /api/ai/draft/:requestId/stream?lang=<locale>&draftId=<ai_output_id>
```

| Element     | Value                                                       |
| ----------- | ----------------------------------------------------------- |
| Method      | `GET` only                                                  |
| `requestId` | UUID of the request whose draft is being streamed           |
| `lang`      | `en` \| `et` \| `ru` (defaults to `en` when missing/invalid)|
| `draftId`   | UUID of the persisted `ai_outputs.kind = reply_draft` row   |
| Cookies     | Supabase auth cookies on the same origin                    |

### Auth

- 401 JSON `{ "error": "unauthorized" }` when there is no Supabase user.
- The real implementation **must** additionally verify the caller has an
  active `clinic_staff` membership whose `clinic_id` matches the request's
  clinic (RLS-backed). The stub does not.

### Validation

- 400 JSON `{ "error": "invalid_request_id" }` when `requestId` is missing
  or malformed.
- 409 JSON `{ "error": "draft_stream_requires_draft_id" }` when `draftId`
  is missing or malformed. Clients must fall back to the static persisted
  draft text in this case.
- 404 JSON `{ "error": "draft_not_found" }` when the draft row is missing,
  already reviewed, unsafe/non-successful, or hidden by RLS.

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
emitting and closes the controller within one event tick. Draft generation
and `ai_outputs` persistence happen before this route opens; the stream
never writes partial rows.

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

## Implementation Notes

The handler in `apps/web/app/api/ai/draft/[requestId]/stream/route.ts`
does not call an AI provider. It loads the exact pending `reply_draft`
row named by `draftId`, verifies request scoping through Supabase RLS, and
streams `output_json.text`. Missing `draftId` is intentionally a safe
disable path: the client falls back to the already-loaded persisted text
instead of showing text that cannot be accepted against the same row.

The **SSE event shape above is frozen**. Changing the event names, the
order, or the `done` payload shape requires a coordinated client change in
the same PR.

---

## Ownership

- **Backend (real implementation):** Codex
- **Frontend consumer:** Claude
- **Wire contract changes:** require both, documented in this file.

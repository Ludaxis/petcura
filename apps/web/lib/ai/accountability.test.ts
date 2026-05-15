import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  buildAiOutputInsert,
  hashAiPromptMaterial,
  inferAiProvider
} from "./accountability";

describe("AI accountability helpers", () => {
  it("hashes prompt material deterministically", () => {
    const hash = hashAiPromptMaterial({
      promptKey: "reply_draft.v1",
      promptVersion: "reply_draft.v1.2026-05-12",
      system: "system",
      prompt: "prompt"
    });

    expect(hash).toHaveLength(64);
    expect(hash).toBe(
      hashAiPromptMaterial({
        promptKey: "reply_draft.v1",
        promptVersion: "reply_draft.v1.2026-05-12",
        system: "system",
        prompt: "prompt"
      })
    );
    expect(hash).not.toBe(
      hashAiPromptMaterial({
        promptKey: "reply_draft.v1",
        promptVersion: "reply_draft.v1.2026-05-12",
        system: "system",
        prompt: "changed"
      })
    );
  });

  it("infers provider family from routed model names", () => {
    expect(inferAiProvider("anthropic/claude-haiku-4.5")).toBe("anthropic");
    expect(inferAiProvider("gpt-4.1-mini")).toBe("openai");
    expect(inferAiProvider("petcura/rules-fallback")).toBe("petcura");
  });

  it("builds non-reviewable records for provider and schema failures", () => {
    const row = buildAiOutputInsert({
      clinicId: "20000000-0000-4000-8000-000000000001",
      requestId: "40000000-0000-4000-8000-000000000001",
      kind: "reply_draft",
      status: "schema_failure",
      model: "anthropic/claude-haiku-4.5",
      promptKey: "reply_draft.v1",
      promptVersion: "reply_draft.v1.2026-05-12",
      promptHash: "a".repeat(64),
      inputJson: {},
      outputJson: { error: "schema_validation_failed" },
      failureReason: "schema_validation_failed"
    });

    expect(row.review_status).toBe("not_reviewable");
    expect(row.provider).toBe("anthropic");
    expect(row.failure_reason).toBe("schema_validation_failed");
  });
});

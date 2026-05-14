import { describe, expect, it } from "vitest";
import {
  contextRetrievalOutputSchema,
  formatSummaryForStaff,
  intakeQuestionOutputSchema,
  memoryExtractionOutputSchema,
  replyDraftOutputSchema,
  summaryLocalizationOutputSchema,
  summaryOutputSchema,
  translationOutputSchema
} from "./index";

describe("AI output contracts", () => {
  it("validates advisory web intake output without final medical decisions", () => {
    const output = intakeQuestionOutputSchema.parse({
      categorySuggestion: "medical_question",
      serviceIntent: "grooming",
      routingSuggestion: "GROOMING",
      urgencySuggestion: "Medium",
      emergencySignal: false,
      riskFlags: ["itching", ""],
      missingFields: ["duration"],
      clarifyingQuestions: [
        "How long has this been happening?",
        "Is Luna eating and drinking normally?"
      ],
      handoffSummary:
        "Owner asks about grooming but mentions itching, so staff should review before scheduling.",
      confidence: "82",
      safetyNotes: ["advisory_only", "staff_review_required"]
    });

    expect(output.routingSuggestion).toBe("grooming");
    expect(output.urgencySuggestion).toBe("medium");
    expect(output.confidence).toBe(0.82);
    expect(output.riskFlags).toEqual(["itching"]);
    expect(output.safetyNotes).toContain("staff_review_required");
  });

  it("validates staff summary output and formats a fallback summary", () => {
    const output = summaryOutputSchema.parse({
      issue: "Reduced appetite",
      duration: "24 hours",
      symptoms: ["lethargy"],
      riskFlags: ["not eating"],
      urgencySuggestion: "medium",
      confidence: 0.76
    });

    expect(formatSummaryForStaff(output)).toContain("Reduced appetite");
    expect(formatSummaryForStaff(output)).toContain("Risk flags");
  });

  it("normalizes provider summary shapes that are safe but slightly loose", () => {
    const output = summaryOutputSchema.parse({
      summaryText: "Owner reports repeated vomiting after eating.",
      issue: null,
      duration: null,
      symptoms: ["vomiting", ""],
      riskFlags: null,
      urgencySuggestion: "Medium",
      confidence: "76"
    });

    expect(output.issue).toBe("Owner reports repeated vomiting after eating.");
    expect(output.urgencySuggestion).toBe("medium");
    expect(output.confidence).toBe(0.76);
    expect(output.riskFlags).toEqual([]);
  });

  it("validates translation output", () => {
    expect(
      translationOutputSchema.parse({
        translatedText: "The cat has not eaten since yesterday.",
        confidence: 0.91
      })
    ).toMatchObject({ confidence: 0.91 });
  });

  it("validates localized summary output with translated risk flags", () => {
    expect(
      summaryLocalizationOutputSchema.parse({
        summaryText: "Omanik teatab korduvast oksendamisest pärast söömist.",
        riskFlags: ["korduv oksendamine", ""],
        confidence: "82"
      })
    ).toMatchObject({
      confidence: 0.82,
      riskFlags: ["korduv oksendamine"]
    });
  });

  it("validates memory extraction candidates with source provenance", () => {
    const output = memoryExtractionOutputSchema.parse({
      candidates: [
        {
          scopeType: "owner",
          scopeId: "30000000-0000-4000-8000-000000000001",
          memoryType: "communication_preference",
          text: "Owner prefers Estonian follow-up messages.",
          confidence: "88",
          sources: [
            {
              sourceType: "message",
              sourceId: "50000000-0000-4000-8000-000000000001"
            }
          ]
        }
      ],
      confidence: 0.8
    });

    expect(output.candidates[0]?.confidence).toBe(0.88);
    expect(output.candidates[0]?.sources[0]?.sourceType).toBe("message");
  });

  it("validates context retrieval and reply drafts without final decisions", () => {
    const context = contextRetrievalOutputSchema.parse({
      taskKind: "reply_draft",
      selectedMemoryIds: ["40000000-0000-4000-8000-000000000001"],
      promptContextHash: "1234567890abcdef",
      contextItems: [
        {
          id: "40000000-0000-4000-8000-000000000001",
          scopeType: "pet",
          scopeId: "30000000-0000-4000-8000-000000000001",
          memoryType: "safety_context",
          text: "Pet should be handled gently due to prior fear response.",
          updatedAt: "2026-05-12T08:00:00.000Z"
        }
      ]
    });

    const draft = replyDraftOutputSchema.parse({
      text: "Thanks for the update. We can help the team review this today.",
      confidence: 0.73,
      usedMemoryIds: context.selectedMemoryIds,
      safetyNotes: ["staff_review_required"]
    });

    expect(draft.usedMemoryIds).toEqual(context.selectedMemoryIds);
    expect(draft.safetyNotes).toContain("staff_review_required");
  });
});

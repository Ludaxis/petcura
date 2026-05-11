import { describe, expect, it } from "vitest";
import {
  formatSummaryForStaff,
  summaryOutputSchema,
  translationOutputSchema
} from "./index";

describe("AI output contracts", () => {
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

  it("validates translation output", () => {
    expect(
      translationOutputSchema.parse({
        translatedText: "The cat has not eaten since yesterday.",
        confidence: 0.91
      })
    ).toMatchObject({ confidence: 0.91 });
  });
});

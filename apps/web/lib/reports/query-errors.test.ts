import { describe, expect, it } from "vitest";
import { isMissingOptionalReportTableError } from "./query-errors";

describe("report query errors", () => {
  it("recognizes missing optional Supabase tables from schema-cache errors", () => {
    expect(
      isMissingOptionalReportTableError(
        {
          code: "PGRST205",
          message:
            "Could not find the table 'public.pms_invoice_summaries' in the schema cache"
        },
        "pms_invoice_summaries"
      )
    ).toBe(true);
  });

  it("recognizes missing optional tables from relation errors", () => {
    expect(
      isMissingOptionalReportTableError(
        {
          code: "42P01",
          message: 'relation "public.pms_invoice_summaries" does not exist'
        },
        "pms_invoice_summaries"
      )
    ).toBe(true);
  });

  it("does not hide unrelated report query failures", () => {
    expect(
      isMissingOptionalReportTableError(
        {
          code: "42501",
          message: "permission denied for table pms_invoice_summaries"
        },
        "pms_invoice_summaries"
      )
    ).toBe(false);

    expect(
      isMissingOptionalReportTableError(
        {
          code: "PGRST205",
          message: "Could not find the table 'public.requests' in the schema cache"
        },
        "pms_invoice_summaries"
      )
    ).toBe(false);
  });
});

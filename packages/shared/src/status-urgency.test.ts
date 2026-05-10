import { describe, expect, it } from "vitest";
import {
  getInboxViewForRequest,
  inboxViewColumns,
  requestStatusColumns
} from "./index";

describe("request status and urgency mapping", () => {
  it("does not persist urgent as a request status", () => {
    expect(requestStatusColumns.map((column) => column.value)).toEqual([
      "new",
      "waiting_staff",
      "waiting_owner",
      "resolved"
    ]);
  });

  it("keeps urgent as a derived inbox view", () => {
    expect(inboxViewColumns.map((column) => column.value)).toContain("urgent");
    expect(
      getInboxViewForRequest({ status: "new", urgency: "high" })
    ).toBe("urgent");
    expect(
      getInboxViewForRequest({ status: "resolved", urgency: "high" })
    ).toBe("resolved");
  });
});

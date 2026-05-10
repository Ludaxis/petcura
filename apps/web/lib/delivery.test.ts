import { describe, expect, it } from "vitest";
import { getLatestDeliveryEvent, normalizeDeliveryStatus } from "./delivery";

describe("delivery helpers", () => {
  it("normalizes supported delivery statuses", () => {
    expect(normalizeDeliveryStatus("queued")).toBe("queued");
    expect(normalizeDeliveryStatus("SENT")).toBe("sent");
    expect(normalizeDeliveryStatus("delivered")).toBe("delivered");
    expect(normalizeDeliveryStatus("read")).toBe("read");
    expect(normalizeDeliveryStatus("acknowledged")).toBe("acknowledged");
    expect(normalizeDeliveryStatus("failed")).toBe("failed");
  });

  it("returns null for unknown provider statuses", () => {
    expect(normalizeDeliveryStatus("accepted")).toBeNull();
    expect(normalizeDeliveryStatus(undefined)).toBeNull();
  });

  it("selects the latest event by timestamp", () => {
    expect(
      getLatestDeliveryEvent([
        {
          id: "sent",
          status: "sent",
          provider: "twilio",
          created_at: "2026-05-10T16:09:18.000Z"
        },
        {
          id: "read",
          status: "read",
          provider: "twilio",
          created_at: "2026-05-10T16:09:24.000Z"
        }
      ])
    )?.toMatchObject({ id: "read", status: "read" });
  });
});

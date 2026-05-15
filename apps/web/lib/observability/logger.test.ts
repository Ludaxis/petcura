import { describe, expect, it, vi } from "vitest";
import { logger } from "./logger";

describe("logger", () => {
  it("redacts secret-like fields from structured logs", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);

    logger.info("qa.test", {
      clinicId: "clinic-a",
      token: "should-not-appear",
      nested: {
        authorization: "Bearer secret"
      }
    });

    const firstCall = spy.mock.calls[0];
    expect(firstCall).toBeDefined();
    const payload = JSON.parse(String(firstCall?.[0]));
    expect(payload).toMatchObject({
      level: "info",
      event: "qa.test",
      service: "petcura-web",
      clinicId: "clinic-a",
      token: "[redacted]",
      nested: {
        authorization: "[redacted]"
      }
    });
    expect(JSON.stringify(payload)).not.toContain("should-not-appear");

    spy.mockRestore();
  });
});

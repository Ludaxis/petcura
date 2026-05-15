import { expect, test } from "@playwright/test";

test("@live staging health returns deployment readiness shape", async ({
  request
}) => {
  test.skip(
    !process.env.PLAYWRIGHT_LIVE_BASE_URL,
    "Set PLAYWRIGHT_LIVE_BASE_URL to run live staging smoke."
  );

  const response = await request.get("/health?strict=1");
  expect([200, 503]).toContain(response.status());
  const body = await response.json();

  expect(body.service).toBe("petcura-web");
  expect(body.region).toBeTruthy();
  expect(body.checks.supabase).toHaveProperty("ok");
});

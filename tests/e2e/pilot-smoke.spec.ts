import { expect, test } from "@playwright/test";

test("@smoke public owner and staff auth entry points render", async ({ page }) => {
  await page.goto("/o/login?lang=en");
  await expect(
    page.getByRole("heading", { name: /welcome|sign in/i })
  ).toBeVisible();
  await expect(page.getByLabel(/phone/i).first()).toBeVisible();

  await page.goto("/login?lang=en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByLabel(/work email/i)).toBeVisible();
});

test("@smoke health endpoint exposes readiness without secret values", async ({
  request
}) => {
  const response = await request.get("/health");
  expect([200, 503]).toContain(response.status());
  const body = await response.json();

  expect(body.service).toBe("petcura-web");
  expect(body.build.short).toBeTruthy();
  expect(body.checks.env).toBeTruthy();
  expect(JSON.stringify(body)).not.toMatch(/sb_secret_|sbp_|Bearer\s/i);
});

import { expect, test } from "@playwright/test";

const publicRoutes = ["/", "/owners", "/demo", "/sandbox", "/trust"] as const;

test.describe("Public marketing experience", () => {
  for (const route of publicRoutes) {
    test(`${route} renders as a public route`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("body")).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`${route === "/" ? "/" : route}`));
    });
  }

  test("landing CTAs resolve to real public routes", async ({ page, request }) => {
    await page.goto("/");

    const hrefs = await page.locator("a[href]").evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("href"))
        .filter((href): href is string => Boolean(href))
    );

    expect(hrefs).not.toContain("/sandbox#walkthrough");
    expect(hrefs.some((href) => href.startsWith("mailto:"))).toBe(false);

    for (const route of ["/demo", "/sandbox", "/trust", "/owners"] as const) {
      expect(hrefs.some((href) => href.startsWith(route))).toBe(true);
      const response = await request.get(route);
      expect(response.status(), route).toBeLessThan(400);
    }
  });

  test("demo form validates, blocks honeypot spam, and shows a confirmation path", async ({
    page
  }) => {
    test.skip(
      test.info().project.name.includes("mobile"),
      "Form behavior is shared; desktop run keeps the suite fast."
    );

    await page.goto("/demo");
    await page.getByRole("button", { name: "Request demo" }).click();
    await expect(page.getByText("Check this field and try again.")).toHaveCount(5);

    await fillDemoForm(page);
    await page.locator("input[name='website']").evaluate((input) => {
      (input as HTMLInputElement).value = "https://spam.example";
    });
    await page.getByRole("button", { name: "Request demo" }).click();
    await expect(page.getByLabel("Clinic name")).toBeVisible();
    await expect(page.getByText("Demo request received")).toHaveCount(0);

    await page.goto("/demo");
    await fillDemoForm(page);
    await page.getByRole("button", { name: "Request demo" }).click();
    await expect(
      page.getByText(/Demo request received|Use the email fallback/)
    ).toBeVisible();
  });

  test("sandbox renders fake inbox without auth redirect", async ({ page }) => {
    await page.goto("/sandbox");

    await expect(page).toHaveURL(/\/sandbox/);
    await expect(
      page.getByRole("heading", {
        name: "Walk through the PetCura inbox without logging in."
      })
    ).toBeVisible();
    await expect(page.getByText("SANDBOX-8421")).toHaveCount(1);
    await expect(page.getByText(/Staff approval/)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toHaveCount(0);
  });

  test("trust center avoids completed-certification overclaims", async ({ page }) => {
    await page.goto("/trust");
    const bodyText = await page.locator("body").innerText();

    expect(bodyText).toContain("SOC 2");
    expect(bodyText).toContain("In progress");
    expect(bodyText).toContain("ISO 27001");
    expect(bodyText).toContain("Planned");
    expect(bodyText).not.toContain("EU AI Act conformant");
    expect(bodyText).not.toMatch(/completed\s+SOC\s*2/i);
    expect(bodyText).not.toMatch(/completed\s+ISO\s*27001/i);
  });
});

async function fillDemoForm(page: import("@playwright/test").Page) {
  await page.getByLabel("Clinic name").fill("Example Vet Clinic");
  await page.getByLabel("Contact name").fill("Marta Tamm");
  await page.getByLabel("Work email").fill("marta@example.test");
  await page.getByLabel("Country").fill("Estonia");
  await page.getByLabel("PMS system (optional)").fill("Provet");
  await page.getByLabel("Monthly owner requests (optional)").selectOption("100_300");
  await page
    .getByLabel("What should we know? (optional)")
    .fill("We want to understand WhatsApp intake and PMS export fit.");
  await page
    .getByLabel(
      "I agree PetCura may process this information to respond to my demo request."
    )
    .check();
}

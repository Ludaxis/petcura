import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@petcura/shared";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const defaultClinicSlug =
  process.env.PETCURA_DEFAULT_CLINIC_SLUG?.trim() || "alex-vet-demo";
const superAdminEmail =
  process.env.PETCURA_SUPER_ADMIN_EMAILS?.split(",")[0]?.trim() ||
  process.env.PETCURA_BOOTSTRAP_STAFF_EMAILS?.split(",")[0]?.trim();

function adminClient() {
  if (!supabaseUrl || !secretKey) {
    throw new Error("Missing Supabase env.");
  }
  return createClient<Database>(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

async function findAuthUserByEmail(
  admin: ReturnType<typeof adminClient>,
  email: string
) {
  for (let page = 1; page <= 10; page += 1) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );
    if (match || data.users.length < 1000) return match ?? null;
  }

  return null;
}

async function ensureSuperAdminStaff(admin: ReturnType<typeof adminClient>) {
  if (!superAdminEmail) {
    throw new Error("Missing super-admin email.");
  }

  const { data: clinic } = await admin
    .from("clinics")
    .select("id")
    .eq("slug", defaultClinicSlug)
    .single();

  const existingUser = await findAuthUserByEmail(admin, superAdminEmail);
  const userId = existingUser
    ? existingUser.id
    : (
        await admin.auth.admin.createUser({
          email: superAdminEmail,
          email_confirm: true
        })
      ).data.user!.id;

  await admin.from("clinic_staff").upsert(
    {
      clinic_id: clinic!.id,
      user_id: userId,
      role: "admin",
      is_active: true
    },
    { onConflict: "clinic_id,user_id" }
  );

  return { email: superAdminEmail, userId };
}

async function authenticateAs(
  admin: ReturnType<typeof adminClient>,
  page: import("@playwright/test").Page,
  baseURL: string | undefined,
  email: string,
  next: string
) {
  const { data: link } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${baseURL}/auth/callback?next=${next}&lang=en` }
  });
  const callbackUrl = new URL("/auth/callback", baseURL);
  callbackUrl.searchParams.set("next", next);
  callbackUrl.searchParams.set("lang", "en");
  callbackUrl.searchParams.set("token_hash", link.properties!.hashed_token);
  callbackUrl.searchParams.set(
    "type",
    link.properties!.verification_type ?? "magiclink"
  );
  await page.goto(callbackUrl.toString());
}

async function delayTabNavigation(
  page: import("@playwright/test").Page,
  pathname: string,
  tab: string
) {
  let delayed = false;
  await page.route(
    (url) =>
      !delayed &&
      url.pathname === pathname &&
      url.searchParams.get("tab") === tab,
    async (route) => {
      delayed = true;
      await new Promise((resolve) => setTimeout(resolve, 750));
      await route.continue();
    }
  );
}

test.describe("Super-admin console", () => {
  test("shows immediate pending feedback on settings and admin tab switches", async ({
    page,
    baseURL
  }, testInfo) => {
    test.skip(
      !supabaseUrl || !secretKey || !superAdminEmail,
      "Supabase env and a configured super-admin email are required."
    );

    const admin = adminClient();
    const { email } = await ensureSuperAdminStaff(admin);

    await authenticateAs(admin, page, baseURL, email, "/settings?tab=team");
    await expect(
      page.getByRole("heading", { name: "Clinic settings" })
    ).toBeVisible();

    await delayTabNavigation(page, "/settings", "activity");
    const settingsTabs = page.getByRole("navigation", {
      name: "Settings sections"
    });
    await page
      .getByRole("link", { name: /Activity/ })
      .click({ noWaitAfter: true });
    await expect(settingsTabs).toHaveAttribute("aria-busy", "true");
    await expect(settingsTabs.getByText("Loading settings").first()).toHaveText(
      "Loading settings"
    );
    await page.waitForURL(
      (url) =>
        url.pathname === "/settings" && url.searchParams.get("tab") === "activity"
    );
    await expect(
      page.getByRole("heading", { name: "Team activity" })
    ).toBeVisible();

    await page.goto("/admin?tab=leads&lang=en");
    await expect(
      page.getByRole("heading", { name: "Admin console" })
    ).toBeVisible();

    await delayTabNavigation(page, "/admin", "clinics");
    const adminTabsNav = page.getByRole("navigation", {
      name: "Admin sections"
    });
    await page
      .getByRole("link", { name: /Clinics/ })
      .click({ noWaitAfter: true });
    await expect(adminTabsNav).toHaveAttribute("aria-busy", "true");
    await expect(adminTabsNav.getByText("Loading admin").first()).toHaveText(
      "Loading admin"
    );
    await page.waitForURL(
      (url) =>
        url.pathname === "/admin" && url.searchParams.get("tab") === "clinics"
    );
    await expect(page.getByRole("heading", { name: "Clinics" })).toBeVisible();
  });

  test("manages demo leads with bulk status and archive actions", async ({
    page,
    baseURL
  }, testInfo) => {
    test.skip(
      testInfo.project.name.includes("mobile"),
      "Desktop run covers table selection and super-admin workflow."
    );
    test.skip(
      !supabaseUrl || !secretKey || !superAdminEmail,
      "Supabase env and a configured super-admin email are required."
    );

    const admin = adminClient();
    const { error: schemaError } = await admin
      .from("marketing_leads")
      .select("id, status, updated_at")
      .limit(1);
    test.skip(
      Boolean(schemaError),
      `Configured Supabase database has not applied the admin lead workflow migration: ${schemaError?.message}`
    );

    const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const clinicNames = [
      `Admin QA Alpha ${unique}`,
      `Admin QA Beta ${unique}`
    ];
    let clinicId: string | undefined;
    let userId: string | undefined;
    const leadIds: string[] = [];

    try {
      const { data: clinic } = await admin
        .from("clinics")
        .select("id")
        .eq("slug", defaultClinicSlug)
        .single();
      clinicId = clinic!.id;

      const existingUser = await findAuthUserByEmail(admin, superAdminEmail!);
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const { data: user } = await admin.auth.admin.createUser({
          email: superAdminEmail!,
          email_confirm: true
        });
        userId = user.user!.id;
      }

      await admin.from("clinic_staff").upsert(
        {
          clinic_id: clinicId,
          user_id: userId,
          role: "admin",
          is_active: true
        },
        { onConflict: "clinic_id,user_id" }
      );

      for (const clinicName of clinicNames) {
        const { data: lead } = await admin
          .from("marketing_leads")
          .insert({
            source: "demo_page",
            locale: "en",
            clinic_name: clinicName,
            contact_name: `QA Sender ${unique}`,
            work_email: `qa-${unique}@example.test`,
            country: "Estonia",
            pms_system: "Provet",
            monthly_request_volume: "100_300",
            message:
              "QA smoke test for super-admin lead management. No owner or pet medical details.",
            consent_given: true
          })
          .select("id")
          .single();
        leadIds.push(lead!.id);
      }

      const { data: link } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: superAdminEmail!,
        options: {
          redirectTo: `${baseURL}/auth/callback?next=/admin&lang=en`
        }
      });
      const callbackUrl = new URL("/auth/callback", baseURL);
      callbackUrl.searchParams.set(
        "next",
        `/admin?tab=leads&q=${encodeURIComponent(unique)}`
      );
      callbackUrl.searchParams.set("lang", "en");
      callbackUrl.searchParams.set(
        "token_hash",
        link.properties!.hashed_token
      );
      callbackUrl.searchParams.set(
        "type",
        link.properties!.verification_type ?? "magiclink"
      );
      await page.goto(callbackUrl.toString());

      await expect(
        page.getByRole("heading", { name: "Admin console" })
      ).toBeVisible();
      await expect(page.getByRole("link", { name: /Leads/ })).toHaveAttribute(
        "aria-current",
        "page"
      );

      for (const clinicName of clinicNames) {
        const row = page.locator("[data-admin-lead-row]", { hasText: clinicName });
        await expect(row).toBeVisible();
        await row.getByRole("checkbox").check();
      }

      await expect(page.getByText("2 selected")).toBeVisible();
      await page.getByRole("button", { name: "Mark qualified" }).click();
      await expect(page.getByText("Updated 2 lead(s).")).toBeVisible();

      const { data: qualifiedRows } = await admin
        .from("marketing_leads")
        .select("id, status")
        .in("id", leadIds);
      expect(qualifiedRows?.map((row) => row.status).sort()).toEqual([
        "qualified",
        "qualified"
      ]);

      const firstRow = page.locator("[data-admin-lead-row]", {
        hasText: clinicNames[0]
      });
      await firstRow.getByRole("button", { name: "Details" }).click();
      await page.getByLabel("Admin note").fill("Follow up after QA call.");
      await page.getByRole("button", { name: "Save note" }).click();
      await expect(page.getByText("Updated 1 lead(s).")).toBeVisible();
      await page.keyboard.press("Escape");

      for (const clinicName of clinicNames) {
        await page
          .locator("[data-admin-lead-row]", { hasText: clinicName })
          .getByRole("checkbox")
          .check();
      }
      page.once("dialog", (dialog) => dialog.accept());
      await page.getByRole("button", { name: "Archive" }).click();
      await expect(page.getByText("Updated 2 lead(s).")).toBeVisible();

      const { data: archivedRows } = await admin
        .from("marketing_leads")
        .select("id, status, archived_at")
        .in("id", leadIds);
      expect(archivedRows?.every((row) => row.status === "archived")).toBe(true);
      expect(archivedRows?.every((row) => Boolean(row.archived_at))).toBe(true);

      const { data: events } = await admin
        .from("marketing_lead_events")
        .select("action")
        .in("lead_id", leadIds);
      expect(events?.some((event) => event.action === "status_changed")).toBe(
        true
      );
      expect(events?.some((event) => event.action === "archived")).toBe(true);
    } finally {
      if (leadIds.length > 0) {
        await admin.from("marketing_leads").delete().in("id", leadIds);
      }
    }
  });
});

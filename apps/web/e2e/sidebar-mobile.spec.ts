import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@petcura/shared";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const defaultClinicSlug =
  process.env.PETCURA_DEFAULT_CLINIC_SLUG?.trim() || "alex-vet-demo";

function adminClient() {
  if (!supabaseUrl || !secretKey) {
    throw new Error("Missing Supabase env.");
  }
  return createClient<Database>(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * Slice B mobile shell coverage: the sidebar collapses into shadcn's Sheet
 * drawer below 768px, the header bar surfaces the SidebarTrigger and the
 * current page title, and pressing the trigger opens the drawer over the
 * content. We exercise this on /reports so coming-soon shell routes cannot
 * accidentally render the default "Inbox" mobile title.
 */
test.describe("Mobile sidebar shell", () => {
  test("trigger reveals sidebar drawer below md", async ({ page, baseURL }) => {
    test.skip(
      !supabaseUrl || !publishableKey || !secretKey,
      "Supabase env required."
    );

    const admin = adminClient();
    const unique = Date.now();
    const staffEmail = `petcura-mobile-${unique}@example.test`;
    let clinicId: string | undefined;
    let staffUserId: string | undefined;
    try {
      const { data: clinic } = await admin
        .from("clinics")
        .select("id")
        .eq("slug", defaultClinicSlug)
        .single();
      clinicId = clinic!.id;
      const { data: user } = await admin.auth.admin.createUser({
        email: staffEmail,
        email_confirm: true
      });
      staffUserId = user.user!.id;
      await admin
        .from("clinic_staff")
        .upsert(
          {
            clinic_id: clinicId,
            user_id: staffUserId,
            role: "admin",
            is_active: true
          },
          { onConflict: "clinic_id,user_id" }
        );

      const { data: link } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: staffEmail,
        options: {
          redirectTo: `${baseURL}/auth/callback?next=/reports&lang=en`
        }
      });
      const cb = new URL("/auth/callback", baseURL);
      cb.searchParams.set("next", "/reports");
      cb.searchParams.set("lang", "en");
      cb.searchParams.set("token_hash", link.properties!.hashed_token);
      cb.searchParams.set(
        "type",
        link.properties!.verification_type ?? "magiclink"
      );
      await page.goto(cb.toString());
      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload({ waitUntil: "domcontentloaded" });

      // Mobile header bar is visible, sidebar is collapsed off-canvas.
      await expect(
        page.locator("[data-mobile-shell-header]").getByText("Reports")
      ).toBeVisible();
      const trigger = page.getByRole("button", { name: /open menu/i });
      await expect(trigger).toBeVisible();
      // Desktop rail (240px) is hidden — sidebar gap collapses to 0.
      await expect(page.locator('[data-state="collapsed"]')).toHaveCount(0);

      // Click the trigger — the Sheet drawer opens.
      await trigger.click();
      const drawer = page.locator('[data-mobile="true"]');
      await expect(drawer).toBeVisible({ timeout: 5000 });
      await expect(
        drawer.getByRole("link", { name: /^Inbox$/i })
      ).toBeVisible();
      await expect(
        drawer.getByRole("link", { name: /^Reminders$/i })
      ).toBeVisible();
      await expect(
        drawer.getByRole("link", { name: /^Reports$/i })
      ).toBeVisible();
      await expect(
        drawer.getByRole("link", { name: /^Settings$/i })
      ).toBeVisible();

      // Esc on the focused sheet content closes the drawer (shadcn handles
      // both focus trap and Esc binding). Focus must be inside the sheet
      // for Radix to capture the key; we click on a nav link first to
      // ensure focus has moved into the trapped region. Then assert via
      // the sheet's data-state attribute, since Radix unmounts after its
      // close animation.
      await drawer.focus().catch(() => {});
      await drawer.press("Escape");
      await expect(
        page.locator('[data-mobile="true"][data-state="open"]')
      ).toHaveCount(0, { timeout: 5000 });
    } finally {
      if (staffUserId) {
        await admin.from("clinic_staff").delete().eq("user_id", staffUserId);
        await admin.auth.admin.deleteUser(staffUserId);
      }
    }
  });
});

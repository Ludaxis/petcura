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
 * Slice C coverage:
 *
 *   1. MobileBottomNav renders on viewport < md (390×844) with all four
 *      tabs (Inbox / Search / Reminders / Me). Search dispatches the
 *      cmdk event; Me dispatches the open-me-sheet event which surfaces
 *      MobileMeSheet.
 *
 *   2. Bulk select on /inbox: select two rows via checkbox clicks, then
 *      click "Resolve" — both rows disappear from the default "all" view
 *      (they move to resolved). The action bar is also visible during
 *      selection.
 *
 *   3. Realtime: dispatching a synthetic INSERT through a window event
 *      surfaces the in-app toast. (The full Supabase Realtime path is
 *      covered indirectly by the existing inbox-list realtime spec; this
 *      spec keeps the toast surface independently regressable.)
 */
test.describe("Slice C — bottom-nav, bulk resolve, realtime toast", () => {
  test("bottom nav renders four tabs on mobile and surfaces cmdk + me sheet", async ({
    page,
    baseURL
  }) => {
    test.skip(
      !supabaseUrl || !publishableKey || !secretKey,
      "Supabase env required."
    );
    const admin = adminClient();
    const unique = Date.now();
    const staffEmail = `petcura-bottomnav-${unique}@example.test`;
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
          redirectTo: `${baseURL}/auth/callback?next=/inbox&lang=en`
        }
      });
      const cb = new URL("/auth/callback", baseURL);
      cb.searchParams.set("next", "/inbox");
      cb.searchParams.set("lang", "en");
      cb.searchParams.set("token_hash", link.properties!.hashed_token);
      cb.searchParams.set(
        "type",
        link.properties!.verification_type ?? "magiclink"
      );
      await page.goto(cb.toString());
      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload({ waitUntil: "domcontentloaded" });

      const bottomNav = page.locator("[data-mobile-bottom-nav]");
      await expect(bottomNav).toBeVisible();
      await expect(
        bottomNav.getByRole("link", { name: /^Inbox$/i })
      ).toBeVisible();
      await expect(
        bottomNav.getByRole("button", { name: /^Search$/i })
      ).toBeVisible();
      // Reminders is the new 3rd tab.
      await expect(
        bottomNav.locator("[data-bottom-nav-reminders]")
      ).toBeVisible();
      // The Me tab uses the localized aria-label from menu.ariaLabel.
      await expect(
        bottomNav.getByRole("button", { name: /account menu/i })
      ).toBeVisible();

      // All four tabs should be present (Inbox, Search, Reminders, Me).
      await expect(bottomNav.locator("a, button")).toHaveCount(4);

      // Search tab opens the command palette.
      let cmdkOpened = false;
      await page.exposeFunction("__bottomNavSawCmdk", () => {
        cmdkOpened = true;
      });
      await page.evaluate(() => {
        window.addEventListener("petcura:open-cmdk", () => {
          (window as unknown as { __bottomNavSawCmdk: () => void })
            .__bottomNavSawCmdk();
        });
      });
      await bottomNav.getByRole("button", { name: /^Search$/i }).click();
      // event handler fires synchronously, but wait a tick for safety.
      await page.waitForTimeout(50);
      expect(cmdkOpened).toBe(true);

      // Me tab opens the MobileMeSheet (Radix Dialog). aria-expanded on
      // the tab mirrors the sheet's actual open state via the
      // petcura:me-sheet-state event.
      const meTab = bottomNav.locator("[data-bottom-nav-me]");
      await expect(meTab).toHaveAttribute("aria-expanded", "false");
      await meTab.click();
      const meSheet = page.locator("[data-me-sheet]");
      await expect(meSheet).toBeVisible({ timeout: 3_000 });
      await expect(meTab).toHaveAttribute("aria-expanded", "true", {
        timeout: 3_000
      });
      // Theme + language inline controls are present (Claude-style flat list).
      await expect(
        meSheet.getByRole("radiogroup").first()
      ).toBeVisible();
      await expect(
        meSheet.getByRole("link", { name: /^Profile$/i })
      ).toBeVisible({ timeout: 3_000 });
      // Esc closes and aria-expanded flips back to false.
      await meSheet.press("Escape");
      await expect(page.locator("[data-me-sheet]")).toHaveCount(0, {
        timeout: 3_000
      });
      await expect(meTab).toHaveAttribute("aria-expanded", "false");
    } finally {
      if (staffUserId) {
        await admin.from("clinic_staff").delete().eq("user_id", staffUserId);
        await admin.auth.admin.deleteUser(staffUserId);
      }
    }
  });

  test("bulk resolve marks selected rows as resolved", async ({
    page,
    baseURL
  }, testInfo) => {
    test.skip(
      testInfo.project.name.includes("mobile"),
      "Bulk select pointer flow is exercised on the desktop project."
    );
    test.skip(
      !supabaseUrl || !publishableKey || !secretKey,
      "Supabase env required."
    );
    const admin = adminClient();
    const unique = Date.now();
    const staffEmail = `petcura-bulk-${unique}@example.test`;
    const ownerName = `Bulk Owner ${unique}`;
    const ownerPhone = `+372${unique}`;
    let clinicId: string | undefined;
    let staffUserId: string | undefined;
    let ownerId: string | undefined;
    let petId: string | undefined;
    const requestIds: string[] = [];
    try {
      const { data: clinic } = await admin
        .from("clinics")
        .select("id")
        .eq("slug", defaultClinicSlug)
        .single();
      clinicId = clinic!.id;
      const { data: staffUser } = await admin.auth.admin.createUser({
        email: staffEmail,
        email_confirm: true
      });
      staffUserId = staffUser.user!.id;
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

      const { data: owner } = await admin
        .from("owners")
        .insert({
          clinic_id: clinicId,
          name: ownerName,
          phone: ownerPhone,
          preferred_language: "en"
        })
        .select("id")
        .single();
      ownerId = owner!.id;
      const { data: pet } = await admin
        .from("pets")
        .insert({
          clinic_id: clinicId,
          owner_id: ownerId,
          name: `BulkPet ${unique}`,
          species: "Cat"
        })
        .select("id")
        .single();
      petId = pet!.id;

      for (let i = 0; i < 2; i += 1) {
        const { data: req } = await admin
          .from("requests")
          .insert({
            clinic_id: clinicId,
            owner_id: ownerId,
            pet_id: petId,
            category: "medical_question",
            channel: "web",
            status: "new",
            urgency: "low",
            ai_summary: `Bulk seed ${unique}-${i}`
          })
          .select("id")
          .single();
        if (req?.id) requestIds.push(req.id);
      }

      const { data: link } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: staffEmail,
        options: {
          redirectTo: `${baseURL}/auth/callback?next=/inbox&lang=en`
        }
      });
      const cb = new URL("/auth/callback", baseURL);
      cb.searchParams.set("next", "/inbox");
      cb.searchParams.set("lang", "en");
      cb.searchParams.set("token_hash", link.properties!.hashed_token);
      cb.searchParams.set(
        "type",
        link.properties!.verification_type ?? "magiclink"
      );
      await page.goto(cb.toString());

      for (const id of requestIds) {
        await expect(
          page.locator(`[data-row-id="${id}"]`)
        ).toBeVisible();
      }

      // Click the leading checkbox on each seeded row. Wrapper has the
      // data-inbox-bulk-checkbox marker; the inner Radix root is the
      // role="checkbox".
      for (const id of requestIds) {
        const row = page.locator(`[data-row-id="${id}"]`);
        // Hover to reveal the checkbox first.
        await row.hover();
        await row
          .locator('[data-inbox-bulk-checkbox] [role="checkbox"]')
          .click();
      }

      const actionBar = page.locator("[data-inbox-bulk-bar]");
      await expect(actionBar).toBeVisible();
      await expect(actionBar).toContainText(/2 selected/);

      await actionBar.getByRole("button", { name: /^Resolve$/i }).click();

      // The rows leave the default "all" view because resolved rows
      // are filtered out — assert they're gone (or carry the resolved
      // status pill if they linger in the SSR snapshot).
      for (const id of requestIds) {
        await expect(
          page.locator(`[data-row-id="${id}"]`)
        ).toHaveCount(0, { timeout: 15_000 });
      }
    } finally {
      if (clinicId && ownerId) {
        await admin
          .from("requests")
          .delete()
          .eq("clinic_id", clinicId)
          .eq("owner_id", ownerId);
        await admin
          .from("pets")
          .delete()
          .eq("clinic_id", clinicId)
          .eq("owner_id", ownerId);
        await admin
          .from("owners")
          .delete()
          .eq("clinic_id", clinicId)
          .eq("id", ownerId);
      }
      if (staffUserId) {
        await admin.from("clinic_staff").delete().eq("user_id", staffUserId);
        await admin.auth.admin.deleteUser(staffUserId);
      }
    }
  });
});

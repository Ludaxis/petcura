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

test.describe("Inbox list view", () => {
  test("renders rows, filters, J/K, ⌘K, theme toggle persists", async ({
    page,
    baseURL
  }) => {
    test.skip(
      !supabaseUrl || !publishableKey || !secretKey,
      "Supabase env required for inbox list smoke."
    );

    const admin = adminClient();
    const unique = Date.now();
    const staffEmail = `petcura-inbox-${unique}@example.test`;
    const ownerName = `Inbox Owner ${unique}`;
    const ownerPhone = `+372${unique}`;
    const petName = `Lumi ${unique}`;
    let clinicId: string | undefined;
    let staffUserId: string | undefined;
    let ownerId: string | undefined;
    let petId: string | undefined;

    try {
      const { data: clinic } = await admin
        .from("clinics")
        .select("id")
        .eq("slug", defaultClinicSlug)
        .single();
      expect(clinic?.id).toBeTruthy();
      clinicId = clinic!.id;

      const { data: staffUser } = await admin.auth.admin.createUser({
        email: staffEmail,
        email_confirm: true
      });
      expect(staffUser.user?.id).toBeTruthy();
      staffUserId = staffUser.user!.id;

      await admin.from("clinic_staff").upsert(
        {
          clinic_id: clinicId,
          user_id: staffUserId,
          role: "admin",
          is_active: true
        },
        { onConflict: "clinic_id,user_id" }
      );

      // Seed an owner + pet + request directly so we have list rows.
      const { data: owner } = await admin
        .from("owners")
        .insert({
          clinic_id: clinicId,
          name: ownerName,
          phone: ownerPhone,
          preferred_language: "et"
        })
        .select("id")
        .single();
      ownerId = owner!.id;

      const { data: pet } = await admin
        .from("pets")
        .insert({
          clinic_id: clinicId,
          owner_id: ownerId,
          name: petName,
          species: "Cat"
        })
        .select("id")
        .single();
      petId = pet!.id;

      await admin.from("requests").insert({
        clinic_id: clinicId,
        owner_id: ownerId,
        pet_id: petId,
        category: "medical_question",
        channel: "web",
        status: "new",
        urgency: "high",
        ai_summary: `${petName} has not eaten since yesterday.`
      });

      // Authenticate the staff user via magic-link callback.
      const { data: link } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: staffEmail,
        options: {
          redirectTo: `${baseURL}/auth/callback?next=/inbox&lang=en`
        }
      });
      const callbackUrl = new URL("/auth/callback", baseURL);
      callbackUrl.searchParams.set("next", "/inbox");
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

      // List view by default with a row for our seeded pet
      await expect(
        page.getByRole("heading", { name: "ClientOps inbox" })
      ).toBeVisible();
      const seededRow = page.locator(`[data-row-id]`).filter({
        hasText: petName
      });
      await expect(seededRow).toBeVisible();

      // Stream filter — Urgent
      await page
        .getByRole("radio", { name: /^Urgent/ })
        .click();
      await expect(page).toHaveURL(/[?&]stream=urgent/);
      await expect(seededRow).toBeVisible();

      // Routine should hide the urgent-tier seeded row.
      await page.getByRole("radio", { name: /^Routine/ }).click();
      await expect(page.locator("[data-row-id]")).toHaveCount(0);

      // All — at least one row visible again.
      await page.getByRole("radio", { name: /^All/ }).click();
      await expect(page.locator("[data-row-id]").first()).toBeVisible();
      expect(await page.locator("[data-row-id]").count()).toBeGreaterThanOrEqual(
        1
      );

      // J / K keyboard navigation moves focus
      await page.keyboard.press("j");
      await page.keyboard.press("k");
      // Some row should be focusable; assert at least one row has tabindex 0
      const focusable = page.locator('[data-row-id][tabindex="0"]');
      await expect(focusable.first()).toBeVisible();

      // E on the focused row resolves it; the StatusPill aria-label updates.
      // Seed focus through the deep-link path so the keyboard shell and SSR
      // roving tabindex agree even when other clinic rows already exist.
      const seededRowId = await seededRow.first().getAttribute("data-row-id");
      expect(seededRowId).toBeTruthy();
      await page.goto(`${baseURL}/inbox?lang=en&id=${seededRowId}`);
      const focusedSeededRow = page.locator(`[data-row-id="${seededRowId}"]`);
      await expect(focusedSeededRow).toHaveAttribute("tabindex", "0", {
        timeout: 5_000
      });
      await focusedSeededRow.focus();
      // Allow the client shell's keydown listener to install before the
      // first keystroke (turbopack hydration race).
      await page.waitForTimeout(400);
      await expect(async () => {
        await focusedSeededRow.focus();
        await page.keyboard.press("e");
        const count = await focusedSeededRow
          .locator(
            '[role="img"][aria-label*="resolved" i], [role="img"][aria-label*="lahendat" i], [role="img"][aria-label*="реше" i]'
          )
          .count();
        expect(count).toBeGreaterThanOrEqual(1);
      }).toPass({ timeout: 20_000, intervals: [600, 1500, 3000] });

      // ⌘K opens the palette; type a partial pet name → ArrowDown + Enter
      // navigates into the request detail.
      const ctrlOrMeta =
        process.platform === "darwin" ? "Meta+k" : "Control+k";
      await page.keyboard.press(ctrlOrMeta);
      const palette = page.getByRole("dialog", {
        name: /command palette|käsupalett|палитра команд/i
      });
      await expect(palette).toBeVisible();
      await palette.locator("[data-cmdk-input]").fill(petName.slice(0, 5));
      await expect(palette.getByRole("option").first()).toBeVisible();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/requests\/[0-9a-f-]{8,}/i);
      // Use a fresh inbox load (avoid back-forward cache rehydration races
      // that can leave React event handlers stale).
      await page.goto(`${baseURL}/inbox?lang=en`);

      // Pick dark inside the Theme radiogroup specifically so we don't match
      // any other "dark"-named radio.
      const themeGroup = page
        .getByRole("radiogroup", { name: /^Theme$|^Teema$|^Тема$/i });
      await expect(themeGroup).toBeVisible();
      await themeGroup
        .getByRole("radio", { name: /^Dark$|^Tume$|^Тёмная$/i })
        .click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await page.goto(`${baseURL}/?lang=en`);
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await page.goto(`${baseURL}/inbox?lang=en`);
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

      // Board view via toggle preserves regression
      await page.getByRole("radio", { name: /board|tahvel|доска/i }).click();
      await expect(page).toHaveURL(/[?&]view=board/);

      // ? opens the shortcuts sheet — must list J/K, E, A.
      await page.getByRole("radio", { name: /^list|loend|список/i }).click();
      await page.keyboard.press("?");
      const sheet = page.getByRole("dialog", {
        name: /shortcuts|kombinats|сокраще/i
      });
      await expect(sheet).toBeVisible();
      await expect(sheet).toContainText(/J\s*\/\s*K/);
      // E and A are in <kbd> tags within their list rows.
      await expect(sheet.locator("kbd").filter({ hasText: /^E$/ })).toHaveCount(
        1
      );
      await expect(sheet.locator("kbd").filter({ hasText: /^A$/ })).toHaveCount(
        1
      );
      await page.keyboard.press("Escape");

      // Mobile viewport — no horizontal page overflow.
      await page.setViewportSize({ width: 390, height: 844 });
      const noOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= window.innerWidth + 1
      );
      expect(noOverflow).toBe(true);
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

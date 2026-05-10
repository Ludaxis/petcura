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
        .getByRole("tab", { name: /^Urgent/ })
        .click();
      await expect(page).toHaveURL(/[?&]stream=urgent/);
      await expect(seededRow).toBeVisible();

      // Reset to All
      await page.getByRole("tab", { name: /^All/ }).click();

      // J / K keyboard navigation moves focus
      await page.keyboard.press("j");
      await page.keyboard.press("k");
      // Some row should be focusable; assert at least one row has tabindex 0
      const focusable = page.locator('[data-row-id][tabindex="0"]');
      await expect(focusable.first()).toBeVisible();

      // ⌘K opens the palette
      const ctrlOrMeta =
        process.platform === "darwin" ? "Meta+k" : "Control+k";
      await page.keyboard.press(ctrlOrMeta);
      await expect(
        page.getByRole("dialog", { name: /command palette/i })
      ).toBeVisible();
      await page.keyboard.press("Escape");

      // Theme toggle — pick dark
      await page
        .getByRole("radio", { name: /dark/i })
        .first()
        .click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

      // Persist across reload
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

      // Board view via toggle preserves regression
      await page.getByRole("tab", { name: /board/i }).click();
      await expect(page).toHaveURL(/[?&]view=board/);

      // ? opens the shortcuts sheet
      await page.getByRole("tab", { name: /list/i }).click();
      await page.keyboard.press("?");
      await expect(
        page.getByRole("dialog", { name: /shortcuts|kombinats|сокраще/i })
      ).toBeVisible();
      await page.keyboard.press("Escape");
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

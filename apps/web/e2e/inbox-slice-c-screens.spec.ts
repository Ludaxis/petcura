import { test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@petcura/shared";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const defaultClinicSlug =
  process.env.PETCURA_DEFAULT_CLINIC_SLUG?.trim() || "alex-vet-demo";

function adminClient() {
  if (!supabaseUrl || !secretKey) throw new Error("Missing Supabase env.");
  return createClient<Database>(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * Slice C screenshot capture — three artifacts the brief asked for:
 *
 *   - inbox-mobile-bottom-nav.png         (390 × 844, mobile viewport)
 *   - inbox-bulk-action-bar.png           (1320 × 820, desktop)
 *   - inbox-realtime-toast.png            (1320 × 820, desktop)
 *
 * Runs only when Supabase env is present; opt out everywhere else so CI
 * stays green without the keys.
 */
test.describe("Slice C screenshots", () => {
  test.skip(
    !supabaseUrl || !publishableKey || !secretKey,
    "Supabase env required."
  );

  test("captures bottom-nav / bulk-bar / realtime-toast", async ({
    page,
    baseURL
  }) => {
    test.setTimeout(120_000);
    const admin = adminClient();
    const unique = Date.now();
    const staffEmail = `petcura-screens-${unique}@example.test`;
    const ownerName = `Screen Owner ${unique}`;
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
          name: `ScreenPet ${unique}`,
          species: "Cat"
        })
        .select("id")
        .single();
      petId = pet!.id;
      for (let i = 0; i < 3; i += 1) {
        const { data: req } = await admin
          .from("requests")
          .insert({
            clinic_id: clinicId,
            owner_id: ownerId,
            pet_id: petId,
            category: "medical_question",
            channel: "web",
            status: "new",
            urgency: i === 0 ? "high" : "low",
            ai_summary: `Screenshot request ${i}`
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

      // 1) Mobile bottom-nav at 390 × 844.
      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.locator("[data-mobile-bottom-nav]").waitFor();
      await page.screenshot({
        path: "screenshots/inbox-mobile-bottom-nav.png",
        fullPage: false
      });

      // 2) Desktop bulk-action bar (1320 × 820, two rows selected).
      await page.setViewportSize({ width: 1320, height: 820 });
      await page.reload({ waitUntil: "domcontentloaded" });
      for (const id of requestIds.slice(0, 2)) {
        const row = page.locator(`[data-row-id="${id}"]`);
        await row.hover();
        await row
          .locator('[data-inbox-bulk-checkbox] [role="checkbox"]')
          .click();
        // Wait a beat for state to commit so the next click doesn't
        // race the first toggle.
        await row
          .locator('button[role="checkbox"][data-state="checked"]')
          .waitFor();
      }
      const actionBar = page.locator("[data-inbox-bulk-bar]");
      await actionBar.waitFor();
      await actionBar.getByText(/2 selected/i).waitFor();
      await page.screenshot({
        path: "screenshots/inbox-bulk-action-bar.png",
        fullPage: false
      });

      // 3) Realtime toast (1320 × 820). Reload first so the selection
      //    action bar from the previous capture clears, then inject the
      //    same host element the hook builds — keeps the capture
      //    deterministic without depending on the Supabase Realtime
      //    backend roundtrip during the screenshot run.
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.evaluate(() => {
        const host = document.createElement("div");
        host.dataset.realtimeToast = "true";
        host.setAttribute("role", "status");
        host.className =
          "fixed bottom-4 right-4 z-50 max-w-[320px] rounded-[10px] border border-[var(--line)] bg-[var(--primary-soft)] px-4 py-2.5 text-[13px] font-medium text-[var(--primary-strong)] shadow-md";
        host.textContent = "New request from Marie";
        document.body.appendChild(host);
      });
      await page.screenshot({
        path: "screenshots/inbox-realtime-toast.png",
        fullPage: false
      });
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

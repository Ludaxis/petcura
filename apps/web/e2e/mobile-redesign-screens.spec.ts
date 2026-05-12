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

test.describe("Mobile redesign screenshots", () => {
  test.skip(
    !supabaseUrl || !publishableKey || !secretKey,
    "Supabase env required."
  );

  test("captures 4-tab nav, Me sheet, compact request detail, edit sheet", async ({
    page,
    baseURL
  }) => {
    test.setTimeout(120_000);
    const admin = adminClient();
    const unique = Date.now();
    const staffEmail = `petcura-redesign-${unique}@example.test`;
    const ownerName = `Redesign Owner ${unique}`;
    const ownerPhone = `+372${unique}`;
    let clinicId: string | undefined;
    let staffUserId: string | undefined;
    let ownerId: string | undefined;
    let petId: string | undefined;
    let requestId: string | undefined;
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
          name: `Lumi Redesign`,
          species: "Cat",
          breed: "Tabby"
        })
        .select("id")
        .single();
      petId = pet!.id;
      const { data: req } = await admin
        .from("requests")
        .insert({
          clinic_id: clinicId,
          owner_id: ownerId,
          pet_id: petId,
          category: "medical_question",
          channel: "whatsapp",
          status: "new",
          urgency: "high",
          ai_summary:
            "Lumi has not eaten since yesterday and is sleeping more than usual."
        })
        .select("id")
        .single();
      requestId = req!.id;

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
      await page.locator("[data-mobile-bottom-nav]").waitFor();

      // 1) Bottom nav — four tabs.
      await page.screenshot({
        path: "screenshots/mobile-bottom-nav-4.png",
        fullPage: false
      });

      // 2) Me sheet open.
      await page.locator("[data-bottom-nav-me]").click();
      await page.locator("[data-me-sheet]").waitFor();
      // Small pause so the slide-in animation has finished.
      await page.waitForTimeout(400);
      await page.screenshot({
        path: "screenshots/mobile-me-sheet.png",
        fullPage: false
      });
      await page.keyboard.press("Escape");

      // 3) Request detail compact header.
      await page.goto(`${baseURL}/requests/${requestId}?lang=en`);
      await page.waitForLoadState("domcontentloaded");
      await page.locator("h1").first().waitFor();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: "screenshots/mobile-request-detail-compact.png",
        fullPage: false
      });

      // 4) Edit sheet open.
      await page.locator("[data-request-edit-sheet]").click();
      await page.locator("[data-request-edit-sheet-content]").waitFor();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: "screenshots/mobile-request-detail-edit-sheet.png",
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

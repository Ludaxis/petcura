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

test.describe("Clinic operating layer", () => {
  test("settings, customer center, pet center, and mobile drawer use real clinic data", async ({
    page,
    baseURL
  }) => {
    test.skip(
      !supabaseUrl || !publishableKey || !secretKey,
      "Supabase env required."
    );

    const admin = adminClient();
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const staffEmail = `petcura-ops-${unique}@example.test`;
    const ownerName = `Ops Owner ${unique}`;
    const ownerPhone = `+372${unique
      .replace(/[^0-9]/g, "")
      .slice(-10)
      .padStart(10, "0")}`;
    const petName = `Ops Pet ${unique}`;

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
      await admin.from("clinic_staff").upsert(
        {
          clinic_id: clinicId,
          user_id: staffUserId,
          role: "owner",
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
          email: `owner-${unique}@example.test`,
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
          species: "Dog",
          breed: "Mixed",
          weight_kg: 12.5,
          allergies: "None recorded"
        })
        .select("id")
        .single();
      petId = pet!.id;

      const { data: request } = await admin
        .from("requests")
        .insert({
          clinic_id: clinicId,
          owner_id: ownerId,
          pet_id: petId,
          category: "medical_question",
          channel: "web",
          status: "new",
          urgency: "low",
          ai_summary: `${petName} has a clinic-center smoke request.`
        })
        .select("id")
        .single();
      requestId = request!.id;

      const { data: link } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: staffEmail,
        options: {
          redirectTo: `${baseURL}/auth/callback?next=/settings&lang=en`
        }
      });
      const cb = new URL("/auth/callback", baseURL);
      cb.searchParams.set("next", "/settings");
      cb.searchParams.set("lang", "en");
      cb.searchParams.set("token_hash", link.properties!.hashed_token);
      cb.searchParams.set(
        "type",
        link.properties!.verification_type ?? "magiclink"
      );
      await page.goto(cb.toString());

      await expect(
        page.getByRole("heading", { name: "Clinic settings" })
      ).toBeVisible();
      await expect(page.getByText(staffEmail)).toBeVisible();
      await expect(page.getByText("Team and permissions")).toBeVisible();

      await page.goto(`${baseURL}/customers?lang=en`);
      await expect(
        page.getByRole("heading", { name: "Customer center" })
      ).toBeVisible();
      await expect(page.getByText(ownerName)).toBeVisible();
      await expect(page.getByText(ownerPhone)).toBeVisible();

      await page.goto(`${baseURL}/pets?lang=en`);
      await expect(
        page.getByRole("heading", { name: "Pet center" })
      ).toBeVisible();
      await expect(page.getByText(petName)).toBeVisible();
      await expect(page.getByText(ownerName, { exact: false })).toBeVisible();

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${baseURL}/customers?lang=en`);
      await expect(
        page.locator("[data-mobile-shell-header]").getByText("Customers")
      ).toBeVisible();
      await page.getByRole("button", { name: /open menu/i }).click();
      const drawer = page.locator('[data-mobile="true"]');
      await expect(drawer.getByRole("link", { name: /^Customers$/ })).toBeVisible();
      await expect(drawer.getByRole("link", { name: /^Pets$/ })).toBeVisible();
    } finally {
      if (requestId) await admin.from("requests").delete().eq("id", requestId);
      if (petId) await admin.from("pets").delete().eq("id", petId);
      if (ownerId) await admin.from("owners").delete().eq("id", ownerId);
      if (staffUserId) {
        await admin.from("clinic_staff").delete().eq("user_id", staffUserId);
        await admin.auth.admin.deleteUser(staffUserId);
      }
    }
  });
});

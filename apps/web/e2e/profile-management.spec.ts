import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@petcura/shared";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
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

async function loginStaff({
  page,
  baseURL,
  staffEmail,
  next
}: {
  page: Page;
  baseURL: string;
  staffEmail: string;
  next: string;
}) {
  const admin = adminClient();
  const { data: link } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: staffEmail,
    options: {
      redirectTo: `${baseURL}/auth/callback?next=${next}&lang=en`
    }
  });
  const cb = new URL("/auth/callback", baseURL);
  cb.searchParams.set("next", next);
  cb.searchParams.set("lang", "en");
  cb.searchParams.set("token_hash", link.properties!.hashed_token);
  cb.searchParams.set(
    "type",
    link.properties!.verification_type ?? "magiclink"
  );
  await page.goto(cb.toString(), { waitUntil: "domcontentloaded" });
}

test.describe("Profile management", () => {
  test("staff, customer, and pet profile forms persist editable fields", async ({
    page,
    baseURL
  }) => {
    test.skip(!supabaseUrl || !secretKey, "Supabase env required.");

    const admin = adminClient();
    const unique = Date.now();
    const staffEmail = `petcura-profile-${unique}@example.test`;
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
          role: "admin",
          is_active: true
        },
        { onConflict: "clinic_id,user_id" }
      );

      const { data: owner } = await admin
        .from("owners")
        .insert({
          clinic_id: clinicId,
          name: `Profile Owner ${unique}`,
          phone: `+37255${unique}`,
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
          name: `ProfilePet ${unique}`,
          species: "Dog"
        })
        .select("id")
        .single();
      petId = pet!.id;

      await loginStaff({
        page,
        baseURL: baseURL!,
        staffEmail,
        next: "/profile"
      });

      await expect(
        page.getByRole("heading", { exact: true, name: "Profile" })
      ).toBeVisible();
      await page.getByLabel("Full name").fill(`Dr Profile ${unique}`);
      await page.getByLabel("Display name").fill(`Profile ${unique}`);
      await page.getByLabel("Phone").fill(`+37258${unique}`);
      await page.getByLabel("Job title").fill("Practice manager");
      await page.getByLabel("Language").selectOption("et");
      await page.locator('input[name="photo"]').setInputFiles({
        name: "avatar.png",
        mimeType: "image/png",
        buffer: Buffer.alloc(1_250_000, 1)
      });
      await page.getByRole("button", { name: /save/i }).click();
      await expect(page.getByText("Profile saved.")).toBeVisible();

      const { data: profile } = await admin
        .from("user_profiles")
        .select("full_name, display_name, phone, job_title, locale, avatar_url")
        .eq("user_id", staffUserId)
        .single();
      expect(profile).toMatchObject({
        full_name: `Dr Profile ${unique}`,
        display_name: `Profile ${unique}`,
        phone: `+37258${unique}`,
        job_title: "Practice manager",
        locale: "et"
      });
      expect(profile?.avatar_url).toContain(
        `${clinicId}/staff/${staffUserId}/avatar-`
      );

      await page.goto(`${baseURL}/customers?lang=en`, {
        waitUntil: "domcontentloaded"
      });
      await expect(
        page.getByRole("heading", { exact: true, name: "Customer center" })
      ).toBeVisible();
      const ownerForm = page.locator("form", {
        has: page.locator(`#owner-name-${ownerId}`)
      });
      await ownerForm.locator(`#owner-name-${ownerId}`).fill(`Edited Owner ${unique}`);
      await ownerForm
        .locator(`#owner-email-${ownerId}`)
        .fill(`owner-${unique}@example.test`);
      await ownerForm.locator(`#owner-language-${ownerId}`).selectOption("ru");
      await ownerForm.getByRole("button", { name: /save/i }).click();
      await expect(page.getByText("Profile saved.")).toBeVisible();

      const { data: savedOwner } = await admin
        .from("owners")
        .select("name, email, preferred_language")
        .eq("id", ownerId)
        .single();
      expect(savedOwner).toMatchObject({
        name: `Edited Owner ${unique}`,
        email: `owner-${unique}@example.test`,
        preferred_language: "ru"
      });

      await page.goto(`${baseURL}/pets?lang=en`, {
        waitUntil: "domcontentloaded"
      });
      await expect(
        page.getByRole("heading", { exact: true, name: "Pet center" })
      ).toBeVisible();
      const petForm = page.locator("form", {
        has: page.locator(`#pet-name-${petId}`)
      });
      await expect(petForm.locator(`#pet-name-${petId}`)).toBeEditable();
      await petForm.locator(`#pet-name-${petId}`).fill(`Edited Pet ${unique}`);
      await expect(petForm.locator(`#pet-name-${petId}`)).toHaveValue(
        `Edited Pet ${unique}`
      );
      await petForm.locator(`#pet-breed-${petId}`).fill("Labrador");
      await petForm.locator(`#pet-weight-${petId}`).fill("12.5");
      await petForm.getByRole("button", { name: /save/i }).click();
      await expect(page.getByText("Profile saved.")).toBeVisible();

      const { data: savedPet } = await admin
        .from("pets")
        .select("name, breed, weight_kg")
        .eq("id", petId)
        .single();
      expect(savedPet).toMatchObject({
        name: `Edited Pet ${unique}`,
        breed: "Labrador",
        weight_kg: 12.5
      });
    } finally {
      if (petId) await admin.from("pets").delete().eq("id", petId);
      if (ownerId) await admin.from("owners").delete().eq("id", ownerId);
      if (staffUserId) {
        const { data: profile } = await admin
          .from("user_profiles")
          .select("avatar_url")
          .eq("user_id", staffUserId)
          .maybeSingle();
        if (profile?.avatar_url) {
          await admin.storage.from("profile-media").remove([profile.avatar_url]);
        }
        await admin.from("clinic_staff").delete().eq("user_id", staffUserId);
        await admin.from("user_profiles").delete().eq("user_id", staffUserId);
        await admin.auth.admin.deleteUser(staffUserId);
      }
    }
  });
});

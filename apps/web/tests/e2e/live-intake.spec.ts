import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@petcura/shared";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const defaultClinicSlug =
  process.env.PETCURA_DEFAULT_CLINIC_SLUG ?? "alex-vet-demo";

function adminClient() {
  if (!supabaseUrl || !secretKey) {
    throw new Error("Missing Supabase env.");
  }

  return createClient<Database>(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

test("owner intake appears in authenticated clinic inbox and detail", async ({
  page,
  baseURL
}) => {
  test.skip(
    !supabaseUrl || !publishableKey || !secretKey,
    "Supabase publishable and secret env is required for the live intake happy path."
  );

  const admin = adminClient();
  const unique = Date.now();
  const staffEmail = `petcura-e2e-${unique}@example.test`;
  const ownerName = `E2E Owner ${unique}`;
  const petName = `Luna ${unique}`;
  const message = "Luna has not eaten since yesterday and seems tired.";

  const { data: clinic, error: clinicError } = await admin
    .from("clinics")
    .select("id")
    .eq("slug", defaultClinicSlug)
    .single();

  expect(clinicError).toBeNull();
  expect(clinic?.id).toBeTruthy();

  const { data: staffUser, error: userError } =
    await admin.auth.admin.createUser({
      email: staffEmail,
      email_confirm: true
    });

  expect(userError).toBeNull();
  expect(staffUser.user?.id).toBeTruthy();

  await admin.from("clinic_staff").upsert(
    {
      clinic_id: clinic!.id,
      user_id: staffUser.user!.id,
      role: "admin",
      is_active: true
    },
    { onConflict: "clinic_id,user_id" }
  );

  await page.goto("/intake?lang=et");
  await page.getByLabel("Sinu nimi").fill(ownerName);
  await page.getByLabel("Telefoninumber").fill(`+372${unique}`);
  await page.getByLabel("Lemmiku nimi").fill(petName);
  await page.getByLabel("Liik").fill("Kass");
  await page.getByLabel("Mis toimub?").fill(message);
  await page.getByRole("button", { name: "Saada pöördumine" }).click();
  await expect(page.getByText("Pöördumine saadetud")).toBeVisible();

  const { data: link, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email: staffEmail,
      options: {
        redirectTo: `${baseURL}/auth/callback?next=/inbox&lang=en`
      }
    });

  expect(linkError).toBeNull();
  expect(link.properties?.action_link).toBeTruthy();

  await page.goto(link.properties!.action_link);
  await expect(
    page.getByRole("heading", { name: "ClientOps inbox" })
  ).toBeVisible();
  await expect(page.getByText(petName)).toBeVisible();

  await page.getByText(petName).click();
  await expect(page.getByRole("heading", { name: petName })).toBeVisible();
  await expect(page.getByText(ownerName)).toBeVisible();
  await expect(page.getByText(message)).toBeVisible();
});

import { expect, test } from "@playwright/test";
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

type SeedResult = {
  clinicId: string;
  staffUserId: string;
  staffEmail: string;
  ownerId: string;
  petId: string;
  requestId: string;
};

async function seedReminderFixture(
  admin: ReturnType<typeof adminClient>
): Promise<SeedResult> {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const staffEmail = `petcura-reminder-${unique}@example.test`;

  const { data: clinic } = await admin
    .from("clinics")
    .select("id")
    .eq("slug", defaultClinicSlug)
    .single();
  if (!clinic?.id) throw new Error("clinic missing");

  const { data: staffUser } = await admin.auth.admin.createUser({
    email: staffEmail,
    email_confirm: true
  });
  const staffUserId = staffUser.user!.id;
  await admin.from("clinic_staff").upsert(
    {
      clinic_id: clinic.id,
      user_id: staffUserId,
      role: "admin",
      is_active: true
    },
    { onConflict: "clinic_id,user_id" }
  );

  const { data: owner } = await admin
    .from("owners")
    .insert({
      clinic_id: clinic.id,
      name: `Reminder Owner ${unique}`,
      phone: `+372${unique.replace(/[^0-9]/g, "").slice(-10).padStart(10, "0")}`,
      preferred_language: "en"
    })
    .select("id")
    .single();
  const ownerId = owner!.id;

  const { data: pet } = await admin
    .from("pets")
    .insert({
      clinic_id: clinic.id,
      owner_id: ownerId,
      name: `Lumi Reminder ${unique}`,
      species: "Cat"
    })
    .select("id")
    .single();
  const petId = pet!.id;

  const { data: request } = await admin
    .from("requests")
    .insert({
      clinic_id: clinic.id,
      owner_id: ownerId,
      pet_id: petId,
      category: "follow_up",
      channel: "web",
      status: "waiting_owner",
      urgency: "low",
      ai_summary: "Follow up after clinic visit."
    })
    .select("id")
    .single();

  return {
    clinicId: clinic.id,
    staffUserId,
    staffEmail,
    ownerId,
    petId,
    requestId: request!.id
  };
}

async function authenticateAs(
  admin: ReturnType<typeof adminClient>,
  page: import("@playwright/test").Page,
  baseURL: string | undefined,
  staffEmail: string,
  next: string
) {
  const { data: link } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: staffEmail,
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

async function teardownFixture(
  admin: ReturnType<typeof adminClient>,
  seed: Partial<SeedResult>
) {
  if (seed.clinicId) {
    if (seed.requestId) {
      await admin
        .from("reminders")
        .delete()
        .eq("clinic_id", seed.clinicId)
        .eq("request_id", seed.requestId);
      await admin
        .from("request_events")
        .delete()
        .eq("clinic_id", seed.clinicId)
        .eq("request_id", seed.requestId);
      await admin
        .from("requests")
        .delete()
        .eq("clinic_id", seed.clinicId)
        .eq("id", seed.requestId);
    }
    if (seed.petId) {
      await admin
        .from("pets")
        .delete()
        .eq("clinic_id", seed.clinicId)
        .eq("id", seed.petId);
    }
    if (seed.ownerId) {
      await admin
        .from("owners")
        .delete()
        .eq("clinic_id", seed.clinicId)
        .eq("id", seed.ownerId);
    }
  }
  if (seed.staffUserId) {
    await admin.from("clinic_staff").delete().eq("user_id", seed.staffUserId);
    await admin.auth.admin.deleteUser(seed.staffUserId);
  }
}

test.describe("Reminders", () => {
  test("creates a reminder from request detail and manages it in /reminders", async ({
    page,
    baseURL
  }, testInfo) => {
    test.skip(
      testInfo.project.name.includes("mobile"),
      "Reminder creation smoke is desktop-first; mobile shell has separate coverage."
    );
    test.skip(!supabaseUrl || !secretKey, "Supabase env required.");

    const admin = adminClient();
    let seed: SeedResult | undefined;

    try {
      seed = await seedReminderFixture(admin);
      await authenticateAs(
        admin,
        page,
        baseURL,
        seed.staffEmail,
        `/requests/${seed.requestId}`
      );

      await page
        .locator("header")
        .getByRole("button", { name: /^Reminder$/ })
        .click();
      const dialog = page.locator("dialog");
      await expect(dialog).toBeVisible();
      const reminderTitle = `Recheck reminder ${Date.now()}`;
      await dialog.locator('select[name="type"]').selectOption("recheck");
      await dialog.locator('input[name="title"]').fill(reminderTitle);
      await dialog
        .locator('textarea[name="body"]')
        .fill("Please confirm whether Lumi is eating normally.");
      await dialog
        .getByRole("button", { name: /^Create reminder$/ })
        .click();

      await expect(page.getByText("Reminder created")).toBeVisible({
        timeout: 10_000
      });
      await expect(
        page.locator('[data-side-panel="rail"]').getByText(reminderTitle)
      ).toBeVisible();

      await page.goto(`/reminders?status=scheduled&lang=en`);
      await expect(page.getByRole("heading", { name: "Reminders" })).toBeVisible();
      await expect(page.getByText(reminderTitle).first()).toBeVisible();
      await page
        .getByRole("button", { name: /Mark completed/i })
        .first()
        .click();

      await expect(page.getByText("Reminder updated")).toBeVisible({
        timeout: 10_000
      });
      await expect(async () => {
        const { data } = await admin
          .from("reminders")
          .select("status, request_id")
          .eq("clinic_id", seed!.clinicId)
          .eq("request_id", seed!.requestId)
          .single();
        expect(data?.status).toBe("completed");
      }).toPass({ timeout: 10_000 });
    } finally {
      if (seed) await teardownFixture(admin, seed);
    }
  });
});

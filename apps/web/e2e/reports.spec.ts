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

type ReportsSeed = {
  clinicId: string;
  adminUserId: string;
  adminEmail: string;
  viewerUserId: string;
  viewerEmail: string;
  ownerId: string;
  petId: string;
  requestId: string;
  messageIds: string[];
  aiOutputId: string;
  aiMemoryId: string;
  vaccinationId: string;
  weightIds: string[];
  outboundIds: string[];
  invoiceId: string;
};

async function authenticateAs(
  admin: ReturnType<typeof adminClient>,
  page: import("@playwright/test").Page,
  baseURL: string | undefined,
  email: string,
  next: string
) {
  const { data: link } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
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

async function seedReportsFixture(
  admin: ReturnType<typeof adminClient>
): Promise<ReportsSeed> {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const adminEmail = `petcura-reports-admin-${unique}@example.test`;
  const viewerEmail = `petcura-reports-viewer-${unique}@example.test`;
  const ownerPhone = `+372${unique
    .replace(/[^0-9]/g, "")
    .slice(-10)
    .padStart(10, "0")}`;

  const { data: clinic } = await admin
    .from("clinics")
    .select("id")
    .eq("slug", defaultClinicSlug)
    .single();
  const clinicId = clinic!.id;

  const { data: adminUser } = await admin.auth.admin.createUser({
    email: adminEmail,
    email_confirm: true
  });
  const adminUserId = adminUser.user!.id;
  const { data: viewerUser } = await admin.auth.admin.createUser({
    email: viewerEmail,
    email_confirm: true
  });
  const viewerUserId = viewerUser.user!.id;

  await admin.from("clinic_staff").insert([
    {
      clinic_id: clinicId,
      user_id: adminUserId,
      role: "admin",
      is_active: true
    },
    {
      clinic_id: clinicId,
      user_id: viewerUserId,
      role: "viewer",
      is_active: true
    }
  ]);

  const { data: owner } = await admin
    .from("owners")
    .insert({
      clinic_id: clinicId,
      name: `Reports Owner ${unique}`,
      phone: ownerPhone,
      preferred_language: "en"
    })
    .select("id")
    .single();
  const ownerId = owner!.id;

  const { data: pet } = await admin
    .from("pets")
    .insert({
      clinic_id: clinicId,
      owner_id: ownerId,
      name: `Reports Pet ${unique}`,
      species: "Cat"
    })
    .select("id")
    .single();
  const petId = pet!.id;

  const { data: request } = await admin
    .from("requests")
    .insert({
      clinic_id: clinicId,
      owner_id: ownerId,
      pet_id: petId,
      category: "medical_question",
      channel: "whatsapp",
      status: "resolved",
      urgency: "high",
      resolved_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      risk_flags_json: ["not_eating"]
    })
    .select("id")
    .single();
  const requestId = request!.id;

  const { data: messages } = await admin
    .from("messages")
    .insert([
      {
        clinic_id: clinicId,
        request_id: requestId,
        sender_type: "owner",
        body: "Reports smoke owner message",
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        clinic_id: clinicId,
        request_id: requestId,
        sender_type: "staff",
        body: "Reports smoke staff reply",
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      }
    ])
    .select("id");
  const messageIds = (messages ?? []).map((row) => row.id);

  const { data: aiOutput } = await admin
    .from("ai_outputs")
    .insert({
      clinic_id: clinicId,
      request_id: requestId,
      kind: "reply_draft",
      model: "petcura/test",
      prompt_version: "test",
      input_json: {},
      output_json: { text: "Draft" },
      status: "success",
      review_status: "accepted_with_edits",
      accepted: true,
      latency_ms: 800
    })
    .select("id")
    .single();
  const aiOutputId = aiOutput!.id;

  const { data: aiMemory } = await admin
    .from("ai_memory_items")
    .insert({
      clinic_id: clinicId,
      scope_type: "pet",
      scope_id: petId,
      memory_type: "pet_context",
      content_text: "Reports smoke accepted memory.",
      status: "accepted",
      source_ai_output_id: aiOutputId
    })
    .select("id")
    .single();
  const aiMemoryId = aiMemory!.id;

  const { data: vaccination } = await admin
    .from("vaccinations")
    .insert({
      clinic_id: clinicId,
      pet_id: petId,
      vaccine_code: "rabies",
      vaccine_name: "Rabies",
      administered_at: "2025-05-01",
      next_due_at: "2026-05-01"
    })
    .select("id")
    .single();
  const vaccinationId = vaccination!.id;

  const { data: weights } = await admin
    .from("pet_weight_entries")
    .insert([
      {
        clinic_id: clinicId,
        pet_id: petId,
        weight_kg: 4.8,
        measured_at: "2026-03-01",
        source: "staff"
      },
      {
        clinic_id: clinicId,
        pet_id: petId,
        weight_kg: 5.5,
        measured_at: "2026-05-01",
        source: "staff"
      }
    ])
    .select("id");
  const weightIds = (weights ?? []).map((row) => row.id);

  const { data: outbound } = await admin
    .from("outbound_messages")
    .insert({
      clinic_id: clinicId,
      request_id: requestId,
      owner_id: ownerId,
      source: "staff_reply",
      channel: "whatsapp",
      recipient_phone: ownerPhone,
      body: "Reports smoke outbound",
      status: "delivered",
      idempotency_key: `reports-smoke:${unique}`
    })
    .select("id");
  const outboundIds = (outbound ?? []).map((row) => row.id);

  const { data: invoice, error: invoiceError } = await admin
    .from("pms_invoice_summaries")
    .insert({
      clinic_id: clinicId,
      owner_id: ownerId,
      pet_id: petId,
      source_system: "demo-pms",
      external_invoice_id_hash: `reports-${unique}`,
      issued_at: new Date().toISOString(),
      currency: "EUR",
      gross_amount_cents: 12900,
      service_category: "consultation"
    })
    .select("id")
    .single();
  if (invoiceError) {
    throw new Error(`Could not seed report invoice: ${invoiceError.message}`);
  }
  const invoiceId = invoice!.id;

  return {
    clinicId,
    adminUserId,
    adminEmail,
    viewerUserId,
    viewerEmail,
    ownerId,
    petId,
    requestId,
    messageIds,
    aiOutputId,
    aiMemoryId,
    vaccinationId,
    weightIds,
    outboundIds,
    invoiceId
  };
}

async function teardown(
  admin: ReturnType<typeof adminClient>,
  seed: ReportsSeed | undefined
) {
  if (!seed) return;
  await admin.from("pms_invoice_summaries").delete().eq("id", seed.invoiceId);
  if (seed.outboundIds.length > 0) {
    await admin.from("outbound_messages").delete().in("id", seed.outboundIds);
  }
  await admin.from("ai_memory_items").delete().eq("id", seed.aiMemoryId);
  await admin.from("ai_outputs").delete().eq("id", seed.aiOutputId);
  if (seed.weightIds.length > 0) {
    await admin.from("pet_weight_entries").delete().in("id", seed.weightIds);
  }
  await admin.from("vaccinations").delete().eq("id", seed.vaccinationId);
  if (seed.messageIds.length > 0) {
    await admin.from("messages").delete().in("id", seed.messageIds);
  }
  await admin.from("requests").delete().eq("id", seed.requestId);
  await admin.from("pets").delete().eq("id", seed.petId);
  await admin.from("owners").delete().eq("id", seed.ownerId);
  await admin.from("clinic_staff").delete().eq("user_id", seed.adminUserId);
  await admin.from("clinic_staff").delete().eq("user_id", seed.viewerUserId);
  await admin.auth.admin.deleteUser(seed.adminUserId);
  await admin.auth.admin.deleteUser(seed.viewerUserId);
}

test.describe("Reports dashboard", () => {
  test("admin sees operational reports and viewer cannot see financial panels", async ({
    page,
    baseURL
  }) => {
    test.skip(!supabaseUrl || !secretKey, "Supabase env required.");

    const admin = adminClient();
    let seed: ReportsSeed | undefined;

    try {
      const financialPreflight = await admin
        .from("pms_invoice_summaries")
        .select("id")
        .limit(1);
      test.skip(
        Boolean(
          financialPreflight.error?.message.includes("schema cache") ||
            financialPreflight.error?.message.includes("does not exist")
        ),
        "Configured Supabase schema has not applied reports financial migration."
      );

      seed = await seedReportsFixture(admin);

      await authenticateAs(admin, page, baseURL, seed.adminEmail, "/reports");
      await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Request trend" }).first()
      ).toBeVisible();
      await page.getByRole("link", { name: "Owners" }).click();
      const ownerValuePanel = page
        .getByRole("heading", { name: "Owner value" })
        .locator("xpath=ancestor::section[1]");
      await expect(ownerValuePanel.getByText("€129")).toBeVisible();

      await authenticateAs(
        admin,
        page,
        baseURL,
        seed.viewerEmail,
        "/reports?tab=owners"
      );
      await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
      await expect(
        page
          .getByText("Financial reports are visible only to clinic owners and admins.")
          .first()
      ).toBeVisible();
    } finally {
      await teardown(admin, seed);
    }
  });
});

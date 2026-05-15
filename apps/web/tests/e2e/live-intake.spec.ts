import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@petcura/shared";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const defaultClinicSlug =
  process.env.PETCURA_DEFAULT_CLINIC_SLUG?.trim() || "alex-vet-demo";

test.setTimeout(120_000);

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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  const ownerPhone = `+372${unique}`;
  const ownerName = `E2E Owner ${unique}`;
  const petName = `Luna ${unique}`;
  const message = "Luna has not eaten since yesterday and seems tired.";
  let clinicId: string | undefined;
  let staffUserId: string | undefined;

  try {
    const { data: clinic, error: clinicError } = await admin
      .from("clinics")
      .select("id")
      .eq("slug", defaultClinicSlug)
      .single();

    expect(clinicError).toBeNull();
    expect(clinic?.id).toBeTruthy();
    clinicId = clinic!.id;

    const { error: webIntakeMigrationError } = await admin
      .from("clinic_web_intake_configs")
      .select("clinic_id")
      .eq("clinic_id", clinicId)
      .limit(1)
      .maybeSingle();

    test.skip(
      Boolean(webIntakeMigrationError),
      "AI-assisted web intake migration is not applied to this Supabase database."
    );

    const { data: staffUser, error: userError } =
      await admin.auth.admin.createUser({
        email: staffEmail,
        email_confirm: true
      });

    expect(userError).toBeNull();
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

    await page.goto("/intake?lang=et");
    await page.getByLabel("Sinu nimi").fill(ownerName);
    await page.getByLabel("Telefoninumber").fill(ownerPhone);
    await page.getByLabel("Lemmiku nimi").fill(petName);
    await page.getByLabel("Liik").fill("Kass");
    await page.getByLabel("Mis toimub?").fill(message);
    await page.locator('input[name="consent"]').check();
    await page.getByRole("button", { name: "Korrasta AI-ga" }).click();
    await expect(page.getByText("Pöördumine alustatud")).toBeVisible();

    const { data: link, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: staffEmail,
        options: {
          redirectTo: `${baseURL}/auth/callback?next=/inbox&lang=en`
        }
      });

    expect(linkError).toBeNull();
    expect(link.properties?.hashed_token).toBeTruthy();

    const callbackUrl = new URL("/auth/callback", baseURL);
    callbackUrl.searchParams.set("next", "/inbox");
    callbackUrl.searchParams.set("lang", "en");
    callbackUrl.searchParams.set("token_hash", link.properties!.hashed_token);
    callbackUrl.searchParams.set(
      "type",
      link.properties!.verification_type ?? "magiclink"
    );

    await page.goto(callbackUrl.toString());
    const skipToInbox = page.getByRole("link", { name: /skip to inbox/i });
    if (await skipToInbox.isVisible().catch(() => false)) {
      await skipToInbox.click();
      await page.waitForURL(/\/inbox/);
    }

    const requestLink = page.getByRole("link", {
      name: new RegExp(`${escapeRegExp(petName)}.*${escapeRegExp(ownerName)}`)
    });

    await expect(requestLink).toBeVisible();
    await requestLink.click();
    await expect(page.getByRole("heading", { name: petName })).toBeVisible();
    await expect(
      page.locator("[data-detail-head]").getByText(ownerName).first()
    ).toBeVisible();
    await expect(
      page.locator("[data-thread]").getByText(message).first()
    ).toBeVisible();

    // The events / internal-notes side panel is responsive and may be hidden
    // by layout changes at narrower desktop widths. Probe the rendered panel
    // instead of assuming a breakpoint. Two side-panel asides ship with the
    // tri-pane (rail at xl+, inline tablet accordion below the thread); we
    // probe the visible one.
    const sidePanelCandidates = page.getByLabel("Request side panel");
    const candidateCount = await sidePanelCandidates.count();
    let sidePanel = sidePanelCandidates.first();
    for (let i = 0; i < candidateCount; i++) {
      const candidate = sidePanelCandidates.nth(i);
      if (await candidate.isVisible().catch(() => false)) {
        sidePanel = candidate;
        break;
      }
    }
    const showsSidePanel = await sidePanel.isVisible().catch(() => false);
    await expect(
      page.locator("[data-ai-intake]").getByText("Intake handoff").first()
    ).toHaveCount(1);
    if (showsSidePanel) {
      await expect(
        sidePanel.locator("[data-ai-intake]").getByText("Intake handoff").first()
      ).toBeVisible();
    } else {
      await page.getByRole("button", { name: "Details" }).click();
      const detailsDialog = page.getByRole("dialog", { name: "Details" });
      await expect(detailsDialog).toBeVisible();
      await expect(
        detailsDialog
          .locator("[data-ai-intake]")
          .getByText("Intake handoff")
          .first()
      ).toBeVisible();
      await page.keyboard.press("Escape");
    }

    const { data: createdOwner, error: ownerLookupError } = await admin
      .from("owners")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("phone", ownerPhone)
      .single();

    expect(ownerLookupError).toBeNull();
    expect(createdOwner?.id).toBeTruthy();

    const { data: createdRequest, error: requestLookupError } = await admin
      .from("requests")
      .select(
        "id, web_intake_session_id, intake_ai_output_id, routing_suggestion, service_intent"
      )
      .eq("clinic_id", clinicId)
      .eq("owner_id", createdOwner!.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    expect(requestLookupError).toBeNull();
    expect(createdRequest?.web_intake_session_id).toBeTruthy();
    expect(createdRequest?.intake_ai_output_id).toBeTruthy();
    expect(createdRequest?.routing_suggestion).toBeTruthy();
    expect(createdRequest?.service_intent).toBeTruthy();

    const { count: intakeOutputCount, error: aiOutputLookupError } = await admin
      .from("ai_outputs")
      .select("id", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .eq("request_id", createdRequest!.id)
      .eq("kind", "intake_question");

    expect(aiOutputLookupError).toBeNull();
    expect(intakeOutputCount ?? 0).toBeGreaterThan(0);
  } finally {
    if (clinicId) {
      const { data: owners } = await admin
        .from("owners")
        .select("id")
        .eq("clinic_id", clinicId)
        .eq("phone", ownerPhone);
      const ownerIds = owners?.map((owner) => owner.id) ?? [];

      if (ownerIds.length > 0) {
        await admin
          .from("requests")
          .delete()
          .eq("clinic_id", clinicId)
          .in("owner_id", ownerIds);
        await admin
          .from("owner_channel_identities")
          .delete()
          .eq("clinic_id", clinicId)
          .in("owner_id", ownerIds);
        await admin
          .from("pets")
          .delete()
          .eq("clinic_id", clinicId)
          .in("owner_id", ownerIds);
        await admin
          .from("owners")
          .delete()
          .eq("clinic_id", clinicId)
          .in("id", ownerIds);
      }
    }

    if (staffUserId) {
      await admin.from("clinic_staff").delete().eq("user_id", staffUserId);
      await admin.auth.admin.deleteUser(staffUserId);
    }
  }
});

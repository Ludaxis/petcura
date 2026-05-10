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
  const staffReply = "Please bring Luna in tomorrow morning for a check.";
  const internalNote = "E2E note: owner prefers a morning appointment.";
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
    await expect(
      page.getByRole("heading", { name: "ClientOps inbox" })
    ).toBeVisible();

    const requestLink = page.getByRole("link", {
      name: new RegExp(`${escapeRegExp(petName)}.*${escapeRegExp(ownerName)}`)
    });

    await expect(requestLink).toBeVisible();
    await requestLink.click();
    await expect(page.getByRole("heading", { name: petName })).toBeVisible();
    await expect(
      page.locator("[data-detail-head]").getByText(ownerName).first()
    ).toBeVisible();
    await expect(page.getByText(message).first()).toBeVisible();

    // The events / internal-notes side panel is `xl:block` per PR B
    // (`docs/contracts` design + plan). Below the xl breakpoint it collapses;
    // on mobile (<1024) it's hidden entirely until the PR C Details sheet
    // ships. Skip its assertions on small viewports.
    const showsSidePanel = (page.viewportSize()?.width ?? 0) >= 1280;

    await page.getByLabel("Reply to owner").fill(staffReply);
    await page.getByRole("button", { name: "Send reply" }).click();
    await expect(page.getByText(staffReply)).toBeVisible();
    if (showsSidePanel) {
      await expect(
        page.getByLabel("Request side panel").getByText("message_sent").first()
      ).toBeVisible();
    }
    await expect(
      page.locator("[data-detail-head]").getByText("Waiting Owner").first()
    ).toBeVisible();

    await page.locator("#urgency").selectOption("high");
    await page
      .locator("form:has(#urgency)")
      .getByRole("button", { name: "Save" })
      .click();
    await expect(
      page.locator("[data-detail-head]").getByText("High").first()
    ).toBeVisible();
    if (showsSidePanel) {
      await expect(
        page
          .getByLabel("Request side panel")
          .getByText("urgency_changed")
          .first()
      ).toBeVisible();
    }

    const assigneeOption = page.locator("#staffMemberId option").nth(1);
    await expect(assigneeOption).toHaveCount(1);
    const assigneeLabel = (await assigneeOption.textContent())?.trim() ?? "";

    await page.locator("#staffMemberId").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Assign" }).click();
    await expect(
      page.locator("[data-current-assignee]").getByText(assigneeLabel)
    ).toBeVisible();
    if (showsSidePanel) {
      await expect(
        page.getByLabel("Request side panel").getByText(/^assigned$/).first()
      ).toBeVisible();
    }

    if (showsSidePanel) {
      await page.getByLabel("Add internal note").fill(internalNote);
      await page.getByRole("button", { name: "Save note" }).click();
      await expect(page.getByText(internalNote)).toBeVisible();
      await expect(
        page.getByLabel("Request side panel").getByText("note_created").first()
      ).toBeVisible();
    }

    await page.locator("#status").selectOption("resolved");
    await page
      .locator("form:has(#status)")
      .getByRole("button", { name: "Save" })
      .click();
    await expect(
      page.locator("[data-detail-head]").getByText("Resolved").first()
    ).toBeVisible();
    if (showsSidePanel) {
      await expect(
        page.getByLabel("Request side panel").getByText(/^resolved$/).first()
      ).toBeVisible();
    }
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

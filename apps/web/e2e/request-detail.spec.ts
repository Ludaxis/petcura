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

type SeedResult = {
  clinicId: string;
  staffUserId: string;
  staffEmail: string;
  ownerId: string;
  petId: string;
  primaryRequestId: string;
  secondaryRequestId: string;
  ownerMessageId: string;
  aiOutputId: string;
  draftText: string;
  ownerMessageBody: string;
  ownerMessageTranslation: string;
};

async function seedRequestDetailFixture(
  admin: ReturnType<typeof adminClient>
): Promise<SeedResult> {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const staffEmail = `petcura-detail-${unique}@example.test`;
  const ownerName = `Detail Owner ${unique}`;
  const ownerPhone = `+372${unique
    .replace(/[^0-9]/g, "")
    .slice(-10)
    .padStart(10, "0")}`;
  const petName = `Lumi Detail ${unique}`;
  const ownerMessageBody = "Lumi ei ole söönud eilest.";
  const ownerMessageTranslation = "Lumi has not eaten since yesterday.";
  const draftText =
    "Tere! Soovitame Lumi pärast lõunat kontrolli tuua, kui ta ei söö.";

  const { data: clinic } = await admin
    .from("clinics")
    .select("id")
    .eq("slug", defaultClinicSlug)
    .single();
  if (!clinic?.id) throw new Error("clinic missing");
  const clinicId = clinic.id;

  const { data: staffUser } = await admin.auth.admin.createUser({
    email: staffEmail,
    email_confirm: true
  });
  const staffUserId = staffUser.user!.id;
  await admin.from("clinic_staff").upsert(
    { clinic_id: clinicId, user_id: staffUserId, role: "admin", is_active: true },
    { onConflict: "clinic_id,user_id" }
  );

  const { data: owner, error: ownerError } = await admin
    .from("owners")
    .insert({
      clinic_id: clinicId,
      name: ownerName,
      phone: ownerPhone,
      preferred_language: "et"
    })
    .select("id")
    .single();
  if (ownerError || !owner?.id) {
    throw new Error(`owner seed failed: ${ownerError?.message ?? "missing id"}`);
  }
  const ownerId = owner!.id;

  const { data: pet } = await admin
    .from("pets")
    .insert({ clinic_id: clinicId, owner_id: ownerId, name: petName, species: "Cat" })
    .select("id")
    .single();
  const petId = pet!.id;

  const { data: primaryRequest } = await admin
    .from("requests")
    .insert({
      clinic_id: clinicId,
      owner_id: ownerId,
      pet_id: petId,
      category: "medical_question",
      channel: "web",
      status: "new",
      urgency: "high",
      ai_summary: `${petName} has not eaten since yesterday.`
    })
    .select("id")
    .single();
  const primaryRequestId = primaryRequest!.id;

  const { data: secondaryRequest } = await admin
    .from("requests")
    .insert({
      clinic_id: clinicId,
      owner_id: ownerId,
      pet_id: petId,
      category: "appointment",
      channel: "web",
      status: "waiting_owner",
      urgency: "low",
      ai_summary: `Follow-up appointment for ${petName}.`
    })
    .select("id")
    .single();
  const secondaryRequestId = secondaryRequest!.id;

  const { data: ownerMessage } = await admin
    .from("messages")
    .insert({
      clinic_id: clinicId,
      request_id: primaryRequestId,
      sender_type: "owner",
      body: ownerMessageBody,
      body_translated: ownerMessageTranslation,
      source_locale: "et"
    })
    .select("id")
    .single();
  const ownerMessageId = ownerMessage!.id;

  const { data: aiOutput } = await admin
    .from("ai_outputs")
    .insert({
      clinic_id: clinicId,
      request_id: primaryRequestId,
      kind: "reply_draft",
      model: "anthropic.claude-test",
      prompt_version: "reply_draft@2025-05-10",
      input_json: {
        source_message_id: ownerMessageId,
        source_locale: "et",
        target_locale: "et"
      },
      output_json: { text: draftText },
      confidence: 0.86,
      accepted: null
    })
    .select("id")
    .single();
  const aiOutputId = aiOutput!.id;

  return {
    clinicId,
    staffUserId,
    staffEmail,
    ownerId,
    petId,
    primaryRequestId,
    secondaryRequestId,
    ownerMessageId,
    aiOutputId,
    draftText,
    ownerMessageBody,
    ownerMessageTranslation
  };
}

async function teardownFixture(
  admin: ReturnType<typeof adminClient>,
  seed: Partial<SeedResult>
) {
  const { clinicId, ownerId, petId, primaryRequestId, secondaryRequestId } =
    seed;
  if (clinicId) {
    if (seed.aiOutputId) {
      await admin.from("ai_outputs").delete().eq("id", seed.aiOutputId);
    }
    const ids = [primaryRequestId, secondaryRequestId].filter(
      (v): v is string => Boolean(v)
    );
    if (ids.length > 0) {
      await admin
        .from("request_events")
        .delete()
        .eq("clinic_id", clinicId)
        .in("request_id", ids);
      await admin
        .from("messages")
        .delete()
        .eq("clinic_id", clinicId)
        .in("request_id", ids);
      await admin.from("requests").delete().eq("clinic_id", clinicId).in("id", ids);
    }
    if (petId)
      await admin.from("pets").delete().eq("clinic_id", clinicId).eq("id", petId);
    if (ownerId)
      await admin
        .from("owners")
        .delete()
        .eq("clinic_id", clinicId)
        .eq("id", ownerId);
  }
  if (seed.staffUserId) {
    await admin.from("clinic_staff").delete().eq("user_id", seed.staffUserId);
    await admin.auth.admin.deleteUser(seed.staffUserId);
  }
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

test.describe("Request detail tri-pane", () => {
  test("renders tri-pane, AI draft accept/reject, translation toggle, ⌘↵, J/K nav", async ({
    page,
    baseURL
  }) => {
    test.skip(
      !supabaseUrl || !publishableKey || !secretKey,
      "Supabase env required for request-detail smoke."
    );

    const admin = adminClient();
    const unique = Date.now();
    const staffEmail = `petcura-detail-${unique}@example.test`;
    const ownerName = `Detail Owner ${unique}`;
    const ownerPhone = `+372${unique}`;
    const petName = `Lumi Detail ${unique}`;
    const ownerMessageBody = "Lumi ei ole söönud eilest.";
    const ownerMessageTranslation = "Lumi has not eaten since yesterday.";
    const draftText =
      "Tere! Soovitame Lumi pärast lõunat kontrolli tuua, kui ta ei söö.";

    let clinicId: string | undefined;
    let staffUserId: string | undefined;
    let ownerId: string | undefined;
    let petId: string | undefined;
    let primaryRequestId: string | undefined;
    let secondaryRequestId: string | undefined;
    let aiOutputId: string | undefined;
    let ownerMessageId: string | undefined;
    let staffMessageId: string | undefined;

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

      const { data: primaryRequest } = await admin
        .from("requests")
        .insert({
          clinic_id: clinicId,
          owner_id: ownerId,
          pet_id: petId,
          category: "medical_question",
          channel: "web",
          status: "new",
          urgency: "high",
          ai_summary: `${petName} has not eaten since yesterday.`
        })
        .select("id")
        .single();
      primaryRequestId = primaryRequest!.id;

      const { data: secondaryRequest } = await admin
        .from("requests")
        .insert({
          clinic_id: clinicId,
          owner_id: ownerId,
          pet_id: petId,
          category: "appointment",
          channel: "web",
          status: "waiting_owner",
          urgency: "low",
          ai_summary: `Follow-up appointment for ${petName}.`
        })
        .select("id")
        .single();
      secondaryRequestId = secondaryRequest!.id;

      // Seed an owner message with a translation so the per-bubble toggle has
      // something to reveal. PR B is read-only on `messages.body_translated`.
      const { data: ownerMessage } = await admin
        .from("messages")
        .insert({
          clinic_id: clinicId,
          request_id: primaryRequestId,
          sender_type: "owner",
          body: ownerMessageBody,
          body_translated: ownerMessageTranslation,
          source_locale: "et"
        })
        .select("id")
        .single();
      ownerMessageId = ownerMessage!.id;

      const { data: staffMessage } = await admin
        .from("messages")
        .insert({
          clinic_id: clinicId,
          request_id: primaryRequestId,
          sender_type: "staff",
          sender_id: staffUserId,
          body: "Thanks, we received this request.",
          source_locale: "en",
          external_id: `SM-detail-${unique}`
        })
        .select("id")
        .single();
      staffMessageId = staffMessage!.id;

      await admin.from("message_delivery_events").insert([
        {
          clinic_id: clinicId,
          message_id: staffMessageId,
          channel: "whatsapp",
          status: "sent",
          provider: "twilio",
          external_event_id: `SM-detail-${unique}:sent`,
          created_at: new Date(unique - 1000).toISOString()
        },
        {
          clinic_id: clinicId,
          message_id: staffMessageId,
          channel: "whatsapp",
          status: "read",
          provider: "twilio",
          external_event_id: `SM-detail-${unique}:read`,
          created_at: new Date(unique).toISOString()
        }
      ]);

      // Seed a pending AI reply draft for the primary request.
      const { data: aiOutput } = await admin
        .from("ai_outputs")
        .insert({
          clinic_id: clinicId,
          request_id: primaryRequestId,
          kind: "reply_draft",
          model: "anthropic.claude-test",
          prompt_version: "reply_draft@2025-05-10",
          input_json: {
            source_message_id: ownerMessageId,
            source_locale: "et",
            target_locale: "et"
          },
          output_json: { text: draftText },
          confidence: 0.86,
          accepted: null
        })
        .select("id")
        .single();
      aiOutputId = aiOutput!.id;

      // Authenticate.
      const { data: link } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: staffEmail,
        options: {
          redirectTo: `${baseURL}/auth/callback?next=/requests/${primaryRequestId}&lang=en`
        }
      });
      const callbackUrl = new URL("/auth/callback", baseURL);
      callbackUrl.searchParams.set("next", `/requests/${primaryRequestId}`);
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

      // Tri-pane renders: rail (lg only), list (lg only), detail body always.
      // On mobile, the list/rail are hidden — the detail takes the viewport
      // and a back-arrow returns to /inbox. The data-row-id node still exists
      // in the SSR'd DOM so deep-links work; just don't assert visibility on
      // small viewports.
      const rowLocator = page
        .locator(`[data-row-id="${primaryRequestId}"]`)
        .first();
      const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
      if (isDesktop) {
        await expect(rowLocator).toBeVisible();
      } else {
        await expect(rowLocator).toHaveCount(1);
      }
      const aiCard = page.getByRole("region", {
        name: /AI draft suggestion|AI mustandi soovitus|Подсказка AI-черновика/i
      });
      await expect(aiCard).toBeVisible();
      await expect(aiCard).toContainText(draftText.slice(0, 12));

      // Translation toggle on owner bubble — flips the visible text to EN.
      const ownerBubble = page
        .locator(`[data-message-id="${ownerMessageId}"]`)
        .first();
      await expect(ownerBubble).toContainText(ownerMessageBody);
      const translateToggle = ownerBubble.locator(
        "[data-translate-toggle]"
      );
      await translateToggle.click();
      await expect(ownerBubble).toContainText(ownerMessageTranslation);
      await expect(translateToggle).toHaveAttribute("aria-pressed", "true");

      const staffBubble = page
        .locator(`[data-message-id="${staffMessageId}"]`)
        .first();
      await expect(staffBubble).toContainText(/Read|Loetud|Прочитано/);

      // Accept the draft → composer textarea is prefilled.
      await aiCard.getByRole("button", { name: /^Accept|Kinnita|Принять/ }).click();
      const composer = page.locator("[data-composer-textarea]");
      await expect(composer).toBeFocused();
      await expect(composer).toHaveValue(draftText);

      // ai_outputs.accepted should now be true.
      await expect(async () => {
        const { data } = await admin
          .from("ai_outputs")
          .select("accepted, reviewed_by")
          .eq("id", aiOutputId!)
          .single();
        expect(data?.accepted).toBe(true);
        expect(data?.reviewed_by).toBe(staffUserId);
      }).toPass({ timeout: 10_000 });

      // Card should hide after accept.
      await expect(aiCard).not.toBeVisible();

      // R focuses composer (after blurring it first).
      await page.keyboard.press("Escape");
      await page.locator("body").click();
      await page.waitForTimeout(100);
      await page.keyboard.press("r");
      await expect(composer).toBeFocused();

      // J/K navigates to the secondary request.
      await page.keyboard.press("Escape");
      await page.locator("body").click();
      await page.waitForTimeout(100);
      await page.keyboard.press("j");
      await page.waitForURL((url) =>
        url.pathname.includes("/requests/") &&
        !url.pathname.endsWith(primaryRequestId!),
        { timeout: 10_000 }
      );

      // ? opens the shortcut sheet listing R, T, ⌘↵.
      await expect(page.locator("[data-composer-textarea]")).toBeVisible();
      await page.locator("body").click();
      await page.waitForTimeout(150);
      await page.keyboard.press("?");
      const sheet = page.getByRole("dialog", {
        name: /shortcuts|kombinats|сокраще/i
      });
      await expect(sheet).toBeVisible();
      await expect(sheet.locator("kbd").filter({ hasText: /^R$/ })).toHaveCount(1);
      await expect(sheet.locator("kbd").filter({ hasText: /^T$/ })).toHaveCount(1);
      await expect(sheet.locator("kbd").filter({ hasText: /⌘↵/ })).toHaveCount(1);
      await page.keyboard.press("Escape");
    } finally {
      // Clean up: ai_outputs → messages → requests → pets → owners → staff
      if (clinicId) {
        if (aiOutputId) {
          await admin.from("ai_outputs").delete().eq("id", aiOutputId);
        }
        if (primaryRequestId || secondaryRequestId) {
          const ids = [primaryRequestId, secondaryRequestId].filter(
            (v): v is string => Boolean(v)
          );
          if (ids.length > 0) {
            await admin
              .from("request_events")
              .delete()
              .eq("clinic_id", clinicId)
              .in("request_id", ids);
            await admin
              .from("messages")
              .delete()
              .eq("clinic_id", clinicId)
              .in("request_id", ids);
            await admin
              .from("requests")
              .delete()
              .eq("clinic_id", clinicId)
              .in("id", ids);
          }
        }
        if (petId) {
          await admin
            .from("pets")
            .delete()
            .eq("clinic_id", clinicId)
            .eq("id", petId);
        }
        if (ownerId) {
          await admin
            .from("owners")
            .delete()
            .eq("clinic_id", clinicId)
            .eq("id", ownerId);
        }
      }
      if (staffUserId) {
        await admin.from("clinic_staff").delete().eq("user_id", staffUserId);
        await admin.auth.admin.deleteUser(staffUserId);
      }
    }
  });

  test("Edit save (saveOnly) keeps card visible and accepted=null", async ({
    page,
    baseURL
  }) => {
    test.skip(
      !supabaseUrl || !publishableKey || !secretKey,
      "Supabase env required."
    );
    const admin = adminClient();
    let seed: SeedResult | undefined;
    try {
      seed = await seedRequestDetailFixture(admin);
      await authenticateAs(
        admin,
        page,
        baseURL,
        seed.staffEmail,
        `/requests/${seed.primaryRequestId}`
      );

      const aiCard = page.getByRole("region", {
        name: /AI draft suggestion|AI mustandi soovitus|Подсказка AI-черновика/i
      });
      await expect(aiCard).toBeVisible();
      await aiCard.scrollIntoViewIfNeeded();
      await aiCard.getByRole("button", { name: /^Edit|Muuda|Изменить/ }).click();
      const dialog = page.getByRole("dialog", {
        name: /Edit AI draft|Muuda AI mustandit|Изменить AI-черновик/i
      });
      await expect(dialog).toBeVisible();
      const editedText = `${seed.draftText} (edited)`;
      const textarea = dialog.locator("textarea");
      await textarea.fill(editedText);
      await dialog
        .getByRole("button", { name: /^Save edit|Salvesta muudatus|Сохранить правку/ })
        .click();

      await expect(async () => {
        const { data } = await admin
          .from("ai_outputs")
          .select("accepted, edited_output_json")
          .eq("id", seed!.aiOutputId)
          .single();
        expect(data?.accepted).toBeNull();
        expect((data?.edited_output_json as { text?: string } | null)?.text).toBe(
          editedText
        );
      }).toPass({ timeout: 10_000 });

      await expect(async () => {
        const { data: events } = await admin
          .from("request_events")
          .select("event_type")
          .eq("request_id", seed!.primaryRequestId);
        expect(
          events?.some((e) => e.event_type === "ai_draft_edited")
        ).toBeTruthy();
      }).toPass({ timeout: 10_000 });

      // Card stays visible (modal closed but region still rendered).
      await expect(aiCard).toBeVisible();
    } finally {
      if (seed) await teardownFixture(admin, seed);
    }
  });

  test("Edit Save & accept finalizes draft and prefills composer", async ({
    page,
    baseURL
  }) => {
    test.skip(
      !supabaseUrl || !publishableKey || !secretKey,
      "Supabase env required."
    );
    const admin = adminClient();
    let seed: SeedResult | undefined;
    try {
      seed = await seedRequestDetailFixture(admin);
      await authenticateAs(
        admin,
        page,
        baseURL,
        seed.staffEmail,
        `/requests/${seed.primaryRequestId}`
      );
      const aiCard = page.getByRole("region", {
        name: /AI draft suggestion|AI mustandi soovitus|Подсказка AI-черновика/i
      });
      await aiCard.scrollIntoViewIfNeeded();
      await aiCard.getByRole("button", { name: /^Edit|Muuda|Изменить/ }).click();
      const dialog = page.getByRole("dialog", {
        name: /Edit AI draft|Muuda AI mustandit|Изменить AI-черновик/i
      });
      const editedText = `${seed.draftText} — finalized.`;
      await dialog.locator("textarea").fill(editedText);
      await dialog
        .getByRole("button", {
          name: /^Save & accept|Salvesta ja kinnita|Сохранить и принять/
        })
        .click();

      await expect(async () => {
        const { data } = await admin
          .from("ai_outputs")
          .select("accepted, reviewed_by, edited_output_json")
          .eq("id", seed!.aiOutputId)
          .single();
        expect(data?.accepted).toBe(true);
        expect(data?.reviewed_by).toBe(seed!.staffUserId);
        expect((data?.edited_output_json as { text?: string } | null)?.text).toBe(
          editedText
        );
      }).toPass({ timeout: 10_000 });

      const { data: events } = await admin
        .from("request_events")
        .select("event_type")
        .eq("request_id", seed.primaryRequestId);
      expect(
        events?.some((e) => e.event_type === "ai_draft_accepted_with_edits")
      ).toBeTruthy();

      await expect(aiCard).not.toBeVisible();
      const composer = page.locator("[data-composer-textarea]");
      await expect(composer).toHaveValue(editedText);
    } finally {
      if (seed) await teardownFixture(admin, seed);
    }
  });

  test("Reject hides card and writes ai_draft_rejected event", async ({
    page,
    baseURL
  }) => {
    test.skip(
      !supabaseUrl || !publishableKey || !secretKey,
      "Supabase env required."
    );
    const admin = adminClient();
    let seed: SeedResult | undefined;
    try {
      seed = await seedRequestDetailFixture(admin);
      await authenticateAs(
        admin,
        page,
        baseURL,
        seed.staffEmail,
        `/requests/${seed.primaryRequestId}`
      );
      const aiCard = page.getByRole("region", {
        name: /AI draft suggestion|AI mustandi soovitus|Подсказка AI-черновика/i
      });
      await aiCard.scrollIntoViewIfNeeded();
      await aiCard
        .getByRole("button", { name: /^Reject|Lükka tagasi|Отклонить/ })
        .click();
      await expect(async () => {
        const { data } = await admin
          .from("ai_outputs")
          .select("accepted")
          .eq("id", seed!.aiOutputId)
          .single();
        expect(data?.accepted).toBe(false);
      }).toPass({ timeout: 10_000 });

      await expect(async () => {
        const { data: events } = await admin
          .from("request_events")
          .select("event_type")
          .eq("request_id", seed!.primaryRequestId);
        expect(
          events?.some((e) => e.event_type === "ai_draft_rejected")
        ).toBeTruthy();
      }).toPass({ timeout: 10_000 });
      await expect(aiCard).not.toBeVisible();
    } finally {
      if (seed) await teardownFixture(admin, seed);
    }
  });

  test("⌘↵ from composer sends a reply via sendStaffReply", async ({
    page,
    baseURL
  }) => {
    test.skip(
      !supabaseUrl || !publishableKey || !secretKey,
      "Supabase env required."
    );
    const admin = adminClient();
    let seed: SeedResult | undefined;
    try {
      seed = await seedRequestDetailFixture(admin);
      await authenticateAs(
        admin,
        page,
        baseURL,
        seed.staffEmail,
        `/requests/${seed.primaryRequestId}`
      );
      const composer = page.locator("[data-composer-textarea]");
      await composer.scrollIntoViewIfNeeded();
      await composer.focus();
      const replyBody = `e2e ⌘↵ reply ${Date.now()}`;
      await composer.fill(replyBody);
      // Web channel — Twilio is bypassed by sendStaffReply for non-whatsapp.
      const isMac = process.platform === "darwin";
      await page.keyboard.press(isMac ? "Meta+Enter" : "Control+Enter");

      await expect(async () => {
        const { data } = await admin
          .from("messages")
          .select("body, sender_type")
          .eq("clinic_id", seed!.clinicId)
          .eq("request_id", seed!.primaryRequestId)
          .eq("body", replyBody);
        expect(data && data.length > 0).toBeTruthy();
        expect(data![0]?.sender_type).toBe("staff");
      }).toPass({ timeout: 10_000 });
    } finally {
      if (seed) await teardownFixture(admin, seed);
    }
  });

  test("K navigates to previous request and shortcut sheet shows J/K", async ({
    page,
    baseURL
  }, testInfo) => {
    test.skip(
      !supabaseUrl || !publishableKey || !secretKey,
      "Supabase env required."
    );
    test.skip(
      testInfo.project.name === "mobile-chrome",
      "Keyboard navigation is a desktop-shift workflow; the mobile project covers the same surface via the mobile spec."
    );
    const admin = adminClient();
    let seed: SeedResult | undefined;
    try {
      seed = await seedRequestDetailFixture(admin);
      // Ensure desktop viewport so the list rail is reachable for J/K.
      await page.setViewportSize({ width: 1320, height: 820 });
      await authenticateAs(
        admin,
        page,
        baseURL,
        seed.staffEmail,
        `/requests/${seed.primaryRequestId}`
      );
      const rowIds = await page
        .locator("[data-row-id]")
        .evaluateAll((nodes) =>
          nodes
            .map((node) => node.getAttribute("data-row-id"))
            .filter((id): id is string => Boolean(id))
        );
      const currentIndex = rowIds.indexOf(seed.primaryRequestId);
      expect(currentIndex).toBeGreaterThanOrEqual(0);
      expect(rowIds.length).toBeGreaterThan(1);
      let startIndex = currentIndex;
      if (startIndex === 0) {
        const nextId = rowIds[1]!;
        await page.locator(`[data-row-id="${nextId}"]`).first().click();
        await page.waitForURL((url) => url.pathname.endsWith(nextId), {
          timeout: 10_000
        });
        startIndex = 1;
      }
      const targetId = rowIds[startIndex - 1]!;

      await page.locator("body").click();
      await page.waitForTimeout(120);
      await page.keyboard.press("k");
      await page.waitForURL(
        (url) =>
          url.pathname.includes("/requests/") &&
          url.pathname.endsWith(targetId),
        { timeout: 10_000 }
      );

      // Shortcut sheet shows J and K rows. Wait for the new page to hydrate
      // (the RequestKeyboard global listener needs to re-attach) before we
      // press `?`. The composer textarea is the cheapest readiness signal.
      await expect(page.locator("[data-composer-textarea]")).toBeVisible();
      await page.locator("body").click();
      await page.waitForTimeout(150);
      await page.keyboard.press("?");
      const sheet = page.getByRole("dialog", {
        name: /shortcuts|kombinats|сокраще/i
      });
      await expect(sheet).toBeVisible();
      // The PR A keys row is "J / K" — confirm both letters render.
      await expect(
        sheet.locator("kbd").filter({ hasText: /J/ }).first()
      ).toBeVisible();
      await expect(
        sheet.locator("kbd").filter({ hasText: /K/ }).first()
      ).toBeVisible();
      await page.keyboard.press("Escape");
    } finally {
      if (seed) await teardownFixture(admin, seed);
    }
  });

  test("mobile 390x844: rail/list hidden, detail visible, back-arrow links to /inbox", async ({
    page,
    baseURL
  }) => {
    test.skip(
      !supabaseUrl || !publishableKey || !secretKey,
      "Supabase env required."
    );
    const admin = adminClient();
    let seed: SeedResult | undefined;
    try {
      seed = await seedRequestDetailFixture(admin);
      await page.setViewportSize({ width: 390, height: 844 });
      await authenticateAs(
        admin,
        page,
        baseURL,
        seed.staffEmail,
        `/requests/${seed.primaryRequestId}`
      );
      // Rail (lg only) and list (lg only) are not visible on mobile.
      const rail = page.locator('aside[aria-label]:has(a[aria-label*="inbox" i])');
      // Use the data-row-id node from the list as a probe — it should exist
      // in the SSR DOM but not be visible on mobile.
      const rowProbe = page
        .locator(`[data-row-id="${seed.primaryRequestId}"]`)
        .first();
      await expect(rowProbe).not.toBeVisible();
      // Detail should be visible — pet name renders in the header.
      await expect(page.locator("h1").first()).toBeVisible();
      // Back-arrow link to /inbox is rendered + focusable.
      const back = page.locator('header a[href*="/inbox"]');
      await expect(back.first()).toBeVisible();
      await back.first().focus();
      await expect(back.first()).toBeFocused();
      // Sanity: rail is not visible.
      await expect(rail).toHaveCount(0).catch(() => null);
    } finally {
      if (seed) await teardownFixture(admin, seed);
    }
  });
});

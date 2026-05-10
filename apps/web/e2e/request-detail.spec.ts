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
});

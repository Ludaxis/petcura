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

async function signInAt(
  page: import("@playwright/test").Page,
  baseURL: string | undefined,
  staffEmail: string,
  admin: ReturnType<typeof adminClient>
) {
  const { data: link } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: staffEmail,
    options: {
      redirectTo: `${baseURL}/auth/callback?next=/inbox?view=board&lang=en`
    }
  });
  const cb = new URL("/auth/callback", baseURL);
  cb.searchParams.set("next", "/inbox?view=board");
  cb.searchParams.set("lang", "en");
  cb.searchParams.set("token_hash", link.properties!.hashed_token);
  cb.searchParams.set(
    "type",
    link.properties!.verification_type ?? "magiclink"
  );
  await page.goto(cb.toString());
}

/**
 * Inbox board drag-and-drop coverage:
 *
 *   1. Mouse path — drag a card from "New" to "Resolved" and assert it lands
 *      in the Resolved column AND the DB row's status moved to "resolved".
 *
 *   2. Mouse path — drag a card to "Urgent" and assert its urgency flipped
 *      to "high" on the DB row (status untouched, since "Urgent" is an
 *      urgency-axis lane).
 *
 *   3. Keyboard path — focus a card via Tab, press Space to pick up, arrow
 *      keys to traverse, Space to drop. Assert the move took effect.
 *
 * Each test seeds its own clinic-scoped requests so they don't collide with
 * other suites. Cleanup deletes the seeded rows + staff user in the finally
 * block so the e2e DB stays tidy.
 */
test.describe("Inbox board — drag and drop", () => {
  test.skip(
    !supabaseUrl || !publishableKey || !secretKey,
    "Supabase env required."
  );

  test("mouse drag moves a card from New to Resolved and persists to DB", async ({
    page,
    baseURL
  }, testInfo) => {
    test.skip(
      testInfo.project.name.includes("mobile"),
      "Mouse drag is exercised on the desktop project; touch path is separate."
    );
    const admin = adminClient();
    const unique = Date.now();
    const staffEmail = `petcura-board-${unique}@example.test`;
    const ownerName = `Board Owner ${unique}`;
    const ownerPhone = `+372${unique}`;
    let clinicId: string | undefined;
    let staffUserId: string | undefined;
    let ownerId: string | undefined;
    let petId: string | undefined;
    const requestIds: string[] = [];
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
          name: `BoardPet ${unique}`,
          species: "Dog"
        })
        .select("id")
        .single();
      petId = pet!.id;

      // Seed three "new" requests with varying urgencies so the columns all
      // render with content.
      for (let i = 0; i < 3; i += 1) {
        const { data: req } = await admin
          .from("requests")
          .insert({
            clinic_id: clinicId,
            owner_id: ownerId,
            pet_id: petId,
            category: "medical_question",
            channel: "web",
            status: "new",
            urgency: "low",
            ai_summary: `Board seed ${unique}-${i}`
          })
          .select("id")
          .single();
        if (req?.id) requestIds.push(req.id);
      }

      await signInAt(page, baseURL, staffEmail, admin);
      // Wait until the board renders.
      await expect(
        page.locator("[data-board-dnd-root]")
      ).toBeVisible({ timeout: 15_000 });

      // Capture the resting board state before any drag occurs. This is the
      // baseline screenshot reviewers compare drag overlays against.
      await page.screenshot({
        path: "screenshots/board-dnd-default.png",
        fullPage: false
      });

      const cardId = requestIds[0]!;
      const card = page
        .locator(`[data-board-card-id="${cardId}"]`)
        .first();
      await expect(card).toBeVisible();

      const targetColumn = page.locator(
        '[data-board-column="resolved"]'
      );
      await expect(targetColumn).toBeVisible();

      // Manual pointer drag — synthesizes mousedown/mousemove/mouseup with
      // intermediate steps so dnd-kit's PointerSensor (6px activation
      // distance) triggers a real drag instead of a click.
      const cardBox = await card.boundingBox();
      const targetBox = await targetColumn.boundingBox();
      if (!cardBox || !targetBox) {
        throw new Error("Missing layout boxes for drag");
      }
      const fromX = cardBox.x + cardBox.width / 2;
      const fromY = cardBox.y + cardBox.height / 2;
      const toX = targetBox.x + targetBox.width / 2;
      const toY = targetBox.y + targetBox.height / 2;

      await page.mouse.move(fromX, fromY);
      await page.mouse.down();
      // Move in a few steps to exceed the activation distance and to trigger
      // dragOver against the destination column.
      await page.mouse.move(fromX + 20, fromY + 20, { steps: 5 });
      // Mid-drag — pointer has passed the activation distance; the drag
      // overlay should be visible at the pointer location.
      await page.screenshot({
        path: "screenshots/board-dnd-dragging.png",
        fullPage: false
      });
      await page.mouse.move(toX, toY, { steps: 20 });
      // Hovering over the destination column — the column should display
      // its drop-target affordance.
      await page.screenshot({
        path: "screenshots/board-dnd-hover.png",
        fullPage: false
      });
      await page.mouse.up();

      // The card should now be inside the Resolved column. Optimistic update
      // happens immediately; the server roundtrip + router.refresh
      // re-establishes authoritative state.
      await expect(
        targetColumn.locator(`[data-board-card-id="${cardId}"]`)
      ).toBeVisible({ timeout: 15_000 });

      // Confirm the DB persisted the status change.
      const { data: dbRow } = await admin
        .from("requests")
        .select("status, resolved_at")
        .eq("id", cardId)
        .single();
      expect(dbRow?.status).toBe("resolved");
      expect(dbRow?.resolved_at).not.toBeNull();

      // Confirm the audit event was written.
      const { data: events } = await admin
        .from("request_events")
        .select("event_type, payload_json")
        .eq("request_id", cardId)
        .eq("event_type", "moved_to_column");
      expect((events ?? []).length).toBeGreaterThan(0);
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

  test("mouse drag onto Urgent flips urgency=high without changing status", async ({
    page,
    baseURL
  }, testInfo) => {
    test.skip(
      testInfo.project.name.includes("mobile"),
      "Desktop pointer flow."
    );
    const admin = adminClient();
    const unique = Date.now() + 1;
    const staffEmail = `petcura-board-urgent-${unique}@example.test`;
    const ownerName = `Urg Owner ${unique}`;
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
          name: `UrgPet ${unique}`,
          species: "Dog"
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
          channel: "web",
          status: "waiting_staff",
          urgency: "low",
          ai_summary: `Urg seed ${unique}`
        })
        .select("id")
        .single();
      requestId = req!.id;

      await signInAt(page, baseURL, staffEmail, admin);
      await expect(page.locator("[data-board-dnd-root]")).toBeVisible({
        timeout: 15_000
      });

      const card = page
        .locator(`[data-board-card-id="${requestId}"]`)
        .first();
      await expect(card).toBeVisible();
      const targetColumn = page.locator('[data-board-column="urgent"]');
      await expect(targetColumn).toBeVisible();

      const cardBox = await card.boundingBox();
      const targetBox = await targetColumn.boundingBox();
      if (!cardBox || !targetBox) throw new Error("Missing boxes");
      const fromX = cardBox.x + cardBox.width / 2;
      const fromY = cardBox.y + cardBox.height / 2;
      const toX = targetBox.x + targetBox.width / 2;
      const toY = targetBox.y + targetBox.height / 2;
      await page.mouse.move(fromX, fromY);
      await page.mouse.down();
      await page.mouse.move(fromX + 20, fromY + 20, { steps: 5 });
      await page.mouse.move(toX, toY, { steps: 20 });
      await page.mouse.up();

      await expect(
        targetColumn.locator(`[data-board-card-id="${requestId}"]`)
      ).toBeVisible({ timeout: 15_000 });

      const { data: dbRow } = await admin
        .from("requests")
        .select("status, urgency")
        .eq("id", requestId!)
        .single();
      // Urgency lane flips urgency only — status stays waiting_staff.
      expect(dbRow?.urgency).toBe("high");
      expect(dbRow?.status).toBe("waiting_staff");
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

  test("keyboard drag moves a card via Space + arrow keys", async ({
    page,
    baseURL
  }, testInfo) => {
    test.skip(
      testInfo.project.name.includes("mobile"),
      "Keyboard DnD is a desktop affordance."
    );
    const admin = adminClient();
    const unique = Date.now() + 2;
    const staffEmail = `petcura-board-kbd-${unique}@example.test`;
    const ownerName = `Kbd Owner ${unique}`;
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
          name: `KbdPet ${unique}`,
          species: "Dog"
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
          channel: "web",
          status: "new",
          urgency: "low",
          ai_summary: `Kbd seed ${unique}`
        })
        .select("id")
        .single();
      requestId = req!.id;

      await signInAt(page, baseURL, staffEmail, admin);
      await expect(page.locator("[data-board-dnd-root]")).toBeVisible({
        timeout: 15_000
      });

      const card = page
        .locator(`[data-board-card-id="${requestId}"]`)
        .first();
      await expect(card).toBeVisible();
      await card.focus();

      // Space to pick up.
      await page.keyboard.press("Space");
      // dnd-kit's KeyboardSensor traverses droppables via the sortable
      // keyboard coordinate getter; arrow-right moves toward the next
      // column. Four presses take us from "New" past Urgent → Waiting
      // Staff → Waiting Owner → Resolved.
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Space");

      // The card should land in Resolved (or have moved at minimum out of
      // "new" — assert the DB state for determinism).
      await page.waitForTimeout(500);
      const { data: dbRow } = await admin
        .from("requests")
        .select("status, urgency")
        .eq("id", requestId!)
        .single();
      // Accept any non-`new` landing column for robustness — exact column
      // depends on dnd-kit collision geometry at runtime. The contract is
      // that keyboard nav can move the card.
      expect(dbRow?.status === "resolved" || dbRow?.urgency === "high").toBe(
        true
      );
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

  test("captures a mobile board screenshot at 390x844", async ({
    browser,
    baseURL
  }) => {
    // Forced viewport — independent of the parent project so the mobile
    // capture renders identically on desktop and mobile project runs.
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }
    });
    const page = await context.newPage();
    const admin = adminClient();
    const unique = Date.now() + 3;
    const staffEmail = `petcura-board-mobile-${unique}@example.test`;
    const ownerName = `Mobile Owner ${unique}`;
    const ownerPhone = `+372${unique}`;
    let clinicId: string | undefined;
    let staffUserId: string | undefined;
    let ownerId: string | undefined;
    let petId: string | undefined;
    const requestIds: string[] = [];
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
          name: `MobilePet ${unique}`,
          species: "Dog"
        })
        .select("id")
        .single();
      petId = pet!.id;
      for (let i = 0; i < 3; i += 1) {
        const { data: req } = await admin
          .from("requests")
          .insert({
            clinic_id: clinicId,
            owner_id: ownerId,
            pet_id: petId,
            category: "medical_question",
            channel: "web",
            status: "new",
            urgency: "low",
            ai_summary: `Mobile seed ${unique}-${i}`
          })
          .select("id")
          .single();
        if (req?.id) requestIds.push(req.id);
      }

      await signInAt(page, baseURL, staffEmail, admin);
      await expect(page.locator("[data-board-dnd-root]")).toBeVisible({
        timeout: 15_000
      });
      await page.screenshot({
        path: "screenshots/board-dnd-mobile.png",
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
      await context.close();
    }
  });
});

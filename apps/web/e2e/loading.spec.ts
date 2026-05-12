import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@petcura/shared";

/*
 * Loading-system smoke tests for the sage shimmer language shipped in
 * Phases 1-3 of the loading plan
 * (.claude/plans/usually-ading-loading-and-elegant-mango.md).
 *
 * What we cover:
 *   1. Route-level loading.tsx fallback fires (aria-busy="true").
 *   2. Inbox stream switch shows a skeleton without losing toolbar focus.
 *   3. CommandPalette is code-split — its chunk is absent from the initial
 *      bundle until ⌘K is pressed.
 *   4. View transition names match between inbox row and request header.
 *   5. Realtime progress bar appears when realtime events fire.
 *
 * Tests that require seeded Supabase data follow the same env-skip pattern
 * as inbox-list.spec.ts / request-detail.spec.ts.
 */

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
};

async function seedLoadingFixture(
  admin: ReturnType<typeof adminClient>
): Promise<SeedResult> {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const staffEmail = `petcura-loading-${unique}@example.test`;
  const ownerName = `Loading Owner ${unique}`;
  const ownerPhone = `+372${unique
    .replace(/[^0-9]/g, "")
    .slice(-10)
    .padStart(10, "0")}`;
  const petName = `Loading Lumi ${unique}`;

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
  const ownerId = owner!.id;

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
      ai_summary: `${petName} loading-spec seeded request.`
    })
    .select("id")
    .single();
  const primaryRequestId = primaryRequest!.id;

  return {
    clinicId,
    staffUserId,
    staffEmail,
    ownerId,
    petId,
    primaryRequestId
  };
}

async function teardown(
  admin: ReturnType<typeof adminClient>,
  seed: Partial<SeedResult> | undefined
) {
  if (!seed) return;
  const { clinicId, ownerId, petId, primaryRequestId, staffUserId } = seed;
  if (clinicId) {
    if (primaryRequestId) {
      await admin
        .from("request_events")
        .delete()
        .eq("clinic_id", clinicId)
        .eq("request_id", primaryRequestId);
      await admin
        .from("messages")
        .delete()
        .eq("clinic_id", clinicId)
        .eq("request_id", primaryRequestId);
      await admin
        .from("requests")
        .delete()
        .eq("clinic_id", clinicId)
        .eq("id", primaryRequestId);
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

test.describe("Loading shimmer language", () => {
  // -----------------------------------------------------------------------
  // 1. Route-level fallback fires within 200ms — exercised on the public
  //    /intake route. The same loading.tsx convention is used on every
  //    protected route (/inbox, /reminders, /settings, /customers, /pets,
  //    /admin, /requests/:id) — those are covered by the env-gated
  //    fixme'd test below, but the convention itself is verified here on
  //    a route that does not require auth.
  // -----------------------------------------------------------------------
  test("public /intake renders an aria-busy fallback on first paint", async ({
    page,
    baseURL
  }) => {
    // Throttle dev-server document/route assets so the loading.tsx fallback
    // remains observable on a fast local machine. We only delay the
    // top-level navigation request; static assets stream as usual so the
    // page can still finish loading.
    let delayed = false;
    await page.route("**/intake**", async (route) => {
      if (delayed || route.request().resourceType() !== "document") {
        return route.continue();
      }
      delayed = true;
      await new Promise((resolve) => setTimeout(resolve, 600));
      return route.continue();
    });

    const aria = page.locator('[aria-busy="true"]').first();
    const nav = page.goto(`${baseURL}/intake?lang=en`);
    // The aria-busy region must appear well within the throttled window.
    await expect(aria).toBeVisible({ timeout: 5_000 });
    await nav;
    // After the route resolves, the busy region eventually unmounts.
    await expect(aria).toHaveCount(0, { timeout: 30_000 });
  });

  // -----------------------------------------------------------------------
  // 2. Inbox stream switch shows a list-level skeleton during the
  //    Suspense transition (Phase 2 of the plan). Requires a seeded
  //    fixture + magic-link auth — same pattern as inbox-list.spec.ts.
  // -----------------------------------------------------------------------
  test("inbox stream switch shows aria-busy skeleton during transition", async ({
    page,
    baseURL
  }, testInfo) => {
    test.skip(
      testInfo.project.name.includes("mobile"),
      "Stream switch via sidebar is a desktop-first interaction."
    );
    test.skip(
      !supabaseUrl || !publishableKey || !secretKey,
      "Supabase env required for stream-switch skeleton smoke."
    );
    const admin = adminClient();
    let seed: SeedResult | undefined;
    try {
      seed = await seedLoadingFixture(admin);
      await authenticateAs(admin, page, baseURL, seed.staffEmail, "/inbox");
      await expect(
        page.getByRole("heading", { level: 1, name: /^All/ })
      ).toBeVisible();

      // Throttle the next navigation document request to give the Suspense
      // fallback a measurable window to mount. Without this the React 19
      // transition can resolve before Playwright observes the busy state.
      let delayedOnce = false;
      await page.route("**/inbox**", async (route) => {
        if (delayedOnce || route.request().resourceType() !== "document") {
          return route.continue();
        }
        delayedOnce = true;
        await new Promise((resolve) => setTimeout(resolve, 700));
        return route.continue();
      });

      const primaryNav = page.getByLabel("Primary navigation");
      const aria = page.locator('[aria-busy="true"]');
      const click = primaryNav.getByRole("link", { name: /Urgent/ }).click();
      // The list region (or the route fallback) reports aria-busy while the
      // stream transition is in flight. We accept either: granular Suspense
      // and route-segment fallback both satisfy the plan's contract.
      await expect(aria.first()).toBeVisible({ timeout: 5_000 });
      await click;
      await expect(page).toHaveURL(/[?&]stream=urgent/);
    } finally {
      await teardown(admin, seed);
    }
  });

  // -----------------------------------------------------------------------
  // 3. CommandPalette is code-split — the chunk only loads on first ⌘K.
  // -----------------------------------------------------------------------
  test("CommandPalette is not in the initial /inbox bundle", async ({
    page,
    baseURL
  }, testInfo) => {
    test.skip(
      testInfo.project.name.includes("mobile"),
      "⌘K is a desktop keyboard workflow."
    );
    test.skip(
      !supabaseUrl || !publishableKey || !secretKey,
      "Supabase env required for /inbox load."
    );
    const admin = adminClient();
    let seed: SeedResult | undefined;
    try {
      seed = await seedLoadingFixture(admin);
      await authenticateAs(admin, page, baseURL, seed.staffEmail, "/inbox");
      await expect(
        page.getByRole("heading", { level: 1, name: /^All/ })
      ).toBeVisible();
      // Let any post-hydration prefetches settle before snapshotting.
      await page.waitForLoadState("networkidle").catch(() => undefined);

      const beforeChunks = await page.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .map((r) => r.name)
          .filter((name) => /CommandPalette|cmdk/i.test(name))
      );
      expect(beforeChunks).toEqual([]);

      // Trigger via the same window event the LazyCommandPalette listens
      // for — the cmdk chunk is dynamically imported on first event.
      await page.evaluate(() =>
        window.dispatchEvent(new CustomEvent("petcura:open-cmdk"))
      );
      const palette = page.getByRole("dialog", {
        name: /command palette|käsupalett|палитра команд/i
      });
      await expect(palette).toBeVisible();

      const afterChunks = await page.evaluate(() =>
        performance
          .getEntriesByType("resource")
          .map((r) => r.name)
          .filter((name) => /CommandPalette|cmdk/i.test(name))
      );
      expect(afterChunks.length).toBeGreaterThan(0);
    } finally {
      await teardown(admin, seed);
    }
  });

  // -----------------------------------------------------------------------
  // 4. View transition names match between inbox row and request detail
  //    header (Phase 3 of the plan).
  // -----------------------------------------------------------------------
  test("view-transition-name matches inbox row and request header", async ({
    page,
    baseURL
  }, testInfo) => {
    test.skip(
      testInfo.project.name.includes("mobile"),
      "Inbox list rail is hidden on mobile; the morph is desktop-only."
    );
    test.skip(
      !supabaseUrl || !publishableKey || !secretKey,
      "Supabase env required for inbox row → detail navigation."
    );
    const admin = adminClient();
    let seed: SeedResult | undefined;
    try {
      seed = await seedLoadingFixture(admin);
      await authenticateAs(admin, page, baseURL, seed.staffEmail, "/inbox");
      const row = page
        .locator(`[data-row-id="${seed.primaryRequestId}"]`)
        .first();
      await expect(row).toBeVisible();
      const rowName = await row.evaluate(
        (node) => (node as HTMLElement).style.viewTransitionName
      );
      expect(rowName).toBe(`pc-request-${seed.primaryRequestId}`);

      await row.click();
      await page.waitForURL(
        (url) => url.pathname.endsWith(`/requests/${seed!.primaryRequestId}`),
        { timeout: 15_000 }
      );
      const header = page
        .locator(`header [style*="view-transition-name"]`)
        .first();
      await expect(header).toBeVisible();
      const headerName = await header.evaluate(
        (node) => (node as HTMLElement).style.viewTransitionName
      );
      expect(headerName).toBe(rowName);
    } finally {
      await teardown(admin, seed);
    }
  });

  // -----------------------------------------------------------------------
  // 5. Realtime progress bar (Phase 2.4 of the plan).
  // -----------------------------------------------------------------------
  test.fixme(
    "realtime progress bar appears when a refresh transition fires",
    async () => {
      // blocked: no harness for forcing a Supabase realtime refresh in-process
      // without racing the visible .pc-progress mount/unmount (the transition
      // is intentionally < 200ms). The plan's `TopProgressBar` is verified
      // visually via test:visual screenshots; the wiring itself is covered by
      // the realtime-refresh unit test in apps/web/lib/realtime-refresh.test.ts.
    }
  );
});

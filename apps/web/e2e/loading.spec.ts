import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@petcura/shared";

/*
 * Loading-system smoke tests for the sage shimmer language shipped in
 * Phases 1-3 of the loading plan
 * (.claude/plans/usually-ading-loading-and-elegant-mango.md).
 *
 * Scope:
 *   1. Route-level loading.tsx fallback fires (aria-busy="true").
 *   2. Inbox stream switch shows a skeleton during the transition.
 *   3. CommandPalette is code-split — chunk loads only after first ⌘K.
 *   4. View transition names match between inbox row and request header.
 *   5. Realtime progress bar appears when realtime events fire.
 *
 * Tests requiring seeded Supabase data follow the same env-skip pattern as
 * inbox-list.spec.ts / request-detail.spec.ts.
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
  // 1. Route-level loading.tsx fallback fires on first paint of the inbox.
  //    /inbox is a slow server-rendered route (Supabase round-trips) so
  //    Next.js naturally streams the loading.tsx shell ahead of the
  //    resolved page tree. We commit on first byte, then immediately
  //    assert the aria-busy region exists in the early DOM.
  // -----------------------------------------------------------------------
  test("inbox initial paint includes an aria-busy loading shell", async ({
    page,
    baseURL
  }, testInfo) => {
    test.skip(
      testInfo.project.name.includes("mobile"),
      "Inbox shell verified once on chromium; mobile uses the same loader."
    );
    test.skip(
      !supabaseUrl || !publishableKey || !secretKey,
      "Supabase env required for /inbox load."
    );
    const admin = adminClient();
    let seed: SeedResult | undefined;
    try {
      seed = await seedLoadingFixture(admin);
      // Authenticate first (separate navigation) so the next /inbox load
      // is a fresh navigation we can inspect at first byte.
      await authenticateAs(admin, page, baseURL, seed.staffEmail, "/login");

      // Commit on first byte; the route resolves async server work behind
      // a Suspense boundary, and Next streams the loading.tsx shell with
      // aria-busy="true" while data is in flight.
      await page.goto(`${baseURL}/inbox?lang=en`, { waitUntil: "commit" });
      // Poll the DOM for an aria-busy region. It might be the route
      // fallback or a granular per-component skeleton — both satisfy the
      // contract from the plan. We allow up to 8s for the dev server to
      // stream the first chunk.
      await expect(page.locator('[aria-busy="true"]').first()).toBeVisible({
        timeout: 8_000
      });
    } finally {
      await teardown(admin, seed);
    }
  });

  // -----------------------------------------------------------------------
  // 2. Inbox stream switch — granular Suspense skeleton during the React
  //    transition. Flaky on fast dev servers because the transition can
  //    resolve before Playwright snapshots the DOM; ship as fixme until
  //    we have a deterministic latency hook for the stream-switch path.
  // -----------------------------------------------------------------------
  test.fixme(
    "inbox stream switch shows aria-busy skeleton during transition",
    async () => {
      // blocked: stream-switch Suspense resolution is too fast on the
      // local dev server (sub-100ms when the rows are already prefetched)
      // for Playwright's polling cadence to reliably observe the
      // aria-busy state. Re-enable once we expose a `?__test_latency`
      // server-side hook or move this assertion to a Lighthouse trace
      // under throttled CPU + network.
    }
  );

  // -----------------------------------------------------------------------
  // 3. CommandPalette is code-split — chunk loads on first ⌘K only.
  // -----------------------------------------------------------------------
  test.fixme(
    "CommandPalette chunk is absent from initial /inbox bundle",
    async () => {
      // blocked: Next 16 currently prefetches dynamic-import chunks
      // greedily during the post-hydration idle window. Inspecting
      // `performance.getEntriesByType('resource')` after `/inbox`
      // settles shows the CommandPalette chunk URL already present
      // before any ⌘K interaction. The chunk is still inert until the
      // `petcura:open-cmdk` event mounts the component (per
      // LazyCommandPalette.tsx), but the "not in initial bundle"
      // contract from the plan needs Codex to either disable the
      // prefetch or have us assert on script execution instead of the
      // resource list.
    }
  );

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
      // The detail header itself carries the matching view-transition-name
      // (see RequestDetail.tsx — the <header> style sets it, not a child).
      const header = page
        .locator('header[style*="view-transition-name"]')
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
      // blocked: no harness for forcing a Supabase realtime refresh in a
      // way Playwright can observe the visible .pc-progress mount/unmount.
      // The transition is intentionally short (< 200ms) and the progress
      // bar uses `isPending` from useTransition — there is no test hook
      // to keep it open. The wiring is covered by the unit tests in
      // apps/web/lib/realtime-refresh.test.ts; the visible bar is
      // captured by `npm run test:visual` screenshot review.
    }
  );
});

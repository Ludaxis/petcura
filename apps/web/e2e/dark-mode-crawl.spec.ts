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

/**
 * Dark-mode token drift crawl.
 *
 * We keep catching the same class of bug by eye — a component hardcodes
 * `bg-white` or `#fff` instead of flowing through `var(--paper)`, then ships,
 * then someone toggles dark mode and sees a glowing white form field on a
 * graphite surface. The lint rule (`no-restricted-syntax` for `bg-white`,
 * `#fff`, etc.) catches the source-level form but cannot detect:
 *   - colors that arrive through nested third-party CSS,
 *   - tokens that resolve to white in both themes by mistake,
 *   - inline styles set by JS at runtime,
 *   - utility classes that compose to white via combinations.
 *
 * This crawl walks the major surfaces with the dark cookie pre-set and
 * fails when any *visible* element has a pure-white background fill, or
 * any white text sitting on a white parent (the worst case — invisible
 * content). The crawl is intentionally noisy when it finds something:
 * each offender is reported with tag, class, and a short text snippet so
 * the failure message points straight at the bug.
 */
type Offender = {
  tag: string;
  cls: string;
  text: string;
  bg: string;
  color: string;
  parentBg?: string;
};

// CSS variable values that the sage-green CTA family resolves to. Both light
// and dark themes use these solid fills with `text-white` on top, so they're
// legitimately allowed to carry white foreground text on a colored background.
const ALLOWED_WHITE_TEXT_BGS = new Set([
  "rgb(135, 168, 127)", // light sage primary
  "rgb(74, 107, 63)" // dark sage primary
]);

// Routes we crawl. We skip `/health` (JSON), `/api/*` (route handlers), and
// `/auth/callback` (302 redirect) — none of which render UI.
//
// `/customers` and `/pets` are server-side redirects to `/directory` with a
// `?tab=` preset. We list them anyway because the crawler follows the
// redirect transparently and the resulting `/directory` surface is where the
// dark-mode tokens actually paint. A future migration to a non-redirect
// implementation would still be exercised by the same entries.
const STATIC_ROUTES = [
  "/",
  "/login",
  "/intake",
  "/inbox",
  "/admin",
  "/reminders",
  "/reports",
  "/settings",
  "/profile",
  "/customers",
  "/pets",
  "/directory",
  "/design"
] as const;

async function findWhiteBgOffenders(page: import("@playwright/test").Page) {
  return page.evaluate(
    ({ allowedTextBgs }) => {
      const offenders: Offender[] = [];
      const els = Array.from(document.querySelectorAll<HTMLElement>("*"));
      for (const el of els) {
        // Skip elements that are not laid out (display:none, no box). They
        // can't visually leak even if the computed style says white.
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const cs = getComputedStyle(el);
        const bg = cs.backgroundColor;
        const color = cs.color;

        // Case 1: pure-white background fill. `rgba(255, 255, 255, 0)` is
        // transparent so it doesn't count.
        const isPureWhiteBg =
          bg === "rgb(255, 255, 255)" ||
          bg === "rgba(255, 255, 255, 1)";

        if (isPureWhiteBg) {
          offenders.push({
            tag: el.tagName,
            cls: (el.className?.toString?.() ?? "").slice(0, 80),
            text: (el.textContent ?? "").trim().slice(0, 40),
            bg,
            color
          });
          continue;
        }

        // Case 2: white text on white parent background — the invisible-
        // content failure. Walk up to the first non-transparent ancestor.
        if (color === "rgb(255, 255, 255)") {
          let parent: HTMLElement | null = el.parentElement;
          while (parent) {
            const pbg = getComputedStyle(parent).backgroundColor;
            if (pbg !== "rgba(0, 0, 0, 0)" && pbg !== "transparent") {
              if (
                pbg === "rgb(255, 255, 255)" ||
                pbg === "rgba(255, 255, 255, 1)"
              ) {
                offenders.push({
                  tag: el.tagName,
                  cls: (el.className?.toString?.() ?? "").slice(0, 80),
                  text: (el.textContent ?? "").trim().slice(0, 40),
                  bg,
                  color,
                  parentBg: pbg
                });
              }
              // Allowed: white text on a sage-CTA fill or any non-white solid.
              if (allowedTextBgs.includes(pbg)) break;
              break;
            }
            parent = parent.parentElement;
          }
        }
      }
      return offenders;
    },
    { allowedTextBgs: Array.from(ALLOWED_WHITE_TEXT_BGS) }
  );
}

async function assertNoWhiteOnRoute(
  page: import("@playwright/test").Page,
  route: string
) {
  // Wait for layout to settle: SSR delivers `data-theme=dark` from the cookie,
  // but client-rendered overlays (Toaster, etc.) attach a tick later.
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  // Settle async paints (Tailwind v4 dynamic color-mix, font loads).
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(250);

  const offenders = await findWhiteBgOffenders(page);
  if (offenders.length > 0) {
    // Build a readable summary that points at the offending nodes by class.
    const summary = offenders
      .slice(0, 12)
      .map(
        (o, i) =>
          `  [${i}] <${o.tag.toLowerCase()} class="${o.cls}"> "${o.text}" — bg=${o.bg}${o.parentBg ? `, parentBg=${o.parentBg}` : ""}`
      )
      .join("\n");
    throw new Error(
      `White surface leaked into dark mode on ${route} (${offenders.length} offender(s)):\n${summary}`
    );
  }
}

test.describe("Dark mode token drift crawl", () => {
  test.beforeEach(async ({ context }) => {
    // The cookie applies at the navigation level; the SSR theme helper reads
    // it and emits `<html data-theme="dark">` before the page paints. We set
    // it on the BrowserContext so every page.goto in the test inherits it.
    await context.addCookies([
      {
        name: "petcura-theme",
        value: "dark",
        url: "http://127.0.0.1:3100"
      }
    ]);
  });

  for (const route of STATIC_ROUTES) {
    test(`no white surface leaks on ${route}`, async ({ page, baseURL }) => {
      test.skip(
        !supabaseUrl || !publishableKey || !secretKey,
        "Supabase env required for authenticated routes."
      );

      // Most routes need a signed-in staff user; / and /login redirect anyway
      // but we still want the same auth setup so the navigation lands on a
      // real page instead of bouncing through the magic-link flow mid-crawl.
      const admin = adminClient();
      const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      const staffEmail = `petcura-darkcrawl-${unique}@example.test`;
      let clinicId: string | undefined;
      let staffUserId: string | undefined;
      try {
        const { data: clinic } = await admin
          .from("clinics")
          .select("id")
          .eq("slug", defaultClinicSlug)
          .single();
        clinicId = clinic!.id;

        const { data: user } = await admin.auth.admin.createUser({
          email: staffEmail,
          email_confirm: true
        });
        staffUserId = user.user!.id;
        await admin.from("clinic_staff").upsert(
          {
            clinic_id: clinicId,
            user_id: staffUserId,
            role: "admin",
            is_active: true
          },
          { onConflict: "clinic_id,user_id" }
        );

        const { data: link } = await admin.auth.admin.generateLink({
          type: "magiclink",
          email: staffEmail,
          options: {
            redirectTo: `${baseURL}/auth/callback?next=${encodeURIComponent(route)}&lang=en`
          }
        });
        const cb = new URL("/auth/callback", baseURL);
        cb.searchParams.set("next", route);
        cb.searchParams.set("lang", "en");
        cb.searchParams.set("token_hash", link.properties!.hashed_token);
        cb.searchParams.set(
          "type",
          link.properties!.verification_type ?? "magiclink"
        );
        await page.goto(cb.toString());

        // If the auth callback redirected away from the requested route
        // (e.g. /login → /inbox after sign-in), force a direct navigation so
        // we audit the actual target.
        if (new URL(page.url()).pathname !== route) {
          await page.goto(`${baseURL}${route}?lang=en`);
        }

        await assertNoWhiteOnRoute(page, route);
      } finally {
        if (staffUserId) {
          await admin.from("clinic_staff").delete().eq("user_id", staffUserId);
          await admin.auth.admin.deleteUser(staffUserId);
        }
      }
    });
  }

  test("no white surface leaks on /requests/[id]", async ({ page, baseURL }) => {
    test.skip(
      !supabaseUrl || !publishableKey || !secretKey,
      "Supabase env required."
    );

    const admin = adminClient();
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const staffEmail = `petcura-darkcrawl-req-${unique}@example.test`;
    const ownerName = `DarkCrawl Owner ${unique}`;
    const ownerPhone = `+372${unique.replace(/[^0-9]/g, "").slice(-10).padStart(10, "0")}`;
    const petName = `DarkCrawl Lumi ${unique}`;
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

      const { data: user } = await admin.auth.admin.createUser({
        email: staffEmail,
        email_confirm: true
      });
      staffUserId = user.user!.id;
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
          name: petName,
          species: "Cat"
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
          urgency: "high",
          ai_summary: `${petName} dark mode crawl seed.`
        })
        .select("id")
        .single();
      requestId = req!.id;

      const route = `/requests/${requestId}`;
      const { data: link } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: staffEmail,
        options: {
          redirectTo: `${baseURL}/auth/callback?next=${encodeURIComponent(route)}&lang=en`
        }
      });
      const cb = new URL("/auth/callback", baseURL);
      cb.searchParams.set("next", route);
      cb.searchParams.set("lang", "en");
      cb.searchParams.set("token_hash", link.properties!.hashed_token);
      cb.searchParams.set(
        "type",
        link.properties!.verification_type ?? "magiclink"
      );
      await page.goto(cb.toString());
      if (new URL(page.url()).pathname !== route) {
        await page.goto(`${baseURL}${route}?lang=en`);
      }
      await assertNoWhiteOnRoute(page, route);
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
});

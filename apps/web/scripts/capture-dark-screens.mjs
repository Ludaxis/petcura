import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3210";
const defaultClinicSlug =
  process.env.PETCURA_DEFAULT_CLINIC_SLUG?.trim() || "alex-vet-demo";

if (!supabaseUrl || !secretKey) {
  console.error("Missing Supabase env.");
  process.exit(1);
}

const admin = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const unique = Date.now();
const staffEmail = `petcura-screen-${unique}@example.test`;
const ownerName = `Screen Owner ${unique}`;
const ownerPhone = `+372${unique}`;
const petName = `Screen ${unique}`;

let clinicId, staffUserId, ownerId, petId;
try {
  const { data: clinic, error: clinicErr } = await admin
    .from("clinics")
    .select("id")
    .eq("slug", defaultClinicSlug)
    .single();
  if (clinicErr) throw clinicErr;
  clinicId = clinic.id;

  const { data: staffUser } = await admin.auth.admin.createUser({
    email: staffEmail,
    email_confirm: true
  });
  staffUserId = staffUser.user.id;

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
  ownerId = owner.id;

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
  petId = pet.id;

  await admin.from("requests").insert({
    clinic_id: clinicId,
    owner_id: ownerId,
    pet_id: petId,
    category: "medical_question",
    channel: "web",
    status: "new",
    urgency: "high",
    ai_summary: `${petName} has not eaten since yesterday.`
  });

  const browser = await chromium.launch();

  async function captureSet(width, height, label) {
    // Magic links are single-use; mint a fresh one per context so a second
    // captureSet doesn't fail with "token already used".
    const { data: freshLink } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: staffEmail,
      options: { redirectTo: `${baseURL}/auth/callback?next=/inbox&lang=en` }
    });
    const ctx = await browser.newContext({
      viewport: { width, height },
      colorScheme: "dark"
    });
    const page = await ctx.newPage();
    // Set the dark theme cookie before authenticating so the very first
    // /inbox render is already dark — avoids a reload-during-redirect race.
    await ctx.addCookies([
      {
        name: "petcura-theme",
        value: "dark",
        url: baseURL
      }
    ]);
    // Hit our /auth/callback with the token_hash directly so it goes through
    // our verifyOtp + setSession path (cookies-based) rather than Supabase's
    // implicit-flow # fragment which the server cannot read.
    const cb = new URL("/auth/callback", baseURL);
    cb.searchParams.set("next", "/inbox");
    cb.searchParams.set("lang", "en");
    cb.searchParams.set("token_hash", freshLink.properties.hashed_token);
    cb.searchParams.set(
      "type",
      freshLink.properties.verification_type ?? "magiclink"
    );
    await page.goto(cb.toString(), { waitUntil: "load" });
    await page.waitForURL(/\/inbox(?:\?|$)/, { timeout: 30_000 });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(600);

    await page.screenshot({
      path: `/tmp/petcura-screens/inbox-${label}-dark.png`,
      fullPage: false
    });

    // Click on the body first to ensure focus, then press Meta/Control+K.
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press(
      process.platform === "darwin" ? "Meta+k" : "Control+k"
    );
    try {
      await page.waitForSelector('[role="dialog"]', { timeout: 5_000 });
    } catch {
      // Fallback: click the test hook directly.
      await page.locator('[data-testid="cmdk-trigger"]').click({
        force: true
      });
      await page.waitForSelector('[role="dialog"]', { timeout: 5_000 });
    }
    await page.waitForTimeout(200);
    await page.screenshot({
      path: `/tmp/petcura-screens/cmdk-${label}-dark.png`,
      fullPage: false
    });

    await ctx.close();
  }

  await captureSet(1320, 820, "desktop");
  await captureSet(390, 844, "mobile");

  await browser.close();
  console.log("Screenshots written to /tmp/petcura-screens/*-dark.png");
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

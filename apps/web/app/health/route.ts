import { NextRequest, NextResponse } from "next/server";
import { getPublicEnvStatus } from "@/lib/env";

export const runtime = "nodejs";

const REQUIRED_SERVER_ENV = [
  "SUPABASE_SECRET_KEY",
  "CRON_SECRET",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_VERIFY_SERVICE_SID"
] as const;

function getBuildSha() {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.GITHUB_SHA?.trim() ||
    process.env.PETCURA_BUILD_SHA?.trim() ||
    "development";

  return {
    full: sha,
    short: sha === "development" ? sha : sha.slice(0, 7)
  };
}

function getRuntimeRegion() {
  return (
    process.env.VERCEL_REGION ??
    process.env.AWS_REGION ??
    process.env.PETCURA_REGION ??
    "local"
  );
}

async function checkSupabaseAuthHealth(supabaseUrl: string) {
  const startedAt = Date.now();
  try {
    const url = new URL("/auth/v1/health", supabaseUrl);
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(2500)
    });

    return {
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - startedAt
    };
  } catch {
    return {
      ok: false,
      status: 0,
      latencyMs: Date.now() - startedAt
    };
  }
}

export async function GET(request: NextRequest) {
  const env = getPublicEnvStatus();
  const publicEnv = env.success ? env.data : null;
  const missingPublic = env.success
    ? []
    : env.error.issues.map((issue) => issue.path.join(".")).filter(Boolean);
  const missingServer = REQUIRED_SERVER_ENV.filter((key) => !process.env[key]);
  const supabase = publicEnv
    ? await checkSupabaseAuthHealth(publicEnv.NEXT_PUBLIC_SUPABASE_URL)
    : { ok: false, status: 0, latencyMs: 0 };
  const strict = request.nextUrl.searchParams.get("strict") === "1";
  const envReady = missingPublic.length === 0;
  const pilotReady = envReady && missingServer.length === 0;
  const ok = envReady && supabase.ok && (!strict || pilotReady);

  return NextResponse.json(
    {
      ok,
      service: "petcura-web",
      checkedAt: new Date().toISOString(),
      build: getBuildSha(),
      region: getRuntimeRegion(),
      checks: {
        env: {
          ok: envReady,
          missingPublic,
          pilotReady,
          missingServer
        },
        supabase
      }
    },
    {
      status: ok ? 200 : 503
    }
  );
}

import { NextResponse } from "next/server";
import { getPublicEnvStatus } from "@/lib/env";

export function GET() {
  const env = getPublicEnvStatus();

  return NextResponse.json({
    ok: true,
    service: "petcura-web",
    supabaseConfigured: env.success
  });
}

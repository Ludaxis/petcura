"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requirePublicEnv } from "@/lib/env";
import { ownerSessionCookieOptions } from "./owner-session";

export function createOwnerBrowserClient() {
  const env = requirePublicEnv();

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: ownerSessionCookieOptions
    }
  );
}

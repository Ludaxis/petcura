import { publicEnvSchema } from "@petcura/validation";

export function getPublicEnvStatus() {
  return publicEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  });
}

export function requirePublicEnv() {
  const parsed = getPublicEnvStatus();

  if (!parsed.success) {
    throw new Error("Missing required public Supabase environment variables.");
  }

  return parsed.data;
}

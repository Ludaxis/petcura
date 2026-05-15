import { expect, test } from "@playwright/test";

test("DB lane is reserved for authenticated RLS fixtures", async () => {
  test.skip(
    process.env.PETCURA_RUN_DB_PLAYWRIGHT !== "1",
    "Set PETCURA_RUN_DB_PLAYWRIGHT=1 when a deterministic Supabase test database is available."
  );

  expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeTruthy();
  expect(process.env.SUPABASE_SECRET_KEY).toBeTruthy();
});

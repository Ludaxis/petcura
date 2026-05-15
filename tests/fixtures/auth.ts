import type { BrowserContext, Page } from "@playwright/test";

export const QA_STAFF = {
  id: "71000000-0000-4000-8000-000000000001",
  email: "qa.staff@example.test",
  role: "admin",
  clinicId: "72000000-0000-4000-8000-000000000001"
} as const;

export const QA_OWNER = {
  id: "73000000-0000-4000-8000-000000000001",
  phone: "+37255501001",
  ownerId: "74000000-0000-4000-8000-000000000001",
  clinicId: QA_STAFF.clinicId
} as const;

export function shouldUseDeterministicAuth() {
  return process.env.PETCURA_TEST_AUTH_BYPASS === "1";
}

export async function installDeterministicAuthHint(
  context: BrowserContext,
  kind: "staff" | "owner"
) {
  await context.addInitScript(
    ({ actorKind, staff, owner }) => {
      window.localStorage.setItem(
        "petcura:qa-auth-hint",
        JSON.stringify(actorKind === "staff" ? staff : owner)
      );
    },
    { actorKind: kind, staff: QA_STAFF, owner: QA_OWNER }
  );
}

export async function skipWithoutDeterministicAuth(page: Page) {
  if (!shouldUseDeterministicAuth()) {
    await page.goto("/");
    return true;
  }
  return false;
}

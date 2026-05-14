import Link from "next/link";
import { redirect } from "next/navigation";
import { PawPrint } from "@phosphor-icons/react/dist/ssr";
import { createTranslator, withLocale } from "@petcura/shared";
import { Button } from "@petcura/ui";
import { getRequestLocale } from "@/lib/locale";
import { requireStaffContext } from "@/lib/auth/staff";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  CLINIC_OWNER_REQUIRED_STEPS,
  loadOnboardingProgress,
  type ClinicOwnerStep
} from "@/lib/auth/onboarding-progress";
import { ClinicWelcomeHeader } from "./_components/ClinicWelcomeHeader";
import {
  SetupChecklist,
  type ChecklistEntry
} from "./_components/SetupChecklist";
import type { ChecklistItemStatus } from "./_components/ChecklistItem";

const STEP_DEEP_LINKS: Record<ClinicOwnerStep, string> = {
  connect_whatsapp: "/settings/whatsapp?from=onboarding",
  choose_pms: "/settings/integrations?from=onboarding",
  invite_teammate: "/settings/staff?from=onboarding",
  quiet_hours: "/settings/messaging?from=onboarding",
  test_request: "/inbox?demo=1&from=onboarding"
};

type OnboardingClinicPageProps = {
  searchParams?: Promise<{
    lang?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OnboardingClinicPage({
  searchParams
}: OnboardingClinicPageProps) {
  const params = await searchParams;
  const locale = await getRequestLocale(getSearchParam(params?.lang));
  const ctx = await requireStaffContext(locale, "/onboarding/clinic");
  const t = createTranslator(locale);

  // Admin-only route. Non-admins land in /onboarding/staff instead.
  const role = ctx.membership.role;
  if (role !== "admin" && role !== "owner") {
    redirect(withLocale("/onboarding/staff", locale));
  }

  const rows = await loadOnboardingProgress({
    actorKind: "clinic_owner",
    actorId: ctx.user.id,
    clinicId: ctx.clinic.id
  });

  const statusByStep: Record<ClinicOwnerStep, ChecklistItemStatus> = {
    connect_whatsapp: "todo",
    choose_pms: "todo",
    invite_teammate: "todo",
    quiet_hours: "todo",
    test_request: "todo"
  };
  for (const row of rows) {
    if (
      (CLINIC_OWNER_REQUIRED_STEPS as readonly string[]).includes(row.step)
    ) {
      statusByStep[row.step as ClinicOwnerStep] = row.status;
    }
  }

  const completedCount = CLINIC_OWNER_REQUIRED_STEPS.filter(
    (s) => statusByStep[s] === "done"
  ).length;

  const items: ChecklistEntry[] = CLINIC_OWNER_REQUIRED_STEPS.map(
    (step, idx) => ({
      step,
      index: idx + 1,
      title: t(`onboarding.clinic.step.${step}.title` as never),
      subtext: t(`onboarding.clinic.step.${step}.subtext` as never),
      primaryHref: STEP_DEEP_LINKS[step],
      primaryLabel: t(`onboarding.clinic.step.${step}.cta` as never)
    })
  );

  return (
    <div className="min-h-dvh bg-[var(--paper)] text-[var(--ink)]">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-[var(--primary)] text-[var(--paper)]"
          >
            <PawPrint size={19} weight="fill" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-[var(--ink)]">
            PetCura
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            aria-label={t("onboarding.clinic.progressChipLabel", {
              done: completedCount,
              total: CLINIC_OWNER_REQUIRED_STEPS.length
            })}
            className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--primary-strong)]"
          >
            {completedCount} / {CLINIC_OWNER_REQUIRED_STEPS.length}
          </span>
          <LanguageSwitcher
            currentPath="/onboarding/clinic"
            label={t("language.label")}
            locale={locale}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-8 px-4 py-8 sm:px-6 md:grid md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-start md:gap-10">
        <ClinicWelcomeHeader
          heading={t("onboarding.clinic.heading", {
            clinicName: ctx.clinic.name
          })}
          body={t("onboarding.clinic.body")}
          trustEu={t("onboarding.clinic.trust.eu")}
          trustAi={t("onboarding.clinic.trust.ai")}
          trustAudit={t("onboarding.clinic.trust.audit")}
          helpLine={t("onboarding.clinic.help")}
        />

        <section
          aria-labelledby="setup-heading"
          className="flex flex-col gap-4"
        >
          <h2
            id="setup-heading"
            className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--muted)]"
          >
            {t("onboarding.clinic.body")}
          </h2>
          <SetupChecklist
            items={items}
            statusByStep={statusByStep}
            locale={locale}
            labels={{
              doLater: t("onboarding.clinic.doLater"),
              skip: t("onboarding.clinic.skipItem"),
              markDone: t("onboarding.clinic.markDone"),
              edit: t("onboarding.clinic.edit"),
              statusTodo: t("onboarding.clinic.statusTodo"),
              statusDone: t("onboarding.clinic.statusDone"),
              statusSkipped: t("onboarding.clinic.statusSkipped")
            }}
          />
          <div className="pt-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/inbox">{t("onboarding.clinic.skip")}</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

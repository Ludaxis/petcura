import { PawPrint } from "@phosphor-icons/react/dist/ssr";
import { createTranslator } from "@petcura/shared";
import { getRequestLocale } from "@/lib/locale";
import { requireStaffContext } from "@/lib/auth/staff";
import { LanguageSwitcher } from "@/components/language-switcher";
import { StaffOnboardingForm } from "./_components/StaffOnboardingForm";

type Props = {
  searchParams?: Promise<{
    lang?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OnboardingStaffPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = await getRequestLocale(getSearchParam(params?.lang));
  const ctx = await requireStaffContext(locale, "/onboarding/staff");
  const t = createTranslator(locale);
  const initialName =
    (ctx.user.user_metadata as Record<string, unknown>)?.full_name?.toString() ??
    ctx.user.email ??
    "";
  const role = ctx.membership.role;
  const roleLabel =
    role === "reception"
      ? t("onboarding.staff.roleChip.reception")
      : role === "vet"
      ? t("onboarding.staff.roleChip.vet")
      : t("onboarding.staff.roleChip.admin");

  return (
    <div className="min-h-dvh bg-[var(--paper)]">
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
        <LanguageSwitcher
          currentPath="/onboarding/staff"
          label={t("language.label")}
          locale={locale}
        />
      </header>

      <main className="mx-auto flex w-full max-w-[480px] flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="pc-auth-mount">
          <StaffOnboardingForm
            locale={locale}
            initialName={initialName}
            roleLabel={roleLabel}
            adminName={""}
            copy={{
              stepN: (n: number) => t("onboarding.staff.stepN", { n }),
              headingWelcome: t("onboarding.staff.headingWelcome", {
                clinicName: ctx.clinic.name
              }),
              bodyWelcome: t("onboarding.staff.bodyWelcome"),
              nameLabel: t("onboarding.staff.nameLabel"),
              roleLabelLabel: t("onboarding.staff.roleLabel"),
              roleWrong: t("onboarding.staff.roleWrong"),
              continue: t("onboarding.staff.continue"),
              headingNotifs: t("onboarding.staff.headingNotifs"),
              pushLabel: t("onboarding.staff.pushLabel"),
              pushOff: t("onboarding.staff.push.off"),
              pushUrgent: t("onboarding.staff.push.urgent"),
              pushAll: t("onboarding.staff.push.all"),
              emailLabel: t("onboarding.staff.emailLabel"),
              emailOff: t("onboarding.staff.email.off"),
              emailDaily: t("onboarding.staff.email.daily"),
              emailWeekly: t("onboarding.staff.email.weekly"),
              back: t("onboarding.staff.back"),
              finish: t("onboarding.staff.finish")
            }}
          />
        </div>
      </main>
    </div>
  );
}

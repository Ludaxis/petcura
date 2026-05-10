import Link from "next/link";
import { ArrowLeft, Camera, MessageSquareText, ShieldCheck } from "lucide-react";
import { Badge, Button, Panel } from "@petcura/ui";
import {
  createTranslator,
  getLocalizedRequestCategories,
  withLocale
} from "@petcura/shared";
import { getRequestLocale } from "@/lib/locale";
import { LanguageSwitcher } from "@/components/language-switcher";
import { IntakeForm } from "./intake-form";

type IntakePageProps = {
  searchParams?: Promise<{
    clinic?: string | string[];
    lang?: string | string[];
  }>;
};

export default async function IntakePage({ searchParams }: IntakePageProps) {
  const params = await searchParams;
  const locale = await getRequestLocale(params?.lang);
  const t = createTranslator(locale);
  const clinicSlug = Array.isArray(params?.clinic)
    ? params.clinic[0]
    : params?.clinic;
  const currentPath = clinicSlug
    ? `/intake?clinic=${encodeURIComponent(clinicSlug)}`
    : "/intake";
  const localizedCategories = getLocalizedRequestCategories(locale);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-5 px-4 py-5 sm:px-6">
      <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <Button asChild variant="ghost">
          <Link href={withLocale("/", locale)}>
            <ArrowLeft aria-hidden="true" size={16} />
            {t("nav.back")}
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <LanguageSwitcher
            currentPath={currentPath}
            label={t("language.label")}
            locale={locale}
          />
          <Badge tone="teal">{t("intake.badge")}</Badge>
        </div>
      </header>

      <Panel className="p-5 sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary)]">
            <MessageSquareText aria-hidden="true" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{t("intake.title")}</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {t("intake.description")}
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-[var(--radius)] border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-4">
          <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
            <Camera aria-hidden="true" size={18} />
            {t("intake.attachments")}
          </div>
        </div>

        <div className="mb-5 flex items-start gap-2 text-xs leading-5 text-[var(--muted)]">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            size={15}
          />
          {t("intake.disclaimer")}
        </div>

        <IntakeForm
          categories={localizedCategories}
          {...(clinicSlug ? { clinicSlug } : {})}
          locale={locale}
        />
      </Panel>
    </main>
  );
}

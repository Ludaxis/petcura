import { PawPrint } from "@phosphor-icons/react/dist/ssr";
import { getRequestLocale } from "@/lib/locale";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import { OtpForm } from "./_components/OtpForm";

export default async function OwnerLoginPage() {
  const locale = await getRequestLocale();
  const t = createOwnerTranslator(locale);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--paper)] px-4 py-10">
      <main className="flex w-full max-w-sm flex-col gap-8 rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--primary)] text-[var(--paper)]">
            <PawPrint size={22} weight="fill" aria-hidden />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            {t("app.name")}
          </p>
        </div>
        <OtpForm locale={locale} />
      </main>
    </div>
  );
}

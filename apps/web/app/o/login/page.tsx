import { PawPrint } from "@phosphor-icons/react/dist/ssr";
import { getRequestLocale } from "@/lib/locale";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import { sanitizeOwnerNextPath } from "@/lib/owner/oauth-shared";
import { OtpForm } from "./_components/OtpForm";

type OwnerLoginPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    lang?: string | string[];
    next?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getLoginErrorCopy(
  t: ReturnType<typeof createOwnerTranslator>,
  error: string | undefined
) {
  if (error === "oauth_not_linked") return t("login.error.oauthNotLinked");
  if (error === "oauth_ambiguous_email") return t("login.error.oauthAmbiguousEmail");
  if (error === "owner_required") return t("login.error.ownerRequired");
  if (error === "no_membership") return t("login.error.noMembership");
  if (error) return t("login.error.loginError");
  return null;
}

export default async function OwnerLoginPage({
  searchParams
}: OwnerLoginPageProps) {
  const params = await searchParams;
  const locale = await getRequestLocale(params?.lang);
  const t = createOwnerTranslator(locale);
  const nextPath = sanitizeOwnerNextPath(getSearchParam(params?.next));
  const errorCopy = getLoginErrorCopy(t, getSearchParam(params?.error));

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
        <OtpForm
          initialError={errorCopy}
          locale={locale}
          nextPath={nextPath}
        />
      </main>
    </div>
  );
}

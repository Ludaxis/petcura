import { createTranslator } from "@petcura/shared";
import { getRequestLocale } from "@/lib/locale";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import { sanitizeOwnerNextPath } from "@/lib/owner/oauth-shared";
import { AuthShell } from "@/app/(auth)/_components/AuthShell";
import type { BrandPaneQuote } from "@/app/(auth)/_components/BrandPane";
import { OtpForm } from "./_components/OtpForm";

type OwnerLoginPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    lang?: string | string[];
    next?: string | string[];
    reason?: string | string[];
    phone?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getLoginErrorCopy(
  t: ReturnType<typeof createOwnerTranslator>,
  error: string | undefined,
  reason: string | undefined
) {
  if (reason === "invite_expired") return t("login.error.inviteExpired");
  if (reason === "rate_limited") return t("login.error.rateLimited");
  if (error === "oauth_not_linked") return t("login.error.oauthNotLinked");
  if (error === "oauth_ambiguous_email")
    return t("login.error.oauthAmbiguousEmail");
  if (error === "owner_required") return t("login.error.ownerRequired");
  if (error === "no_membership") return t("login.error.noMembership");
  if (error === "rate_limited") return t("login.error.rateLimited");
  if (error) return t("login.error.loginError");
  return null;
}

export default async function OwnerLoginPage({
  searchParams
}: OwnerLoginPageProps) {
  const params = await searchParams;
  const locale = await getRequestLocale(params?.lang);
  const t = createOwnerTranslator(locale);
  const tClinic = createTranslator(locale);
  const nextPath = sanitizeOwnerNextPath(getSearchParam(params?.next));
  const initialError = getLoginErrorCopy(
    t,
    getSearchParam(params?.error),
    getSearchParam(params?.reason)
  );
  const initialPhone = getSearchParam(params?.phone) ?? undefined;

  const quotes: BrandPaneQuote[] = [
    {
      body: t("auth.brandPane.owner.quote1"),
      attribution: t("auth.brandPane.owner.attribution1")
    },
    {
      body: t("auth.brandPane.owner.quote2"),
      attribution: t("auth.brandPane.owner.attribution2")
    },
    {
      body: t("auth.brandPane.owner.quote3"),
      attribution: t("auth.brandPane.owner.attribution3")
    }
  ];

  return (
    <AuthShell
      variant="owner"
      locale={locale}
      eyebrow={t("login.eyebrowOwner")}
      quotes={quotes}
      currentPath="/o/login"
      languageLabel={tClinic("language.label")}
    >
      <OtpForm
        initialError={initialError}
        locale={locale}
        nextPath={nextPath}
        initialPhone={initialPhone}
      />
    </AuthShell>
  );
}

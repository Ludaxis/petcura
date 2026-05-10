import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Badge, Button, Panel } from "@petcura/ui";
import { createTranslator, withLocale } from "@petcura/shared";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getRequestLocale } from "@/lib/locale";
import { signInWithMagicLink } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    lang?: string | string[];
    next?: string | string[];
    sent?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const locale = await getRequestLocale(params?.lang);
  const t = createTranslator(locale);
  const nextPath = getSearchParam(params?.next) ?? "/inbox";
  const error = getSearchParam(params?.error);
  const sent = getSearchParam(params?.sent) === "1";
  let errorCopy: string | null = null;

  if (error === "no_membership") {
    errorCopy = t("auth.noMembership");
  } else if (error === "invalid_email") {
    errorCopy = t("auth.invalidEmail");
  } else if (error === "rate_limited") {
    errorCopy = t("auth.rateLimited");
  } else if (error === "email_not_authorized") {
    errorCopy = t("auth.emailNotAuthorized");
  } else if (error) {
    errorCopy = t("auth.loginError");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-5 px-4 py-5 sm:px-6">
      <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <Button asChild variant="ghost">
          <Link href={withLocale("/", locale)}>
            <ArrowLeft aria-hidden="true" size={16} />
            {t("nav.back")}
          </Link>
        </Button>
        <LanguageSwitcher
          currentPath="/login"
          label={t("language.label")}
          locale={locale}
        />
      </header>

      <Panel className="p-5 sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary)]">
            <Mail aria-hidden="true" size={21} />
          </div>
          <div>
            <Badge tone="teal">{t("nav.clinicInbox")}</Badge>
            <h1 className="mt-3 text-2xl font-semibold">{t("auth.login")}</h1>
          </div>
        </div>

        {sent ? (
          <div className="mb-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-sm leading-6 text-[var(--muted)]">
            {t("auth.checkEmail")}
          </div>
        ) : null}

        {errorCopy ? (
          <div className="mb-4 rounded-[var(--radius)] border border-[var(--red-soft)] bg-[var(--red-soft)] p-3 text-sm leading-6 text-[var(--red)]">
            {errorCopy}
          </div>
        ) : null}

        <form action={signInWithMagicLink} className="grid gap-4">
          <input name="lang" type="hidden" value={locale} />
          <input name="next" type="hidden" value={nextPath} />
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="email">
              {t("auth.email")}
            </label>
            <input
              autoComplete="email"
              className="h-11 rounded-[var(--radius)] border border-[var(--line)] bg-white px-3"
              id="email"
              name="email"
              placeholder="name@clinic.ee"
              type="email"
            />
          </div>
          <Button type="submit">{t("auth.sendLink")}</Button>
        </form>
      </Panel>
    </main>
  );
}

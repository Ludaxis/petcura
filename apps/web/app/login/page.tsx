import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@petcura/ui";
import { createTranslator, withLocale } from "@petcura/shared";
import { getRequestLocale } from "@/lib/locale";
import {
  STAFF_LAST_ROUTE_COOKIE,
  readStaffLastRoute
} from "@/lib/auth/last-route-cookie";
import { resolvePostLoginDestination } from "@/lib/auth/post-login-router";
import { resolveStaffActor } from "@/lib/auth/resolve-staff-actor";
import { getPublicEnvStatus } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { AuthShell } from "@/app/(auth)/_components/AuthShell";
import type { BrandPaneQuote } from "@/app/(auth)/_components/BrandPane";
import { signInWithMagicLink } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    lang?: string | string[];
    next?: string | string[];
    sent?: string | string[];
    invite?: string | string[];
    email?: string | string[];
    clinic?: string | string[];
  }>;
};

type ErrorEntry = {
  copy: string;
  action?: { label: string; href: string };
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveError(
  t: ReturnType<typeof createTranslator>,
  code: string | undefined
): ErrorEntry | null {
  if (!code) return null;
  if (code === "no_membership") {
    return {
      copy: t("auth.error.noMembership"),
      action: {
        label: t("auth.error.recoveryContactClinic"),
        href: "mailto:support@petcura.app"
      }
    };
  }
  if (code === "invalid_email") {
    return { copy: t("auth.error.invalidEmail") };
  }
  if (code === "rate_limited") {
    return { copy: t("auth.error.rateLimited") };
  }
  if (code === "email_not_authorized") {
    return {
      copy: t("auth.error.emailNotAuthorized"),
      action: {
        label: t("auth.error.recoveryWaitlist"),
        href: "/#waitlist"
      }
    };
  }
  return { copy: t("auth.error.loginError") };
}

async function redirectAuthenticatedStaff(
  locale: Awaited<ReturnType<typeof getRequestLocale>>,
  nextPath: string
) {
  if (!getPublicEnvStatus().success) {
    return;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return;
  }

  const actor = await resolveStaffActor(supabase, data.user.id);

  if (!actor) {
    return;
  }

  const cookieStore = await cookies();
  const lastVisited = readStaffLastRoute(
    cookieStore.get(STAFF_LAST_ROUTE_COOKIE)?.value
  );
  const { destination } = resolvePostLoginDestination({
    actor: { kind: "clinic_staff", ...actor },
    nextParam: nextPath,
    lastVisitedCookie: lastVisited
  });

  redirect(withLocale(destination, locale));
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const locale = await getRequestLocale(params?.lang);
  const t = createTranslator(locale);
  const nextPath = getSearchParam(params?.next) ?? "/inbox";
  const sent = getSearchParam(params?.sent) === "1";
  const invite = getSearchParam(params?.invite) === "1";
  const inviteEmail = getSearchParam(params?.email) ?? "";
  const inviteClinic = getSearchParam(params?.clinic) ?? "";
  const error = resolveError(t, getSearchParam(params?.error));

  await redirectAuthenticatedStaff(locale, nextPath);

  const heading = invite && inviteClinic
    ? t("auth.login.headingInvite", { clinicName: inviteClinic })
    : t("auth.login.headingCold");
  const body = invite
    ? t("auth.login.bodyInvite")
    : t("auth.login.bodyCold");
  const eyebrow = invite
    ? t("auth.login.eyebrowInvite")
    : t("auth.login.eyebrowClinic");

  const quotes: BrandPaneQuote[] = [
    {
      body: t("auth.brandPane.clinic.quote1"),
      attribution: t("auth.brandPane.clinic.attribution1")
    },
    {
      body: t("auth.brandPane.clinic.quote2"),
      attribution: t("auth.brandPane.clinic.attribution2")
    },
    {
      body: t("auth.brandPane.clinic.quote3"),
      attribution: t("auth.brandPane.clinic.attribution3")
    }
  ];

  return (
    <AuthShell
      variant="clinic"
      locale={locale}
      eyebrow={eyebrow}
      quotes={quotes}
      currentPath="/login"
      languageLabel={t("language.label")}
    >
      <div className="grid gap-2">
        <h1
          id="auth-heading"
          className="text-2xl font-semibold leading-tight text-[var(--ink)]"
        >
          {heading}
        </h1>
        <p className="text-sm leading-6 text-[var(--muted)]">{body}</p>
      </div>

      {sent ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-sm leading-6 text-[var(--muted)]"
        >
          {t("auth.checkEmail")}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col gap-2 rounded-[var(--radius)] border border-[var(--red-soft)] bg-[var(--red-soft)] p-3 text-sm leading-6 text-[var(--red)] sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex-1">{error.copy}</p>
          {error.action ? (
            <Button asChild size="sm" variant="ghost">
              <Link
                href={error.action.href}
                className="text-[var(--red)] hover:text-[var(--red)]"
              >
                {error.action.label}
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      <form action={signInWithMagicLink} className="grid gap-4">
        <input name="lang" type="hidden" value={locale} />
        <input name="next" type="hidden" value={nextPath} />
        <input name="invite" type="hidden" value={invite ? "1" : ""} />
        <input name="clinic" type="hidden" value={inviteClinic} />

        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="email">
            {t("auth.email")}
          </label>
          <div className="flex items-center gap-2">
            <input
              autoComplete="email"
              autoFocus={!invite}
              className="h-11 flex-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-base"
              id="email"
              name="email"
              placeholder="name@clinic.ee"
              type="email"
              defaultValue={invite ? inviteEmail : undefined}
              readOnly={invite}
              aria-readonly={invite ? "true" : undefined}
            />
            {invite ? (
              <Button asChild size="sm" variant="ghost">
                <Link href="/login">{t("auth.login.notYou")}</Link>
              </Button>
            ) : null}
          </div>
        </div>

        <Button type="submit" className="h-11 w-full">
          {t("auth.sendLink")}
          <ArrowRight aria-hidden="true" size={16} />
        </Button>
      </form>

      <p className="text-xs text-[var(--muted)]">
        {t("auth.login.help")}{" "}
      </p>
    </AuthShell>
  );
}

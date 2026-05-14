import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Languages,
  MessageCircle,
  ShieldCheck,
  Stethoscope
} from "lucide-react";
import { Button } from "@petcura/ui";
import { createTranslator, withLocale, type SupportedLocale } from "@petcura/shared";
import { getRequestLocale } from "@/lib/locale";
import { LanguageSwitcher } from "@/components/language-switcher";

type OwnersPageProps = {
  searchParams?: Promise<{
    lang?: string | string[];
  }>;
};

export default async function OwnersPage({ searchParams }: OwnersPageProps) {
  const locale = await getRequestLocale((await searchParams)?.lang);
  const t = createTranslator(locale);
  const intakeHref = withLocale("/intake", locale);
  const homeHref = withLocale("/", locale);

  const features = [
    {
      icon: <MessageCircle aria-hidden="true" size={18} />,
      title: t("owners.feature.1.title"),
      body: t("owners.feature.1.body")
    },
    {
      icon: <Languages aria-hidden="true" size={18} />,
      title: t("owners.feature.2.title"),
      body: t("owners.feature.2.body")
    },
    {
      icon: <ShieldCheck aria-hidden="true" size={18} />,
      title: t("owners.feature.3.title"),
      body: t("owners.feature.3.body")
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            aria-label="PetCura"
            className="inline-flex items-center gap-2 font-semibold"
            href={homeHref}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-[var(--primary)] text-white">
              <Stethoscope aria-hidden="true" size={18} />
            </span>
            <span className="text-sm tracking-[0.04em]">PetCura</span>
          </Link>
          <LanguageSwitcher
            currentPath="/owners"
            label={t("language.label")}
            locale={locale}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <span
          className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary-strong)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {t("owners.eyebrow")}
        </span>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">
          {t("owners.title")}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
          {t("owners.body")}
        </p>

        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-6"
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]"
              >
                {feature.icon}
              </span>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {feature.title}
              </h2>
              <p className="text-sm leading-6 text-[var(--muted)]">
                {feature.body}
              </p>
            </li>
          ))}
        </ul>

        <section
          aria-labelledby="owners-cta-heading"
          className="mt-16 flex flex-col gap-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-8 sm:p-10"
        >
          <h2
            id="owners-cta-heading"
            className="text-2xl font-semibold text-[var(--foreground)]"
          >
            {t("owners.cta.title")}
          </h2>
          <p className="max-w-xl text-base leading-7 text-[var(--muted)]">
            {t("owners.cta.body")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href={ownerAppHref(locale)}>
                {t("owners.cta.primary")}
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={intakeHref}>{t("owners.cta.secondary")}</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={homeHref}>
                <ArrowLeft aria-hidden="true" size={16} />
                {t("owners.cta.back")}
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

function ownerAppHref(locale: SupportedLocale) {
  // Owner app lives at my.petcura.app in production. On the apex marketing
  // domain, /o serves the same routes, so a relative path works in dev and on
  // any preview deployment without hardcoding the production host.
  return withLocale("/o", locale);
}

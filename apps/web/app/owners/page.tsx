import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Languages,
  LockKeyhole,
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

  const paths = [
    {
      icon: <MessageCircle aria-hidden="true" size={18} />,
      title: t("owners.path.whatsapp.title"),
      body: t("owners.path.whatsapp.body")
    },
    {
      icon: <ClipboardList aria-hidden="true" size={18} />,
      title: t("owners.path.web.title"),
      body: t("owners.path.web.body")
    },
    {
      icon: <ShieldCheck aria-hidden="true" size={18} />,
      title: t("owners.path.portal.title"),
      body: t("owners.path.portal.body")
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

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
          <div>
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
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild>
                <Link href={ownerAppHref(locale)}>
                  {t("owners.cta.primary")}
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={intakeHref}>{t("owners.cta.secondary")}</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_24px_56px_-36px_rgba(41,38,27,0.42)]">
            <div className="rounded-[var(--radius)] bg-[var(--primary-soft)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary-strong)]">
                {t("owners.invited.kicker")}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                {t("owners.invited.title")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {t("owners.invited.body")}
              </p>
            </div>
            <ol className="mt-4 grid gap-3">
              {[1, 2, 3].map((step) => (
                <li
                  className="flex gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3"
                  key={step}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--paper)] text-xs font-semibold text-[var(--primary-strong)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {step}
                  </span>
                  <span className="text-sm leading-6 text-[var(--foreground)]">
                    {t(`owners.next.${step}` as "owners.next.1")}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-[var(--line)] bg-[var(--surface-soft)]">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                {t("owners.paths.title")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {t("owners.paths.body")}
              </p>
            </div>
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {paths.map((feature) => (
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
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          {[
            {
              icon: <AlertTriangle aria-hidden="true" size={18} />,
              title: t("owners.emergency.title"),
              body: t("owners.emergency.body")
            },
            {
              icon: <Languages aria-hidden="true" size={18} />,
              title: t("owners.language.title"),
              body: t("owners.language.body")
            },
            {
              icon: <LockKeyhole aria-hidden="true" size={18} />,
              title: t("owners.privacy.title"),
              body: t("owners.privacy.body")
            }
          ].map((card) => (
            <article
              className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5"
              key={card.title}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
                {card.icon}
              </span>
              <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
                {card.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {card.body}
              </p>
            </article>
          ))}
        </section>

        <section
          aria-labelledby="owners-cta-heading"
          className="mx-auto mb-16 flex w-full max-w-6xl flex-col gap-4 px-4 sm:px-6 lg:px-8"
        >
          <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-8 sm:p-10">
            <h2
              id="owners-cta-heading"
              className="text-2xl font-semibold text-[var(--foreground)]"
            >
              {t("owners.cta.title")}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-[var(--muted)]">
              {t("owners.cta.body")}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
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

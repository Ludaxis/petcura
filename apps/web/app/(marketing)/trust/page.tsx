import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  Database,
  FileCheck2,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Badge, Button } from "@petcura/ui";
import { createTranslator, withLocale } from "@petcura/shared";
import { getRequestLocale } from "@/lib/locale";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  demoHrefBySource,
  leadSources,
  marketingRoutes,
  trustClaims
} from "../_data/landing";
import { RouteViewTracker } from "../_components/RouteViewTracker";
import { TrackedMarketingLink } from "../_components/TrackedMarketingLink";

export const metadata: Metadata = {
  title: "PetCura Trust Center",
  description:
    "Security, privacy, AI safety, and compliance posture for PetCura clinic pilots."
};

type TrustPageProps = {
  searchParams?: Promise<{ lang?: string | string[] }>;
};

export default async function TrustPage({ searchParams }: TrustPageProps) {
  const locale = await getRequestLocale((await searchParams)?.lang);
  const t = createTranslator(locale);
  const homeHref = withLocale(marketingRoutes.home, locale);
  const demoHref = withLocale(demoHrefBySource(leadSources.trust), locale);

  const sections = [
    {
      icon: <Database aria-hidden="true" size={18} />,
      title: t("trust.residency.title"),
      body: t("trust.residency.body"),
      claims: trustClaims.residency
    },
    {
      icon: <Sparkles aria-hidden="true" size={18} />,
      title: t("trust.ai.title"),
      body: t("trust.ai.body"),
      claims: trustClaims.aiSafety
    },
    {
      icon: <ClipboardCheck aria-hidden="true" size={18} />,
      title: t("trust.audit.title"),
      body: t("trust.audit.body"),
      claims: trustClaims.auditability
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <RouteViewTracker
        eventName="trust_center_opened"
        locale={locale}
        route="/trust"
        source={leadSources.trust}
      />
      <header className="border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Button asChild size="sm" variant="ghost">
            <Link href={homeHref}>
              <ArrowLeft aria-hidden="true" size={14} />
              {t("trust.nav.back")}
            </Link>
          </Button>
          <LanguageSwitcher
            currentPath="/trust"
            label={t("language.label")}
            locale={locale}
          />
        </div>
      </header>

      <main>
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-20">
            <div className="flex flex-col gap-6">
              <span
                className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary-strong)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {t("trust.eyebrow")}
              </span>
              <div>
                <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-[var(--foreground)] sm:text-5xl">
                  {t("trust.title")}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
                  {t("trust.body")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <TrackedMarketingLink
                    eventName="landing_cta_clicked"
                    href={demoHref}
                    locale={locale}
                    route="/demo"
                    source={leadSources.trust}
                  >
                    {t("trust.cta.demo")}
                    <ArrowRight aria-hidden="true" size={16} />
                  </TrackedMarketingLink>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={withLocale(marketingRoutes.sandbox, locale)}>
                    {t("trust.cta.sandbox")}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_24px_56px_-36px_rgba(41,38,27,0.42)]">
              <div className="flex items-start gap-3 rounded-[var(--radius)] bg-[var(--primary-soft)] p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--paper)] text-[var(--primary-strong)]">
                  <ShieldCheck aria-hidden="true" size={18} />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">
                    {t("trust.snapshot.title")}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {t("trust.snapshot.body")}
                  </p>
                </div>
              </div>
              <ul className="grid gap-2 sm:grid-cols-3" role="list">
                {trustClaims.roadmap.map((item) => (
                  <li
                    className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3"
                    key={item.label}
                  >
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {item.status}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--line)] bg-[var(--surface-soft)]">
          <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
            {sections.map((section) => (
              <article
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5"
                key={section.title}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
                  {section.icon}
                </span>
                <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
                  {section.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {section.body}
                </p>
                <ul className="mt-4 grid gap-2" role="list">
                  {section.claims.map((claim) => (
                    <li
                      className="flex gap-2 text-sm leading-6 text-[var(--foreground)]"
                      key={claim}
                    >
                      <FileCheck2
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-[var(--primary)]"
                        size={14}
                      />
                      {claim}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="border-b border-[var(--line)]">
          <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <Badge tone="amber">{t("trust.limits.badge")}</Badge>
              <h2 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
                {t("trust.limits.title")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {t("trust.limits.body")}
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2" role="list">
              {[
                t("trust.limits.item.1"),
                t("trust.limits.item.2"),
                t("trust.limits.item.3"),
                t("trust.limits.item.4")
              ].map((item) => (
                <li
                  className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4 text-sm leading-6 text-[var(--foreground)]"
                  key={item}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

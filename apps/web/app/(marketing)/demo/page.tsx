import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarClock, ShieldCheck, Sparkles } from "lucide-react";
import { createTranslator, withLocale } from "@petcura/shared";
import { Button } from "@petcura/ui";
import { getRequestLocale } from "@/lib/locale";
import { LanguageSwitcher } from "@/components/language-switcher";
import { leadSources, marketingRoutes } from "../_data/landing";
import { DemoLeadForm } from "./DemoLeadForm";

export const metadata: Metadata = {
  title: "Book a PetCura demo",
  description:
    "Request a clinic pilot walkthrough for PetCura, the WhatsApp-native ClientOps inbox for veterinary clinics."
};

type DemoPageProps = {
  searchParams?: Promise<{
    lang?: string | string[];
    source?: string | string[];
  }>;
};

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const params = await searchParams;
  const locale = await getRequestLocale(params?.lang);
  const t = createTranslator(locale);
  const source = normalizeSource(params?.source);
  const homeHref = withLocale(marketingRoutes.home, locale);
  const sandboxHref = withLocale(marketingRoutes.sandbox, locale);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Button asChild size="sm" variant="ghost">
            <Link href={homeHref}>
              <ArrowLeft aria-hidden="true" size={14} />
              {t("demo.nav.back")}
            </Link>
          </Button>
          <LanguageSwitcher
            currentPath="/demo"
            label={t("language.label")}
            locale={locale}
          />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-20">
        <section className="flex flex-col gap-6">
          <span
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary-strong)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("demo.eyebrow")}
          </span>
          <div>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight text-[var(--foreground)] sm:text-5xl">
              {t("demo.title")}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
              {t("demo.body")}
            </p>
          </div>

          <ul className="grid gap-3" role="list">
            {[
              {
                icon: <CalendarClock aria-hidden="true" size={16} />,
                title: t("demo.promise.1.title"),
                body: t("demo.promise.1.body")
              },
              {
                icon: <Sparkles aria-hidden="true" size={16} />,
                title: t("demo.promise.2.title"),
                body: t("demo.promise.2.body")
              },
              {
                icon: <ShieldCheck aria-hidden="true" size={16} />,
                title: t("demo.promise.3.title"),
                body: t("demo.promise.3.body")
              }
            ].map((item) => (
              <li
                className="flex gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4"
                key={item.title}
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
                  {item.icon}
                </span>
                <span>
                  <strong className="block text-sm font-semibold text-[var(--foreground)]">
                    {item.title}
                  </strong>
                  <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <p className="text-sm leading-6 text-[var(--muted)]">
            {t("demo.sandboxLead")}{" "}
            <Link
              className="font-semibold text-[var(--primary-strong)] underline-offset-4 hover:underline focus-visible:underline"
              href={sandboxHref}
            >
              {t("demo.sandboxLink")}
            </Link>
          </p>
        </section>

        <section aria-labelledby="demo-form-heading">
          <div className="mb-5">
            <h2
              className="text-2xl font-semibold text-[var(--foreground)]"
              id="demo-form-heading"
            >
              {t("demo.form.title")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {t("demo.form.body")}
            </p>
          </div>
          <DemoLeadForm
            copy={{
              clinicName: t("demo.form.clinicName"),
              contactName: t("demo.form.contactName"),
              workEmail: t("demo.form.workEmail"),
              country: t("demo.form.country"),
              pmsSystem: t("demo.form.pmsSystem"),
              monthlyRequestVolume: t("demo.form.monthlyRequestVolume"),
              volumePlaceholder: t("demo.form.volume.placeholder"),
              volumeUnder100: t("demo.form.volume.under100"),
              volume100300: t("demo.form.volume.100300"),
              volume300800: t("demo.form.volume.300800"),
              volume800Plus: t("demo.form.volume.800plus"),
              volumeUnknown: t("demo.form.volume.unknown"),
              message: t("demo.form.message"),
              messagePlaceholder: t("demo.form.messagePlaceholder"),
              consent: t("demo.form.consent"),
              submit: t("demo.form.submit"),
              submitting: t("demo.form.submitting"),
              successTitle: t("demo.form.successTitle"),
              successBody: t("demo.form.successBody"),
              fallbackTitle: t("demo.form.fallbackTitle"),
              fallbackBody: t("demo.form.fallbackBody"),
              fallbackCta: t("demo.form.fallbackCta"),
              requiredError: t("demo.form.requiredError")
            }}
            locale={locale}
            source={source}
          />
        </section>
      </main>
    </div>
  );
}

function normalizeSource(input: string | string[] | undefined) {
  const source = Array.isArray(input) ? input[0] : input;
  return Object.values(leadSources).includes(source as never)
    ? (source as (typeof leadSources)[keyof typeof leadSources])
    : leadSources.demoPage;
}

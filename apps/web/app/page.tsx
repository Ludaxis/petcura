import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Inbox,
  ShieldCheck,
  Stethoscope
} from "lucide-react";
import { Badge, Button, Panel, Metric } from "@petcura/ui";
import {
  createTranslator,
  demoRequests,
  pilotMetrics,
  withLocale
} from "@petcura/shared";
import { getPublicEnvStatus } from "@/lib/env";
import { getRequestLocale } from "@/lib/locale";
import { LanguageSwitcher } from "@/components/language-switcher";

type HomePageProps = {
  searchParams?: Promise<{
    lang?: string | string[];
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const locale = await getRequestLocale((await searchParams)?.lang);
  const t = createTranslator(locale);
  const envStatus = getPublicEnvStatus();
  const workflow = [
    t("home.workflow.1"),
    t("home.workflow.2"),
    t("home.workflow.3"),
    t("home.workflow.4")
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-[var(--line)] py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--primary)] text-white">
            <Stethoscope aria-hidden="true" size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--primary)]">
              {t("home.kicker")}
            </p>
            <h1 className="text-2xl font-semibold tracking-normal text-[var(--foreground)]">
              {t("home.title")}
            </h1>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2" aria-label="Primary">
          <LanguageSwitcher
            currentPath="/"
            label={t("language.label")}
            locale={locale}
          />
          <Button asChild variant="secondary">
            <Link href={withLocale("/intake", locale)}>
              {t("nav.ownerIntake")}
            </Link>
          </Button>
          <Button asChild>
            <Link href={withLocale("/inbox", locale)}>
              {t("nav.clinicInbox")}
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </Button>
        </nav>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel className="p-5 sm:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="teal">{t("home.badge.whatsapp")}</Badge>
              <Badge tone="neutral">{t("home.badge.ai")}</Badge>
              <Badge tone="neutral">{t("home.badge.exports")}</Badge>
            </div>
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl">
                {t("home.hero.title")}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
                {t("home.hero.body")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {workflow.map((step, index) => (
                <div
                  className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3"
                  key={step}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--paper)] text-sm font-semibold text-[var(--primary)]">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-[var(--foreground)]">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">
                {t("home.status.kicker")}
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                {t("home.status.title")}
              </h2>
            </div>
            <Badge tone={envStatus.success ? "teal" : "amber"}>
              {envStatus.success
                ? t("home.status.supabaseReady")
                : t("home.status.envPending")}
            </Badge>
          </div>
          <div className="mt-5 grid gap-3">
            <Metric
              icon={<Inbox aria-hidden="true" size={18} />}
              label={t("home.metric.demoRequests")}
              value={String(demoRequests.length)}
            />
            <Metric
              icon={<Clock3 aria-hidden="true" size={18} />}
              label={t("home.metric.responseTarget")}
              value={pilotMetrics.responseTimeTarget}
            />
            <Metric
              icon={<Activity aria-hidden="true" size={18} />}
              label={t("home.metric.callReduction")}
              value={pilotMetrics.callReductionTarget}
            />
            <Metric
              icon={<ShieldCheck aria-hidden="true" size={18} />}
              label={t("home.metric.safety")}
              value={t("home.metric.zeroIncidents")}
            />
          </div>
          <div className="mt-5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4">
            <div className="flex gap-3">
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 text-[var(--primary)]"
                size={18}
              />
              <p className="text-sm leading-6 text-[var(--muted)]">
                {t("home.next")}
              </p>
            </div>
          </div>
        </Panel>
      </section>
      <footer className="mx-auto mt-12 flex max-w-6xl items-center justify-between gap-4 border-t border-[var(--line)] px-6 py-6 text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
        <span style={{ fontFamily: "var(--font-mono)" }}>
          PetCura · v1.0
        </span>
        <Link
          href="/design"
          className="hover:text-[var(--primary-strong)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Design system →
        </Link>
      </footer>
    </main>
  );
}

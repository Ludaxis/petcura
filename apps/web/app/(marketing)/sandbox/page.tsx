import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  MessageCircle,
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
  sandboxInbox
} from "../_data/landing";
import { RouteViewTracker } from "../_components/RouteViewTracker";
import { TrackedMarketingLink } from "../_components/TrackedMarketingLink";

export const metadata: Metadata = {
  title: "PetCura sandbox inbox",
  description:
    "Tour a fake-data PetCura inbox without auth, real owner PII, Supabase writes, or AI provider calls."
};

type SandboxPageProps = {
  searchParams?: Promise<{ lang?: string | string[] }>;
};

export default async function SandboxPage({ searchParams }: SandboxPageProps) {
  const locale = await getRequestLocale((await searchParams)?.lang);
  const t = createTranslator(locale);
  const homeHref = withLocale(marketingRoutes.home, locale);
  const demoHref = withLocale(demoHrefBySource(leadSources.sandbox), locale);
  const trustHref = withLocale(marketingRoutes.trust, locale);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <RouteViewTracker
        eventName="sandbox_opened"
        locale={locale}
        route="/sandbox"
        source={leadSources.sandbox}
      />
      <header className="border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Button asChild size="sm" variant="ghost">
            <Link href={homeHref}>
              <ArrowLeft aria-hidden="true" size={14} />
              {t("sandbox.nav.back")}
            </Link>
          </Button>
          <LanguageSwitcher
            currentPath="/sandbox"
            label={t("language.label")}
            locale={locale}
          />
        </div>
      </header>

      <main>
        <section className="border-b border-[var(--line)]">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
            <div className="flex flex-col gap-6">
              <span
                className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary-strong)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {t("sandbox.eyebrow")}
              </span>
              <div>
                <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-[var(--foreground)] sm:text-5xl">
                  {t("sandbox.title")}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
                  {t("sandbox.body")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <TrackedMarketingLink
                    eventName="landing_cta_clicked"
                    href={demoHref}
                    locale={locale}
                    route="/demo"
                    source={leadSources.sandbox}
                  >
                    {t("sandbox.cta.demo")}
                    <ArrowRight aria-hidden="true" size={16} />
                  </TrackedMarketingLink>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={trustHref}>{t("sandbox.cta.trust")}</Link>
                </Button>
              </div>
              <ul className="flex flex-wrap gap-2 text-xs text-[var(--muted)]" role="list">
                <li>
                  <Badge tone="teal">{t("sandbox.badge.fakeData")}</Badge>
                </li>
                <li>
                  <Badge>{t("sandbox.badge.noAuth")}</Badge>
                </li>
                <li>
                  <Badge>{t("sandbox.badge.noWrites")}</Badge>
                </li>
              </ul>
            </div>

            <SandboxPreview t={t} />
          </div>
        </section>

        <section className="border-b border-[var(--line)] bg-[var(--surface-soft)]">
          <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
            {[
              {
                title: t("sandbox.guard.1.title"),
                body: t("sandbox.guard.1.body")
              },
              {
                title: t("sandbox.guard.2.title"),
                body: t("sandbox.guard.2.body")
              },
              {
                title: t("sandbox.guard.3.title"),
                body: t("sandbox.guard.3.body")
              }
            ].map((card) => (
              <article
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5"
                key={card.title}
              >
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  {card.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {card.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function SandboxPreview({ t }: { t: ReturnType<typeof createTranslator> }) {
  return (
    <div className="grid gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[0_24px_56px_-36px_rgba(41,38,27,0.42)]">
      <PreviewCard
        icon={<MessageCircle aria-hidden="true" size={15} />}
        kicker={`${sandboxInbox.ownerMessage.channel} · ${sandboxInbox.ownerMessage.time}`}
        title={sandboxInbox.ownerMessage.from}
      >
        <p>{sandboxInbox.ownerMessage.body}</p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          {t("sandbox.preview.language")}: {sandboxInbox.ownerMessage.language}
        </p>
      </PreviewCard>

      <PreviewCard
        icon={<Sparkles aria-hidden="true" size={15} />}
        kicker={t("sandbox.preview.structured")}
        title={`${sandboxInbox.request.pet} · ${sandboxInbox.request.category}`}
        tone="primary"
      >
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">{t("sandbox.preview.status")}</dt>
            <dd>{sandboxInbox.request.status}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">{t("sandbox.preview.risk")}</dt>
            <dd>{sandboxInbox.request.suggestedRisk}</dd>
          </div>
        </dl>
        <p
          className="mt-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--primary-strong)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {sandboxInbox.request.id}
        </p>
        <p className="mt-3 text-sm leading-6">{sandboxInbox.request.summary}</p>
      </PreviewCard>

      <PreviewCard
        icon={<ShieldCheck aria-hidden="true" size={15} />}
        kicker={sandboxInbox.aiDraft.label}
        title={t("sandbox.preview.staffReview")}
      >
        <p>{sandboxInbox.aiDraft.body}</p>
        <p className="mt-2 text-xs font-semibold text-[var(--primary-strong)]">
          {sandboxInbox.aiDraft.boundary}
        </p>
      </PreviewCard>

      <PreviewCard
        icon={<CheckCircle2 aria-hidden="true" size={15} />}
        kicker={sandboxInbox.staffAction.decision}
        title={sandboxInbox.staffAction.reviewer}
      >
        <p>{sandboxInbox.staffAction.ownerReply}</p>
      </PreviewCard>

      <div
        className="rounded-[var(--radius)] border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-3 text-xs text-[var(--muted)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 font-semibold uppercase tracking-[0.06em]">
            <FileText aria-hidden="true" size={13} />
            {sandboxInbox.export.destination}
          </span>
          <span>{sandboxInbox.export.auditId}</span>
        </div>
        <p className="mt-2">
          {sandboxInbox.export.fields.join(" · ")}
        </p>
      </div>
    </div>
  );
}

function PreviewCard({
  children,
  icon,
  kicker,
  title,
  tone = "paper"
}: {
  children: ReactNode;
  icon: ReactNode;
  kicker: string;
  title: string;
  tone?: "paper" | "primary";
}) {
  return (
    <article
      className={
        tone === "primary"
          ? "rounded-[var(--radius)] border border-[var(--primary-soft)] bg-[var(--primary-soft)] p-3"
          : "rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-3"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--primary-strong)]">
          {icon}
          {kicker}
        </span>
      </div>
      <h2 className="mt-2 text-sm font-semibold text-[var(--foreground)]">
        {title}
      </h2>
      <div className="mt-2 text-sm leading-6 text-[var(--foreground)]">
        {children}
      </div>
    </article>
  );
}

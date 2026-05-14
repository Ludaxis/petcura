import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  CircleSlash,
  FileText,
  Globe,
  Inbox,
  Languages,
  MessageCircle,
  MessagesSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope
} from "lucide-react";
import { Badge, Button } from "@petcura/ui";
import { createTranslator, withLocale } from "@petcura/shared";
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
  const intakeHref = withLocale("/intake", locale);
  const ownersHref = withLocale("/owners", locale);

  const trustChips = t("landing.hero.trust")
    .split(" · ")
    .map((chip) => chip.trim())
    .filter(Boolean);

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)]">
      <TopNav locale={locale} t={t} intakeHref={intakeHref} />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-[var(--line)]">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8 lg:py-24">
            <div className="flex flex-col items-start gap-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                <ShieldCheck aria-hidden="true" size={13} />
                <span>{t("landing.hero.eyebrow")}</span>
              </span>
              <h1 className="max-w-2xl text-[40px] font-semibold leading-[1.05] tracking-[-0.01em] text-[var(--foreground)] sm:text-[52px] lg:text-[60px]">
                {t("landing.hero.title")}
              </h1>
              <p className="max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
                {t("landing.hero.body")}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Button asChild>
                  <Link href="#pricing">
                    {t("landing.hero.ctaPrimary")}
                    <ArrowRight aria-hidden="true" size={16} />
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="#how-it-works">
                    {t("landing.hero.ctaSecondary")}
                  </Link>
                </Button>
              </div>
              <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[var(--muted)]">
                {trustChips.map((chip) => (
                  <li key={chip} className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]"
                    />
                    {chip}
                  </li>
                ))}
              </ul>
            </div>

            <ProductLoopMock t={t} />
          </div>
        </section>

        {/* LOGO STRIP */}
        <section className="border-b border-[var(--line)] bg-[var(--surface-soft)]">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              {t("landing.logos.heading")}
            </p>
            <ul className="mt-6 grid grid-cols-2 items-center justify-items-center gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <li
                  key={index}
                  className="flex h-10 w-full max-w-[160px] items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--line)] bg-[var(--paper)] text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--muted-2)]"
                >
                  {t("landing.logos.placeholder")} {index}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* PROBLEM */}
        <section
          aria-labelledby="problem-heading"
          className="border-b border-[var(--line)]"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8">
            <div className="flex flex-col gap-4">
              <SectionKicker>{t("landing.problem.kicker")}</SectionKicker>
              <h2
                id="problem-heading"
                className="text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
              >
                {t("landing.problem.title")}
              </h2>
              <p className="max-w-lg text-base leading-7 text-[var(--muted)]">
                {t("landing.problem.body")}
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <li
                  key={n}
                  className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--red-soft)] text-[var(--red)]"
                  >
                    <Phone size={13} />
                  </span>
                  <p className="text-sm leading-6 text-[var(--foreground)]">
                    {t(`landing.problem.item.${n}` as `landing.problem.item.1`)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* WALKTHROUGH */}
        <section
          aria-labelledby="how-heading"
          className="border-b border-[var(--line)] bg-[var(--surface-soft)]"
          id="how-it-works"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <SectionKicker>{t("landing.walkthrough.kicker")}</SectionKicker>
              <h2
                id="how-heading"
                className="mt-3 text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
              >
                {t("landing.walkthrough.title")}
              </h2>
              <p className="mt-3 text-base leading-7 text-[var(--muted)]">
                {t("landing.walkthrough.body")}
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <WalkthroughCard
                index={1}
                icon={<MessagesSquare aria-hidden="true" size={18} />}
                title={t("landing.walkthrough.step1.title")}
                body={t("landing.walkthrough.step1.body")}
              />
              <WalkthroughCard
                index={2}
                icon={<Sparkles aria-hidden="true" size={18} />}
                title={t("landing.walkthrough.step2.title")}
                body={t("landing.walkthrough.step2.body")}
              />
              <WalkthroughCard
                index={3}
                icon={<FileText aria-hidden="true" size={18} />}
                title={t("landing.walkthrough.step3.title")}
                body={t("landing.walkthrough.step3.body")}
              />
            </div>
          </div>
        </section>

        {/* USE CASES */}
        <section
          aria-labelledby="usecases-heading"
          className="border-b border-[var(--line)]"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <SectionKicker>{t("landing.usecases.kicker")}</SectionKicker>
              <h2
                id="usecases-heading"
                className="mt-3 text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
              >
                {t("landing.usecases.title")}
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <UseCaseCard
                icon={<Inbox aria-hidden="true" size={18} />}
                title={t("landing.usecases.front.title")}
                body={t("landing.usecases.front.body")}
              />
              <UseCaseCard
                icon={<Stethoscope aria-hidden="true" size={18} />}
                title={t("landing.usecases.vet.title")}
                body={t("landing.usecases.vet.body")}
              />
              <UseCaseCard
                icon={<Sparkles aria-hidden="true" size={18} />}
                title={t("landing.usecases.owner.title")}
                body={t("landing.usecases.owner.body")}
              />
            </div>
          </div>
        </section>

        {/* INTEGRATIONS */}
        <section
          aria-labelledby="integrations-heading"
          className="border-b border-[var(--line)] bg-[var(--surface-soft)]"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-8">
            <div className="flex flex-col gap-4">
              <SectionKicker>{t("landing.integrations.kicker")}</SectionKicker>
              <h2
                id="integrations-heading"
                className="text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
              >
                {t("landing.integrations.title")}
              </h2>
              <p className="max-w-lg text-base leading-7 text-[var(--muted)]">
                {t("landing.integrations.body")}
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              <IntegrationChip
                icon={<MessageCircle aria-hidden="true" size={16} />}
                label={t("landing.integrations.whatsapp")}
              />
              <IntegrationChip
                icon={<FileText aria-hidden="true" size={16} />}
                label={t("landing.integrations.pms")}
              />
              <IntegrationChip
                icon={<Calendar aria-hidden="true" size={16} />}
                label={t("landing.integrations.calendar")}
              />
              <IntegrationChip
                icon={<Globe aria-hidden="true" size={16} />}
                label={t("landing.integrations.web")}
              />
              <IntegrationChip
                icon={<Phone aria-hidden="true" size={16} />}
                label={t("landing.integrations.sms")}
              />
              <IntegrationChip
                icon={<Languages aria-hidden="true" size={16} />}
                label={t("landing.integrations.translate")}
              />
            </ul>
          </div>
        </section>

        {/* AI SAFETY */}
        <section
          aria-labelledby="safety-heading"
          className="border-b border-[var(--line)]"
          id="safety"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <SectionKicker>{t("landing.safety.kicker")}</SectionKicker>
              <h2
                id="safety-heading"
                className="mt-3 text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
              >
                {t("landing.safety.title")}
              </h2>
              <p className="mt-3 text-base leading-7 text-[var(--muted)]">
                {t("landing.safety.body")}
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <article className="flex flex-col gap-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-6">
                <header className="flex items-center gap-2 text-[var(--primary-strong)]">
                  <CheckCircle2 aria-hidden="true" size={18} />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.06em]">
                    {t("landing.safety.will.title")}
                  </h3>
                </header>
                <ul className="flex flex-col gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <li
                      className="flex items-start gap-2 text-sm leading-6 text-[var(--foreground)]"
                      key={n}
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-1 text-[var(--primary)]"
                        size={14}
                      />
                      {t(
                        `landing.safety.will.${n}` as `landing.safety.will.1`
                      )}
                    </li>
                  ))}
                </ul>
              </article>

              <article className="flex flex-col gap-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-6">
                <header className="flex items-center gap-2 text-[var(--red)]">
                  <CircleSlash aria-hidden="true" size={18} />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.06em]">
                    {t("landing.safety.willnot.title")}
                  </h3>
                </header>
                <ul className="flex flex-col gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <li
                      className="flex items-start gap-2 text-sm leading-6 text-[var(--foreground)]"
                      key={n}
                    >
                      <CircleSlash
                        aria-hidden="true"
                        className="mt-1 text-[var(--red)]"
                        size={14}
                      />
                      {t(
                        `landing.safety.willnot.${n}` as `landing.safety.willnot.1`
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <p className="mt-6 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              <strong className="font-semibold text-[var(--foreground)]">
                {t("landing.safety.training")}
              </strong>
            </p>
          </div>
        </section>

        {/* COMPLIANCE */}
        <section
          aria-labelledby="security-heading"
          className="border-b border-[var(--line)] bg-[var(--surface-soft)]"
          id="security"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8">
            <div className="flex flex-col gap-4">
              <SectionKicker>{t("landing.compliance.kicker")}</SectionKicker>
              <h2
                id="security-heading"
                className="text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
              >
                {t("landing.compliance.title")}
              </h2>
              <p className="max-w-lg text-base leading-7 text-[var(--muted)]">
                {t("landing.compliance.body")}
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  "eu",
                  "gdpr",
                  "audit",
                  "soc",
                  "iso",
                  "aiact"
                ] as const
              ).map((key) => (
                <li
                  className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4"
                  key={key}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]"
                  >
                    <ShieldCheck size={16} />
                  </span>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {t(
                      `landing.compliance.badge.${key}` as `landing.compliance.badge.eu`
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* TESTIMONIAL */}
        <section
          aria-labelledby="proof-heading"
          className="border-b border-[var(--line)]"
        >
          <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <SectionKicker>{t("landing.proof.kicker")}</SectionKicker>
              <h2
                id="proof-heading"
                className="mt-3 text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
              >
                {t("landing.proof.title")}
              </h2>
            </div>

            <figure className="mt-10 grid items-center gap-8 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-10 lg:grid-cols-[1.4fr_0.6fr] lg:gap-12">
              <blockquote className="space-y-6">
                <p className="text-xl leading-relaxed text-[var(--foreground)] sm:text-2xl">
                  &ldquo;{t("landing.proof.quote")}&rdquo;
                </p>
                <figcaption className="text-sm font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                  — {t("landing.proof.author")}
                </figcaption>
              </blockquote>
              <aside className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  {t("landing.proof.metricLabel")}
                </p>
                <p className="mt-2 text-base font-medium leading-6 text-[var(--foreground)]">
                  {t("landing.proof.metric")}
                </p>
              </aside>
            </figure>

            <p className="mt-4 text-xs italic text-[var(--muted)]">
              {t("landing.proof.disclaimer")}
            </p>
          </div>
        </section>

        {/* PRICING */}
        <section
          aria-labelledby="pricing-heading"
          className="border-b border-[var(--line)] bg-[var(--surface-soft)]"
          id="pricing"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-8">
            <div className="flex flex-col gap-4">
              <SectionKicker>{t("landing.pricing.kicker")}</SectionKicker>
              <h2
                id="pricing-heading"
                className="text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
              >
                {t("landing.pricing.title")}
              </h2>
              <p className="max-w-lg text-base leading-7 text-[var(--muted)]">
                {t("landing.pricing.body")}
              </p>
            </div>

            <article className="flex flex-col gap-6 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8">
              <header className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-2xl font-semibold text-[var(--foreground)]">
                  {t("landing.pricing.tier.title")}
                </h3>
                <Badge tone="teal">{t("landing.compliance.badge.eu")}</Badge>
              </header>
              <p className="text-sm leading-6 text-[var(--muted)]">
                {t("landing.pricing.tier.body")}
              </p>
              <ul className="grid gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <li
                    className="flex items-start gap-2 text-sm leading-6 text-[var(--foreground)]"
                    key={n}
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-1 text-[var(--primary)]"
                      size={14}
                    />
                    {t(
                      `landing.pricing.feature.${n}` as `landing.pricing.feature.1`
                    )}
                  </li>
                ))}
              </ul>
              <div>
                <Button asChild>
                  <Link href="mailto:hello@petcura.app?subject=Pilot%20enquiry">
                    {t("landing.pricing.cta")}
                    <ArrowRight aria-hidden="true" size={16} />
                  </Link>
                </Button>
              </div>
            </article>
          </div>
        </section>

        {/* FAQ */}
        <section
          aria-labelledby="faq-heading"
          className="border-b border-[var(--line)]"
        >
          <div className="mx-auto w-full max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <SectionKicker>{t("landing.faq.kicker")}</SectionKicker>
              <h2
                id="faq-heading"
                className="mt-3 text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
              >
                {t("landing.faq.title")}
              </h2>
            </div>
            <div className="mt-10 flex flex-col gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <FaqItem
                  key={n}
                  question={t(
                    `landing.faq.q${n}` as `landing.faq.q1`
                  )}
                  answer={t(
                    `landing.faq.a${n}` as `landing.faq.a1`
                  )}
                />
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section
          aria-labelledby="final-cta-heading"
          className="border-b border-[var(--line)] bg-[var(--surface-soft)]"
        >
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 lg:px-8">
            <h2
              id="final-cta-heading"
              className="max-w-2xl text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
            >
              {t("landing.cta.title")}
            </h2>
            <p className="max-w-xl text-base leading-7 text-[var(--muted)]">
              {t("landing.cta.body")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild>
                <Link href="mailto:hello@petcura.app?subject=Demo%20request">
                  {t("landing.cta.primary")}
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={intakeHref}>{t("landing.cta.secondary")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer t={t} intakeHref={intakeHref} ownersHref={ownersHref} />
    </div>
  );
}

type Translator = ReturnType<typeof createTranslator>;

function TopNav({
  locale,
  t,
  intakeHref
}: {
  locale: Awaited<ReturnType<typeof getRequestLocale>>;
  t: Translator;
  intakeHref: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_oklch,var(--paper)_88%,transparent)] backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklch,var(--paper)_72%,transparent)]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          aria-label="PetCura home"
          className="inline-flex items-center gap-2 font-semibold text-[var(--foreground)]"
          href="/"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-[var(--primary)] text-white">
            <Stethoscope aria-hidden="true" size={18} />
          </span>
          <span className="text-sm tracking-[0.04em]">PetCura</span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 lg:flex"
        >
          {[
            { href: "#how-it-works", key: "landing.nav.howItWorks" as const },
            { href: "#safety", key: "landing.nav.safety" as const },
            { href: "#security", key: "landing.nav.security" as const },
            { href: "#pricing", key: "landing.nav.pricing" as const }
          ].map((item) => (
            <Link
              className="rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
              href={item.href}
              key={item.href}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher
            currentPath="/"
            label={t("language.label")}
            locale={locale}
          />
          <Link
            className="hidden rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)] lg:inline-flex"
            href="/login"
          >
            {t("landing.nav.signIn")}
          </Link>
          <Button asChild size="sm">
            <Link href="#pricing">{t("landing.nav.bookDemo")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary-strong)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {children}
    </span>
  );
}

function ProductLoopMock({ t }: { t: Translator }) {
  return (
    <figure
      aria-label="Product preview: WhatsApp message becomes a typed request, AI drafts a reply, staff approves, record exports to PMS"
      className="relative flex w-full flex-col gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[0_24px_48px_-32px_rgba(74,107,63,0.35)] sm:p-5"
    >
      {/* WhatsApp bubble */}
      <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface-soft)] p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--primary-strong)]">
            <MessageCircle aria-hidden="true" size={12} />
            {t("landing.loop.whatsapp.label")}
          </span>
          <span
            className="text-[10px] text-[var(--muted)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {t("landing.loop.whatsapp.time")}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
          {t("landing.loop.whatsapp.message")}
        </p>
        <p className="mt-1 text-[11px] text-[var(--muted)]">
          {t("landing.loop.whatsapp.from")}
        </p>
      </div>

      {/* AI suggestion */}
      <div className="rounded-[10px] border border-[var(--primary-soft)] bg-[var(--primary-soft)] p-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--primary-strong)]">
          <Sparkles aria-hidden="true" size={12} />
          {t("landing.loop.ai.label")}
        </div>
        <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--primary-strong)]">
          {t("landing.loop.ai.category")}
        </p>
        <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
          {t("landing.loop.ai.summary")}
        </p>
        <p className="mt-2 text-[11px] italic text-[var(--primary-strong)]">
          {t("landing.loop.ai.disclaimer")}
        </p>
      </div>

      {/* Staff reply */}
      <div className="rounded-[10px] border border-[var(--line)] bg-[var(--paper)] p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
            <CheckCircle2 aria-hidden="true" size={12} />
            {t("landing.loop.reply.label")}
          </span>
          <span className="text-[11px] text-[var(--muted)]">
            {t("landing.loop.reply.author")}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
          {t("landing.loop.reply.body")}
        </p>
      </div>

      {/* Export */}
      <div
        className="flex items-center justify-between gap-3 rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-3"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
          <FileText aria-hidden="true" size={12} />
          {t("landing.loop.export.label")}
        </span>
        <span className="text-[10.5px] text-[var(--muted)]">
          {t("landing.loop.export.detail")}
        </span>
      </div>
    </figure>
  );
}

function WalkthroughCard({
  index,
  icon,
  title,
  body
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-6">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary-strong)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {index}
        </span>
        <span className="text-[var(--primary)]">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="text-sm leading-6 text-[var(--muted)]">{body}</p>
    </article>
  );
}

function UseCaseCard({
  icon,
  title,
  body
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-6">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]"
      >
        {icon}
      </span>
      <h3 className="text-lg font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="text-sm leading-6 text-[var(--muted)]">{body}</p>
    </article>
  );
}

function IntegrationChip({
  icon,
  label
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--surface-soft)] text-[var(--primary)]"
      >
        {icon}
      </span>
      <span className="text-sm font-medium text-[var(--foreground)]">
        {label}
      </span>
    </li>
  );
}

function FaqItem({
  question,
  answer
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5 transition open:bg-[var(--surface-soft)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-[var(--foreground)]">
        <span>{question}</span>
        <span
          aria-hidden="true"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] transition group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{answer}</p>
    </details>
  );
}

function Footer({
  t,
  intakeHref,
  ownersHref
}: {
  t: Translator;
  intakeHref: string;
  ownersHref: string;
}) {
  const columns = [
    {
      heading: t("landing.footer.product"),
      links: [
        { href: "#how-it-works", label: t("landing.footer.howItWorks") },
        { href: "#safety", label: t("landing.footer.safety") },
        { href: "#security", label: t("landing.footer.compliance") },
        { href: "#pricing", label: t("landing.footer.pricing") },
        { href: "/login", label: t("landing.nav.signIn") }
      ]
    },
    {
      heading: t("landing.footer.company"),
      links: [
        { href: "/design", label: t("landing.footer.changelog") },
        { href: "/health", label: t("landing.footer.status") },
        { href: "#security", label: t("landing.footer.trust") },
        { href: "#how-it-works", label: t("landing.footer.manifesto") },
        {
          href: "mailto:hello@petcura.app",
          label: t("landing.footer.contact")
        }
      ]
    },
    {
      heading: t("landing.footer.owners"),
      links: [
        { href: ownersHref, label: t("landing.footer.owners") },
        { href: "/o", label: t("owners.cta.primary") },
        { href: intakeHref, label: t("intake.title") }
      ]
    }
  ];

  return (
    <footer className="bg-[var(--paper)]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_2fr] lg:px-8">
        <div className="flex flex-col gap-3">
          <Link
            aria-label="PetCura home"
            className="inline-flex items-center gap-2"
            href="/"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-[var(--primary)] text-white">
              <Stethoscope aria-hidden="true" size={18} />
            </span>
            <span className="text-sm font-semibold tracking-[0.04em] text-[var(--foreground)]">
              PetCura
            </span>
          </Link>
          <p className="max-w-xs text-xs leading-5 text-[var(--muted)]">
            {t("landing.hero.eyebrow")}
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="grid gap-8 sm:grid-cols-3"
        >
          {columns.map((column) => (
            <div className="flex flex-col gap-3" key={column.heading}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                {column.heading}
              </p>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={`${column.heading}-${link.label}`}>
                    <Link
                      className="text-sm text-[var(--foreground)] hover:text-[var(--primary-strong)]"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-[var(--line)]">
        <div
          className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-2 px-4 py-5 text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] sm:flex-row sm:items-center sm:px-6 lg:px-8"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span>{t("landing.footer.legal")}</span>
          <span>PetCura · v1.0</span>
        </div>
      </div>
    </footer>
  );
}

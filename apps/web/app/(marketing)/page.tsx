import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { Button } from "@petcura/ui";
import { createTranslator, withLocale } from "@petcura/shared";

import { getRequestLocale } from "@/lib/locale";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  demoHrefBySource,
  leadSources,
  marketingRoutes,
  pilotProofSignals
} from "./_data/landing";

import { AISafety } from "./_sections/AISafety";
import { Compliance } from "./_sections/Compliance";
import { FAQ } from "./_sections/FAQ";
import { FinalCTA } from "./_sections/FinalCTA";
import { Hero } from "./_sections/Hero";
import { Integrations } from "./_sections/Integrations";
import { LogoStrip } from "./_sections/LogoStrip";
import { OwnersBand } from "./_sections/OwnersBand";
import { Pricing } from "./_sections/Pricing";
import { Problem } from "./_sections/Problem";
import { Testimonial } from "./_sections/Testimonial";
import { UseCases } from "./_sections/UseCases";
import { Walkthrough } from "./_sections/Walkthrough";
import { MobileCTABar } from "./_components/MobileCTABar";
import { MobileMarketingMenu } from "./_components/MobileMarketingMenu";

type MarketingPageProps = {
  searchParams?: Promise<{ lang?: string | string[] }>;
};

export default async function MarketingPage({
  searchParams
}: MarketingPageProps) {
  const locale = await getRequestLocale((await searchParams)?.lang);
  const t = createTranslator(locale);
  const demoHeroHref = withLocale(demoHrefBySource(leadSources.hero), locale);
  const demoPricingHref = withLocale(
    demoHrefBySource(leadSources.pricing),
    locale
  );
  const demoFinalHref = withLocale(
    demoHrefBySource(leadSources.finalCta),
    locale
  );
  const demoMobileHref = withLocale(
    demoHrefBySource(leadSources.mobileBar),
    locale
  );
  const demoFooterHref = withLocale(
    demoHrefBySource(leadSources.footer),
    locale
  );
  const sandboxHref = withLocale(marketingRoutes.sandbox, locale);
  const trustHref = withLocale(marketingRoutes.trust, locale);
  const privacyHref = marketingRoutes.privacy;
  const cookiesHref = marketingRoutes.cookies;
  const subprocessorsHref = marketingRoutes.subprocessors;
  const intakeHref = withLocale(marketingRoutes.ownerIntake, locale);
  const ownersHref = withLocale(marketingRoutes.owners, locale);
  const ownerSignInHref = withLocale(marketingRoutes.ownerLogin, locale);
  const clinicSignInHref = withLocale(marketingRoutes.clinicLogin, locale);

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)]">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius)] focus:bg-[var(--paper)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--foreground)] focus:shadow"
        href="#main-content"
      >
        Skip to content
      </a>
      <TopNav
        demoHref={demoHeroHref}
        locale={locale}
        ownersHref={ownersHref}
        signInHref={clinicSignInHref}
        t={t}
      />

      <main id="main-content">
        <Hero
          copy={{
            eyebrow: t("landing.hero.eyebrow"),
            title: t("landing.hero.title"),
            body: t("landing.hero.body"),
            ctaPrimary: t("landing.hero.ctaPrimary"),
            ctaSecondary: t("landing.cta.secondary_sandbox"),
            ownerPath: t("landing.hero.ownerPath"),
            trust: t("landing.hero.trust"),
            loop: {
              whatsappLabel: t("landing.loop.whatsapp.label"),
              whatsappFrom: t("landing.loop.whatsapp.from"),
              whatsappMessage: t("landing.loop.whatsapp.message"),
              whatsappTime: t("landing.loop.whatsapp.time"),
              aiLabel: t("landing.loop.ai.label"),
              aiCategory: t("landing.loop.ai.category"),
              aiSummary: t("landing.loop.ai.summary"),
              aiDisclaimer: t("landing.loop.ai.disclaimer"),
              replyLabel: t("landing.loop.reply.label"),
              replyBody: t("landing.loop.reply.body"),
              replyAuthor: t("landing.loop.reply.author"),
              exportLabel: t("landing.loop.export.label"),
              exportDetail: t("landing.loop.export.detail")
            }
          }}
          hrefs={{
            demo: demoHeroHref,
            owners: ownersHref,
            sandbox: sandboxHref
          }}
          locale={locale}
        />

        <LogoStrip
          footnote={t("landing.logos.consent_footnote")}
          heading={t("landing.logos.heading")}
          signals={pilotProofSignals}
        />

        <Problem
          body={t("landing.problem.body")}
          items={[
            t("landing.problem.item.1"),
            t("landing.problem.item.2"),
            t("landing.problem.item.3"),
            t("landing.problem.item.4")
          ]}
          kicker={t("landing.problem.kicker")}
          sceneCaption={t("landing.problem.scene_caption")}
          title={t("landing.problem.title")}
        />

        <Walkthrough
          beats={{
            one: t("landing.walkthrough.beat.1"),
            two: t("landing.walkthrough.beat.2"),
            three: t("landing.walkthrough.beat.3"),
            four: t("landing.walkthrough.beat.4")
          }}
          body={t("landing.walkthrough.body")}
          kicker={t("landing.walkthrough.kicker")}
          title={t("landing.walkthrough.title")}
        />

        <UseCases
          cards={[
            {
              id: "front",
              icon: "front",
              title: t("landing.usecases.front.title"),
              body: t("landing.usecases.front.body"),
              outcome: t("landing.usecases.front.outcome")
            },
            {
              id: "vet",
              icon: "vet",
              title: t("landing.usecases.vet.title"),
              body: t("landing.usecases.vet.body"),
              outcome: t("landing.usecases.vet.outcome")
            },
            {
              id: "owner",
              icon: "owner",
              title: t("landing.usecases.owner.title"),
              body: t("landing.usecases.owner.body"),
              outcome: t("landing.usecases.owner.outcome")
            }
          ]}
          kicker={t("landing.usecases.kicker")}
          title={t("landing.usecases.title")}
        />

        <OwnersBand
          kicker={t("landing.owners.kicker")}
          title={t("landing.owners.title")}
          body={t("landing.owners.body")}
          ctaPrimary={t("landing.owners.ctaPrimary")}
          ctaSecondary={t("landing.owners.ctaSecondary")}
          signInHref={ownerSignInHref}
          ownersHref={ownersHref}
        />

        <Integrations
          body={t("landing.integrations.body")}
          kicker={t("landing.integrations.kicker")}
          labels={{
            whatsapp: t("landing.integrations.whatsapp"),
            pms: t("landing.integrations.pms"),
            calendar: t("landing.integrations.calendar"),
            web: t("landing.integrations.web"),
            sms: t("landing.integrations.sms"),
            translate: t("landing.integrations.translate")
          }}
          title={t("landing.integrations.title")}
        />

        <AISafety
          body={t("landing.safety.body")}
          kicker={t("landing.safety.kicker")}
          taglineLine1={t("landing.safety.tagline_kinetic_1")}
          taglineLine2={t("landing.safety.tagline_kinetic_2")}
          training={t("landing.safety.training")}
          will={{
            title: t("landing.safety.will.title"),
            items: [
              t("landing.safety.will.1"),
              t("landing.safety.will.2"),
              t("landing.safety.will.3"),
              t("landing.safety.will.4")
            ]
          }}
          willNot={{
            title: t("landing.safety.willnot.title"),
            items: [
              t("landing.safety.willnot.1"),
              t("landing.safety.willnot.2"),
              t("landing.safety.willnot.3"),
              t("landing.safety.willnot.4")
            ]
          }}
        />

        <Compliance
          badges={[
            { id: "eu", label: t("landing.compliance.badge.eu") },
            { id: "gdpr", label: t("landing.compliance.badge.gdpr") },
            { id: "audit", label: t("landing.compliance.badge.audit") },
            { id: "soc", label: t("landing.compliance.badge.soc") },
            { id: "iso", label: t("landing.compliance.badge.iso") },
            { id: "aiact", label: t("landing.compliance.badge.aiact") }
          ]}
          body={t("landing.compliance.body")}
          kicker={t("landing.compliance.kicker")}
          strip={t("landing.compliance.strip")}
          title={t("landing.compliance.title")}
          training={t("landing.compliance.training")}
          trustCenterLink={t("landing.compliance.trustcenter_link")}
          trustCenterHref={trustHref}
        />

        <Testimonial
          author={t("landing.proof.author")}
          disclaimer={t("landing.proof.disclaimer")}
          kicker={t("landing.proof.kicker")}
          metric={t("landing.proof.metric")}
          metricLabel={t("landing.proof.metricLabel")}
          quote={t("landing.proof.quote")}
          title={t("landing.proof.title")}
        />

        <Pricing
          body={t("landing.pricing.body")}
          kicker={t("landing.pricing.kicker")}
          tier={{
            title: t("landing.pricing.tier.title"),
            body: t("landing.pricing.tier.body"),
            badge: t("landing.compliance.badge.eu"),
            features: [
              t("landing.pricing.feature.1"),
              t("landing.pricing.feature.2"),
              t("landing.pricing.feature.3"),
              t("landing.pricing.feature.4"),
              t("landing.pricing.feature.5")
            ],
            ctaPrimary: t("landing.pricing.cta"),
            ctaSecondary: t("landing.pricing.cta_secondary"),
            sandboxNote: t("landing.pricing.sandbox_note")
          }}
          hrefs={{
            demo: demoPricingHref,
            sandbox: sandboxHref
          }}
          locale={locale}
          title={t("landing.pricing.title")}
        />

        <FAQ
          items={[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
            id: `faq-${n}`,
            question: t(`landing.faq.q${n}` as `landing.faq.q1`),
            answer: t(`landing.faq.a${n}` as `landing.faq.a1`)
          }))}
          kicker={t("landing.faq.kicker")}
          title={t("landing.faq.title")}
        />

        <FinalCTA
          body={t("landing.cta.body")}
          hrefs={{
            demo: demoFinalHref,
            owners: ownersHref
          }}
          locale={locale}
          primary={t("landing.cta.primary")}
          secondary={t("landing.cta.secondary_owner")}
          title={t("landing.cta.title")}
        />
      </main>

      <Footer
        demoHref={demoFooterHref}
        intakeHref={intakeHref}
        ownersHref={ownersHref}
        ownerSignInHref={ownerSignInHref}
        signInHref={clinicSignInHref}
        privacyHref={privacyHref}
        cookiesHref={cookiesHref}
        subprocessorsHref={subprocessorsHref}
        t={t}
        trustHref={trustHref}
      />
      <MobileCTABar
        hrefs={{ demo: demoMobileHref, owners: ownersHref }}
        locale={locale}
        primary={t("landing.mobilebar.primary")}
        secondary={t("landing.mobilebar.secondary")}
      />
    </div>
  );
}

type Translator = ReturnType<typeof createTranslator>;
type Locale = Awaited<ReturnType<typeof getRequestLocale>>;

function TopNav({
  demoHref,
  locale,
  signInHref,
  t,
  ownersHref
}: {
  demoHref: string;
  locale: Locale;
  signInHref: string;
  t: Translator;
  ownersHref: string;
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

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
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
          <Link
            className="hidden rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)] lg:inline-flex"
            href={ownersHref}
          >
            {t("landing.nav.forOwners")}
          </Link>
          <LanguageSwitcher
            currentPath="/"
            label={t("language.label")}
            locale={locale}
          />
          <Link
            className="hidden rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)] lg:inline-flex"
            href={signInHref}
          >
            {t("landing.nav.signIn")}
          </Link>
          <Button asChild className="hidden sm:inline-flex" size="sm">
            <Link href={demoHref}>{t("landing.nav.bookDemo")}</Link>
          </Button>
          <MobileMarketingMenu
            hrefs={{
              demo: demoHref,
              owners: ownersHref,
              signIn: signInHref
            }}
            labels={{
              menu: t("landing.nav.menu"),
              close: t("landing.nav.close"),
              howItWorks: t("landing.nav.howItWorks"),
              safety: t("landing.nav.safety"),
              security: t("landing.nav.security"),
              pricing: t("landing.nav.pricing"),
              owners: t("landing.nav.forOwners"),
              signIn: t("landing.nav.signIn"),
              demo: t("landing.nav.bookDemo")
            }}
            locale={locale}
          />
        </div>
      </div>
    </header>
  );
}

function Footer({
  demoHref,
  t,
  intakeHref,
  ownersHref,
  ownerSignInHref,
  signInHref,
  privacyHref,
  cookiesHref,
  subprocessorsHref,
  trustHref
}: {
  demoHref: string;
  t: Translator;
  intakeHref: string;
  ownersHref: string;
  ownerSignInHref: string;
  signInHref: string;
  privacyHref: string;
  cookiesHref: string;
  subprocessorsHref: string;
  trustHref: string;
}) {
  const columns = [
    {
      heading: t("landing.footer.product"),
      links: [
        { href: "#how-it-works", label: t("landing.footer.howItWorks") },
        { href: "#safety", label: t("landing.footer.safety") },
        { href: "#security", label: t("landing.footer.compliance") },
        { href: "#pricing", label: t("landing.footer.pricing") },
        { href: signInHref, label: t("landing.nav.signIn") }
      ]
    },
    {
      heading: t("landing.footer.company"),
      links: [
        { href: "/design", label: t("landing.footer.changelog") },
        { href: "/health", label: t("landing.footer.status") },
        { href: trustHref, label: t("landing.footer.trust") },
        { href: "#how-it-works", label: t("landing.footer.manifesto") },
        { href: demoHref, label: t("landing.footer.contact") }
      ]
    },
    {
      heading: t("landing.footer.legalHeading"),
      links: [
        { href: privacyHref, label: t("landing.footer.privacy") },
        { href: cookiesHref, label: t("landing.footer.cookies") },
        { href: subprocessorsHref, label: t("landing.footer.subprocessors") },
        { href: trustHref, label: t("landing.footer.trust") }
      ]
    },
    {
      heading: t("landing.footer.owners"),
      links: [
        { href: ownersHref, label: t("landing.footer.owners") },
        { href: ownerSignInHref, label: t("owners.cta.primary") },
        { href: intakeHref, label: t("intake.title") }
      ]
    }
  ];
  const bottomLinks = [
    { href: privacyHref, label: t("landing.footer.privacy") },
    { href: cookiesHref, label: t("landing.footer.cookies") },
    {
      href: `${cookiesHref}#cookie-settings`,
      label: t("landing.footer.cookieSettings")
    },
    { href: subprocessorsHref, label: t("landing.footer.subprocessors") }
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
        <nav aria-label="Footer" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-5 text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span>{t("landing.footer.legal")}</span>
            {bottomLinks.map((link) => (
              <Link
                className="transition hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <span style={{ fontFamily: "var(--font-mono)" }}>PetCura · v1.0</span>
        </div>
      </div>
    </footer>
  );
}

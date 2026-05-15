import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  ShieldCheck,
  TriangleAlert
} from "lucide-react";
import { cn } from "@petcura/ui";
import { SectionKicker } from "./SectionKicker";

export type LegalPageShellLink = {
  href: string;
  label: string;
  description?: string;
  external?: boolean;
};

export type LegalPageShellCallout = {
  title: string;
  body: ReactNode;
  tone?: "trust" | "notice" | "caution";
};

type LegalPageShellStructuredListItem = {
  title: string;
  body?: ReactNode;
};

export type LegalPageShellListItem =
  | ReactNode
  | LegalPageShellStructuredListItem;

export type LegalPageShellSection = {
  id: string;
  eyebrow?: string;
  title: string;
  lede?: ReactNode;
  body?: ReactNode;
  items?: ReadonlyArray<LegalPageShellListItem>;
};

export type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  lede: ReactNode;
  updatedDate?: string;
  updatedDateTime?: string;
  updatedLabel?: string;
  sections: ReadonlyArray<LegalPageShellSection>;
  callouts?: ReadonlyArray<LegalPageShellCallout>;
  sidebarLinks?: ReadonlyArray<LegalPageShellLink>;
  sidebarLabel?: string;
  backLink?: LegalPageShellLink;
};

const calloutToneClasses = {
  trust: {
    icon: ShieldCheck,
    item: "border-[var(--primary-soft)] bg-[var(--paper)]",
    iconWrap: "bg-[var(--primary-soft)] text-[var(--primary-strong)]"
  },
  notice: {
    icon: FileText,
    item: "border-[var(--line)] bg-[var(--paper)]",
    iconWrap: "bg-[var(--surface-soft)] text-[var(--primary)]"
  },
  caution: {
    icon: TriangleAlert,
    item: "border-[var(--amber-soft)] bg-[var(--paper)]",
    iconWrap: "bg-[var(--amber-soft)] text-[var(--amber)]"
  }
} as const;

export function LegalPageShell({
  eyebrow,
  title,
  lede,
  updatedDate,
  updatedDateTime,
  updatedLabel = "Updated",
  sections,
  callouts = [],
  sidebarLinks,
  sidebarLabel = "On this page",
  backLink
}: LegalPageShellProps) {
  const resolvedSidebarLinks: ReadonlyArray<LegalPageShellLink> =
    sidebarLinks ??
    sections.map((section) => ({
      href: `#${section.id}`,
      label: section.title
    }));

  return (
    <main
      aria-labelledby="legal-page-title"
      className="min-h-screen bg-[var(--background)] text-[var(--foreground)]"
    >
      <section className="border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          {backLink ? (
            <LegalPageShellAnchor
              className="w-fit text-[var(--muted)] hover:text-[var(--foreground)]"
              link={backLink}
            >
              <ArrowLeft aria-hidden="true" size={14} />
              {backLink.label}
            </LegalPageShellAnchor>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.42fr)] lg:items-end">
            <div className="max-w-3xl">
              <SectionKicker>{eyebrow}</SectionKicker>
              <h1
                className="mt-5 text-4xl font-semibold leading-tight text-[var(--foreground)] sm:text-5xl"
                id="legal-page-title"
                style={{ textWrap: "balance" }}
              >
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
                {lede}
              </p>
            </div>

            {updatedDate ? (
              <div className="border-t border-[var(--line)] pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {updatedLabel}
                </p>
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                  <CalendarDays
                    aria-hidden="true"
                    className="text-[var(--primary)]"
                    size={16}
                  />
                  <time dateTime={updatedDateTime}>{updatedDate}</time>
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {callouts.length > 0 ? (
        <section
          aria-label="Trust notes"
          className="border-b border-[var(--line)] bg-[var(--surface-soft)]"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-3 px-4 py-6 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
            {callouts.map((callout) => {
              const tone = callout.tone ?? "notice";
              const toneConfig = calloutToneClasses[tone];
              const Icon = toneConfig.icon;

              return (
                <article
                  className={cn(
                    "flex gap-3 rounded-[var(--radius)] border p-4",
                    toneConfig.item
                  )}
                  key={callout.title}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)]",
                      toneConfig.iconWrap
                    )}
                  >
                    <Icon size={16} />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--foreground)]">
                      {callout.title}
                    </h2>
                    <div className="mt-1 text-sm leading-6 text-[var(--muted)] [&_a]:font-semibold [&_a]:text-[var(--primary-strong)] [&_a]:underline-offset-4 [&_a:focus-visible]:underline [&_a:hover]:underline">
                      {callout.body}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-8 lg:py-14">
        {resolvedSidebarLinks.length > 0 ? (
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <nav
              aria-label={sidebarLabel}
              className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-3"
            >
              <p
                className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {sidebarLabel}
              </p>
              <ul
                className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
                role="list"
              >
                {resolvedSidebarLinks.map((link) => (
                  <li className="min-w-fit lg:min-w-0" key={link.href}>
                    <LegalPageShellAnchor
                      className="group flex rounded-[var(--radius)] px-2 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)] focus-visible:bg-[var(--surface-soft)]"
                      link={link}
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate">{link.label}</span>
                        {link.description ? (
                          <span className="hidden text-xs font-normal leading-5 text-[var(--muted)] lg:block">
                            {link.description}
                          </span>
                        ) : null}
                      </span>
                      {isExternalLink(link) ? (
                        <ArrowUpRight
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 opacity-60"
                          size={14}
                        />
                      ) : null}
                    </LegalPageShellAnchor>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        ) : null}

        <div className="min-w-0">
          <div className="grid gap-10">
            {sections.map((section) => (
              <article
                aria-labelledby={`${section.id}-heading`}
                className="scroll-mt-8 border-t border-[var(--line)] pt-8 first:border-t-0 first:pt-0"
                id={section.id}
                key={section.id}
              >
                <div className="grid gap-5 lg:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)] lg:gap-10">
                  <div>
                    {section.eyebrow ? (
                      <p
                        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary-strong)]"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {section.eyebrow}
                      </p>
                    ) : null}
                    <h2
                      className="text-2xl font-semibold leading-tight text-[var(--foreground)] sm:text-3xl"
                      id={`${section.id}-heading`}
                      style={{ textWrap: "balance" }}
                    >
                      {section.title}
                    </h2>
                    {section.lede ? (
                      <div className="mt-3 text-sm leading-6 text-[var(--muted)]">
                        {section.lede}
                      </div>
                    ) : null}
                  </div>

                  <div className="min-w-0 text-sm leading-7 text-[var(--foreground)]">
                    {section.body ? (
                      <div className="space-y-4 text-[var(--muted)] [&_a]:font-semibold [&_a]:text-[var(--primary-strong)] [&_a]:underline-offset-4 [&_a:focus-visible]:underline [&_a:hover]:underline [&_strong]:font-semibold [&_strong]:text-[var(--foreground)]">
                        {section.body}
                      </div>
                    ) : null}

                    {section.items?.length ? (
                      <ul
                        className={cn(
                          "grid gap-3",
                          section.body ? "mt-5" : undefined
                        )}
                        role="list"
                      >
                        {section.items.map((item, index) => (
                          <li
                            className="flex gap-3 border-t border-[var(--line)] pt-3 first:border-t-0 first:pt-0"
                            key={`${section.id}-item-${index}`}
                          >
                            <CheckCircle2
                              aria-hidden="true"
                              className="mt-1 shrink-0 text-[var(--primary)]"
                              size={16}
                            />
                            <LegalPageShellListItemContent item={item} />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function LegalPageShellListItemContent({
  item
}: {
  item: LegalPageShellListItem;
}) {
  if (isStructuredListItem(item)) {
    return (
      <div>
        <p className="font-semibold text-[var(--foreground)]">{item.title}</p>
        {item.body ? (
          <div className="mt-1 text-[var(--muted)]">{item.body}</div>
        ) : null}
      </div>
    );
  }

  return <div className="text-[var(--muted)]">{item}</div>;
}

function LegalPageShellAnchor({
  children,
  className,
  link
}: {
  children: ReactNode;
  className?: string;
  link: LegalPageShellLink;
}) {
  const classes = cn(
    "inline-flex items-center gap-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
    className
  );

  if (isExternalLink(link)) {
    return (
      <a
        className={classes}
        href={link.href}
        rel="noreferrer"
        target="_blank"
      >
        {children}
      </a>
    );
  }

  return (
    <Link className={classes} href={link.href}>
      {children}
    </Link>
  );
}

function isExternalLink(link: LegalPageShellLink) {
  return link.external ?? /^https?:\/\//.test(link.href);
}

function isStructuredListItem(
  item: LegalPageShellListItem
): item is LegalPageShellStructuredListItem {
  return (
    typeof item === "object" &&
    item !== null &&
    !Array.isArray(item) &&
    "title" in item
  );
}

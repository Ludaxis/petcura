"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PawPrint, Search, SlidersHorizontal, Users, X } from "lucide-react";
import {
  createTranslator,
  localeOptions,
  type SupportedLocale
} from "@petcura/shared";
import { Badge, Spinner, cn } from "@petcura/ui";

type Tab = "owners" | "pets";
type Density = "comfortable" | "compact";
type Sort = "recent" | "name" | "latest" | "pets";

type DirectoryHeaderProps = {
  locale: SupportedLocale;
  tab: Tab;
  q: string;
  ownerCount: number;
  petCount: number;
  density: Density;
  sort: Sort;
  lang: string | undefined;
  species: string | undefined;
  speciesOptions: string[];
  openOnly: boolean;
  recentDays: number | undefined;
  status?: "saved";
  hasError?: boolean;
};

export function DirectoryHeader({
  locale,
  tab,
  q: initialQ,
  ownerCount,
  petCount,
  density,
  sort,
  lang,
  species,
  speciesOptions,
  openOnly,
  recentDays,
  status,
  hasError
}: DirectoryHeaderProps) {
  const t = createTranslator(locale);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);
  const [lastSyncedQ, setLastSyncedQ] = useState(initialQ);
  const initialMount = useRef(true);

  // Keep local search box in sync if the URL changes externally (e.g. tab
  // switch clears the query). Adjusting state during render is the React-
  // recommended pattern for this — avoids the useEffect cascade.
  if (initialQ !== lastSyncedQ) {
    setLastSyncedQ(initialQ);
    setQ(initialQ);
  }

  // Debounced URL push on search input change.
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      pushParams({ q: q.trim() || null, id: null });
    }, 250);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function pushParams(updates: Record<string, string | null | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === undefined || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function buildHref(updates: Record<string, string | null | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === undefined || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const tabs: Array<{ id: Tab; label: string; count: number; icon: typeof Users }> =
    [
      {
        id: "owners",
        label: t("directory.tabs.owners"),
        count: ownerCount,
        icon: Users
      },
      {
        id: "pets",
        label: t("directory.tabs.pets"),
        count: petCount,
        icon: PawPrint
      }
    ];

  const hasActiveFilters =
    Boolean(lang) ||
    Boolean(species && tab === "pets") ||
    openOnly ||
    Boolean(recentDays);

  const recentValue =
    recentDays === 7
      ? "7d"
      : recentDays === 30
        ? "30d"
        : recentDays === 90
          ? "90d"
          : "";

  return (
    <header className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
              <Users aria-hidden="true" size={16} />
            </span>
            <h1 className="text-[20px] font-semibold leading-tight text-[var(--ink)]">
              {t("directory.title")}
            </h1>
          </div>
          <p className="mt-1.5 max-w-3xl text-[12.5px] leading-5 text-[var(--muted)]">
            {t("directory.description")}
          </p>
        </div>
      </div>

      {status === "saved" ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 rounded-[var(--radius)] bg-[var(--primary-soft)] px-3 py-2 text-[12.5px] font-medium text-[var(--primary-strong)]"
        >
          {t("profile.saved")}
        </p>
      ) : null}
      {hasError ? (
        <p
          role="alert"
          aria-live="assertive"
          className="mt-3 rounded-[var(--radius)] bg-[var(--red-soft)] px-3 py-2 text-[12.5px] font-medium text-[var(--red)]"
        >
          {t("profile.error")}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Segmented tab control rendered as anchors so deep links work */}
        <nav
          aria-label={t("directory.title")}
          className="inline-flex h-9 items-center rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-0.5"
        >
          {tabs.map((item) => {
            const active = item.id === tab;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={buildHref({ tab: item.id, id: null })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded-[5px] px-3 text-[12.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
                  active
                    ? "bg-[var(--ink)] text-[var(--paper)]"
                    : "bg-transparent text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)]"
                )}
              >
                <Icon aria-hidden="true" size={13} />
                <span>{item.label}</span>
                <Badge tone="neutral">{item.count}</Badge>
              </Link>
            );
          })}
        </nav>

        {/* Search input with debounced URL push */}
        <div className="relative flex h-9 min-w-[220px] flex-1 items-center sm:max-w-md">
          <Search
            aria-hidden="true"
            size={14}
            className="pointer-events-none absolute left-2.5 text-[var(--muted-2)]"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("directory.search.placeholder")}
            aria-label={t("directory.search.placeholder")}
            className="h-9 w-full rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] pl-8 pr-8 text-[13px] text-[var(--ink)] placeholder:text-[var(--muted-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label={t("directory.search.clear")}
              className="absolute right-2 inline-flex h-5 w-5 items-center justify-center rounded text-[var(--muted-2)] hover:text-[var(--ink)]"
            >
              <X aria-hidden="true" size={12} />
            </button>
          ) : null}
          {pending ? (
            <span
              role="status"
              aria-label={t("directory.search.placeholder")}
              className="absolute right-7 inline-flex h-4 w-4 items-center justify-center text-[var(--primary)]"
            >
              <Spinner size={14} tone="primary" />
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            value={lang ?? ""}
            ariaLabel={t("directory.filter.language")}
            icon={<SlidersHorizontal aria-hidden="true" size={12} />}
            onChange={(value) => pushParams({ filterLang: value || null })}
            options={[
              { value: "", label: t("directory.filter.allLanguages") },
              ...localeOptions.map((option) => ({
                value: option.value,
                label: option.shortLabel
              }))
            ]}
          />

          {tab === "pets" ? (
            <FilterSelect
              value={species ?? ""}
              ariaLabel={t("directory.filter.species")}
              icon={<PawPrint aria-hidden="true" size={12} />}
              onChange={(value) => pushParams({ species: value || null })}
              options={[
                { value: "", label: t("directory.filter.allSpecies") },
                ...speciesOptions.map((value) => ({ value, label: value }))
              ]}
            />
          ) : null}

          <Link
            href={buildHref({ open: openOnly ? null : "1", id: null })}
            aria-pressed={openOnly}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border px-2.5 text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
              openOnly
                ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-strong)]"
                : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)]"
            )}
          >
            {t("directory.filter.openRequests")}
          </Link>

          <FilterSelect
            value={recentValue}
            ariaLabel={t("directory.filter.recent")}
            onChange={(value) => pushParams({ recent: value || null })}
            options={[
              { value: "", label: t("directory.filter.recent") },
              { value: "7d", label: t("directory.filter.recent.7d") },
              { value: "30d", label: t("directory.filter.recent.30d") },
              { value: "90d", label: t("directory.filter.recent.90d") }
            ]}
          />

          <FilterSelect
            value={sort === "recent" ? "" : sort}
            ariaLabel={t("directory.sort.label")}
            onChange={(value) => pushParams({ sort: value || null })}
            options={[
              { value: "", label: t("directory.sort.recent") },
              { value: "name", label: t("directory.sort.name") },
              { value: "latest", label: t("directory.sort.latest") },
              { value: "pets", label: t("directory.sort.pets") }
            ]}
          />

          <nav
            aria-label={t("directory.density.label")}
            className="inline-flex h-9 items-center rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-0.5"
          >
            {(["comfortable", "compact"] as const).map((option) => {
              const active = density === option;
              return (
                <Link
                  key={option}
                  href={buildHref({
                    density: option === "comfortable" ? null : "compact"
                  })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-8 items-center justify-center rounded-[5px] px-2 text-[11.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
                    active
                      ? "bg-[var(--ink)] text-[var(--paper)]"
                      : "bg-transparent text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)]"
                  )}
                >
                  {t(
                    option === "comfortable"
                      ? "directory.density.comfortable"
                      : "directory.density.compact"
                  )}
                </Link>
              );
            })}
          </nav>

          {hasActiveFilters || q ? (
            <Link
              href={buildHref({
                filterLang: null,
                species: null,
                open: null,
                recent: null,
                sort: null,
                q: null
              })}
              className="inline-flex h-9 items-center gap-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2.5 text-[12px] text-[var(--muted)] hover:text-[var(--ink)]"
            >
              <X aria-hidden="true" size={12} />
              {t("directory.filter.clear")}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

type FilterSelectProps = {
  value: string;
  ariaLabel: string;
  icon?: React.ReactNode;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
};

function FilterSelect({
  value,
  ariaLabel,
  icon,
  options,
  onChange
}: FilterSelectProps) {
  return (
    <label className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2 text-[12px] text-[var(--muted)] focus-within:ring-2 focus-within:ring-[var(--primary-soft)]">
      {icon}
      <span className="sr-only">{ariaLabel}</span>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent pr-1 text-[12px] text-[var(--ink)] outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

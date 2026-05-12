import "server-only";

import { createTranslator, type SupportedLocale } from "@petcura/shared";
import type { StaffContext } from "@/lib/auth/staff";
import {
  listClinicCustomers,
  listClinicPets,
  type DirectorySort
} from "@/lib/clinic/directory";
import { OwnerRow } from "./OwnerRow";
import { PetRow } from "./PetRow";

type DirectoryTab = "owners" | "pets";

type DirectoryListSectionProps = {
  staffContext: StaffContext;
  locale: SupportedLocale;
  tab: DirectoryTab;
  q: string;
  sort: DirectorySort;
  selectedLanguage: string | undefined;
  selectedSpecies: string | undefined;
  recentDays: number | undefined;
  hasOpenRequest: boolean;
  canEditOwners: boolean;
  canEditPets: boolean;
  selectedId?: string | undefined;
  /** Optional URL prefix to append `&id=<row.id>` against for row links. */
  queryString?: string;
};

function formatRelativeFor(locale: SupportedLocale) {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const dtf = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  return (iso: string) => {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const diffMs = then - Date.now();
    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const abs = Math.abs(diffMs);
    if (abs < hour) return rtf.format(Math.round(diffMs / minute), "minute");
    if (abs < day) return rtf.format(Math.round(diffMs / hour), "hour");
    if (abs < 30 * day) return rtf.format(Math.round(diffMs / day), "day");
    return dtf.format(new Date(iso));
  };
}

/**
 * Async server component that performs the per-tab directory fetch and
 * renders the list of OwnerRow / PetRow. Wrapped by the page in
 * `<Suspense key=...>` so tab and filter changes show DirectoryListSkeleton
 * in ~100ms instead of blocking the whole route segment.
 */
export async function DirectoryListSection({
  staffContext,
  locale,
  tab,
  q,
  sort,
  selectedLanguage,
  selectedSpecies,
  recentDays,
  hasOpenRequest,
  canEditOwners,
  canEditPets,
  selectedId
}: DirectoryListSectionProps) {
  const t = createTranslator(locale);
  const formatRelative = formatRelativeFor(locale);

  if (tab === "owners") {
    const owners = await listClinicCustomers(
      staffContext.supabase,
      staffContext.clinic.id,
      {
        q,
        hasOpenRequest,
        sort,
        limit: 60,
        ...(selectedLanguage ? { lang: selectedLanguage } : {}),
        ...(recentDays ? { recentDays } : {})
      }
    );

    if (owners.rows.length === 0) {
      return (
        <p className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-6 text-[13px] text-[var(--muted)]">
          {t("directory.results.emptyOwners")}
        </p>
      );
    }

    return (
      <div className="grid">
        {owners.rows.map((owner, index) => (
          <OwnerRow
            key={owner.id}
            owner={owner}
            locale={locale}
            selected={selectedId === owner.id}
            density="comfortable"
            href={`/directory?tab=owners&id=${encodeURIComponent(owner.id)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            formatRelative={formatRelative}
            index={index}
            canEdit={canEditOwners}
          />
        ))}
      </div>
    );
  }

  const pets = await listClinicPets(
    staffContext.supabase,
    staffContext.clinic.id,
    {
      q,
      hasOpenRequest,
      sort,
      limit: 60,
      ...(selectedSpecies ? { species: selectedSpecies } : {}),
      ...(recentDays ? { recentDays } : {})
    }
  );

  if (pets.rows.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-6 text-[13px] text-[var(--muted)]">
        {t("directory.results.emptyPets")}
      </p>
    );
  }

  return (
    <div className="grid">
      {pets.rows.map((pet, index) => (
        <PetRow
          key={pet.id}
          pet={pet}
          locale={locale}
          selected={selectedId === pet.id}
          density="comfortable"
          href={`/directory?tab=pets&id=${encodeURIComponent(pet.id)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          formatRelative={formatRelative}
          index={index}
          canEdit={canEditPets}
        />
      ))}
    </div>
  );
}

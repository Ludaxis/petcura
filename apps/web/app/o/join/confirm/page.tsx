import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PawPrint } from "@phosphor-icons/react/dist/ssr";
import { createTranslator } from "@petcura/shared";
import { getRequestLocale } from "@/lib/locale";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { JoinHero } from "../_components/JoinHero";
import { consumeJoinToken } from "../actions";

type JoinMeta = {
  clinicId: string;
  clinicName: string;
  petId?: string;
  petName?: string;
  petSpecies?: string;
};

type Props = {
  searchParams?: Promise<{
    lang?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeParseMeta(raw: string | undefined): JoinMeta | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as JoinMeta;
    if (typeof parsed?.clinicName !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export default async function JoinConfirmPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = await getRequestLocale(getSearchParam(params?.lang));
  const t = createOwnerTranslator(locale);
  const tClinic = createTranslator(locale);
  const cookieStore = await cookies();
  const meta = safeParseMeta(cookieStore.get("pc_join_meta")?.value);

  if (!meta || !cookieStore.get("pc_join_token")) {
    redirect("/o/login?reason=invite_expired");
  }

  const heading = meta.petName
    ? t("join.subheadingWithPet", { petName: meta.petName })
    : t("join.subheadingNoPet");
  const primaryLabel = meta.petName
    ? t("join.cta.continue", { petName: meta.petName })
    : t("join.cta.continueNoPet");

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--paper)] text-[var(--ink)]">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-[var(--primary)] text-[var(--paper)]"
          >
            <PawPrint size={19} weight="fill" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-[var(--ink)]">
            PetCura
          </span>
        </div>
        <LanguageSwitcher
          currentPath="/o/join/confirm"
          label={tClinic("language.label")}
          locale={locale}
        />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="flex w-full flex-col items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary-strong)]">
            {t("join.eyebrow", { clinicName: meta.clinicName })}
          </p>
          <p className="sr-only">
            {/* second-level heading hint for assistive tech */}
            {heading}
          </p>
        </div>
        <div className="mt-4 w-full">
          <JoinHero
            clinicName={meta.clinicName}
            petName={meta.petName}
            body={t("join.body")}
            primaryLabel={primaryLabel}
            notMeLabel={t("join.notMe")}
            termsCopy={t("join.terms")}
            consumeAction={consumeJoinToken}
            notMeHref="/intake"
            locale={locale}
          />
        </div>
      </main>
    </div>
  );
}

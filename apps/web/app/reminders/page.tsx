import { Bell } from "lucide-react";
import { createTranslator } from "@petcura/shared";
import { AppShell } from "@/app/_components/AppShell";
import { ComingSoonCard } from "@/app/_components/ComingSoonCard";
import { getRequestLocale } from "@/lib/locale";

type Props = {
  searchParams?: Promise<{ lang?: string | string[] }>;
};

export default async function RemindersPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const langParam = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const locale = await getRequestLocale(langParam);
  const t = createTranslator(locale);
  return (
    <AppShell locale={locale} currentPath="/reminders">
      <ComingSoonCard
        Icon={Bell}
        title={t("nav.reminders")}
        body={t("comingSoon.body")}
        comingSoonTitle={t("comingSoon.title")}
      />
    </AppShell>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@petcura/ui";
import { getRequestLocale } from "@/lib/locale";

const COPY = {
  en: {
    eyebrow: "PetCura · 404",
    title: "We can't find that page.",
    body: "The link may be old, or the request might belong to a different clinic. Head back to the home page or jump into the clinic inbox.",
    home: "Back to home",
    inbox: "Clinic inbox"
  },
  et: {
    eyebrow: "PetCura · 404",
    title: "Seda lehte ei leitud.",
    body: "Link võib olla vananenud või pöördumine kuulub teisele kliinikule. Mine tagasi avalehele või kliiniku postkasti.",
    home: "Avalehele",
    inbox: "Kliiniku postkast"
  },
  ru: {
    eyebrow: "PetCura · 404",
    title: "Страница не найдена.",
    body: "Ссылка может быть устаревшей или запрос принадлежит другой клинике. Вернитесь на главную или откройте входящие клиники.",
    home: "На главную",
    inbox: "Клиника"
  }
} as const;

export default async function NotFoundPage() {
  const locale = await getRequestLocale();
  const copy = COPY[locale];

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-xl flex-col gap-7 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-10 shadow-sm">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--primary)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {copy.eyebrow}
        </span>
        <h1 className="text-3xl font-semibold tracking-[-0.015em] text-[var(--ink)]">
          {copy.title}
        </h1>
        <p className="text-[14px] leading-[1.55] text-[var(--ink-2)]">
          {copy.body}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="primary">
            <Link href="/">
              <ArrowLeft aria-hidden="true" size={16} />
              {copy.home}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/inbox">{copy.inbox}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

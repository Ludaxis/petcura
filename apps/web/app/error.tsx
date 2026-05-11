"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@petcura/ui";

const COPY = {
  en: {
    eyebrow: "PetCura · something broke",
    title: "We hit an unexpected error.",
    body: "Sorry about that. The error has been logged. Try again, or head back to the home page.",
    retry: "Try again",
    home: "Back to home"
  },
  et: {
    eyebrow: "PetCura · midagi läks valesti",
    title: "Tekkis ootamatu viga.",
    body: "Vabandust. Viga on logitud. Proovi uuesti või mine tagasi avalehele.",
    retry: "Proovi uuesti",
    home: "Avalehele"
  },
  ru: {
    eyebrow: "PetCura · что-то сломалось",
    title: "Произошла непредвиденная ошибка.",
    body: "Извините. Ошибка записана. Попробуйте ещё раз или вернитесь на главную.",
    retry: "Попробовать снова",
    home: "На главную"
  }
} as const;

type Locale = keyof typeof COPY;

function resolveLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const lang = document.documentElement.lang?.slice(0, 2).toLowerCase();
  if (lang === "et" || lang === "ru") return lang;
  return "en";
}

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[petcura] route error", error);
  }, [error]);

  const copy = COPY[resolveLocale()];

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-xl flex-col gap-7 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-10 shadow-sm">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--red)]"
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
        {error.digest ? (
          <p
            className="text-[11px] text-[var(--muted)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            error_id: {error.digest}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => reset()} variant="primary">
            <RefreshCw aria-hidden="true" size={16} />
            {copy.retry}
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">
              <ArrowLeft aria-hidden="true" size={16} />
              {copy.home}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

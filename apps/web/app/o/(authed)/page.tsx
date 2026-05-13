import Link from "next/link";
import {
  ArrowRight,
  ChatCircle,
  Plus,
  Stethoscope
} from "@phosphor-icons/react/dist/ssr";
import { Button, cn } from "@petcura/ui";
import { getRequestLocale } from "@/lib/locale";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import {
  listOwnerAppointments,
  listOwnerPets,
  listOwnerRequests,
  listOwnerVaccinations,
  toOwnerProfile
} from "@/lib/owner/data";
import { requireOwnerContext } from "@/lib/owner/auth";
import {
  aggregateVaccineUrgency,
  formatDate,
  formatRelative,
  vaccineUrgency
} from "@/lib/owner/format";
import { PetCard } from "./_components/PetCard";

export default async function OwnerHomePage() {
  const locale = await getRequestLocale();
  const context = await requireOwnerContext(locale, "/o");
  const t = createOwnerTranslator(locale);
  const owner = toOwnerProfile(context);
  const [pets, vaccinations, appointments, requests] = await Promise.all([
    listOwnerPets(context),
    listOwnerVaccinations(context),
    listOwnerAppointments(context, locale),
    listOwnerRequests(context)
  ]);
  const firstName = owner.name.split(" ")[0] ?? "";

  const petStatus = (petId: string) => {
    const urgency = aggregateVaccineUrgency(
      vaccinations
        .filter((v) => v.petId === petId)
        .map((v) => vaccineUrgency(v.nextDueAt))
    );
    if (urgency === "overdue")
      return { tone: "alert" as const, label: t("pet.vax.overdue") };
    if (urgency === "due_soon")
      return { tone: "warn" as const, label: t("pet.vax.dueSoon") };
    return null;
  };

  const latestRequest =
    requests
      .slice()
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))[0] ??
    null;

  const upcoming = [
    ...appointments.map((a) => ({
      id: a.id,
      title: `${a.serviceName} · ${a.petName}`,
      when: a.scheduledAt ?? a.proposedWindowStart
    })),
    ...vaccinations
      .filter((v) => v.nextDueAt && vaccineUrgency(v.nextDueAt) !== "ok")
      .map((v) => ({
        id: v.id,
        title: `${v.vaccineName} · ${pets.find((p) => p.id === v.petId)?.name ?? ""}`,
        when: v.nextDueAt!
      }))
  ].sort((a, b) => a.when.localeCompare(b.when));

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
          {t("app.name")}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
          {firstName
            ? t("home.greeting", { name: firstName })
            : t("home.greetingFallback")}
        </h1>
      </header>

      <section aria-labelledby="pets-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="pets-heading"
            className="text-sm font-semibold uppercase tracking-[0.06em] text-[var(--muted)]"
          >
            {t("home.pets.title")}
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/o/me">
              <Plus size={14} weight="bold" aria-hidden />
              {t("home.pets.add")}
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              locale={locale}
              status={petStatus(pet.id)}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section
          aria-labelledby="conversation-heading"
          className="flex flex-col rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)] p-5"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2
              id="conversation-heading"
              className="text-sm font-semibold uppercase tracking-[0.06em] text-[var(--muted)]"
            >
              {t("home.conversation.title")}
            </h2>
            {latestRequest ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/o/chat/${latestRequest.id}`}>
                  {t("home.conversation.open")}
                  <ArrowRight size={14} weight="bold" aria-hidden />
                </Link>
              </Button>
            ) : null}
          </div>
          {latestRequest ? (
            <Link
              href={`/o/chat/${latestRequest.id}`}
              className={cn(
                "block rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)] p-4",
                "transition-colors hover:border-[var(--line-2)] hover:bg-[var(--paper)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
              )}
            >
              <p className="flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                <span>{latestRequest.petName}</span>
                <span>{formatRelative(latestRequest.lastMessageAt, locale)}</span>
              </p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--ink)]">
                {latestRequest.lastMessagePreview}
              </p>
              {latestRequest.unreadByOwner > 0 ? (
                <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[var(--primary-strong)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                  {latestRequest.unreadByOwner}
                </p>
              ) : null}
            </Link>
          ) : (
            <p className="text-sm leading-6 text-[var(--muted)]">
              {t("home.conversation.empty")}
            </p>
          )}
        </section>

        <section
          aria-labelledby="upcoming-heading"
          className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)] p-5"
        >
          <h2
            id="upcoming-heading"
            className="mb-3 text-sm font-semibold uppercase tracking-[0.06em] text-[var(--muted)]"
          >
            {t("home.upcoming.title")}
          </h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{t("home.upcoming.empty")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {upcoming.slice(0, 4).map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)] p-3"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--paper)] text-[var(--primary)]">
                    <Stethoscope size={15} weight="duotone" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--ink)]">
                      {item.title}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{formatDate(item.when, locale)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="quick-heading" className="mt-1">
        <h2
          id="quick-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-[0.06em] text-[var(--muted)]"
        >
          {t("home.quick.title")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/o/chat"
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)] p-4",
              "transition-colors hover:border-[var(--line-2)] hover:bg-[var(--soft)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
              <ChatCircle size={20} weight="duotone" aria-hidden />
            </span>
            <span className="text-sm font-medium text-[var(--ink)]">{t("home.quick.ask")}</span>
            <ArrowRight size={16} weight="regular" aria-hidden className="ml-auto text-[var(--muted-2)]" />
          </Link>
          <Link
            href="/o/services"
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)] p-4",
              "transition-colors hover:border-[var(--line-2)] hover:bg-[var(--soft)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
              <Stethoscope size={20} weight="duotone" aria-hidden />
            </span>
            <span className="text-sm font-medium text-[var(--ink)]">{t("home.quick.book")}</span>
            <ArrowRight size={16} weight="regular" aria-hidden className="ml-auto text-[var(--muted-2)]" />
          </Link>
        </div>
      </section>
    </div>
  );
}

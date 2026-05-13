import {
  Bell,
  CaretRight,
  DownloadSimple,
  Pause,
  ShieldCheck,
  SignOut,
  Trash
} from "@phosphor-icons/react/dist/ssr";
import { Button, cn } from "@petcura/ui";
import { getRequestLocale } from "@/lib/locale";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import { mockClinic, mockOwner } from "@/lib/owner/mock";
import { localeOptions } from "@petcura/shared";

export default async function MePage() {
  const locale = await getRequestLocale();
  const t = createOwnerTranslator(locale);
  const owner = mockOwner;

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">{t("me.title")}</h1>
      </header>

      <section
        aria-labelledby="profile-heading"
        className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)] p-5"
      >
        <h2 id="profile-heading" className="mb-4 text-sm font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
          {t("me.profile.title")}
        </h2>
        <dl className="flex flex-col gap-3 text-sm">
          <ProfileRow label={t("me.profile.name")} value={owner.name} />
          <ProfileRow label={t("me.profile.email")} value={owner.email ?? "—"} />
          <ProfileRow label={t("me.profile.phone")} value={owner.phone} />
          <div className="flex items-center justify-between border-t border-[var(--line)] pt-3">
            <dt className="text-[var(--muted)]">{t("me.profile.language")}</dt>
            <dd className="flex gap-1">
              {localeOptions.map((opt) => (
                <span
                  key={opt.value}
                  className={cn(
                    "rounded-[var(--radius)] px-2.5 py-1 text-xs font-semibold",
                    opt.value === owner.preferredLanguage
                      ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]"
                      : "bg-[var(--soft)] text-[var(--muted)]"
                  )}
                >
                  {opt.shortLabel}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </section>

      <section
        aria-labelledby="notify-heading"
        className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)] p-5"
      >
        <h2 id="notify-heading" className="mb-4 text-sm font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
          {t("me.notifications.title")}
        </h2>
        <ul className="flex flex-col gap-2">
          <ToggleRow icon={<Bell size={16} weight="duotone" aria-hidden />} label={t("me.notifications.push")} checked />
          <ToggleRow icon={<Pause size={16} weight="regular" aria-hidden />} label={t("me.notifications.pause")} checked={false} />
        </ul>
      </section>

      <section
        aria-labelledby="clinics-heading"
        className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)] p-5"
      >
        <h2 id="clinics-heading" className="mb-4 text-sm font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
          {t("me.clinics.title")}
        </h2>
        <div className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)] px-4 py-3 text-sm">
          <span className="font-medium text-[var(--ink)]">{mockClinic.name}</span>
          <span className="text-xs text-[var(--muted)]">{mockClinic.timezone}</span>
        </div>
      </section>

      <section
        aria-labelledby="gdpr-heading"
        className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)] p-5"
      >
        <h2 id="gdpr-heading" className="mb-4 text-sm font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
          {t("me.gdpr.title")}
        </h2>
        <ul className="flex flex-col gap-2">
          <ActionRow icon={<DownloadSimple size={16} weight="regular" aria-hidden />} label={t("me.gdpr.export")} />
          <ActionRow icon={<ShieldCheck size={16} weight="duotone" aria-hidden />} label={t("me.gdpr.privacy")} />
          <ActionRow icon={<Trash size={16} weight="regular" aria-hidden />} label={t("me.gdpr.delete")} tone="destructive" />
        </ul>
      </section>

      <Button variant="secondary" className="self-start">
        <SignOut size={16} weight="regular" aria-hidden />
        {t("me.signout")}
      </Button>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="truncate text-right font-medium text-[var(--ink)]">{value}</dd>
    </div>
  );
}

function ToggleRow({ icon, label, checked }: { icon: React.ReactNode; label: string; checked: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)] px-4 py-3">
      <span className="flex items-center gap-3 text-sm text-[var(--ink)]">
        <span className="text-[var(--muted)]">{icon}</span>
        {label}
      </span>
      <span
        role="switch"
        aria-checked={checked}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          checked ? "bg-[var(--primary)]" : "bg-[var(--line-2)]"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-[var(--paper)] transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </span>
    </li>
  );
}

function ActionRow({
  icon,
  label,
  tone = "default"
}: {
  icon: React.ReactNode;
  label: string;
  tone?: "default" | "destructive";
}) {
  return (
    <li>
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)] px-4 py-3 text-sm",
          "transition-colors hover:bg-[var(--paper)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
          tone === "destructive" ? "text-[var(--red)] hover:text-[var(--red)]" : "text-[var(--ink)]"
        )}
      >
        <span className={cn(tone === "destructive" ? "text-[var(--red)]" : "text-[var(--muted)]")}>
          {icon}
        </span>
        <span className="flex-1 text-left font-medium">{label}</span>
        <CaretRight size={14} weight="bold" aria-hidden className="text-[var(--muted-2)]" />
      </button>
    </li>
  );
}

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
import { requireOwnerContext } from "@/lib/owner/auth";
import { toOwnerProfile } from "@/lib/owner/data";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import { getSignedProfileImageUrl } from "@/lib/profile-media";
import { localeOptions } from "@petcura/shared";
import {
  ProfileEditorCard,
  ProfileField,
  profileInputClass
} from "@/app/_components/profile/ProfileEditor";
import { updateOwnerSelfProfile } from "../actions";
import { signOutOwner } from "../../login/actions";

export default async function MePage() {
  const locale = await getRequestLocale();
  const context = await requireOwnerContext(locale, "/o/me");
  const t = createOwnerTranslator(locale);
  const owner = toOwnerProfile(context);
  const ownerPhotoUrl = await getSignedProfileImageUrl(context.owner.photo_url);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">{t("me.title")}</h1>
      </header>

      <ProfileEditorCard
        action={updateOwnerSelfProfile}
        description={<span>{t("me.profile.help")}</span>}
        hiddenFields={<input name="lang" type="hidden" value={locale} />}
        imageLabel={t("me.profile.photo")}
        imageUrl={ownerPhotoUrl}
        name={owner.name}
        submitLabel={t("me.profile.save")}
        title={t("me.profile.title")}
      >
        <ProfileField htmlFor="owner-self-name" label={t("me.profile.name")}>
          <input
            className={profileInputClass}
            defaultValue={owner.name}
            id="owner-self-name"
            name="name"
            required
          />
        </ProfileField>
        <ProfileField htmlFor="owner-self-email" label={t("me.profile.email")}>
          <input
            className={profileInputClass}
            defaultValue={owner.email ?? ""}
            id="owner-self-email"
            name="email"
            type="email"
          />
        </ProfileField>
        <ProfileField htmlFor="owner-self-phone" label={t("me.profile.phone")}>
          <input
            className={profileInputClass}
            defaultValue={owner.phone}
            disabled
            id="owner-self-phone"
            name="phone"
            type="tel"
          />
        </ProfileField>
        <ProfileField
          htmlFor="owner-self-language"
          label={t("me.profile.language")}
        >
          <select
            className={profileInputClass}
            defaultValue={owner.preferredLanguage}
            id="owner-self-language"
            name="preferredLanguage"
          >
            {localeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </ProfileField>
      </ProfileEditorCard>

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
        <div className="flex flex-col gap-2">
          {context.memberships.map((membership) => (
            <div
              key={membership.clinicId}
              className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)] px-4 py-3 text-sm"
            >
              <span className="font-medium text-[var(--ink)]">{membership.clinic.name}</span>
              <span className="text-xs text-[var(--muted)]">{membership.clinic.timezone}</span>
            </div>
          ))}
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

      <form action={signOutOwner}>
        <Button variant="secondary" className="self-start">
          <SignOut size={16} weight="regular" aria-hidden />
          {t("me.signout")}
        </Button>
      </form>
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
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
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

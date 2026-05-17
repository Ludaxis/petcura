"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ChatCircle, CalendarHeart, User, PawPrint } from "@phosphor-icons/react";
import { cn } from "@petcura/ui";
import type { SupportedLocale } from "@petcura/shared";
import { createOwnerTranslator } from "@/lib/owner/i18n";

type Props = {
  locale: SupportedLocale;
  clinicName: string;
  unreadCount?: number;
};

export function OwnerSideRail({ locale, clinicName, unreadCount = 0 }: Props) {
  const t = createOwnerTranslator(locale);
  const pathname = usePathname() ?? "/";

  const items = [
    { href: "/o", label: t("tab.home"), Icon: House, active: pathname === "/o" || pathname.startsWith("/o/pets") },
    { href: "/o/chat", label: t("tab.chat"), Icon: ChatCircle, active: pathname.startsWith("/o/chat"), badge: unreadCount },
    { href: "/o/services", label: t("tab.services"), Icon: CalendarHeart, active: pathname.startsWith("/o/services") },
    { href: "/o/me", label: t("tab.me"), Icon: User, active: pathname.startsWith("/o/me") }
  ];

  return (
    <aside
      className="hidden lg:flex lg:w-64 lg:flex-col lg:gap-2 lg:border-r lg:border-[var(--line)] lg:bg-[var(--soft)] lg:px-4 lg:py-6"
      aria-label={t("app.name")}
    >
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-[var(--primary)] text-[var(--paper)]">
          <PawPrint size={20} weight="fill" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--ink)]">
            {t("app.name")}
          </p>
          <p className="truncate text-xs text-[var(--muted)]">{clinicName}</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(({ href, label, Icon, active, badge }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
              active
                ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]"
                : "text-[var(--muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
            )}
          >
            <Icon size={18} weight={active ? "fill" : "regular"} aria-hidden />
            <span className="flex-1">{label}</span>
            {badge && badge > 0 ? (
              <span
                aria-hidden
                className="inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-semibold text-[var(--paper)]"
              >
                {badge > 9 ? "9+" : badge}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

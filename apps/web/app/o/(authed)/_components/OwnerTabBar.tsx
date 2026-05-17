"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ChatCircle, CalendarHeart, User } from "@phosphor-icons/react";
import { cn } from "@petcura/ui";
import type { SupportedLocale } from "@petcura/shared";
import { createOwnerTranslator } from "@/lib/owner/i18n";

type Props = {
  locale: SupportedLocale;
  unreadCount?: number;
};

export function OwnerTabBar({ locale, unreadCount = 0 }: Props) {
  const t = createOwnerTranslator(locale);
  const pathname = usePathname() ?? "/";

  const items = [
    { href: "/o", label: t("tab.home"), Icon: House, active: pathname === "/o" || pathname.startsWith("/o/pets") },
    { href: "/o/chat", label: t("tab.chat"), Icon: ChatCircle, active: pathname.startsWith("/o/chat"), badge: unreadCount },
    { href: "/o/services", label: t("tab.services"), Icon: CalendarHeart, active: pathname.startsWith("/o/services") },
    { href: "/o/me", label: t("tab.me"), Icon: User, active: pathname.startsWith("/o/me") }
  ];

  return (
    <nav
      role="navigation"
      aria-label={t("app.name")}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch gap-1",
        "border-t border-[var(--line)] bg-[var(--paper)] px-2 pb-[max(env(safe-area-inset-bottom),0px)] pt-1",
        "lg:hidden"
      )}
    >
      {items.map(({ href, label, Icon, active, badge }) => (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-pill)] px-1 text-[11px] font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]",
            active
              ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]"
              : "text-[var(--muted-2)] hover:text-[var(--ink)]"
          )}
        >
          <span className="relative inline-flex h-5 w-5 items-center justify-center">
            <Icon size={20} weight={active ? "fill" : "regular"} aria-hidden />
            {badge && badge > 0 ? (
              <span
                aria-hidden
                className="absolute -right-1.5 -top-0.5 inline-flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[9px] font-semibold text-[var(--paper)] ring-2 ring-[var(--paper)]"
              >
                {badge > 9 ? "9+" : badge}
              </span>
            ) : null}
          </span>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

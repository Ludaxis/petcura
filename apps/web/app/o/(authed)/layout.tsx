import type { ReactNode } from "react";
import { getRequestLocale } from "@/lib/locale";
import { mockClinic, mockRequests } from "@/lib/owner/mock";
import { OwnerSideRail } from "./_components/OwnerSideRail";
import { OwnerTabBar } from "./_components/OwnerTabBar";

type Props = {
  children: ReactNode;
};

export default async function OwnerLayout({ children }: Props) {
  const locale = await getRequestLocale();
  const clinic = mockClinic;
  const unreadCount = mockRequests.reduce((n, r) => n + r.unreadByOwner, 0);

  return (
    <div className="min-h-dvh bg-[var(--paper)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1280px]">
        <OwnerSideRail
          locale={locale}
          clinicName={clinic.name}
          unreadCount={unreadCount}
        />
        <main
          id="owner-main"
          className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0"
        >
          {children}
        </main>
      </div>
      <OwnerTabBar locale={locale} unreadCount={unreadCount} />
    </div>
  );
}

import { createTranslator, type CopyKey } from "@petcura/shared";
import {
  Shimmer,
  SkeletonCard,
  SkeletonList,
  SkeletonText
} from "@petcura/ui";
import { getRequestLocale } from "@/lib/locale";
import { AppShell } from "./AppShell";

type DashboardLoadingVariant =
  | "admin"
  | "directory"
  | "inbox"
  | "profile"
  | "record"
  | "reminders"
  | "reports"
  | "request"
  | "settings";

type DashboardRouteLoadingProps = {
  currentPath: string;
  label: string;
  pageTitleKey: CopyKey;
  variant: DashboardLoadingVariant;
};

function HeaderSkeleton({
  description = true,
  tabs = false
}: {
  description?: boolean;
  tabs?: boolean;
}) {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Shimmer className="h-8 w-8 rounded-[var(--radius)]" />
            <Shimmer className="h-6 w-40 rounded" />
          </div>
          {description ? (
            <Shimmer className="mt-2 h-3 w-full max-w-[28rem] rounded" />
          ) : null}
        </div>
        <Shimmer className="h-6 w-16 rounded-full" />
      </div>
      {tabs ? (
        <div className="mt-4 flex gap-2 overflow-hidden">
          {[80, 88, 112, 104].map((width) => (
            <Shimmer
              key={width}
              className="h-8 shrink-0 rounded-full"
              style={{ width }}
            />
          ))}
        </div>
      ) : null}
    </header>
  );
}

function ToolbarSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-3 shadow-sm">
      <div className="flex gap-2">
        <Shimmer className="h-9 w-28 rounded-[var(--radius)]" />
        <Shimmer className="h-9 w-24 rounded-[var(--radius)]" />
      </div>
      <Shimmer className="h-9 w-40 rounded-[var(--radius)]" />
    </div>
  );
}

function CardGridSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonCard key={i} icon lines={3} footer={i % 2 === 0} />
      ))}
    </div>
  );
}

function DirectorySkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--soft)] p-3 sm:p-4">
        <div className="mx-auto grid max-w-6xl gap-4">
          <ToolbarSkeleton />
          <div className="grid gap-2 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-3 shadow-sm lg:grid-cols-[minmax(12rem,1fr)_10rem_10rem_10rem_auto]">
            <Shimmer className="h-10 rounded-[var(--radius)]" />
            <Shimmer className="h-10 rounded-[var(--radius)]" />
            <Shimmer className="h-10 rounded-[var(--radius)]" />
            <Shimmer className="h-10 rounded-[var(--radius)]" />
            <Shimmer className="h-10 rounded-[var(--radius)]" />
          </div>
          <SkeletonList rows={8} label="Loading directory" />
        </div>
      </div>
    </>
  );
}

function InboxSkeleton() {
  return (
    <>
      <HeaderSkeleton tabs />
      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--soft)] p-3 sm:p-4">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] shadow-sm">
          <SkeletonList rows={10} label="Loading inbox" />
        </div>
      </div>
    </>
  );
}

function RemindersSkeleton() {
  return (
    <>
      <HeaderSkeleton tabs />
      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--soft)] p-3 sm:p-4">
        <div className="mx-auto max-w-6xl">
          <SkeletonList rows={8} label="Loading reminders" />
        </div>
      </div>
    </>
  );
}

function SettingsSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--soft)] p-3 sm:p-4">
        <div className="mx-auto grid max-w-6xl gap-4">
          <ToolbarSkeleton />
          <SkeletonCard lines={2} icon />
          <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <Shimmer className="h-5 w-32 rounded" />
              <Shimmer className="h-9 w-28 rounded-[var(--radius)]" />
            </div>
            <SkeletonList rows={5} label="Loading settings" />
          </div>
        </div>
      </div>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--soft)] p-3 sm:p-4">
        <div className="mx-auto max-w-4xl">
          <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Shimmer className="h-14 w-14 rounded-[var(--radius)]" />
              <div className="min-w-0 flex-1">
                <Shimmer className="h-4 w-44 rounded" />
                <SkeletonText className="mt-2" lines={2} gap="tight" />
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid gap-1.5">
                  <Shimmer className="h-3 w-24 rounded" />
                  <Shimmer className="h-10 rounded-[var(--radius)]" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Shimmer className="h-9 w-28 rounded-[var(--radius)]" />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function RecordSkeleton() {
  return (
    <>
      <HeaderSkeleton description={false} />
      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--soft)] p-3 sm:p-4">
        <div className="mx-auto grid max-w-6xl gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="grid gap-4">
            <SkeletonCard lines={5} />
            <SkeletonCard lines={4} footer />
          </div>
          <div className="grid gap-4">
            <SkeletonCard lines={3} />
            <SkeletonCard lines={4} />
          </div>
        </div>
      </div>
    </>
  );
}

function RequestSkeleton() {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden bg-[var(--soft)] lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_320px]">
      <aside className="hidden min-h-0 overflow-hidden border-r border-[var(--line)] bg-[var(--paper)] lg:block">
        <SkeletonList rows={9} label="Loading request list" />
      </aside>
      <section className="min-h-0 overflow-y-auto bg-[var(--paper)] p-4">
        <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
          <Shimmer className="h-10 w-10 rounded-full" />
          <div className="min-w-0 flex-1">
            <Shimmer className="h-5 w-1/2 rounded" />
            <Shimmer className="mt-2 h-3 w-1/3 rounded" />
          </div>
          <Shimmer className="h-8 w-24 rounded-[var(--radius)]" />
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {[80, 64, 96, 72].map((height, i) => (
            <div key={i} className={i % 2 === 0 ? "" : "flex justify-end"}>
              <Shimmer
                className="rounded-[var(--radius)]"
                style={{ height, width: `${50 + (i % 3) * 15}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-soft)] p-3">
          <Shimmer className="h-3 w-20 rounded" />
          <Shimmer className="mt-2 h-20 rounded-[var(--radius)]" />
        </div>
      </section>
      <aside className="hidden min-h-0 overflow-y-auto border-l border-[var(--line)] bg-[var(--soft)] p-3 xl:grid xl:gap-3">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={4} />
      </aside>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--soft)] p-3 sm:p-4">
        <div className="mx-auto grid max-w-6xl gap-4">
          <CardGridSkeleton cards={4} />
          <SkeletonCard lines={5} footer />
        </div>
      </div>
    </>
  );
}

function ReportsSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-[var(--soft)] p-4">
      <div className="w-full max-w-xl rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-6 shadow-sm">
        <Shimmer className="h-10 w-10 rounded-[var(--radius)]" />
        <Shimmer className="mt-4 h-6 w-40 rounded" />
        <SkeletonText className="mt-3" lines={3} />
        <Shimmer className="mt-5 h-9 w-32 rounded-[var(--radius)]" />
      </div>
    </div>
  );
}

function LoadingBody({ variant }: { variant: DashboardLoadingVariant }) {
  switch (variant) {
    case "admin":
      return <AdminSkeleton />;
    case "directory":
      return <DirectorySkeleton />;
    case "inbox":
      return <InboxSkeleton />;
    case "profile":
      return <ProfileSkeleton />;
    case "record":
      return <RecordSkeleton />;
    case "reminders":
      return <RemindersSkeleton />;
    case "reports":
      return <ReportsSkeleton />;
    case "request":
      return <RequestSkeleton />;
    case "settings":
      return <SettingsSkeleton />;
  }
}

export async function DashboardRouteLoading({
  currentPath,
  label,
  pageTitleKey,
  variant
}: DashboardRouteLoadingProps) {
  const locale = await getRequestLocale();
  const t = createTranslator(locale);

  return (
    <AppShell
      locale={locale}
      currentPath={currentPath}
      pageTitle={t(pageTitleKey)}
    >
      <section
        aria-busy="true"
        aria-label={label}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <LoadingBody variant={variant} />
      </section>
    </AppShell>
  );
}

import { DashboardRouteLoading } from "@/app/_components/DashboardRouteLoading";

export default function InboxLoading() {
  return (
    <DashboardRouteLoading
      currentPath="/inbox"
      label="Loading inbox"
      pageTitleKey="nav.headerTitle.inbox"
      variant="inbox"
    />
  );
}

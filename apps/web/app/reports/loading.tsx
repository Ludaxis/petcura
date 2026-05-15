import { DashboardRouteLoading } from "@/app/_components/DashboardRouteLoading";

export default function ReportsLoading() {
  return (
    <DashboardRouteLoading
      currentPath="/reports"
      label="Loading reports"
      pageTitleKey="nav.headerTitle.reports"
      variant="reports"
    />
  );
}

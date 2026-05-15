import { DashboardRouteLoading } from "@/app/_components/DashboardRouteLoading";

export default function AdminLoading() {
  return (
    <DashboardRouteLoading
      currentPath="/admin"
      label="Loading admin"
      pageTitleKey="nav.headerTitle.admin"
      variant="admin"
    />
  );
}

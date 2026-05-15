import { DashboardRouteLoading } from "@/app/_components/DashboardRouteLoading";

export default function RequestLoading() {
  return (
    <DashboardRouteLoading
      currentPath="/requests"
      label="Loading request"
      pageTitleKey="nav.headerTitle.requests"
      variant="request"
    />
  );
}

import { DashboardRouteLoading } from "@/app/_components/DashboardRouteLoading";

export default function CustomerLoading() {
  return (
    <DashboardRouteLoading
      currentPath="/customers"
      label="Loading customer"
      pageTitleKey="nav.headerTitle.customers"
      variant="record"
    />
  );
}

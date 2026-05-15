import { DashboardRouteLoading } from "@/app/_components/DashboardRouteLoading";

export default function DirectoryLoading() {
  return (
    <DashboardRouteLoading
      currentPath="/directory"
      label="Loading directory"
      pageTitleKey="nav.headerTitle.directory"
      variant="directory"
    />
  );
}

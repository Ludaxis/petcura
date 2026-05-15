import { DashboardRouteLoading } from "@/app/_components/DashboardRouteLoading";

export default function SettingsLoading() {
  return (
    <DashboardRouteLoading
      currentPath="/settings"
      label="Loading settings"
      pageTitleKey="nav.headerTitle.settings"
      variant="settings"
    />
  );
}

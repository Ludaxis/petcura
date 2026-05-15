import { DashboardRouteLoading } from "@/app/_components/DashboardRouteLoading";

export default function RemindersLoading() {
  return (
    <DashboardRouteLoading
      currentPath="/reminders"
      label="Loading reminders"
      pageTitleKey="nav.headerTitle.reminders"
      variant="reminders"
    />
  );
}

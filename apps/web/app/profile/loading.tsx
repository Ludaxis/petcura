import { DashboardRouteLoading } from "@/app/_components/DashboardRouteLoading";

export default function ProfileLoading() {
  return (
    <DashboardRouteLoading
      currentPath="/profile"
      label="Loading profile"
      pageTitleKey="nav.headerTitle.profile"
      variant="profile"
    />
  );
}

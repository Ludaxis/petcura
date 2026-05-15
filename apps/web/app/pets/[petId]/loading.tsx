import { DashboardRouteLoading } from "@/app/_components/DashboardRouteLoading";

export default function PetLoading() {
  return (
    <DashboardRouteLoading
      currentPath="/pets"
      label="Loading pet"
      pageTitleKey="nav.headerTitle.pets"
      variant="record"
    />
  );
}

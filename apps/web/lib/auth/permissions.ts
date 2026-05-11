import "server-only";

import type { ClinicPermission, StaffRole } from "@petcura/shared";
import { hasClinicPermission } from "@petcura/shared";
import type { StaffContext } from "@/lib/auth/staff";

export function hasStaffPermission(
  ctx: Pick<StaffContext, "membership">,
  permission: ClinicPermission
) {
  return hasClinicPermission(ctx.membership.role as StaffRole, permission);
}

export function requireStaffPermission(
  ctx: Pick<StaffContext, "membership">,
  permission: ClinicPermission
) {
  if (!hasStaffPermission(ctx, permission)) {
    throw new Error(`Missing clinic permission: ${permission}`);
  }
}

import { describe, expect, it } from "vitest";
import {
  canAssignStaffRole,
  canManageStaffMember,
  hasClinicPermission
} from "./permissions";

describe("clinic role permissions", () => {
  it("limits staff management to owner/admin roles", () => {
    expect(hasClinicPermission("owner", "team:manage")).toBe(true);
    expect(hasClinicPermission("admin", "team:manage")).toBe(true);
    expect(hasClinicPermission("vet", "team:manage")).toBe(false);
    expect(hasClinicPermission("viewer", "team:manage")).toBe(false);
  });

  it("only owners can assign or manage owner memberships", () => {
    expect(canAssignStaffRole("owner", "owner")).toBe(true);
    expect(canAssignStaffRole("admin", "owner")).toBe(false);
    expect(canManageStaffMember("owner", "owner")).toBe(true);
    expect(canManageStaffMember("admin", "owner")).toBe(false);
  });

  it("keeps viewers read-only", () => {
    expect(hasClinicPermission("viewer", "requests:view")).toBe(true);
    expect(hasClinicPermission("viewer", "requests:reply")).toBe(false);
    expect(hasClinicPermission("viewer", "reminders:manage")).toBe(false);
  });
});

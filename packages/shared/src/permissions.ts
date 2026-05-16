import type { Database } from "./database.types";

export type StaffRole = Database["public"]["Enums"]["staff_role"];

export const staffRoles = [
  "owner",
  "admin",
  "vet",
  "tech",
  "reception",
  "viewer"
] as const satisfies readonly StaffRole[];

export type ClinicPermission =
  | "team:view"
  | "team:manage"
  | "customers:view"
  | "customers:manage"
  | "pets:view"
  | "pets:manage"
  | "requests:view"
  | "requests:reply"
  | "requests:manage"
  | "reminders:view"
  | "reminders:manage"
  | "reports:view"
  | "reports:financial"
  | "settings:view";

const ROLE_PERMISSIONS: Record<StaffRole, readonly ClinicPermission[]> = {
  owner: [
    "team:view",
    "team:manage",
    "customers:view",
    "customers:manage",
    "pets:view",
    "pets:manage",
    "requests:view",
    "requests:reply",
    "requests:manage",
    "reminders:view",
    "reminders:manage",
    "reports:view",
    "reports:financial",
    "settings:view"
  ],
  admin: [
    "team:view",
    "team:manage",
    "customers:view",
    "customers:manage",
    "pets:view",
    "pets:manage",
    "requests:view",
    "requests:reply",
    "requests:manage",
    "reminders:view",
    "reminders:manage",
    "reports:view",
    "reports:financial",
    "settings:view"
  ],
  vet: [
    "team:view",
    "customers:view",
    "customers:manage",
    "pets:view",
    "pets:manage",
    "requests:view",
    "requests:reply",
    "requests:manage",
    "reminders:view",
    "reminders:manage",
    "reports:view",
    "settings:view"
  ],
  tech: [
    "team:view",
    "customers:view",
    "customers:manage",
    "pets:view",
    "pets:manage",
    "requests:view",
    "requests:reply",
    "requests:manage",
    "reminders:view",
    "reminders:manage",
    "reports:view",
    "settings:view"
  ],
  reception: [
    "team:view",
    "customers:view",
    "customers:manage",
    "pets:view",
    "pets:manage",
    "requests:view",
    "requests:reply",
    "requests:manage",
    "reminders:view",
    "reminders:manage",
    "reports:view",
    "settings:view"
  ],
  viewer: [
    "team:view",
    "customers:view",
    "pets:view",
    "requests:view",
    "reminders:view",
    "reports:view",
    "settings:view"
  ]
};

export function getClinicPermissions(role: StaffRole) {
  return ROLE_PERMISSIONS[role];
}

export function hasClinicPermission(
  role: StaffRole,
  permission: ClinicPermission
) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAssignStaffRole(actorRole: StaffRole, nextRole: StaffRole) {
  if (!hasClinicPermission(actorRole, "team:manage")) return false;
  if (nextRole === "owner") return actorRole === "owner";
  return actorRole === "owner" || actorRole === "admin";
}

export function canManageStaffMember(
  actorRole: StaffRole,
  targetRole: StaffRole
) {
  if (!hasClinicPermission(actorRole, "team:manage")) return false;
  if (targetRole === "owner") return actorRole === "owner";
  return actorRole === "owner" || actorRole === "admin";
}

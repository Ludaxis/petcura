import { describe, expect, it } from "vitest";
import { ownerMembershipSelect } from "./membership-query";

describe("ownerMembershipSelect", () => {
  it("disambiguates owner memberships through the clinic-owner composite foreign key", () => {
    expect(ownerMembershipSelect).toContain(
      "owners!owner_user_memberships_clinic_id_owner_id_fkey"
    );
    expect(ownerMembershipSelect).not.toContain(", owners(");
  });
});

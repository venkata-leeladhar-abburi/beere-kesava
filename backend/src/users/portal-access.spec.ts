import { AccessLevel, UserRole } from "../generated/prisma/client";
import { accessLevelFor, accessLevelMap } from "./portal-access";

const user = {
  role: UserRole.ACCOUNTANT,
  accessLevel: AccessLevel.FULL_ACCESS,
  additionalRoles: [UserRole.SHOP, UserRole.WORKER],
  portalAccess: [{ role: UserRole.SHOP, accessLevel: AccessLevel.MONEY_HIDDEN }],
};

describe("accessLevelFor", () => {
  it("uses the row for that portal when there is one", () => {
    expect(accessLevelFor(user, UserRole.SHOP)).toBe(AccessLevel.MONEY_HIDDEN);
  });

  it("falls back to the primary role's own level", () => {
    expect(accessLevelFor(user, UserRole.ACCOUNTANT)).toBe(AccessLevel.FULL_ACCESS);
  });

  it("does not leak the primary level onto an extra portal that has no row", () => {
    const restricted = { ...user, accessLevel: AccessLevel.RESTRICTED };
    expect(accessLevelFor(restricted, UserRole.ACCOUNTANT)).toBe(AccessLevel.RESTRICTED);
    expect(accessLevelFor(restricted, UserRole.WORKER)).toBe(AccessLevel.FULL_ACCESS);
  });

  it("treats a single-portal account with no rows as unchanged", () => {
    const solo = { role: UserRole.WORKER, accessLevel: AccessLevel.DOWNLOAD_RESTRICTED };
    expect(accessLevelFor(solo, UserRole.WORKER)).toBe(AccessLevel.DOWNLOAD_RESTRICTED);
  });
});

describe("accessLevelMap", () => {
  it("lists every assigned portal, primary first", () => {
    expect(accessLevelMap(user)).toEqual([
      { role: UserRole.ACCOUNTANT, accessLevel: AccessLevel.FULL_ACCESS },
      { role: UserRole.SHOP, accessLevel: AccessLevel.MONEY_HIDDEN },
      { role: UserRole.WORKER, accessLevel: AccessLevel.FULL_ACCESS },
    ]);
  });
});

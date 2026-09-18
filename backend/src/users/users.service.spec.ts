import { BadRequestException, ConflictException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { AccessLevel, UserRole } from "../generated/prisma/client";

/**
 * Stands in for both shapes the service uses: `$transaction(fn)` for create,
 * which needs a tx client, and `$transaction([...ops])` for update.
 */
const runTransaction = (tx: unknown) => (arg: unknown) =>
  Array.isArray(arg) ? Promise.all(arg) : (arg as (client: unknown) => unknown)(tx);

describe("UsersService mobile uniqueness", () => {
  const prisma = {
    user: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    userPortalAccess: { upsert: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new UsersService(prisma as never, { nextNamed: jest.fn() } as never);

  beforeEach(() => jest.clearAllMocks());

  const dto = { firstName: "A", lastName: "B", mobile: "+91 98765 43210", role: "ADMIN" } as CreateUserDto;

  it("rejects a number already assigned to another user, whatever format it was typed in", async () => {
    prisma.user.findFirst.mockResolvedValue({ empId: "ADMIN-001", firstName: "Existing", lastName: "Admin" });

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { mobile: { endsWith: "9876543210" } } }),
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("stores the normalised 10-digit number when the mobile is free", async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(
      runTransaction({
        user: { findMany: jest.fn().mockResolvedValue([]), create: prisma.user.create.mockResolvedValue({}) },
      }),
    );

    await service.create(dto);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ mobile: "9876543210" }) }),
    );
  });

  it("lets a user keep their own number on update but not take someone else's", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1" });
    prisma.user.findFirst.mockResolvedValue(null);

    await service.update("u1", { mobile: "09876543210" });
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { mobile: { endsWith: "9876543210" }, id: { not: "u1" } } }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ mobile: "9876543210" }) }),
    );
  });
});

describe("UsersService additional portals", () => {
  const prisma = {
    user: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    userPortalAccess: { upsert: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new UsersService(prisma as never, { nextNamed: jest.fn() } as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(
      runTransaction({
        user: { findMany: jest.fn().mockResolvedValue([]), create: prisma.user.create.mockResolvedValue({}) },
      }),
    );
  });

  const dto = (role: UserRole, additionalRoles: UserRole[]): CreateUserDto => ({
    firstName: "A",
    lastName: "B",
    mobile: "9876543210",
    role,
    additionalRoles,
  });

  it("stores several extra portals on a staff account", async () => {
    await service.create(dto(UserRole.WORKER, [UserRole.SHOP, UserRole.ACCOUNTANT]));
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ additionalRoles: [UserRole.SHOP, UserRole.ACCOUNTANT] }),
      }),
    );
  });

  it("drops the primary role from the extras instead of duplicating it", async () => {
    await service.create(dto(UserRole.WORKER, [UserRole.WORKER, UserRole.SHOP]));
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ additionalRoles: [UserRole.SHOP] }) }),
    );
  });

  it("refuses WEAVER and SUPERADMIN as side-grants", async () => {
    await expect(service.create(dto(UserRole.WORKER, [UserRole.WEAVER]))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.create(dto(UserRole.WORKER, [UserRole.SUPERADMIN]))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("refuses to give a weaver a second portal", async () => {
    await expect(service.create(dto(UserRole.WEAVER, [UserRole.SHOP]))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("re-sanitises on update, so changing the primary role clears it from the extras", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      role: UserRole.WORKER,
      additionalRoles: [UserRole.SHOP, UserRole.ADMIN],
    });

    await service.update("u1", { role: UserRole.SHOP });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ additionalRoles: [UserRole.ADMIN] }) }),
    );
  });
});

describe("UsersService per-portal access levels", () => {
  const prisma = {
    user: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), findMany: jest.fn() },
    userPortalAccess: { upsert: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new UsersService(prisma as never, { nextNamed: jest.fn() } as never);

  const existing = {
    id: "u1",
    role: UserRole.ACCOUNTANT,
    accessLevel: AccessLevel.FULL_ACCESS,
    additionalRoles: [UserRole.SHOP],
    portalAccess: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue(existing);
    prisma.$transaction.mockImplementation(runTransaction(undefined));
  });

  it("keeps the primary role's level on the User row and the rest in their own", async () => {
    await service.setPortalAccessLevels("u1", [
      { role: UserRole.ACCOUNTANT, accessLevel: AccessLevel.FULL_ACCESS },
      { role: UserRole.SHOP, accessLevel: AccessLevel.MONEY_HIDDEN },
    ]);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { accessLevel: AccessLevel.FULL_ACCESS },
    });
    expect(prisma.userPortalAccess.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_role: { userId: "u1", role: UserRole.SHOP } },
        update: { accessLevel: AccessLevel.MONEY_HIDDEN },
      }),
    );
  });

  it("leaves the primary alone when only an extra portal is being changed", async () => {
    await service.setPortalAccessLevels("u1", [
      { role: UserRole.SHOP, accessLevel: AccessLevel.DOWNLOAD_RESTRICTED },
    ]);

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.userPortalAccess.upsert).toHaveBeenCalledTimes(1);
  });

  it("refuses a level for a portal the person isn't assigned", async () => {
    await expect(
      service.setPortalAccessLevels("u1", [{ role: UserRole.ADMIN, accessLevel: AccessLevel.RESTRICTED }]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.userPortalAccess.upsert).not.toHaveBeenCalled();
  });

  it("drops the stored level for a portal that is revoked", async () => {
    await service.update("u1", { additionalRoles: [] });

    expect(prisma.userPortalAccess.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1", role: { notIn: [UserRole.ACCOUNTANT] } },
    });
  });
});

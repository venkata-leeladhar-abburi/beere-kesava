import { ConflictException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";

describe("UsersService mobile uniqueness", () => {
  const prisma = {
    user: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), findMany: jest.fn() },
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
    prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn({
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

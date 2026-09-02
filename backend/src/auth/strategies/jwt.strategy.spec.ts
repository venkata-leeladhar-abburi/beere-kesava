import { UnauthorizedException } from "@nestjs/common";
import { UserRole } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtPayload, JwtStrategy } from "./jwt.strategy";

describe("JwtStrategy", () => {
  let strategy: JwtStrategy;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: { findUnique: jest.fn() },
      weaver: { findUnique: jest.fn() },
    };
    strategy = new JwtStrategy(mockPrisma as PrismaService);
  });

  it("maps a well-formed JWT payload onto the AuthenticatedUser shape used by req.user", async () => {
    const payload: JwtPayload = {
      sub: "user-123",
      mobile: "9999999999",
      role: UserRole.ADMIN,
      name: "Store Admin",
    };

    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-123" });

    await expect(strategy.validate(payload)).resolves.toEqual({
      id: "user-123",
      mobile: "9999999999",
      role: UserRole.ADMIN,
      name: "Store Admin",
      accessLevel: undefined,
      weaverId: null,
    });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "user-123" } });
  });

  it("throws UnauthorizedException if the user does not exist", async () => {
    const payload: JwtPayload = {
      sub: "deleted-user-123",
      mobile: "9999999999",
      role: UserRole.ADMIN,
      name: "Store Admin",
    };

    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });

  it("carries an undefined sub through as id rather than throwing", async () => {
    const payload: JwtPayload = {
      sub: undefined,
      mobile: "8888888888",
      role: UserRole.WEAVER,
      name: "Some Weaver",
    };

    await expect(strategy.validate(payload)).resolves.toEqual({
      id: undefined,
      mobile: "8888888888",
      role: UserRole.WEAVER,
      name: "Some Weaver",
      accessLevel: undefined,
      weaverId: null,
    });
    expect(mockPrisma.weaver.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });
});

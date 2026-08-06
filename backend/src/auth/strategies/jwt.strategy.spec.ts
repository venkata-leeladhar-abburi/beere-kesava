import { UserRole } from "../../generated/prisma/client";
import { JwtPayload, JwtStrategy } from "./jwt.strategy";

describe("JwtStrategy", () => {
  const strategy = new JwtStrategy();

  it("maps a well-formed JWT payload onto the AuthenticatedUser shape used by req.user", () => {
    const payload: JwtPayload = {
      sub: "user-123",
      mobile: "9999999999",
      role: UserRole.ADMIN,
      name: "Store Admin",
    };

    expect(strategy.validate(payload)).toEqual({
      id: "user-123",
      mobile: "9999999999",
      role: UserRole.ADMIN,
      name: "Store Admin",
    });
  });

  it("carries an undefined sub through as id rather than throwing", () => {
    const payload: JwtPayload = {
      sub: undefined,
      mobile: "8888888888",
      role: UserRole.WEAVER,
      name: "Some Weaver",
    };

    expect(strategy.validate(payload)).toEqual({
      id: undefined,
      mobile: "8888888888",
      role: UserRole.WEAVER,
      name: "Some Weaver",
    });
  });
});

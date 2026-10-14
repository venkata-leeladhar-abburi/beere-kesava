import { AccessLevel, ActiveStatus, UserRole } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtPayload, JwtStrategy } from "./jwt.strategy";

describe("JwtStrategy", () => {
  let strategy: JwtStrategy;
  let mockPrisma: any;

  const bearerGet = { method: "GET", headers: { authorization: "Bearer t" } } as any;

  const payload: JwtPayload = {
    sub: "user-123",
    mobile: "9999999999",
    role: UserRole.WORKER,
    name: "Name In Token",
    accessLevel: AccessLevel.FULL_ACCESS,
    sid: "sess-1",
  };

  const user = (over: Record<string, unknown> = {}) => ({
    id: "user-123",
    firstName: "Ravi",
    lastName: "Kumar",
    role: UserRole.WORKER,
    additionalRoles: [],
    accessLevel: AccessLevel.MONEY_HIDDEN,
    status: ActiveStatus.ACTIVE,
    linkedWeaverId: null,
    portalAccess: [],
    ...over,
  });

  const session = (over: Record<string, unknown> = {}) => ({
    id: "sess-1",
    revokedAt: null,
    lastSeenAt: new Date(),
    user: user(),
    weaver: null,
    ...over,
  });

  const rejectsWith = async (p: Promise<unknown>, status: number, code: string) => {
    await expect(p).rejects.toMatchObject({ code });
    await p.catch((e) => expect(e.getStatus()).toBe(status));
  };

  beforeEach(() => {
    mockPrisma = {
      authSession: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    };
    strategy = new JwtStrategy(mockPrisma as PrismaService);
  });

  it("builds req.user from the database, not the token", async () => {
    mockPrisma.authSession.findUnique.mockResolvedValue(session());

    await expect(strategy.validate(bearerGet, payload)).resolves.toEqual({
      id: "user-123",
      sessionId: "sess-1",
      mobile: "9999999999",
      role: UserRole.WORKER,
      name: "Ravi Kumar",
      // The token said FULL_ACCESS; the account now says MONEY_HIDDEN.
      accessLevel: AccessLevel.MONEY_HIDDEN,
      weaverId: null,
    });
  });

  it("ends a session that was signed out or revoked", async () => {
    mockPrisma.authSession.findUnique.mockResolvedValue(session({ revokedAt: new Date() }));
    await rejectsWith(strategy.validate(bearerGet, payload), 401, "AUTH_SESSION_EXPIRED");
  });

  it("ends a session whose row no longer exists", async () => {
    mockPrisma.authSession.findUnique.mockResolvedValue(null);
    await rejectsWith(strategy.validate(bearerGet, payload), 401, "AUTH_SESSION_EXPIRED");
  });

  it("retires tokens issued before sessions existed", async () => {
    const { sid: _sid, ...legacy } = payload;
    await rejectsWith(strategy.validate(bearerGet, legacy), 401, "AUTH_SESSION_EXPIRED");
    expect(mockPrisma.authSession.findUnique).not.toHaveBeenCalled();
  });

  it("locks out a deactivated account on its very next request", async () => {
    mockPrisma.authSession.findUnique.mockResolvedValue(
      session({ user: user({ status: ActiveStatus.INACTIVE }) }),
    );
    await rejectsWith(strategy.validate(bearerGet, payload), 401, "AUTH_SESSION_EXPIRED");
  });

  it("ends the session when the portal it was opened in is taken away", async () => {
    mockPrisma.authSession.findUnique.mockResolvedValue(
      session({ user: user({ role: UserRole.SHOP }) }),
    );
    await rejectsWith(strategy.validate(bearerGet, payload), 401, "AUTH_SESSION_EXPIRED");
  });

  it("rejects a token whose sub does not match its session", async () => {
    mockPrisma.authSession.findUnique.mockResolvedValue(
      session({ user: user({ id: "someone-else" }) }),
    );
    await rejectsWith(strategy.validate(bearerGet, payload), 401, "AUTH_SESSION_EXPIRED");
  });

  it("resolves a weaver-only session and checks the weaver's status", async () => {
    const weaverPayload: JwtPayload = { ...payload, sub: "w-1", role: UserRole.WEAVER };
    mockPrisma.authSession.findUnique.mockResolvedValue(
      session({ user: null, weaver: { id: "w-1", name: "Lakshmi", status: ActiveStatus.ACTIVE } }),
    );
    await expect(strategy.validate(bearerGet, weaverPayload)).resolves.toMatchObject({
      id: "w-1",
      weaverId: "w-1",
      role: UserRole.WEAVER,
      name: "Lakshmi",
    });

    mockPrisma.authSession.findUnique.mockResolvedValue(
      session({
        user: null,
        weaver: { id: "w-1", name: "Lakshmi", status: ActiveStatus.INACTIVE },
      }),
    );
    await rejectsWith(strategy.validate(bearerGet, weaverPayload), 401, "AUTH_SESSION_EXPIRED");
  });

  it("refreshes lastSeenAt only when it is stale", async () => {
    mockPrisma.authSession.findUnique.mockResolvedValue(session());
    await strategy.validate(bearerGet, payload);
    expect(mockPrisma.authSession.update).not.toHaveBeenCalled();

    mockPrisma.authSession.findUnique.mockResolvedValue(session({ lastSeenAt: new Date(0) }));
    await strategy.validate(bearerGet, payload);
    expect(mockPrisma.authSession.update).toHaveBeenCalledTimes(1);
  });

  describe("CSRF on cookie-authenticated requests", () => {
    beforeEach(() => mockPrisma.authSession.findUnique.mockResolvedValue(session()));

    it("refuses a cookie-only write without the CSRF header", async () => {
      const req = { method: "POST", headers: { cookie: "bk_session=t" } } as any;
      await rejectsWith(strategy.validate(req, payload), 403, "FORBIDDEN_ROLE");
    });

    it("allows a cookie-only write that carries the header", async () => {
      const req = { method: "POST", headers: { cookie: "bk_session=t", "x-bk-csrf": "1" } } as any;
      await expect(strategy.validate(req, payload)).resolves.toMatchObject({ id: "user-123" });
    });

    it("allows a cookie-only read without the header", async () => {
      const req = { method: "GET", headers: { cookie: "bk_session=t" } } as any;
      await expect(strategy.validate(req, payload)).resolves.toMatchObject({ id: "user-123" });
    });

    it("does not ask bearer requests for the header", async () => {
      const req = { method: "DELETE", headers: { authorization: "Bearer t" } } as any;
      await expect(strategy.validate(req, payload)).resolves.toMatchObject({ id: "user-123" });
    });
  });
});

/**
 * users.controller.ts over real HTTP: the sensitive surface for the whole
 * app (creating employees, editing them, changing access levels), gated by
 * @RequirePermissions rather than @RequireRoles (see the controller's own
 * header comment) — this is the integration-level counterpart to the
 * authz-matrix's static checks, exercising PermissionsGuard's real DB-backed
 * permission lookup instead of a synthetic route in a unit spec.
 */
import {
  createTestApp,
  loginAs,
  SEEDED,
  TestApp,
  unique,
  uniquePhone,
  type Envelope,
} from "../utils/test-app";

interface UserPayload {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  role: string;
}

describe("Users (integration)", () => {
  let testApp: TestApp;
  let superadminToken: string;
  let workerToken: string;
  let workerPhone: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    superadminToken = await loginAs(testApp.http, SEEDED.superadmin.phone, testApp.prisma);

    // A real WORKER account, created the same way the authz matrix's
    // "unseeded/under-permissioned role" case works: seeded directly via
    // Prisma (a plain fixture), then logged in through the real OTP flow so
    // its JWT is indistinguishable from one a real worker would carry.
    workerPhone = uniquePhone();
    await testApp.prisma.user.create({
      data: {
        empId: `IT-WORKER-${workerPhone}`,
        firstName: "Test",
        lastName: "Worker",
        mobile: workerPhone,
        role: "WORKER",
      },
    });
    workerToken = await loginAs(testApp.http, workerPhone, testApp.prisma);
  });

  afterAll(async () => {
    await testApp.close();
  });

  describe("POST /users (requires users.create)", () => {
    it("SUPERADMIN can create a user", async () => {
      const phone = uniquePhone();
      const res = await testApp.http
        .post("/users")
        .set("Authorization", `Bearer ${superadminToken}`)
        .send({ firstName: "New", lastName: "Hire", mobile: phone, role: "ACCOUNTANT" });

      expect(res.status).toBe(201);
      const body = res.body as Envelope<UserPayload>;
      expect(body.data.mobile).toBe(phone);
      expect(body.data.role).toBe("ACCOUNTANT");
    });

    it("WORKER is denied — seeded WORKER permissions do not include users.create", async () => {
      const res = await testApp.http
        .post("/users")
        .set("Authorization", `Bearer ${workerToken}`)
        .send({ firstName: "Should", lastName: "Fail", mobile: uniquePhone(), role: "ACCOUNTANT" });

      expect(res.status).toBe(403);
    });

    it("rejects a payload missing required fields with 400, not 500", async () => {
      const res = await testApp.http
        .post("/users")
        .set("Authorization", `Bearer ${superadminToken}`)
        .send({ firstName: "Incomplete" });

      expect(res.status).toBe(400);
    });

    it("rejects an unrecognised extra field — proves ValidationPipe's whitelist is really active", async () => {
      const res = await testApp.http
        .post("/users")
        .set("Authorization", `Bearer ${superadminToken}`)
        .send({
          firstName: "Extra",
          lastName: "Field",
          mobile: uniquePhone(),
          role: "ACCOUNTANT",
          isSuperSecretAdmin: true,
        });

      // forbidNonWhitelisted: true means an unknown property is a 400, not
      // silently stripped and not silently accepted.
      expect(res.status).toBe(400);
    });

    it("rejects a duplicate mobile number with a real conflict status, not a 500", async () => {
      const phone = uniquePhone();
      const first = await testApp.http
        .post("/users")
        .set("Authorization", `Bearer ${superadminToken}`)
        .send({ firstName: "First", lastName: "User", mobile: phone, role: "ACCOUNTANT" });
      expect(first.status).toBe(201);

      const second = await testApp.http
        .post("/users")
        .set("Authorization", `Bearer ${superadminToken}`)
        .send({ firstName: "Second", lastName: "User", mobile: phone, role: "ACCOUNTANT" });

      expect(second.status).toBeGreaterThanOrEqual(400);
      expect(second.status).toBeLessThan(500);
    });
  });

  describe("GET /users (unguarded — open to any authenticated role)", () => {
    it("WORKER can list users despite lacking users.create", async () => {
      const res = await testApp.http.get("/users").set("Authorization", `Bearer ${workerToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe("PATCH /users/:id/access-level (requires users.roles.manage)", () => {
    it("WORKER cannot escalate their own access level", async () => {
      const me = await testApp.prisma.user.findUniqueOrThrow({ where: { mobile: workerPhone } });
      const res = await testApp.http
        .patch(`/users/${me.id}/access-level`)
        .set("Authorization", `Bearer ${workerToken}`)
        .send({ accessLevel: "FULL_ACCESS" });

      expect(res.status).toBe(403);
    });

    it("SUPERADMIN can change another user's access level", async () => {
      const me = await testApp.prisma.user.findUniqueOrThrow({ where: { mobile: workerPhone } });
      const res = await testApp.http
        .patch(`/users/${me.id}/access-level`)
        .set("Authorization", `Bearer ${superadminToken}`)
        .send({ accessLevel: "MONEY_HIDDEN" });

      expect(res.status).toBe(200);
      const updated = await testApp.prisma.user.findUniqueOrThrow({ where: { id: me.id } });
      expect(updated.accessLevel).toBe("MONEY_HIDDEN");
    });
  });

  describe("DELETE /users/:id (requires users.delete)", () => {
    /**
     * KNOWN BUG, pinned deliberately rather than asserted as correct.
     *
     * prisma/seed.ts withholds users.delete from ADMIN
     * (`ADMIN: PERMISSIONS.map(...).filter(k => k !== "users.delete")`), and
     * its comment says destructive account deletion is SUPERADMIN-only. That
     * carve-out has never actually done anything: PermissionsGuard returns
     * true for SUPERADMIN *and ADMIN* before it looks at required permissions
     * at all —
     *
     *   if (user.role === SUPERADMIN || user.role === ADMIN) return true;
     *
     * — so ADMIN bypasses permission checks exactly as it bypasses
     * @RequireRoles. A permission key cannot express "SUPERADMIN only" under
     * the current guard, and neither users.delete nor weavers.delete does.
     *
     * This test asserts the behaviour that ships today (200) so the gap is
     * visible and counted. When the guard is fixed to consult permissions for
     * ADMIN, this flips to 403 and the seed carve-out starts meaning
     * something.
     */
    it("ADMIN can currently delete a user, because ADMIN bypasses permission checks entirely", async () => {
      const adminToken = await loginAs(testApp.http, SEEDED.admin.phone, testApp.prisma);
      const target = await testApp.prisma.user.create({
        data: {
          empId: `IT-DEL-${unique()}`,
          firstName: "To",
          lastName: "Delete",
          mobile: uniquePhone(),
          role: "ACCOUNTANT",
        },
      });

      const res = await testApp.http
        .delete(`/users/${target.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it("SUPERADMIN can delete a user", async () => {
      const target = await testApp.prisma.user.create({
        data: {
          empId: `IT-DEL2-${unique()}`,
          firstName: "To",
          lastName: "Delete",
          mobile: uniquePhone(),
          role: "ACCOUNTANT",
        },
      });

      const res = await testApp.http
        .delete(`/users/${target.id}`)
        .set("Authorization", `Bearer ${superadminToken}`);

      expect(res.status).toBe(200);
      await expect(
        testApp.prisma.user.findUnique({ where: { id: target.id } }),
      ).resolves.toBeNull();
    });
  });
});

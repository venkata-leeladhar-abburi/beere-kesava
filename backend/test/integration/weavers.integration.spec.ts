/**
 * weavers.controller.ts over real HTTP. This controller had zero
 * authorization decorators until this Phase 1 pass (see the authz matrix's
 * KNOWN_UNGUARDED_MUTATIONS history and the controller's own header
 * comment) — these specs are the integration-level proof that the
 * decorators added there actually take effect on a real request, not just
 * in the unit-level PermissionsGuard specs.
 */
import { createTestApp, loginAs, SEEDED, TestApp, unique, uniquePhone } from "../utils/test-app";

describe("Weavers (integration)", () => {
  let testApp: TestApp;
  let superadminToken: string;
  let accountantToken: string;
  let weaverToken: string;

  beforeAll(async () => {
    testApp = await createTestApp();
    superadminToken = await loginAs(testApp.http, SEEDED.superadmin.phone, testApp.prisma);

    const accountantPhone = uniquePhone();
    await testApp.prisma.user.create({
      data: {
        empId: `IT-ACCT-${accountantPhone}`,
        firstName: "Test",
        lastName: "Accountant",
        mobile: accountantPhone,
        role: "ACCOUNTANT",
      },
    });
    accountantToken = await loginAs(testApp.http, accountantPhone, testApp.prisma);

    // Created through the real endpoint rather than a raw Prisma insert: the
    // Weaver model's `code`/`initials` are derived by WeaversService.create()
    // (via IdGeneratorService), not values a test can validly fabricate by
    // hand without duplicating that logic.
    const weaverPayload = newWeaverPayload();
    const weaverCreate = await testApp.http
      .post("/weavers")
      .set("Authorization", `Bearer ${accountantToken}`)
      .send(weaverPayload);
    expect(weaverCreate.status).toBe(201);
    weaverToken = await loginAs(testApp.http, weaverPayload.phone, testApp.prisma);
  });

  afterAll(async () => {
    await testApp.close();
  });

  function newWeaverPayload() {
    const phone = uniquePhone();
    return {
      firstName: "New",
      lastName: `Weaver-${unique()}`,
      photoUrl: "https://example.com/photo.jpg",
      email: `weaver-${unique()}@example.com`,
      phone,
    };
  }

  describe("POST /weavers", () => {
    it("ACCOUNTANT can register a weaver", async () => {
      const res = await testApp.http
        .post("/weavers")
        .set("Authorization", `Bearer ${accountantToken}`)
        .send(newWeaverPayload());
      expect(res.status).toBe(201);
    });

    it("a WEAVER cannot register another weaver", async () => {
      const res = await testApp.http
        .post("/weavers")
        .set("Authorization", `Bearer ${weaverToken}`)
        .send(newWeaverPayload());
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /weavers/:id", () => {
    // Same known bug as users.delete — see the long comment in
    // users.integration.spec.ts. weavers.delete was introduced on the
    // assumption that a permission key could exclude ADMIN where
    // @RequireRoles could not; it cannot, because PermissionsGuard
    // short-circuits ADMIN before any permission lookup. Pinned at the
    // shipping behaviour so the gap is counted, not hidden.
    it("ADMIN can currently delete a weaver, because ADMIN bypasses permission checks entirely", async () => {
      const adminToken = await loginAs(testApp.http, SEEDED.admin.phone, testApp.prisma);
      const created = await testApp.http
        .post("/weavers")
        .set("Authorization", `Bearer ${accountantToken}`)
        .send(newWeaverPayload());
      expect(created.status).toBe(201);

      const res = await testApp.http
        .delete(`/weavers/${created.body.data.id as string}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it("SUPERADMIN can delete a weaver", async () => {
      const payload = newWeaverPayload();
      const created = await testApp.http
        .post("/weavers")
        .set("Authorization", `Bearer ${accountantToken}`)
        .send(payload);
      expect(created.status).toBe(201);
      const weaverId = created.body.data.id as string;

      const res = await testApp.http
        .delete(`/weavers/${weaverId}`)
        .set("Authorization", `Bearer ${superadminToken}`);

      expect(res.status).toBe(200);
      await expect(
        testApp.prisma.weaver.findUnique({ where: { id: weaverId } }),
      ).resolves.toBeNull();
    });
  });

  describe("GET /weavers (still open — tracked separately, not part of this pass)", () => {
    it("any authenticated role can list weavers, including their contact details", async () => {
      const res = await testApp.http.get("/weavers").set("Authorization", `Bearer ${weaverToken}`);
      expect(res.status).toBe(200);
    });
  });
});

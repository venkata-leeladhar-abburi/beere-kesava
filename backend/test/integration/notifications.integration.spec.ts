/**
 * notifications.controller.ts over real HTTP. NotificationsService.markRead
 * used to look a notification up by id alone (see the unit spec at
 * src/notifications/notifications.service.spec.ts for the mocked-Prisma
 * version of this) — any authenticated user could mark any other user's
 * notification read by guessing an id. These specs prove the fix holds with
 * a real Postgres round trip between two genuinely distinct real users, not
 * a mocked Prisma client that could hide a subtle where-clause mistake.
 */
import { createTestApp, loginAs, TestApp, uniquePhone } from "../utils/test-app";

describe("Notifications (integration)", () => {
  let testApp: TestApp;
  let shopToken: string;
  let shopUserId: string;
  let workerToken: string;

  beforeAll(async () => {
    testApp = await createTestApp();

    const shopPhone = uniquePhone();
    const shopUser = await testApp.prisma.user.create({
      data: { empId: `IT-SHOP-${shopPhone}`, firstName: "Shop", lastName: "Staff", mobile: shopPhone, role: "SHOP" },
    });
    shopUserId = shopUser.id;
    shopToken = await loginAs(testApp.http, shopPhone, testApp.prisma);

    const workerPhone = uniquePhone();
    await testApp.prisma.user.create({
      data: { empId: `IT-WORK-${workerPhone}`, firstName: "Worker", lastName: "Staff", mobile: workerPhone, role: "WORKER" },
    });
    workerToken = await loginAs(testApp.http, workerPhone, testApp.prisma);
  });

  afterAll(async () => {
    await testApp.close();
  });

  describe("POST /notifications", () => {
    it("SHOP can raise a notification (e.g. a low-stock alert to ADMIN)", async () => {
      const res = await testApp.http
        .post("/notifications")
        .set("Authorization", `Bearer ${shopToken}`)
        .send({ targetType: "ROLE", role: "ADMIN", type: "shop_low_stock", payload: { priority: "urgent" } });

      expect(res.status).toBe(201);
    });

    it("a WEAVER cannot raise a notification — excluded deliberately, see the controller comment", async () => {
      const weaverPhone = uniquePhone();
      await testApp.prisma.weaver.create({
        data: {
          code: `IT-WV-${weaverPhone}`,
          name: "Test Weaver",
          firstName: "Test",
          lastName: "Weaver",
          initials: "TW",
          photoUrl: "https://example.com/p.jpg",
          email: `weaver-${weaverPhone}@example.com`,
          phone: weaverPhone,
        },
      });
      const weaverToken = await loginAs(testApp.http, weaverPhone, testApp.prisma);

      const res = await testApp.http
        .post("/notifications")
        .set("Authorization", `Bearer ${weaverToken}`)
        .send({ targetType: "ROLE", role: "ADMIN", type: "spam", payload: {} });

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /notifications/:id/read — ownership scoping", () => {
    it("a user can mark their own role-targeted notification read", async () => {
      const created = await testApp.http
        .post("/notifications")
        .set("Authorization", `Bearer ${shopToken}`)
        .send({ targetType: "ROLE", role: "WORKER", type: "test", payload: {} });
      const id = created.body.data.id as string;

      const res = await testApp.http
        .patch(`/notifications/${id}/read`)
        .set("Authorization", `Bearer ${workerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.readAt).not.toBeNull();
    });

    it("a user CANNOT mark another user's role-targeted notification read", async () => {
      const created = await testApp.http
        .post("/notifications")
        .set("Authorization", `Bearer ${shopToken}`)
        .send({ targetType: "ROLE", role: "WORKER", type: "test", payload: {} });
      const id = created.body.data.id as string;

      // SHOP is not the WORKER this was addressed to — this is the exact
      // scenario the IDOR fix closes. 404, not 403: the caller should not be
      // able to distinguish "not yours" from "does not exist".
      const res = await testApp.http
        .patch(`/notifications/${id}/read`)
        .set("Authorization", `Bearer ${shopToken}`);

      expect(res.status).toBe(404);

      const stillUnread = await testApp.prisma.notification.findUniqueOrThrow({ where: { id } });
      expect(stillUnread.readAt).toBeNull();
    });

    it("a user-targeted notification can only be marked read by that exact user", async () => {
      const created = await testApp.http
        .post("/notifications")
        .set("Authorization", `Bearer ${shopToken}`)
        .send({ targetType: "USER", userId: shopUserId, type: "personal", payload: {} });
      const id = created.body.data.id as string;

      const deniedForOther = await testApp.http
        .patch(`/notifications/${id}/read`)
        .set("Authorization", `Bearer ${workerToken}`);
      expect(deniedForOther.status).toBe(404);

      const allowedForOwner = await testApp.http
        .patch(`/notifications/${id}/read`)
        .set("Authorization", `Bearer ${shopToken}`);
      expect(allowedForOwner.status).toBe(200);
    });
  });
});

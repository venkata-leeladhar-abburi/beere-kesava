/**
 * Server-side sessions over real HTTP and a real database: the guarantees
 * that only hold if the per-request session lookup (src/auth/session.ts)
 * actually runs. Each case signs a fresh account in, so no token is shared.
 */
import { createTestApp, loginAs, SEEDED, TestApp, uniquePhone } from "../utils/test-app";

describe("Sessions (integration)", () => {
  let testApp: TestApp;
  let superadminToken: string;

  const newWorker = async () => {
    const phone = uniquePhone();
    const user = await testApp.prisma.user.create({
      data: {
        empId: `IT-SESS-${phone}`,
        firstName: "Sess",
        lastName: "Worker",
        mobile: phone,
        role: "WORKER",
      },
    });
    const token = await loginAs(testApp.http, phone, testApp.prisma);
    return { user, token };
  };
  // Any authenticated route works; notifications is open to every role.
  const probe = (token: string) =>
    testApp.http.get("/notifications").set("Authorization", `Bearer ${token}`);

  beforeAll(async () => {
    testApp = await createTestApp();
    superadminToken = await loginAs(testApp.http, SEEDED.superadmin.phone, testApp.prisma);
  });

  afterAll(async () => {
    await testApp.close();
  });

  it("a signed-in token works until it is logged out, and not after", async () => {
    const { token } = await newWorker();
    expect((await probe(token)).status).toBe(200);

    const out = await testApp.http.post("/auth/logout").set("Authorization", `Bearer ${token}`);
    expect(out.status).toBe(201);

    const after = await probe(token);
    expect(after.status).toBe(401);
    expect(after.body.code).toBe("AUTH_SESSION_EXPIRED");
  });

  it("an admin signing a device out ends that token on its next request", async () => {
    const { user, token } = await newWorker();
    const list = await testApp.http
      .get(`/users/${user.id}/sessions`)
      .set("Authorization", `Bearer ${superadminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);

    const revoke = await testApp.http
      .delete(`/users/${user.id}/sessions/${list.body.data[0].id}`)
      .set("Authorization", `Bearer ${superadminToken}`);
    expect(revoke.status).toBe(200);

    expect((await probe(token)).status).toBe(401);
  });

  it("deactivating an account locks it out at once and refuses a new OTP", async () => {
    const { user, token } = await newWorker();

    const off = await testApp.http
      .patch(`/users/${user.id}`)
      .set("Authorization", `Bearer ${superadminToken}`)
      .send({ status: "INACTIVE" });
    expect(off.status).toBe(200);

    expect((await probe(token)).status).toBe(401);
    const otp = await testApp.http.post("/auth/request-otp").send({ phone: user.mobile });
    expect(otp.status).toBe(401);
  });

  it("removing the portal a session is in ends that session", async () => {
    const { user, token } = await newWorker();
    await testApp.prisma.user.update({ where: { id: user.id }, data: { role: "SHOP" } });

    expect((await probe(token)).status).toBe(401);
  });

  it("only admins may list or end someone else's sessions", async () => {
    const a = await newWorker();
    const b = await newWorker();
    const res = await testApp.http
      .get(`/users/${b.user.id}/sessions`)
      .set("Authorization", `Bearer ${a.token}`);
    expect(res.status).toBe(403);
  });
});

/**
 * Real HTTP, real Postgres, real JwtStrategy/PermissionsGuard — the login
 * flow every other integration spec's loginAs() depends on. Unit specs
 * (src/auth/auth.service.spec.ts) already cover the service logic in
 * isolation with a mocked Prisma; this file exists to prove the whole stack
 * wired together actually behaves the same way, end to end.
 */
import {
  clearOtpThrottle,
  createTestApp,
  loginAs,
  SEEDED,
  TestApp,
  uniquePhone,
  type Envelope,
} from "../utils/test-app";

describe("Auth (integration)", () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  it("rejects an unregistered phone number before issuing an OTP", async () => {
    const res = await testApp.http.post("/auth/request-otp").send({ phone: uniquePhone() });
    expect(res.status).toBe(401);
  });

  it("logs the seeded superadmin in and returns a token carrying the right role", async () => {
    const token = await loginAs(testApp.http, SEEDED.superadmin.phone, testApp.prisma);
    expect(token).toEqual(expect.any(String));

    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as {
      role: string;
      mobile: string;
    };
    expect(payload.role).toBe(SEEDED.superadmin.role);
    expect(payload.mobile).toBe(SEEDED.superadmin.phone);
  });

  it("rejects a request to a protected route with no token at all", async () => {
    const res = await testApp.http.get("/users");
    // JwtAuthGuard is global; every route needs a valid JWT unless @Public().
    expect(res.status).toBe(401);
  });

  it("rejects a request with a garbage bearer token", async () => {
    const res = await testApp.http.get("/users").set("Authorization", "Bearer not-a-real-jwt");
    expect(res.status).toBe(401);
  });

  it("verify-otp rejects an incorrect code without consuming a real one", async () => {
    const phone = SEEDED.admin.phone;
    // This spec drives the OTP endpoints directly rather than via loginAs(),
    // so it has to clear the throttle rows itself.
    await clearOtpThrottle(testApp.prisma, phone);
    await testApp.http.post("/auth/request-otp").send({ phone });

    const wrong = await testApp.http.post("/auth/verify-otp").send({ phone, code: "000000" });
    expect(wrong.status).toBe(401);

    // The real code, requested moments ago, must still work afterwards - a
    // wrong guess must not burn/consume the legitimate pending OTP.
    const codeRes = await testApp.http.get("/auth/testing/otp").query({ phone });
    const code = (codeRes.body as Envelope<{ code: string }>).data.code;
    const right = await testApp.http.post("/auth/verify-otp").send({ phone, code });
    expect(right.status).toBe(201);
  });

  it("GET /auth/testing/otp is reachable in this environment, proving E2E_TEST_MODE took effect", async () => {
    // Sanity check on the harness itself: if this ever 404s, every other
    // spec in this suite is silently unable to log in, and the real failure
    // (backend/.env.test missing E2E_TEST_MODE=true) would otherwise show up
    // as confusing timeouts elsewhere instead of here.
    const phone = uniquePhone();
    await testApp.prisma.user.create({
      data: {
        empId: `IT-${phone}`,
        firstName: "Integration",
        lastName: "Test",
        mobile: phone,
        role: "WORKER",
      },
    });
    await testApp.http.post("/auth/request-otp").send({ phone });
    const res = await testApp.http.get("/auth/testing/otp").query({ phone });
    expect(res.status).toBe(200);
  });
});

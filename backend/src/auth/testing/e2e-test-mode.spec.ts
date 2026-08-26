import { isE2eTestModeEnabled } from "./e2e-test-mode";

/**
 * This gate decides, at AuthModule construction time, whether
 * TestOnlyAuthController — which echoes a plaintext OTP — is wired into the
 * app at all. It must default closed and require an explicit double opt-in,
 * because AuthService.otpInspector?.record() and this gate are the only
 * things standing between "OTP is bcrypt-only, exactly as before" and "OTP is
 * retrievable in plaintext by anyone who can reach the API".
 */
describe("isE2eTestModeEnabled", () => {
  const original = { NODE_ENV: process.env.NODE_ENV, E2E_TEST_MODE: process.env.E2E_TEST_MODE };

  afterEach(() => {
    process.env.NODE_ENV = original.NODE_ENV;
    process.env.E2E_TEST_MODE = original.E2E_TEST_MODE;
  });

  const set = (nodeEnv: string | undefined, e2eTestMode: string | undefined) => {
    if (nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
    if (e2eTestMode === undefined) delete process.env.E2E_TEST_MODE;
    else process.env.E2E_TEST_MODE = e2eTestMode;
  };

  it("is disabled with neither variable set", () => {
    set(undefined, undefined);
    expect(isE2eTestModeEnabled()).toBe(false);
  });

  it("is disabled in development without the explicit flag", () => {
    set("development", undefined);
    expect(isE2eTestModeEnabled()).toBe(false);
  });

  it("is disabled by a falsy-looking flag value", () => {
    set("development", "false");
    expect(isE2eTestModeEnabled()).toBe(false);
    set("development", "0");
    expect(isE2eTestModeEnabled()).toBe(false);
    set("development", "");
    expect(isE2eTestModeEnabled()).toBe(false);
  });

  it("is enabled only by the exact combination E2E_TEST_MODE=true outside production", () => {
    set("development", "true");
    expect(isE2eTestModeEnabled()).toBe(true);
    set("test", "true");
    expect(isE2eTestModeEnabled()).toBe(true);
    set(undefined, "true");
    expect(isE2eTestModeEnabled()).toBe(true);
  });

  it("stays disabled in production even with the flag set", () => {
    // The one case that must never flip: NODE_ENV=production always wins,
    // regardless of what E2E_TEST_MODE is set to.
    set("production", "true");
    expect(isE2eTestModeEnabled()).toBe(false);
  });
});

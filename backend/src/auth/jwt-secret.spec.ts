/**
 * jwt-secret.ts resolves its value at module load, so every case here has to
 * set the env vars and then require() the module fresh after
 * jest.resetModules() — the same pattern (and for the same reason) as
 * testing/test-only-auth.controller.spec.ts.
 */
describe("JWT_SECRET resolution", () => {
  const original = { NODE_ENV: process.env.NODE_ENV, JWT_SECRET: process.env.JWT_SECRET };

  afterEach(() => {
    process.env.NODE_ENV = original.NODE_ENV;
    if (original.JWT_SECRET === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original.JWT_SECRET;
    jest.resetModules();
  });

  function load(nodeEnv: string | undefined, secret: string | undefined): string {
    if (nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
    if (secret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = secret;

    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require("./jwt-secret") as typeof import("./jwt-secret")).JWT_SECRET;
  }

  const REAL_SECRET = "a".repeat(48);

  describe("outside production", () => {
    it("falls back to the dev secret when JWT_SECRET is unset", () => {
      expect(load("development", undefined)).toBe("beere-kesava-dev-only-insecure-secret");
    });

    it("prefers a configured secret over the fallback", () => {
      expect(load("development", "my-local-secret")).toBe("my-local-secret");
    });

    it("does not enforce the production length floor", () => {
      expect(load("test", "short")).toBe("short");
    });
  });

  describe("in production", () => {
    it("accepts a long, unrecognised secret", () => {
      expect(load("production", REAL_SECRET)).toBe(REAL_SECRET);
    });

    it("refuses to load with JWT_SECRET unset", () => {
      expect(() => load("production", undefined)).toThrow(/must be set in production/);
    });

    it("refuses the dev fallback even when it is set explicitly", () => {
      expect(() => load("production", "beere-kesava-dev-only-insecure-secret")).toThrow(
        /known development value/,
      );
    });

    it("refuses the old committed fallback that shipped in the source", () => {
      expect(() => load("production", "beere-kesava-secret-key-2026")).toThrow(
        /known development value/,
      );
    });

    it("refuses a secret shorter than 32 characters", () => {
      expect(() => load("production", "a".repeat(31))).toThrow(/at least 32 characters/);
    });

    it("accepts exactly 32 characters", () => {
      expect(load("production", "b".repeat(32))).toBe("b".repeat(32));
    });
  });
});

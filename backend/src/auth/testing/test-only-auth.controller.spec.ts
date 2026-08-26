/**
 * AuthModule reads isE2eTestModeEnabled() once, at module *definition* time
 * (a top-level const, not something re-checked per request — see the comment
 * in auth.module.ts), and Nest's @Module() decorator captures that value into
 * the class's static metadata (MODULE_METADATA.CONTROLLERS /
 * MODULE_METADATA.PROVIDERS) the moment the file is first evaluated. Nest's
 * router builds every route directly from that metadata, so proving
 * TestOnlyAuthController is or isn't present there — under each env
 * combination — proves whether the route can ever exist, without needing to
 * boot the full app's unrelated DI graph (global guards, Reflector, and
 * every other AuthModule dependency) just to make an HTTP request.
 *
 * This complements e2e-test-mode.spec.ts, which covers the pure gate
 * function in isolation, and reuses jest.resetModules() the same way: env
 * vars are set, then auth.module.ts is required fresh so its top-level
 * `const e2eTestMode = isE2eTestModeEnabled()` re-evaluates under that env.
 */
import { MODULE_METADATA } from "@nestjs/common/constants";

describe("AuthModule / E2E test-mode route registration", () => {
  const original = { NODE_ENV: process.env.NODE_ENV, E2E_TEST_MODE: process.env.E2E_TEST_MODE };

  afterEach(() => {
    process.env.NODE_ENV = original.NODE_ENV;
    process.env.E2E_TEST_MODE = original.E2E_TEST_MODE;
    jest.resetModules();
  });

  function loadAuthModuleControllerNames(nodeEnv: string | undefined, e2eTestMode: string | undefined) {
    if (nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
    if (e2eTestMode === undefined) delete process.env.E2E_TEST_MODE;
    else process.env.E2E_TEST_MODE = e2eTestMode;
    // auth.module.ts independently refuses to load in production without a
    // real secret (see its own top-level check) — irrelevant to what this
    // test is verifying, so satisfy it rather than let it mask the result.
    if (nodeEnv === "production") process.env.JWT_SECRET = "test-secret-for-this-check-only";

    jest.resetModules();
    // Must be a fresh require() after resetModules() — a static top-of-file
    // import would be hoisted and cached before the env vars above are set.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AuthModule } = require("../auth.module") as typeof import("../auth.module");

    const controllers = (Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, AuthModule) ??
      []) as Array<{ name: string }>;
    const providers = (Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AuthModule) ??
      []) as Array<{ name?: string; provide?: { name?: string } }>;
    return {
      controllerNames: controllers.map((c) => c.name),
      // Provider entries are a mix of bare classes and { provide, useClass }
      // literals — check both shapes for the provider's name rather than
      // JSON.stringify, which throws on the circular structures classes with
      // decorator metadata tend to carry.
      hasOtpInspectorProvider: providers.some(
        (p) => p.name === "OtpInspectorService" || p.provide?.name === "OtpInspectorService",
      ),
    };
  }

  it("omits the test-only controller and provider without the flag", () => {
    const { controllerNames, hasOtpInspectorProvider } = loadAuthModuleControllerNames(
      "development",
      undefined,
    );
    expect(controllerNames).not.toContain("TestOnlyAuthController");
    expect(hasOtpInspectorProvider).toBe(false);
  });

  it("omits them when the flag is set to a falsy-looking string", () => {
    const { controllerNames } = loadAuthModuleControllerNames("development", "false");
    expect(controllerNames).not.toContain("TestOnlyAuthController");
  });

  it("registers both when the flag is explicitly true outside production", () => {
    const { controllerNames, hasOtpInspectorProvider } = loadAuthModuleControllerNames(
      "development",
      "true",
    );
    expect(controllerNames).toContain("TestOnlyAuthController");
    expect(hasOtpInspectorProvider).toBe(true);
  });

  it("stays disabled in production even with the flag set", () => {
    // The one case that must never flip.
    const { controllerNames, hasOtpInspectorProvider } = loadAuthModuleControllerNames(
      "production",
      "true",
    );
    expect(controllerNames).not.toContain("TestOnlyAuthController");
    expect(hasOtpInspectorProvider).toBe(false);
  });
});

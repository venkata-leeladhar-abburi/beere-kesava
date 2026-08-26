/**
 * Separate from the unit-test config (../jest.config.js) on purpose: these
 * specs boot the full Nest app over real HTTP against a real database
 * (test/utils/test-app.ts), which is an order of magnitude slower per test
 * than a mocked-Prisma unit spec and belongs in its own CI step / local
 * command rather than blocking the fast inner loop.
 *
 * Requires backend/.env.test to point at a disposable Postgres — see
 * test/README.md. Never run against backend/.env's DATABASE_URL.
 */
/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "..",
  testRegex: "test/integration/.*\\.integration\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          target: "ES2021",
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          strictNullChecks: true,
          skipLibCheck: true,
          types: ["node", "jest"],
        },
      },
    ],
  },
  testEnvironment: "node",
  // Real HTTP + a real Postgres round trip per request is slow enough that
  // the unit-suite's 30s ceiling (see ../jest.config.js) isn't generous
  // enough here.
  testTimeout: 30000,
  maxWorkers: 1,
  globalSetup: "<rootDir>/test/utils/global-setup.ts",
};

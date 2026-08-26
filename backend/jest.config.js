/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
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
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  // ts-jest compiles each suite from scratch, so a cold worker can spend
  // several seconds before the first assertion runs. Combined with the real
  // bcrypt hashing in the auth specs, the 5s default blew up under parallel
  // load while every suite passed when run alone. Raise the ceiling rather
  // than weaken the tests.
  testTimeout: 30000,
};

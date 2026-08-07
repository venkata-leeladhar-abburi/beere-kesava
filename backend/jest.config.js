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
};

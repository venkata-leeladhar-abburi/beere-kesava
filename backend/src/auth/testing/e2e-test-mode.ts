/**
 * Gate for every test-only seam in this directory (currently just the OTP
 * inspector). Requires BOTH conditions so a stray `NODE_ENV=test` in a real
 * deployment cannot, by itself, expose a plaintext-OTP endpoint:
 *
 *   - NODE_ENV is not "production"
 *   - E2E_TEST_MODE is explicitly "true"
 *
 * AuthModule uses this to decide, at module-construction time, whether to
 * register OtpInspectorService and TestOnlyAuthController at all — a route
 * this function returns false for is never wired into the app, not merely
 * refused at request time.
 */
export function isE2eTestModeEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.E2E_TEST_MODE === "true";
}

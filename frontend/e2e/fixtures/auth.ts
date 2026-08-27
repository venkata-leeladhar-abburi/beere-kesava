import { expect, test as base, type Page } from "@playwright/test";

/**
 * Logs a real user through the real /auth/request-otp -> /auth/verify-otp
 * flow, the same path a human takes. Two accounts are guaranteed to exist in
 * any environment without seeding: SUPERADMIN (9392757489) and ADMIN
 * (8888888888) are upserted idempotently by AuthService.ensureDefaultUsers()
 * on first login (see backend/src/auth/auth.service.ts). Every other role
 * needs a real seeded user or weaver with a matching phone number - see each
 * journey spec for what it expects to already exist.
 *
 * The OTP itself is retrieved from GET /auth/testing/otp, which only exists
 * when the backend was started with E2E_TEST_MODE=true outside production
 * (backend/src/auth/testing/e2e-test-mode.ts). Without that flag this
 * request 404s and the helper fails loudly rather than hanging on a code
 * that will never arrive.
 */
export const SEEDED_USERS = {
  superadmin: { phone: "9392757489", dashboardPath: "/superadmin" },
  admin: { phone: "8888888888", dashboardPath: "/admin" },
} as const;

export async function fetchOtp(page: Page, apiURL: string, phone: string): Promise<string> {
  // Only ever reads the code an already-issued request produced — never
  // requests one itself. The 60-second resend cooldown in
  // AuthService.requestOtp counts per phone number regardless of caller, so
  // calling POST /auth/request-otp here as well as clicking the UI's own
  // "Send OTP" button would race that cooldown and 429 one of the two.
  const codeResponse = await page.request.get(`${apiURL}/auth/testing/otp`, {
    params: { phone },
  });
  if (codeResponse.status() === 404) {
    throw new Error(
      "GET /auth/testing/otp returned 404. Either no OTP has been recorded for " +
        `${phone} yet, or the backend was not started with E2E_TEST_MODE=true ` +
        "(see backend/src/auth/testing/e2e-test-mode.ts and playwright.config.ts).",
    );
  }
  if (!codeResponse.ok()) {
    throw new Error(`GET /auth/testing/otp returned ${codeResponse.status()}: ${await codeResponse.text()}`);
  }

  // Every response is wrapped by the backend's global ResponseInterceptor as
  // { success, statusCode, data: <actual payload> } - see
  // backend/src/common/interceptors/response.interceptor.ts.
  const body = (await codeResponse.json()) as { data: { code: string } };
  return body.data.code;
}

/**
 * Drives the real login UI end to end: types the phone number on
 * StepPhone, waits for the OTP screen, types the real code into the six
 * single-digit boxes, and waits for navigation off /login. This exercises
 * the same client code a user's browser runs — nothing is short-circuited
 * except how the code is obtained.
 */
export async function loginAs(page: Page, apiURL: string, phone: string): Promise<void> {
  await page.goto("/login");

  await page.getByPlaceholder("98765 43210").fill(phone);
  // The one and only OTP request for this login — fired through the real UI,
  // the same call a human's click makes. fetchOtp() below only ever reads
  // the code this produced; see its comment for why it must not also request
  // one.
  await page.getByRole("button", { name: /Send OTP/i }).click();
  await expect(page.getByText("Enter Your Mobile Number")).toBeHidden();

  const code = await fetchOtp(page, apiURL, phone);

  const digitBoxes = page.locator('input[maxlength="1"]');
  await expect(digitBoxes.first()).toBeVisible();
  await digitBoxes.first().click();
  await page.keyboard.type(code, { delay: 30 });

  // Filling all six boxes does not auto-submit — StepOTP only verifies on
  // Enter or an explicit click of this button (see its handleKey/onClick).
  await page.getByRole("button", { name: "Verify and Login" }).click();

  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
}

interface AuthFixtures {
  apiURL: string;
  loginAsSuperadmin: () => Promise<void>;
  loginAsAdmin: () => Promise<void>;
}

export const test = base.extend<AuthFixtures>({
  apiURL: [process.env.VITE_API_URL ?? "http://localhost:3000", { option: true }],

  loginAsSuperadmin: async ({ page, apiURL }, use) => {
    await use(() => loginAs(page, apiURL, SEEDED_USERS.superadmin.phone));
  },

  loginAsAdmin: async ({ page, apiURL }, use) => {
    await use(() => loginAs(page, apiURL, SEEDED_USERS.admin.phone));
  },
});

export { expect } from "@playwright/test";

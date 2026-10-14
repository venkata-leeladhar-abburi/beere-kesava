import { expect, test, SEEDED_USERS } from "../fixtures/auth";

/**
 * The one journey every other spec depends on, so it earns its own file and
 * runs first: OTP request -> OTP verify -> landing on the role-correct
 * dashboard. SUPERADMIN and ADMIN are the only two roles guaranteed to exist
 * without seeding (see fixtures/auth.ts), so this is what proves the E2E
 * harness itself — the test-only OTP endpoint, the login UI, the role ->
 * route mapping — actually works end to end.
 */
// Only two phone numbers are registered (SEEDED_USERS), and requesting an OTP
// invalidates any code already issued for that number. Two tests running in
// parallel on the same number would void each other's code, so this file
// runs serially.
test.describe.configure({ mode: "serial" });

test.describe("Login", () => {
  test("superadmin logs in via OTP and lands on the superadmin dashboard", async ({
    page,
    loginAsSuperadmin,
  }) => {
    await loginAsSuperadmin();
    await expect(page).toHaveURL(new RegExp(`^.*${SEEDED_USERS.superadmin.dashboardPath}`));
  });

  test("admin logs in via OTP and lands on the admin dashboard", async ({ page, loginAsAdmin }) => {
    await loginAsAdmin();
    await expect(page).toHaveURL(new RegExp(`^.*${SEEDED_USERS.admin.dashboardPath}`));
  });

  test("an unregistered phone number is rejected before an OTP is sent", async ({ page }) => {
    // Mirrors AuthService.requestOtp's guard: unknown numbers never trigger a
    // WhatsApp send, both to avoid burning billable conversations and to
    // avoid the endpoint acting as an open relay for OTP spam.
    await page.goto("/login");
    await page.getByPlaceholder("98765 43210").fill("0000000000");
    await page.getByRole("button", { name: /Send OTP/i }).click();

    await expect(page.getByText(/not registered/i)).toBeVisible();
    // Still on the phone step — no OTP screen should have appeared.
    await expect(page.locator('input[maxlength="1"]')).toHaveCount(0);
  });

  test("an incorrect code is rejected and the session stays unauthenticated", async ({ page }) => {
    // Reuses the admin phone from the test above. AuthService no longer has
    // a resend cooldown (only the lockout after three wrong guesses), so a
    // fresh OTP can be requested straight away.
    await page.goto("/login");
    await page.getByPlaceholder("98765 43210").fill(SEEDED_USERS.admin.phone);
    await page.getByRole("button", { name: /Send OTP/i }).click();

    const digitBoxes = page.locator('input[maxlength="1"]');
    await expect(digitBoxes.first()).toBeVisible();
    await digitBoxes.first().click();
    // Deliberately wrong — six digits, guaranteed not to match the real code.
    await page.keyboard.type("000000", { delay: 30 });
    // Filling the boxes never auto-submits — see the comment in
    // fixtures/auth.ts's loginAs().
    await page.getByRole("button", { name: "Verify and Login" }).click();

    // AuthService.verifyOtp's message for a wrong code.
    await expect(page.getByText(/invalid otp code/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

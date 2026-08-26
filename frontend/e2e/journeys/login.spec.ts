import { expect, test, SEEDED_USERS } from "../fixtures/auth";

/**
 * The one journey every other spec depends on, so it earns its own file and
 * runs first: OTP request -> OTP verify -> landing on the role-correct
 * dashboard. SUPERADMIN and ADMIN are the only two roles guaranteed to exist
 * without seeding (see fixtures/auth.ts), so this is what proves the E2E
 * harness itself — the test-only OTP endpoint, the login UI, the role ->
 * route mapping — actually works end to end.
 */
// Only two phone numbers are guaranteed registered (SEEDED_USERS), and
// AuthService.requestOtp enforces a real 60s-per-phone resend cooldown.
// Running these in parallel would have two tests race that cooldown against
// the same number, so this file trades its cross-test parallelism for a
// state constraint the backend itself enforces.
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
    // Reuses the admin phone, which the earlier "admin logs in" test already
    // requested an OTP for. AuthService.requestOtp enforces a real 60s resend
    // cooldown per phone number - there is no way around it with only two
    // guaranteed-registered numbers to test against, so this test waits it
    // out explicitly rather than flake on a 429. A disposable per-run
    // database (Phase 1's Testcontainers item) removes this constraint by
    // letting each test seed its own throwaway phone number instead.
    test.setTimeout(90_000);
    await page.waitForTimeout(61_000);

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

    await expect(page.getByText(/incorrect code/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

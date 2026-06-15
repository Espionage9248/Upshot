import { test, expect } from "./fixtures";

/**
 * Full auth + shell journey behind the production CSP, driven by a CDP virtual
 * authenticator. ONE test on ONE context on purpose: the resident passkey
 * created at /register must survive into the /login ceremony, and a fresh
 * context would drop it. "Sign out" therefore clears the session cookie, not the
 * context.
 *
 * `authenticatorId` is requested so the virtual-authenticator fixture attaches
 * before any WebAuthn call runs.
 */
test("register passkey → login → Today → theme → Settings → 401 Reconnect → auth redirect", async ({
  page,
  context,
  authenticatorId,
}) => {
  expect(authenticatorId).toBeTruthy();

  // 1) First run: /register → create a passkey → backup codes shown once.
  await page.goto("/register");
  await page.getByPlaceholder("you@example.com").fill("owner@upshot.test");
  await page.getByRole("button", { name: "Create account with passkey" }).click();

  await expect(page.getByText("Save your recovery codes")).toBeVisible();
  // Exactly 10 codes are issued.
  await expect(page.locator("ul li")).toHaveCount(10);

  await page.getByLabel("I have saved these recovery codes.").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/today");

  // 2) Sign out (clear session cookie; keep the authenticator) → /login → passkey.
  await context.clearCookies();
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign in with passkey" }).click();
  await page.waitForURL("**/today");

  // Authenticated shell rendered (the gear lives in the primary rail) and seeded
  // net worth is present ($20,912.00 = 248_300 + 1_842_900 cents).
  await expect(page.getByLabel("Settings")).toBeVisible();
  await expect(page.getByText("$20,912", { exact: false })).toBeVisible();

  // 3) Toggle light/dark: System → Light → Dark; <html class="dark"> flips.
  const themeButton = page.getByRole("button", { name: /^Theme:/ });
  await themeButton.click(); // → light
  await themeButton.click(); // → dark
  await expect(page.locator("html")).toHaveClass(/dark/);
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === "upshot-theme")?.value).toBe("dark");

  // 4) Open Settings via the gear.
  await page.getByLabel("Settings").click();
  await page.waitForURL("**/settings");

  // 5) Sync & activity → Runs → the 401 row carries a Reconnect affordance.
  // Scope to the settings nav rail (a duplicate link also sits in the page body).
  await page
    .getByLabel("Settings navigation")
    .getByRole("link", { name: "Sync & activity" })
    .click();
  await page.waitForURL("**/settings/sync-activity");
  await expect(page.getByText("Token expired")).toBeVisible();
  await expect(page.getByText("Reconnect")).toBeVisible();

  // 6) Unauthenticated access to a protected route → redirected to /login.
  await context.clearCookies();
  await page.goto("/today");
  await page.waitForURL("**/login");
  await expect(page.getByRole("button", { name: "Sign in with passkey" })).toBeVisible();
});

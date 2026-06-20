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
test("register passkey → login → Today → theme → Settings → 401 Reconnect → Plan → debts smoke → installments smoke → recurring smoke → auth redirect", async ({
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

  // 6) Dialog regression guard. Two prod-only bugs hid from jsdom unit tests
  // (no CSS) and text-only e2e: (a) the @upshot/ui Tailwind classes weren't
  // scanned, so dialogs mounted with a layout box but TRANSPARENT/unstyled —
  // `toBeVisible()` alone passes that, so assert a real background; (b) the
  // budget dialogs lacked router.refresh(), so a saved allocation didn't show
  // until reload — assert the figure updates in place.
  await page.goto("/budget");
  await page.getByRole("button", { name: /^Allocate$/ }).first().click();
  const allocPanel = page.getByRole("dialog");
  await expect(allocPanel).toBeVisible();
  const panelBg = await allocPanel.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(panelBg).not.toBe("rgba(0, 0, 0, 0)"); // styled, not a transparent purged shell
  await allocPanel.getByRole("textbox").first().fill("500");
  await allocPanel.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(/\$500/).first()).toBeVisible(); // refreshed without a reload

  // 6b) aria-describedby guard. The budget allocate dialog must have a
  // non-empty aria-describedby attribute (auto-wired by Radix when
  // aria-describedby={undefined} override is absent) that resolves to a
  // visible description node. Before the fix the override blanks the link.
  await page.goto("/budget");
  await page.getByRole("button", { name: /^Allocate$/ }).first().click();
  const allocDialog2 = page.getByRole("dialog");
  await expect(allocDialog2).toBeVisible();
  const describedBy = await allocDialog2.getAttribute("aria-describedby");
  expect(describedBy, "allocate dialog must have a non-empty aria-describedby").toBeTruthy();
  if (describedBy) {
    // Verify the id resolves to a visible description node in the DOM.
    // Use attribute selector to avoid CSS.escape (which is browser-only).
    const descNode = page.locator(`[id="${describedBy}"]`);
    await expect(descNode).toBeVisible();
  }
  // Close the dialog before continuing.
  await page.keyboard.press("Escape");

  // 7) Plan room: sub-nav links are visible.
  await page.goto("/plan");
  await expect(
    page.getByLabel("Plan navigation").getByRole("link", { name: "Debts" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Plan navigation").getByRole("link", { name: "BNPL" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Plan navigation").getByRole("link", { name: "Recurring" }),
  ).toBeVisible();

  // 8) /plan/debts route smoke: navigates, renders empty state (no debts seeded).
  await page.goto("/plan/debts");
  await expect(page.getByRole("heading", { name: "Debts" })).toBeVisible();
  // No debts are seeded in fixtures.ts, so the empty state renders.
  await expect(page.getByText("No debts tracked")).toBeVisible();
  // The "Add debt" button is present.
  await expect(page.getByRole("button", { name: "Add debt" }).first()).toBeVisible();

  // Regression guard: actually INVOKING each Plan write action against the
  // production build. A "use server" module with a bare `export type { X };`
  // re-export compiles to a runtime `registerServerReference(X)` → the action
  // crashes with "ReferenceError: X is not defined" the moment it is invoked
  // (the route smokes above only render the read path, which never loaded it).
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  // Debts: createDebtAction.
  await page.getByRole("button", { name: "Add debt" }).first().click();
  const debtDialog = page.getByRole("dialog");
  await debtDialog.getByLabel("Name").fill("Visa card");
  await debtDialog.getByLabel("Current balance").fill("2500");
  await debtDialog.getByLabel("Monthly payment").fill("200");
  await debtDialog.getByRole("button", { name: "Add debt" }).click();
  await expect(page.getByText("Visa card")).toBeVisible({ timeout: 15000 });

  // 9) /plan/installments route smoke: navigates, renders empty state (no plans seeded).
  await page.goto("/plan/installments");
  await expect(page.getByRole("heading", { name: "BNPL" })).toBeVisible();
  // No installment plans are seeded in fixtures.ts, so the empty state renders.
  await expect(page.getByText("No BNPL plans tracked")).toBeVisible();
  // The "Mark as BNPL" button is present.
  await expect(page.getByRole("button", { name: "Mark as BNPL" }).first()).toBeVisible();

  // Installments: createInstallmentPlanAction (exercises installments.ts).
  await page.getByRole("button", { name: "Mark as BNPL" }).first().click();
  const bnplDialog = page.getByRole("dialog");
  await bnplDialog.getByLabel("Merchant").fill("ACME Store");
  await bnplDialog.getByLabel("Total amount").fill("200");
  await bnplDialog.getByLabel("Number of installments").fill("4");
  await bnplDialog.getByLabel("First due date (YYYY-MM-DD)").fill("2026-07-01");
  await bnplDialog.getByLabel("Frequency (days)").fill("14");
  await bnplDialog.getByRole("button", { name: "Add plan" }).click();
  await expect(page.getByText("ACME Store")).toBeVisible({ timeout: 15000 });

  // 10) /plan/recurring route smoke: navigates, renders the recurring list.
  // fixtures.ts seeds one ACTIVE recurring item (e2e-bill-phone "Phone", $45/mo BILL).
  await page.goto("/plan/recurring");
  await expect(page.getByRole("heading", { name: "Recurring" })).toBeVisible();
  // The seeded Phone bill (ACTIVE, $45/mo) renders in the Active section.
  await expect(page.getByText("Phone")).toBeVisible();
  // Monthly total summary is present.
  await expect(page.getByText("Monthly total")).toBeVisible();

  // Recurring: setUsageAction on the seeded Phone bill (exercises recurring.ts).
  await page.getByRole("button", { name: "Set usage count" }).first().click();
  await page.getByLabel("Usage count").fill("3");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("button", { name: "Set usage count" }).first()).toBeVisible({
    timeout: 15000,
  });

  // No Plan write action threw a Server Components / ReferenceError in the prod build.
  expect(pageErrors, `unexpected page errors: ${pageErrors.join(" | ")}`).toEqual([]);

  // 11) Unauthenticated access to a protected route → redirected to /login.
  await context.clearCookies();
  await page.goto("/today");
  await page.waitForURL("**/login");
  await expect(page.getByRole("button", { name: "Sign in with passkey" })).toBeVisible();
});

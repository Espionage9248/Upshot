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
test("register passkey → login → Today → theme → Settings → 401 Reconnect → Plan → debts smoke → installments smoke → recurring smoke → strategy/what-if/BNPL-PathB/mark-BNPL/wishlist/mark-purchase/recurring-delete/detect/validation → auth redirect", async ({
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

  // --- Scenario planner: preview → save → lock → unlock (write paths) ---
  const planner = page.getByRole("region", { name: "Scenario planner" });
  await expect(planner).toBeVisible();

  // Set a to-debt share so a preview computes.
  await planner.getByRole("slider", { name: "To debt share" }).fill("60");

  // Custom strategy → author a payoff order (write path: customOrder flows into the scenario).
  // (Needs ≥1 included debt; "Visa card" was added earlier. A second debt makes reorder meaningful,
  //  but with one debt the Custom list still renders and selecting Custom must not error.)
  await planner.getByRole("radio", { name: "Custom" }).click();
  const customList = planner.getByRole("list", { name: "Custom payoff order" });
  await expect(customList).toBeVisible({ timeout: 15000 });
  // If a second debt exists, exercise a move; otherwise the single row's buttons are disabled.
  const downButtons = customList.getByRole("button", { name: /^Move .* down$/ });
  if ((await downButtons.count()) > 0 && (await downButtons.first().isEnabled())) {
    await downButtons.first().click();
  }

  // Save as scenario (auto-accept the name prompt).
  page.once("dialog", (d) => d.accept("E2E scenario"));
  await planner.getByRole("button", { name: "Save as scenario" }).click();

  // Saved list shows it.
  const saved = page.getByRole("region", { name: "Saved scenarios" });
  await expect(saved.getByText("E2E scenario")).toBeVisible({ timeout: 15000 });

  // Lock the current scenario as the tracked plan.
  await planner.getByRole("button", { name: "Lock in debt plan" }).click();

  // Locked banner appears.
  const banner = page.getByRole("region", { name: "Locked debt plan" });
  await expect(banner).toBeVisible({ timeout: 15000 });

  // Unlock to restore the unlocked state.
  await banner.getByRole("button", { name: "Re-model / unlock" }).click();
  await expect(banner).toBeHidden({ timeout: 15000 });

  // 9) /plan/installments route smoke: navigates, renders empty state (no plans seeded).
  // The BNPL list was rebuilt in the Phase-5 rebuild: the button is "Add BNPL plan"
  // (InstallmentFormDialog Path B — per-installment amount + auto-match, no
  // frequency/first-due fields). "Mark as BNPL" now lives in the /money row
  // popover (Path A).
  await page.goto("/plan/installments");
  await expect(page.getByRole("heading", { name: "BNPL" })).toBeVisible();
  // No installment plans are seeded in fixtures.ts, so the empty state renders.
  await expect(page.getByText("No BNPL plans tracked")).toBeVisible();
  // The "Add BNPL plan" button is present (both in the top bar and EmptyState).
  await expect(page.getByRole("button", { name: "Add BNPL plan" }).first()).toBeVisible();

  // Installments: createInstallmentByMatchAction (Path B — exercises installments.ts).
  await page.getByRole("button", { name: "Add BNPL plan" }).first().click();
  const bnplDialog = page.getByRole("dialog");
  await bnplDialog.getByLabel("Merchant").fill("ACME Store");
  await bnplDialog.getByLabel("Per-installment amount").fill("50.00");
  await bnplDialog.getByLabel("Number of installments").fill("4");
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

  // Recurring: toggle the seeded Phone bill's kind (exercises setRecurringKindAction
  // in recurring.ts). Seeded as a BILL → toggling flips it to Subscription. Scope
  // the assertion to the toggle button (the "Bills" category badge also contains
  // the substring "Bill").
  const kindToggle = page.getByRole("button", { name: "Toggle recurring kind" }).first();
  await expect(kindToggle).toContainText("Bill");
  await kindToggle.click();
  await expect(kindToggle).toContainText("Subscription", { timeout: 15000 });

  // ─── Extended write-path coverage (Task 19) ───────────────────────────────

  // 10a) Strategy toggle (Task 10): Avalanche option on the Debt payoff strategy
  // Segmented. Navigate back to debts where the dashboard now has the control.
  await page.goto("/plan/debts");
  // Wait until the "Visa card" debt is visible (page is re-rendered from DB).
  await expect(page.getByText("Visa card")).toBeVisible({ timeout: 15000 });
  await page
    .getByLabel("Debt payoff strategy")
    .getByRole("radio", { name: "Avalanche" })
    .click();
  // The page must survive the strategy toggle — no crash.
  await expect(page.getByLabel("Debt payoff strategy")).toBeVisible();

  // 10b) What-if panel (Task 11): fill "New interest rate % p.a." and pick the
  // refinance-target debt. The panel renders when debts.length > 0.
  // Fill the rate; this alone doesn't trigger recompute (needs a debt selected).
  await page.getByLabel("New interest rate % p.a.").fill("5");
  // Open the "Debt" combobox in the what-if section (Radix Select portal).
  // role="combobox" with name "Debt" — the UiSelect render.
  await page.getByRole("combobox", { name: "Debt" }).click();
  // Wait for the Radix Select portal to open and the option to appear.
  await expect(page.getByRole("option", { name: "Visa card" })).toBeVisible({ timeout: 5000 });
  await page.getByRole("option", { name: "Visa card" }).click();
  // The input change triggers recompute; assert no page error.

  // 10c) BNPL Path B (Task 15): Add BNPL plan with merchant/amount/count.
  await page.goto("/plan/installments");
  await expect(page.getByRole("heading", { name: "BNPL" })).toBeVisible();
  // "Add BNPL plan" button is rendered both in the top bar and in EmptyState.
  await page.getByRole("button", { name: "Add BNPL plan" }).first().click();
  const bnplPathBDialog = page.getByRole("dialog");
  await bnplPathBDialog.getByLabel("Merchant").fill("Klarna – Test");
  await bnplPathBDialog.getByLabel("Per-installment amount").fill("25.00");
  await bnplPathBDialog.getByLabel("Number of installments").fill("4");
  await bnplPathBDialog.getByRole("button", { name: "Add plan" }).click();
  // After success the dialog auto-closes and "Klarna – Test" card renders.
  await expect(page.getByText("Klarna – Test")).toBeVisible({ timeout: 15000 });

  // 10d) Mark as BNPL Path A (Task 14): open the first expense row's edit
  // popover on /money, click "Mark as BNPL", accept defaults, submit.
  // fixtures.ts seeds one SETTLED expense tx ("Klarna Purchase", -$50.00).
  await page.goto("/money");
  await expect(page.getByText("Klarna Purchase")).toBeVisible({ timeout: 15000 });
  // Open the gear popover on that row.
  await page.getByRole("button", { name: "Edit transaction" }).first().click();
  // The "Convert" section's "Mark as BNPL" trigger renders inside the popover.
  await page.getByRole("button", { name: "Mark as BNPL" }).click();
  // Both the Popover and the BNPL Dialog carry role="dialog". Scope to the one
  // that has the "Add plan" button (i.e. the BNPL dialog, not the Popover).
  const markBnplDialog = page.getByRole("dialog").filter({ has: page.getByRole("button", { name: "Add plan" }) });
  await expect(markBnplDialog).toBeVisible();
  // Defaults are pre-filled from the tx description and amount; just submit.
  await markBnplDialog.getByRole("button", { name: "Add plan" }).click();
  // After success the dialog closes; wait for it to leave the DOM.
  await expect(markBnplDialog).not.toBeVisible({ timeout: 15000 });

  // 10e) Wishlist (Task 17): add a wishlist item on /plan/purchases.
  await page.goto("/plan/purchases");
  await expect(page.getByRole("heading", { name: "Purchases" })).toBeVisible();
  await page.getByRole("button", { name: "Add to wishlist" }).first().click();
  const wishlistDialog = page.getByRole("dialog");
  await wishlistDialog.getByLabel("Name").fill("Test item");
  await wishlistDialog.getByLabel("Target price").fill("100.00");
  await wishlistDialog.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Test item")).toBeVisible({ timeout: 15000 });

  // 10f) Mark as purchase (Task 17): /money → gear → "Mark as purchase" → submit.
  await page.goto("/money");
  await expect(page.getByText("Klarna Purchase")).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Edit transaction" }).first().click();
  await page.getByRole("button", { name: "Mark as purchase" }).click();
  // The "Save" button scopes to the Mark-as-purchase dialog (not the Popover).
  const markPurchaseDialog = page.getByRole("dialog").filter({ has: page.getByRole("button", { name: "Save" }) });
  await expect(markPurchaseDialog).toBeVisible();
  // Name is pre-filled from tx description; just submit.
  await markPurchaseDialog.getByRole("button", { name: "Save" }).click();
  await expect(markPurchaseDialog).not.toBeVisible({ timeout: 15000 });

  // 10g) Recurring delete (Task 18): remove the seeded Phone bill.
  // The seeded "Phone" bill (ACTIVE) has the RecurringDeleteButton ("Delete"
  // button with aria-label "Remove recurring item").
  await page.goto("/plan/recurring");
  await expect(page.getByText("Phone")).toBeVisible();
  await page.getByRole("button", { name: "Remove recurring item" }).first().click();
  // After delete the page refreshes; Phone should disappear.
  await expect(page.getByText("Phone")).not.toBeVisible({ timeout: 15000 });

  // 10g2) Rules authoring (matching-foundation): build a Patreon-style rule that
  // uses the NEW amount-bounded condition (amount + ± + currency) AND the new
  // LINK_RECURRING action with an entity picker, then save it. This invokes the
  // real saveRuleAction write path against the prod build and asserts the rule
  // persists + renders. The DETECT run that follows (10h) then loads this rule
  // through the engine — any prod-only crash from the new action type surfaces
  // via the pageErrors guard below. (The currency-aware match + link mechanics
  // themselves are proven at the integration layer in detect.test.ts.)
  await page.goto("/settings/rules");
  await expect(page.getByRole("button", { name: "+ Rule" })).toBeVisible();
  await page.getByRole("button", { name: "+ Rule" }).click();
  const ruleDialog = page.getByRole("dialog");
  await expect(ruleDialog).toBeVisible();
  await ruleDialog.getByLabel("Rule name").fill("Patreon membership");

  // Condition: description contains "Patreon" AND ≈ $8.00 ± $0.50 USD (field +
  // operator keep their defaults: description / contains).
  await ruleDialog.getByRole("button", { name: "+ Add condition" }).click();
  await ruleDialog.getByLabel("Condition value").fill("Patreon");
  await ruleDialog.getByLabel("Condition amount").fill("8.00");
  await ruleDialog.getByLabel("Condition tolerance").fill("0.50");
  await ruleDialog.getByLabel("Condition currency").fill("USD");

  // Action: Link to recurring → the seeded "Patreon Membership" item.
  await ruleDialog.getByRole("button", { name: "+ Add action" }).click();
  await ruleDialog.getByRole("combobox", { name: "Action type" }).click();
  await page.getByRole("option", { name: "Link to recurring" }).click();
  await ruleDialog.getByRole("combobox", { name: "Target recurring item" }).click();
  await page.getByRole("option", { name: "Patreon Membership" }).click();

  await ruleDialog.getByRole("button", { name: "Save" }).click();
  // Saved: dialog closes, the rule card renders with the link-recurring summary.
  await expect(page.getByText("Patreon membership")).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/link recurring/)).toBeVisible();

  // 10h) DETECT / maintenance job (Task 7): trigger from Settings → Sync & activity.
  await page.goto("/settings/sync-activity");
  await expect(page.getByRole("button", { name: "Run detection" })).toBeVisible();
  await page.getByRole("button", { name: "Run detection" }).click();
  // Wait briefly for the action to complete and the page to settle.
  await page.waitForTimeout(2000);

  // 10i) Validation-error paths: open the debt dialog, submit with empty name.
  await page.goto("/plan/debts");
  await expect(page.getByText("Visa card")).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Add debt" }).first().click();
  const validationDebtDialog = page.getByRole("dialog");
  await expect(validationDebtDialog).toBeVisible();
  // Click "Add debt" without filling any fields → per-field error for Name.
  await validationDebtDialog.getByRole("button", { name: "Add debt" }).click();
  await expect(
    validationDebtDialog.getByText("Enter a name for this debt."),
  ).toBeVisible();
  // Close the dialog.
  await page.keyboard.press("Escape");

  // Validation-error path: BNPL form empty merchant.
  await page.goto("/plan/installments");
  await page.getByRole("button", { name: "Add BNPL plan" }).first().click();
  const validationBnplDialog = page.getByRole("dialog");
  await expect(validationBnplDialog).toBeVisible();
  // Submit without merchant → per-field error.
  await validationBnplDialog.getByRole("button", { name: "Add plan" }).click();
  await expect(
    validationBnplDialog.getByText("Enter the merchant name."),
  ).toBeVisible();
  // Close the dialog.
  await page.keyboard.press("Escape");

  // No Plan write action threw a Server Components / ReferenceError in the prod build.
  expect(pageErrors, `unexpected page errors: ${pageErrors.join(" | ")}`).toEqual([]);

  // 11) Unauthenticated access to a protected route → redirected to /login.
  await context.clearCookies();
  await page.goto("/today");
  await page.waitForURL("**/login");
  await expect(page.getByRole("button", { name: "Sign in with passkey" })).toBeVisible();
});

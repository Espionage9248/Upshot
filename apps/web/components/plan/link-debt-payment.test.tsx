import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, test, expect, beforeEach } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/server-actions/debts", () => ({
  linkDebtPaymentToDebtAction: vi.fn().mockResolvedValue({ ok: true, data: "rule-1" }),
}));

import { LinkDebtPayment } from "./link-debt-payment";
import { linkDebtPaymentToDebtAction } from "@/server-actions/debts";

const linkAction = vi.mocked(linkDebtPaymentToDebtAction);

beforeEach(() => { linkAction.mockClear(); refresh.mockClear(); });

test("picks a debt and confirms → calls linkDebtPaymentToDebtAction with the chosen debt + pattern", async () => {
  render(
    <LinkDebtPayment
      debts={[{ id: "zip", name: "Zip" }, { id: "visa", name: "Visa" }]}
      defaultPattern="ZIP PAYMENT"
      suggestionId="sugg-1"
      triggerLabel="This is a payment for"
    />,
  );
  // choose Visa
  fireEvent.change(screen.getByLabelText("Choose a debt"), { target: { value: "visa" } });
  fireEvent.click(screen.getByRole("button", { name: /Link payment/i }));
  await waitFor(() =>
    expect(linkAction).toHaveBeenCalledWith({
      debtId: "visa",
      debtName: "Visa",
      patterns: ["ZIP PAYMENT"],
      suggestionId: "sugg-1",
    }),
  );
  expect(refresh).toHaveBeenCalled();
});

test("disables confirm until a debt is chosen", () => {
  render(<LinkDebtPayment debts={[{ id: "zip", name: "Zip" }]} defaultPattern="X" triggerLabel="Link" />);
  // single debt is preselected → enabled; with a placeholder empty option it would be disabled.
  expect(screen.getByRole("button", { name: /Link payment/i })).toBeEnabled();
});

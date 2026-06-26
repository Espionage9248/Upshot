import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, test, expect } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

type CreateInput = { name: string; amountCents: number; frequency: string; kind: string };
const mockCreateRecurringAction = vi.fn(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (_input: CreateInput) => ({ ok: true as const, data: "rec-1" }),
);
vi.mock("@/server-actions/recurring", () => ({
  createRecurringAction: (arg: CreateInput) => mockCreateRecurringAction(arg),
}));

import { RecurringAddDialog } from "./recurring-add-dialog";

function openDialog() {
  render(<RecurringAddDialog />);
  fireEvent.click(screen.getByRole("button", { name: "+ Add recurring" }));
}

test("renders trigger button", () => {
  render(<RecurringAddDialog />);
  expect(screen.getByRole("button", { name: "+ Add recurring" })).toBeInTheDocument();
});

test("opening shows the form fields", () => {
  openDialog();
  expect(screen.getByRole("textbox", { name: /^Name$/i })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: /^Amount$/i })).toBeInTheDocument();
});

test("shows error when name is empty on submit", () => {
  openDialog();
  const buttons = screen.getAllByRole("button", { name: /add recurring/i });
  const submitBtn = buttons.at(-1)!;
  fireEvent.click(submitBtn);
  expect(screen.getByText("Enter a name for this recurring item.")).toBeInTheDocument();
});

test("shows error when amount is zero", () => {
  openDialog();
  fireEvent.change(screen.getByRole("textbox", { name: /^Name$/i }), {
    target: { value: "Netflix" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /^Amount$/i }), {
    target: { value: "0.00" },
  });
  const buttons = screen.getAllByRole("button", { name: /add recurring/i });
  fireEvent.click(buttons.at(-1)!);
  expect(screen.getByText("Enter a valid amount greater than zero.")).toBeInTheDocument();
});

test("calls createRecurringAction with integer cents (12.50 → 1250)", async () => {
  mockCreateRecurringAction.mockClear();
  openDialog();

  fireEvent.change(screen.getByRole("textbox", { name: /^Name$/i }), {
    target: { value: "Netflix" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /^Amount$/i }), {
    target: { value: "12.50" },
  });

  const buttons = screen.getAllByRole("button", { name: /add recurring/i });
  fireEvent.click(buttons.at(-1)!);

  await waitFor(() => {
    expect(mockCreateRecurringAction).toHaveBeenCalledOnce();
  });

  const arg = mockCreateRecurringAction.mock.calls[0]?.[0] as {
    name: string;
    amountCents: number;
    frequency: string;
    kind: string;
  };
  expect(arg.name).toBe("Netflix");
  expect(arg.amountCents).toBe(1250);
  expect(arg.frequency).toBe("MONTHLY");
  expect(arg.kind).toBe("SUBSCRIPTION");
});

test("integer cents conversion: whole dollars (15 → 1500)", async () => {
  mockCreateRecurringAction.mockClear();
  openDialog();

  fireEvent.change(screen.getByRole("textbox", { name: /^Name$/i }), {
    target: { value: "Spotify" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /^Amount$/i }), {
    target: { value: "15" },
  });

  const buttons = screen.getAllByRole("button", { name: /add recurring/i });
  fireEvent.click(buttons.at(-1)!);

  await waitFor(() => {
    expect(mockCreateRecurringAction).toHaveBeenCalledOnce();
  });

  const arg = mockCreateRecurringAction.mock.calls[0]?.[0] as { amountCents: number };
  expect(arg.amountCents).toBe(1500);
});

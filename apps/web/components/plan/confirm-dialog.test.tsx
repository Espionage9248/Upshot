import { render, screen, fireEvent } from "@testing-library/react";
import { vi, it, expect } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

it("renders the unlock copy and danger CTA when open", () => {
  render(<ConfirmDialog kind="unlock" open onOpenChange={() => {}} onConfirm={() => {}} />);
  expect(screen.getByText("Unlock your plan?")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Unlock" })).toBeInTheDocument();
});

it("fires onConfirm when the confirm button is clicked", () => {
  const onConfirm = vi.fn();
  render(<ConfirmDialog kind="lock" open onOpenChange={() => {}} onConfirm={onConfirm} />);
  fireEvent.click(screen.getByRole("button", { name: "Lock it in" }));
  expect(onConfirm).toHaveBeenCalledOnce();
});

it("renders nothing visible when closed", () => {
  render(<ConfirmDialog kind="lock" open={false} onOpenChange={() => {}} onConfirm={() => {}} />);
  expect(screen.queryByText("Lock in this plan?")).not.toBeInTheDocument();
});

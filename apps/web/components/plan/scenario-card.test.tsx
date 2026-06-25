import { render, screen, fireEvent } from "@testing-library/react";
import { vi, it, expect } from "vitest";
import { ScenarioCard } from "./scenario-card";

it("renders what-if stats and fires open", () => {
  const onOpen = vi.fn();
  render(
    <ScenarioCard
      name="Aggressive"
      debtFreeMonth="2028-02"
      extraPaymentCents={10000}
      interestSavedCents={250000}
      isLocked={false}
      onOpen={onOpen}
    />,
  );
  expect(screen.getByText("WHAT-IF")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Open/i }));
  expect(onOpen).toHaveBeenCalledOnce();
});

it("hides promote/delete for the locked card", () => {
  render(
    <ScenarioCard
      name="Tracked plan"
      debtFreeMonth="2028-02"
      extraPaymentCents={40000}
      interestSavedCents={0}
      isLocked
      onOpen={() => {}}
    />,
  );
  expect(screen.getByText("LOCKED")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Delete/i })).not.toBeInTheDocument();
});

it("shows dash for saves when locked", () => {
  render(
    <ScenarioCard
      name="Tracked plan"
      debtFreeMonth="2028-02"
      extraPaymentCents={40000}
      interestSavedCents={0}
      isLocked
      onOpen={() => {}}
    />,
  );
  // SAVES row shows "—" not a money amount
  const savesLabel = screen.getByText("SAVES");
  const savesRow = savesLabel.parentElement!;
  expect(savesRow.textContent).toContain("—");
});

it("renders promote and delete buttons for what-if cards", () => {
  const onPromote = vi.fn();
  const onDelete = vi.fn();
  render(
    <ScenarioCard
      name="Snowball"
      debtFreeMonth="2027-06"
      extraPaymentCents={20000}
      interestSavedCents={100000}
      isLocked={false}
      onOpen={() => {}}
      onPromote={onPromote}
      onDelete={onDelete}
    />,
  );
  expect(screen.getByRole("button", { name: /Promote/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument();
});

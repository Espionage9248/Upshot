import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { UpcomingBills } from "./upcoming-bills";

const BILLS = [
  { id: "1", name: "Netflix", sub: "Monthly", cents: 1999, daysUntil: 1 },
  { id: "2", name: "Origin Energy", sub: "Utility", cents: 14210, daysUntil: 2 },
  { id: "3", name: "Spotify", cents: 1199, daysUntil: 7 },
];

describe("UpcomingBills", () => {
  it("renders bill names", () => {
    const { getByText } = render(<UpcomingBills bills={BILLS} />);
    expect(getByText("Netflix")).toBeTruthy();
    expect(getByText("Origin Energy")).toBeTruthy();
    expect(getByText("Spotify")).toBeTruthy();
  });

  it("renders sub label when provided", () => {
    const { getByText } = render(<UpcomingBills bills={BILLS} />);
    expect(getByText("Monthly")).toBeTruthy();
  });

  it("warn-tint chip for daysUntil <= 2", () => {
    const { container } = render(<UpcomingBills bills={BILLS} />);
    const chips = container.querySelectorAll("[data-daychip]");
    // Netflix (1 day) and Origin (2 days) should have warn
    const warnChips = Array.from(chips).filter(
      (chip) =>
        (chip as HTMLElement).style.background?.includes("var(--warn)") ||
        (chip as HTMLElement).getAttribute("data-warn") === "true",
    );
    expect(warnChips.length).toBe(2);
  });

  it("neutral chip for daysUntil > 2", () => {
    const { container } = render(<UpcomingBills bills={BILLS} />);
    const chips = container.querySelectorAll("[data-daychip]");
    const neutralChips = Array.from(chips).filter(
      (chip) =>
        (chip as HTMLElement).getAttribute("data-warn") === "false",
    );
    expect(neutralChips.length).toBe(1);
  });

  it("renders projected Money for each bill", () => {
    const { container } = render(
      <UpcomingBills bills={[{ id: "1", name: "Bill", cents: 1999, daysUntil: 5 }]} />,
    );
    // projected kind uses dashed underline
    const projected = container.querySelector("span[style*='dashed']");
    expect(projected).toBeTruthy();
  });

  it("renders empty list without crashing", () => {
    const { container } = render(<UpcomingBills bills={[]} />);
    expect(container.firstChild).toBeTruthy();
  });
});

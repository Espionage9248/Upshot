import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { LoadedRule } from "@upshot/core";
import { ConditionRow } from "./condition-row";

type MatchCondition = LoadedRule["conditions"][number];

function makeCondition(overrides?: Partial<MatchCondition>): MatchCondition {
  return {
    id: "c-1",
    ruleId: "r-1",
    field: "description",
    mode: "contains",
    value: "patreon",
    amountCents: null,
    toleranceCents: null,
    currency: null,
    ...overrides,
  };
}

describe("ConditionRow — amount/tolerance/currency inputs", () => {
  it("typing a valid dollar amount fires onChange with amountCents in cents", () => {
    const onChange = vi.fn();
    render(
      <ConditionRow
        condition={makeCondition()}
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Condition amount"), {
      target: { value: "8.00" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: 800 }),
    );
  });

  it("clearing the amount input fires onChange with amountCents === null", () => {
    const onChange = vi.fn();
    render(
      <ConditionRow
        condition={makeCondition({ amountCents: 800 })}
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Condition amount"), {
      target: { value: "" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: null }),
    );
  });

  it("typing a lowercase currency string fires onChange with it uppercased", () => {
    const onChange = vi.fn();
    render(
      <ConditionRow
        condition={makeCondition()}
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Condition currency"), {
      target: { value: "usd" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ currency: "USD" }),
    );
  });

  it("a condition with amountCents: 800 renders '8.00' in the amount input (round-trip)", () => {
    render(
      <ConditionRow
        condition={makeCondition({ amountCents: 800 })}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const input = screen.getByLabelText("Condition amount") as HTMLInputElement;
    expect(input.value).toBe("8.00");
  });
});

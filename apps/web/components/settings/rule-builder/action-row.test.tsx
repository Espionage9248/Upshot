import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { LoadedRule } from "@upshot/core";
import { ActionRow } from "./action-row";

type MatchAction = LoadedRule["actions"][number];

const debtOptions = [{ value: "d1", label: "Visa" }];
const recurringOptions = [{ value: "r1", label: "Netflix" }];
const installmentOptions = [{ value: "i1", label: "Afterpay" }];
const categoryOptions = [{ value: "cat-1", label: "Groceries" }];
const tagOptions = [{ value: "tag-1", label: "tag-work" }];

function makeAction(overrides?: Partial<MatchAction>): MatchAction {
  return {
    id: "a-1",
    ruleId: "r-1",
    type: "RENAME",
    value: null,
    targetId: null,
    ...overrides,
  };
}

describe("ActionRow — LINK_* and IGNORE_SUBSCRIPTION", () => {
  it("renders Target debt select when action.type is LINK_DEBT", () => {
    render(
      <ActionRow
        action={makeAction({ type: "LINK_DEBT" })}
        categoryOptions={categoryOptions}
        tagOptions={tagOptions}
        debtOptions={debtOptions}
        recurringOptions={recurringOptions}
        installmentOptions={installmentOptions}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Target debt")).toBeInTheDocument();
  });

  it("renders Target recurring item select when action.type is LINK_RECURRING", () => {
    render(
      <ActionRow
        action={makeAction({ type: "LINK_RECURRING" })}
        categoryOptions={categoryOptions}
        tagOptions={tagOptions}
        debtOptions={debtOptions}
        recurringOptions={recurringOptions}
        installmentOptions={installmentOptions}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Target recurring item")).toBeInTheDocument();
  });

  it("renders Target BNPL plan select when action.type is LINK_INSTALLMENT", () => {
    render(
      <ActionRow
        action={makeAction({ type: "LINK_INSTALLMENT" })}
        categoryOptions={categoryOptions}
        tagOptions={tagOptions}
        debtOptions={debtOptions}
        recurringOptions={recurringOptions}
        installmentOptions={installmentOptions}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Target BNPL plan")).toBeInTheDocument();
  });

  it("renders no target picker for IGNORE_SUBSCRIPTION", () => {
    render(
      <ActionRow
        action={makeAction({ type: "IGNORE_SUBSCRIPTION" })}
        categoryOptions={categoryOptions}
        tagOptions={tagOptions}
        debtOptions={debtOptions}
        recurringOptions={recurringOptions}
        installmentOptions={installmentOptions}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText("Target category")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Target tag")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Target debt")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Target recurring item")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Target BNPL plan")).not.toBeInTheDocument();
  });
});

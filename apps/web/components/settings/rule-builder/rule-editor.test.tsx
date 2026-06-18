import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { LoadedRule } from "@upshot/core";
import { RuleEditor } from "./rule-editor";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const saveRuleAction = vi.fn();
const previewRuleAction = vi.fn();
const applyRuleAction = vi.fn();

vi.mock("@/server-actions/rules", () => ({
  saveRuleAction: (...a: unknown[]) => saveRuleAction(...a),
  previewRuleAction: (...a: unknown[]) => previewRuleAction(...a),
  applyRuleAction: (...a: unknown[]) => applyRuleAction(...a),
}));

const categoryOptions = [
  { value: "cat-groceries", label: "Groceries" },
  { value: "cat-fun", label: "Fun" },
];
const tagOptions = [{ value: "tag-work", label: "tag-work" }];

function renderEditor(rule?: LoadedRule) {
  render(
    <RuleEditor
      rule={rule ?? null}
      categoryOptions={categoryOptions}
      tagOptions={tagOptions}
      onClose={vi.fn()}
    />,
  );
}

describe("RuleEditor", () => {
  beforeEach(() => {
    saveRuleAction.mockReset();
    previewRuleAction.mockReset();
    applyRuleAction.mockReset();
  });

  it("adds and removes condition rows", () => {
    renderEditor();
    expect(screen.queryAllByTestId("condition-row")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: /add condition/i }));
    fireEvent.click(screen.getByRole("button", { name: /add condition/i }));
    expect(screen.queryAllByTestId("condition-row")).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: /remove condition/i })[0]!);
    expect(screen.queryAllByTestId("condition-row")).toHaveLength(1);
  });

  it("adds and removes action rows", () => {
    renderEditor();
    expect(screen.queryAllByTestId("action-row")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: /add action/i }));
    expect(screen.queryAllByTestId("action-row")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /remove action/i }));
    expect(screen.queryAllByTestId("action-row")).toHaveLength(0);
  });

  it("submits an assembled LoadedRule reflecting the rows", async () => {
    saveRuleAction.mockResolvedValue({ ok: true, data: { ok: true } });
    renderEditor();

    fireEvent.change(screen.getByLabelText(/rule name/i), {
      target: { value: "Coffee" },
    });

    // One condition: description contains "coffee"
    fireEvent.click(screen.getByRole("button", { name: /add condition/i }));
    fireEvent.change(screen.getByLabelText(/condition value/i), {
      target: { value: "coffee" },
    });

    // One action: RENAME -> "Coffee shop" (RENAME is the default action type)
    fireEvent.click(screen.getByRole("button", { name: /add action/i }));
    fireEvent.change(screen.getByLabelText(/rename value/i), {
      target: { value: "Coffee shop" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(saveRuleAction).toHaveBeenCalledTimes(1));
    const arg = saveRuleAction.mock.calls[0]![0] as LoadedRule;
    expect(arg.rule.name).toBe("Coffee");
    expect(arg.rule.isActive).toBe(true);
    expect(arg.conditions).toHaveLength(1);
    expect(arg.conditions[0]!.value).toBe("coffee");
    expect(arg.conditions[0]!.ruleId).toBe(arg.rule.id);
    expect(arg.actions).toHaveLength(1);
    expect(arg.actions[0]!.type).toBe("RENAME");
    expect(arg.actions[0]!.value).toBe("Coffee shop");
    expect(arg.actions[0]!.ruleId).toBe(arg.rule.id);
  });

  it("surfaces a bad SET_CATEGORY rejection (not a generic error, not success)", async () => {
    saveRuleAction.mockResolvedValue({
      ok: true,
      data: { ok: false, badCategoryId: "cat-gone" },
    });
    const onClose = vi.fn();
    render(
      <RuleEditor
        rule={null}
        categoryOptions={categoryOptions}
        tagOptions={tagOptions}
        onClose={onClose}
      />,
    );
    fireEvent.change(screen.getByLabelText(/rule name/i), {
      target: { value: "Bad" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => {
      expect(screen.getByText(/category no longer exists/i)).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});

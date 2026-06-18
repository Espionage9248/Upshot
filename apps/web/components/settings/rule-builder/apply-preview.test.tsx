import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { LoadedRule } from "@upshot/core";
import { ApplyPreview } from "./apply-preview";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const previewRuleAction = vi.fn();
const applyRuleAction = vi.fn();

vi.mock("@/server-actions/rules", () => ({
  previewRuleAction: (...a: unknown[]) => previewRuleAction(...a),
  applyRuleAction: (...a: unknown[]) => applyRuleAction(...a),
}));

const draft: LoadedRule = {
  rule: { id: "rule-1", name: "Coffee", isActive: true, priority: 100 },
  conditions: [],
  actions: [],
};

describe("ApplyPreview", () => {
  beforeEach(() => {
    previewRuleAction.mockReset();
    applyRuleAction.mockReset();
  });

  it("shows the previewed count", async () => {
    previewRuleAction.mockResolvedValue({ ok: true, data: { count: 7 } });
    render(<ApplyPreview draft={draft} saved />);
    fireEvent.click(screen.getByRole("button", { name: /preview/i }));
    await waitFor(() => {
      expect(screen.getByText(/Matches 7 transactions/i)).toBeInTheDocument();
    });
  });

  it("calls applyRuleAction and renders the success applied count", async () => {
    applyRuleAction.mockResolvedValue({ ok: true, data: { applied: 3 } });
    render(<ApplyPreview draft={draft} saved />);
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));
    await waitFor(() => {
      expect(applyRuleAction).toHaveBeenCalledWith("rule-1");
    });
    await waitFor(() => {
      expect(screen.getByText(/Applied to 3 transactions/i)).toBeInTheDocument();
    });
  });

  it("renders the amber warning path when apply returns a warning", async () => {
    applyRuleAction.mockResolvedValue({
      ok: true,
      data: { applied: 2, warning: { code: "up_writeback_failed", message: "x" } },
    });
    render(<ApplyPreview draft={draft} saved />);
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));
    await waitFor(() => {
      expect(screen.getByText(/Applied locally/i)).toBeInTheDocument();
    });
  });

  it("disables Apply for an unsaved rule with a hint to save first", () => {
    render(<ApplyPreview draft={draft} saved={false} />);
    expect(screen.getByRole("button", { name: /^apply$/i })).toBeDisabled();
    expect(screen.getByText(/save the rule first/i)).toBeInTheDocument();
  });
});

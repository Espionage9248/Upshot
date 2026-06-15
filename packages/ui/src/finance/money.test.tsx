import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Money } from "./money";

describe("Money atom", () => {
  it("formats integer cents as AUD with tabular figures", () => {
    const { container } = render(<Money cents={123456} kind="income" />);
    const el = container.firstChild as HTMLElement;
    expect(el.textContent).toContain("$1,234.56");
    expect(el.querySelector(".tnum")).toBeTruthy();
  });
  it("always shows a sign per kind", () => {
    expect(render(<Money cents={500} kind="income" />).container.textContent).toContain("+");
    expect(render(<Money cents={500} kind="expense" />).container.textContent).toContain("−");
    expect(render(<Money cents={500} kind="projected" />).container.textContent).toContain("~");
  });
  it("transfer reads neutral (no +/−), not as spend", () => {
    const txt = render(<Money cents={500} kind="transfer" />).container.textContent ?? "";
    expect(txt).not.toContain("−");
    expect(txt).not.toContain("+");
  });
  it("neutral shows − only for negative values (positive is sign-less)", () => {
    expect(render(<Money cents={-500} kind="neutral" />).container.textContent).toContain("−");
    expect(render(<Money cents={500} kind="neutral" />).container.textContent).not.toContain("−");
  });
  it("quiet renders neutral text colour", () => {
    const { container } = render(<Money cents={500} kind="expense" quiet />);
    expect((container.firstChild as HTMLElement).style.color).toContain("--text");
  });
});

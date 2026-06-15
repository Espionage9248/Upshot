import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Table, THead, TBody, TR, TH, TD } from "./table";

describe("Table", () => {
  it("renders semantic table with thead and tbody", () => {
    const { container } = render(
      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
          </TR>
        </THead>
        <TBody>
          <TR>
            <TD>Alice</TD>
          </TR>
        </TBody>
      </Table>,
    );
    expect(container.querySelector("table")).not.toBeNull();
    expect(container.querySelector("thead")).not.toBeNull();
    expect(container.querySelector("tbody")).not.toBeNull();
  });

  it("TD with numeric prop → has text-right and tnum classes", () => {
    const { container } = render(
      <Table>
        <TBody>
          <TR>
            <TD numeric>42.00</TD>
          </TR>
        </TBody>
      </Table>,
    );
    const td = container.querySelector("td") as HTMLElement;
    expect(td.className).toContain("text-right");
    expect(td.className).toContain("tnum");
  });

  it("TR with selected prop → has coral-dim bg and inset coral edge classes/style", () => {
    const { container } = render(
      <Table>
        <TBody>
          <TR selected>
            <TD>Row</TD>
          </TR>
        </TBody>
      </Table>,
    );
    const tr = container.querySelector("tr") as HTMLElement;
    // Either a class or inline style carries the coral-dim + inset coral
    const hasCoralDimClass = tr.className.includes("bg-[var(--coral-dim)]");
    const hasCoralDimStyle = tr.style.background?.includes("var(--coral-dim)") ?? false;
    expect(hasCoralDimClass || hasCoralDimStyle).toBe(true);

    const hasInsetClass = tr.className.includes("shadow-[inset_2px_0_0_var(--coral)]");
    const hasInsetStyle = tr.style.boxShadow?.includes("var(--coral)") ?? false;
    expect(hasInsetClass || hasInsetStyle).toBe(true);
  });

  it("TH renders caps label text", () => {
    render(
      <Table>
        <THead>
          <TR>
            <TH>AMOUNT</TH>
          </TR>
        </THead>
      </Table>,
    );
    expect(screen.getByText("AMOUNT")).toBeInTheDocument();
  });

  it("TH with numeric prop → text-right + tnum", () => {
    const { container } = render(
      <Table>
        <THead>
          <TR>
            <TH numeric>Amount</TH>
          </TR>
        </THead>
      </Table>,
    );
    const th = container.querySelector("th") as HTMLElement;
    expect(th.className).toContain("text-right");
    expect(th.className).toContain("tnum");
  });
});

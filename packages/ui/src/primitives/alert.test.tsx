import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Alert } from "./alert";

describe("Alert", () => {
  it("tone=critical → role=alert + renders children", () => {
    render(<Alert tone="critical">Danger!</Alert>);
    const el = screen.getByRole("alert");
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent("Danger!");
  });

  it("tone=warning → role=alert", () => {
    render(<Alert tone="warning">Watch out</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("tone=info → NO role=alert", () => {
    render(<Alert tone="info">FYI</Alert>);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("FYI")).toBeInTheDocument();
  });

  it("tone=critical → background style references var(--expense) + 12%", () => {
    const { container } = render(<Alert tone="critical">msg</Alert>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.background).toContain("var(--expense)");
    expect(el.style.background).toContain("12%");
  });

  it("tone=warning → background references var(--warn) + 12%", () => {
    const { container } = render(<Alert tone="warning">msg</Alert>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.background).toContain("var(--warn)");
    expect(el.style.background).toContain("12%");
  });

  it("icon={false} hides the icon svg", () => {
    const { container } = render(<Alert tone="info" icon={false}>msg</Alert>);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("default shows an icon svg", () => {
    const { container } = render(<Alert tone="info">msg</Alert>);
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("action prop renders", () => {
    render(<Alert tone="info" action={<button>Dismiss</button>}>msg</Alert>);
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });
});

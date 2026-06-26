import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

// usePathname drives active/settingsActive derivation.
let pathname = "/today";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));
// next/link renders a plain anchor in tests.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { UpRail } from "./up-rail";

describe("UpRail", () => {
  it("renders the 5 rooms with their labels and hrefs", () => {
    pathname = "/today";
    const { getByText, getByRole } = render(<UpRail />);
    for (const label of ["Today", "Money", "Budget", "Plan", "Analyse"]) {
      expect(getByText(label)).toBeTruthy();
    }
    expect(getByRole("link", { name: /Money/ })).toHaveAttribute("href", "/money");
    expect(getByRole("link", { name: /Budget/ })).toHaveAttribute(
      "href",
      "/budget",
    );
  });

  it("marks the active room with aria-current based on the pathname", () => {
    pathname = "/money";
    const { getByRole } = render(<UpRail />);
    expect(getByRole("link", { name: /Money/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(getByRole("link", { name: /Today/ })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("renders the gear and avatar", () => {
    pathname = "/today";
    const { getByRole, getByText } = render(<UpRail />);
    expect(getByRole("link", { name: /Settings/i })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(getByText("SM")).toBeTruthy();
  });

  it("when on a /settings path, no room is current and the gear is current", () => {
    pathname = "/settings";
    const { getByRole } = render(<UpRail />);
    expect(getByRole("link", { name: /Settings/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(getByRole("link", { name: /Today/ })).not.toHaveAttribute(
      "aria-current",
    );
    expect(getByRole("link", { name: /Money/ })).not.toHaveAttribute(
      "aria-current",
    );
  });
});

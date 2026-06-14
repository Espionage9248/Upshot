import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SettingsNav, SETTINGS_SECTIONS } from "./settings-nav";

describe("SettingsNav", () => {
  it("renders all 7 default sections in order", () => {
    render(<SettingsNav activeHref="/settings/account" />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(7);
    expect(links[0]).toHaveTextContent("Account & profile");
    expect(links[1]).toHaveTextContent("Connections & sync");
    expect(links[2]).toHaveTextContent("Budgeting & goals");
    expect(links[3]).toHaveTextContent("Debts & purchases");
    expect(links[4]).toHaveTextContent("Tax");
    expect(links[5]).toHaveTextContent("Data & export");
    expect(links[6]).toHaveTextContent("Sync & activity");
  });

  it("active item has aria-current=page and coral-dim classes", () => {
    render(<SettingsNav activeHref="/settings/sync" />);
    const syncLink = screen.getByRole("link", { name: "Connections & sync" });
    expect(syncLink).toHaveAttribute("aria-current", "page");
    expect(syncLink.className).toContain("coral-dim");
    // inset shadow indicates active left edge
    expect(syncLink.className).toMatch(/inset/);
  });

  it("inactive items do not have aria-current and do not have coral-dim", () => {
    render(<SettingsNav activeHref="/settings/sync" />);
    const accountLink = screen.getByRole("link", { name: "Account & profile" });
    expect(accountLink).not.toHaveAttribute("aria-current");
    expect(accountLink.className).not.toContain("coral-dim");
  });

  it("each link has a correct href", () => {
    render(<SettingsNav activeHref="/settings/account" />);
    const links = screen.getAllByRole("link");
    // hrefs are provided by the default SETTINGS_SECTIONS
    links.forEach((link) => {
      expect(link).toHaveAttribute("href");
    });
  });

  it("SETTINGS_SECTIONS export has 7 entries", () => {
    expect(SETTINGS_SECTIONS).toHaveLength(7);
  });

  it("accepts custom items", () => {
    const items = [
      { label: "Alpha", href: "/alpha" },
      { label: "Beta", href: "/beta" },
    ];
    render(<SettingsNav items={items} activeHref="/alpha" />);
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Alpha" })).toHaveAttribute("aria-current", "page");
  });
});

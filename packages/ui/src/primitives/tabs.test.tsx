import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TabsList, TabsTrigger, TabsContent, UiTabs } from "./tabs";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "assets", label: "Assets" },
  { value: "debts", label: "Debts" },
];

describe("Tabs", () => {
  it("renders a tablist with all triggers", () => {
    render(
      <UiTabs defaultValue="overview">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            {t.label} content
          </TabsContent>
        ))}
      </UiTabs>,
    );
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Assets" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Debts" })).toBeInTheDocument();
  });

  it("the default tab panel is visible, others hidden", () => {
    render(
      <UiTabs defaultValue="overview">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            {t.label} content
          </TabsContent>
        ))}
      </UiTabs>,
    );
    // Radix renders inactive tab panels hidden (aria-hidden or unmounted)
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Overview content");
  });

  it("clicking a trigger selects it and shows its panel", () => {
    render(
      <UiTabs defaultValue="overview">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            {t.label} content
          </TabsContent>
        ))}
      </UiTabs>,
    );
    const assetsTab = screen.getByRole("tab", { name: "Assets" });
    // Radix Tabs activates on mouseDown (not click), so we fire mousedown.
    fireEvent.mouseDown(assetsTab);
    expect(assetsTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Assets content");
  });
});

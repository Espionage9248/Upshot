import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { DashboardWidget } from "@/server-actions/dashboard";
import { DashGrid } from "./dash-grid";
import {
  addWidget,
  defaultLayout,
  hideWidget,
  reorder,
} from "./dash-layout";

// saveLayoutAction is a "use server" action; stub it so the component test never
// touches the DB/auth (jsdom has no server runtime).
vi.mock("@/server-actions/dashboard", () => ({
  saveLayoutAction: vi.fn(async () => ({ ok: true, data: undefined })),
}));

const layout: DashboardWidget[] = [
  { id: "w-a", widgetKey: "net-worth", position: 0, size: "sm", visible: true, config: null },
  { id: "w-b", widgetKey: "safe-to-spend", position: 1, size: "lg", visible: true, config: null },
  { id: "w-c", widgetKey: "streak", position: 2, size: "sm", visible: true, config: null },
];

describe("reorder", () => {
  it("moves an item and re-numbers positions", () => {
    const next = reorder(layout, 0, 2);
    expect(next.map((w) => w.widgetKey)).toEqual(["safe-to-spend", "streak", "net-worth"]);
    expect(next.map((w) => w.position)).toEqual([0, 1, 2]);
  });

  it("is a no-op when from === to", () => {
    expect(reorder(layout, 1, 1)).toBe(layout);
  });

  it("is a no-op for an out-of-range source", () => {
    expect(reorder(layout, 9, 0)).toBe(layout);
  });
});

describe("hideWidget", () => {
  it("sets visible:false on the matching id and preserves the rest", () => {
    const next = hideWidget(layout, "w-b");
    expect(next.find((w) => w.id === "w-b")?.visible).toBe(false);
    expect(next.find((w) => w.id === "w-a")?.visible).toBe(true);
    expect(next).toHaveLength(3);
  });
});

describe("addWidget", () => {
  it("re-shows a hidden widget of the same key rather than duplicating", () => {
    const hidden = hideWidget(layout, "w-b");
    const next = addWidget(hidden, "safe-to-spend");
    expect(next.filter((w) => w.widgetKey === "safe-to-spend")).toHaveLength(1);
    expect(next.find((w) => w.widgetKey === "safe-to-spend")?.visible).toBe(true);
  });

  it("appends a fresh instance for a registry key not present", () => {
    const next = addWidget(layout, "readiness");
    expect(next).toHaveLength(4);
    expect(next[3]?.widgetKey).toBe("readiness");
  });

  it("ignores an unknown widget key", () => {
    expect(addWidget(layout, "nope")).toBe(layout);
  });
});

describe("defaultLayout", () => {
  it("produces contiguous positions and all-visible widgets", () => {
    const def = defaultLayout();
    expect(def.length).toBeGreaterThan(0);
    expect(def.map((w) => w.position)).toEqual(def.map((_, i) => i));
    expect(def.every((w) => w.visible)).toBe(true);
  });
});

describe("DashGrid", () => {
  it("renders the visible widgets from the initial prop", () => {
    render(<DashGrid initial={layout} />);
    expect(screen.getByText("Net worth")).toBeInTheDocument();
    expect(screen.getByText("Safe to spend")).toBeInTheDocument();
  });

  it("does not show edit affordances until Arrange is clicked", () => {
    render(<DashGrid initial={layout} />);
    expect(screen.queryByText("Add a widget")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Arrange"));
    expect(screen.getByText("Add a widget")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Drag to reorder").length).toBe(3);
  });

  it("hides a widget (drops a grid shell) when its remove button is clicked", () => {
    render(<DashGrid initial={layout} startEditing />);
    expect(screen.getAllByLabelText("Drag to reorder")).toHaveLength(3);
    fireEvent.click(screen.getByLabelText("Remove Streak"));
    // The shell leaves the grid (one fewer drag handle); it reappears in the
    // add-rail, so its title text still exists in the DOM.
    expect(screen.getAllByLabelText("Drag to reorder")).toHaveLength(2);
    expect(screen.queryByLabelText("Remove Streak")).not.toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";
import { RealityHeader } from "./reality-header";

test("hypothesis mode shows the what-if pill + name + unsaved dot", () => {
  render(<RealityHeader mode="hypothesis" name="My plan" dirty />);
  expect(screen.getByText("What-if · not committed")).toBeInTheDocument();
  expect(screen.getByText("My plan")).toBeInTheDocument();
  expect(screen.getByTitle("Unsaved changes")).toBeInTheDocument();
});

test("locked-edit mode shows the tracked-plan pill; no dot when clean", () => {
  render(<RealityHeader mode="locked-edit" name="Tracked" dirty={false} />);
  expect(screen.getByText("Editing your tracked plan")).toBeInTheDocument();
  expect(screen.queryByTitle("Unsaved changes")).not.toBeInTheDocument();
});

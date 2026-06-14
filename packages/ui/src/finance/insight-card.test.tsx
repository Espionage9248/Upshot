import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { InsightCard } from "./insight-card";

describe("InsightCard", () => {
  it("renders children content", () => {
    const { getByText } = render(
      <InsightCard>Spotify rose $2 in May — two subscriptions active.</InsightCard>,
    );
    expect(getByText("Spotify rose $2 in May — two subscriptions active.")).toBeTruthy();
  });

  it("renders close button when onDismiss is provided", () => {
    const { container } = render(
      <InsightCard onDismiss={() => {}}>Some insight.</InsightCard>,
    );
    const btn = container.querySelector("button");
    expect(btn).toBeTruthy();
  });

  it("fires onDismiss when close button is clicked", () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <InsightCard onDismiss={onDismiss}>Some insight.</InsightCard>,
    );
    const btn = container.querySelector("button") as HTMLButtonElement;
    fireEvent.click(btn);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("does not render close button when onDismiss is not provided", () => {
    const { container } = render(<InsightCard>No dismiss.</InsightCard>);
    expect(container.querySelector("button")).toBeNull();
  });

  it("renders an icon when icon prop is provided", () => {
    const { container } = render(
      <InsightCard icon="repeat">Insight with icon.</InsightCard>,
    );
    // UIcon renders an SVG
    expect(container.querySelector("svg")).toBeTruthy();
  });
});

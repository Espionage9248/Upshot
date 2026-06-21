import "@testing-library/jest-dom/vitest";

// Radix UI's Slider uses ResizeObserver internally; jsdom doesn't include it.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

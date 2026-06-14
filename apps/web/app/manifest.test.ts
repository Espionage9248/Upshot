import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, it, expect } from "vitest";
import manifest from "./manifest";

const publicDir = path.join(
  fileURLToPath(import.meta.url),
  "..",
  "..",
  "public",
);

describe("manifest", () => {
  it("returns name and theme_color", () => {
    const m = manifest();
    expect(m.name).toBe("Upshot");
    expect(m.short_name).toBe("Upshot");
    expect(m.theme_color).toBe("#ff705c");
  });

  it("has exactly 3 icon entries with correct src/sizes/type/purpose", () => {
    const { icons } = manifest();
    expect(icons).toHaveLength(3);

    const [first, second, third] = icons ?? [];
    expect(first).toMatchObject({
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    });
    expect(second).toMatchObject({
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    });
    expect(third).toMatchObject({
      src: "/maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    });
  });

  it("has correct start_url and display", () => {
    const m = manifest();
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
  });

  it("all 7 public brand assets exist on disk", () => {
    const assets = [
      "icon-512.png",
      "icon-192.png",
      "maskable-512.png",
      "apple-touch-180.png",
      "favicon-32.png",
      "favicon-16.png",
      "favicon.svg",
    ];
    for (const asset of assets) {
      const fullPath = path.join(publicDir, asset);
      expect(existsSync(fullPath), `${asset} must exist in public/`).toBe(true);
    }
  });
});

// @vitest-environment node
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

// __dirname of this test file
const thisDir = dirname(fileURLToPath(import.meta.url));
// repo root = packages/ui/src/icons -> up 4 levels
const repoRoot = resolve(thisDir, "../../../..");

describe("attribution — LICENSE + THIRD-PARTY-NOTICES", () => {
  it("packages/ui/src/icons/LICENSE exists and references Lucide ISC + Feather", () => {
    const licPath = resolve(thisDir, "LICENSE");
    expect(existsSync(licPath)).toBe(true);
    const text = readFileSync(licPath, "utf8");
    expect(text).toMatch(/ISC/i);
    expect(text).toMatch(/Lucide/i);
    expect(text).toMatch(/Feather/i);
  });

  it("top-level THIRD-PARTY-NOTICES exists and mentions Lucide", () => {
    const noticesPath = resolve(repoRoot, "THIRD-PARTY-NOTICES");
    expect(existsSync(noticesPath)).toBe(true);
    const text = readFileSync(noticesPath, "utf8");
    expect(text).toContain("Lucide");
  });
});

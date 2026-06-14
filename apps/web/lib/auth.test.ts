import { describe, it, expect } from "vitest";
import { getAuth } from "./auth";

describe("getAuth", () => {
  it("fails fast with a secret-free error when required env is missing", () => {
    // Importing the module must be side-effect-free; the throw only happens on
    // use. Ensure the required vars are absent for this assertion.
    delete process.env.BETTER_AUTH_SECRET;
    delete process.env.BETTER_AUTH_URL;
    delete process.env.UPSHOT_RP_ID;

    expect(() => getAuth()).toThrow(/BETTER_AUTH_SECRET is not set/);
    // the error names the variable but never echoes a value
  });
});

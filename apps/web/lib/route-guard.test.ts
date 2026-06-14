import { describe, expect, it } from "vitest";
import { decideRedirect } from "./route-guard";

describe("decideRedirect", () => {
  describe("unauthenticated", () => {
    it("redirects a protected route to /login", () => {
      expect(decideRedirect("/today", false, false)).toEqual({
        type: "redirect",
        to: "/login",
      });
    });

    it("allows /login", () => {
      expect(decideRedirect("/login", false, false)).toEqual({ type: "allow" });
    });

    it("allows /register only on first run", () => {
      expect(decideRedirect("/register", false, true)).toEqual({ type: "allow" });
    });

    it("redirects /register to /login when not first run", () => {
      expect(decideRedirect("/register", false, false)).toEqual({
        type: "redirect",
        to: "/login",
      });
    });
  });

  describe("authenticated", () => {
    it("redirects /login to /today", () => {
      expect(decideRedirect("/login", true, false)).toEqual({
        type: "redirect",
        to: "/today",
      });
    });

    it("redirects /register to /today", () => {
      expect(decideRedirect("/register", true, true)).toEqual({
        type: "redirect",
        to: "/today",
      });
    });

    it("allows a normal protected route", () => {
      expect(decideRedirect("/today", true, false)).toEqual({ type: "allow" });
    });
  });

  describe("/api/auth/*", () => {
    it("always allows when unauthenticated", () => {
      expect(decideRedirect("/api/auth/sign-in", false, false)).toEqual({
        type: "allow",
      });
    });

    it("always allows when authenticated", () => {
      expect(decideRedirect("/api/auth/callback", true, false)).toEqual({
        type: "allow",
      });
    });
  });
});

import { test, expect } from "vitest";
import { parsePurchaseMeta } from "./purchases-core";

test("parsePurchaseMeta extracts og:title, price (→cents), site_name", () => {
  const html = `<meta property="og:title" content="Sony Headphones"><meta property="og:price:amount" content="299.00"><meta property="og:site_name" content="JB Hi-Fi">`;
  expect(parsePurchaseMeta(html)).toEqual({ name: "Sony Headphones", priceCents: 29900, merchant: "JB Hi-Fi" });
});

test("parsePurchaseMeta returns {} when no tags present", () => {
  expect(parsePurchaseMeta("<html></html>")).toEqual({});
});

import { test, expect, vi } from "vitest";
import { run } from "./main";

test("run logs 'worker up'", () => {
  const log = vi.fn();
  run(log);
  expect(log).toHaveBeenCalledExactlyOnceWith("worker up");
});

import { start } from "./main";

start().catch((err) => {
  console.error("worker failed to start:", err instanceof Error ? err.message : err);
  process.exit(1);
});

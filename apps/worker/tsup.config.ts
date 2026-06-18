import { defineConfig } from "tsup";

// Bundle the TS-source workspace packages (@upshot/db|core|contracts) INTO the
// output so `node dist/index.js` runs without a TS loader. Native/3rd-party deps
// (better-sqlite3-multiple-ciphers, drizzle-orm, croner) stay external and resolve
// from node_modules at runtime.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  clean: true,
  outDir: "dist",
  noExternal: [/^@upshot\//],
  // better-sqlite3-multiple-ciphers and drizzle-orm are CJS modules; bundling them
  // into an ESM output breaks dynamic require("fs") / require("path"). Keep them
  // (and croner) external so Node resolves them from node_modules at runtime.
  external: ["better-sqlite3-multiple-ciphers", /^drizzle-orm/, "croner"],
});

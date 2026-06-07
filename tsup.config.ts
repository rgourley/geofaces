import { defineConfig } from "tsup";

export default defineConfig([
  // ESM + CJS + types for bundler/npm consumers
  {
    entry: ["src/index.ts", "src/react.tsx"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    treeshake: true,
    minify: false,
    external: ["react"],
  },
  // A single minified IIFE for <script src> / CDN use: exposes a global `geofaces`
  {
    entry: { geofaces: "src/index.ts" },
    format: ["iife"],
    globalName: "geofaces",
    outExtension: () => ({ js: ".global.js" }),
    minify: true,
    clean: false,
  },
]);

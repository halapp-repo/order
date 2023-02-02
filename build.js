const { build } = require("esbuild");

build({
  entryPoints: ["src/handlers/orders/put/id/status/index.ts"],
  outdir: "dist",
  bundle: true,
  minify: true,
  sourcemap: true,
  target: "es2020",
  keepNames: true,
  platform: "node",
});

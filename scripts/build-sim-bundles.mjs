// Bundles simulation sources that need npm libraries into self-contained classic scripts
// (sandboxed, opaque-origin frames cannot load ES modules from their own folder).
// Run: node scripts/build-sim-bundles.mjs   – output is committed with its package.
// A published package version is immutable: rebuild only pre-release versions.
import { build } from "esbuild";

const bundles = [
  {
    entry: "sims-src/leeuwenhoek-microscope-3d/main.js",
    out: "public/sims/leeuwenhoek-microscope-3d/1.0.0/viewer.js",
  },
];

for (const b of bundles) {
  await build({
    entryPoints: [b.entry],
    outfile: b.out,
    bundle: true,
    format: "iife",
    minify: true,
    target: ["es2020"],
    legalComments: "eof",
    banner: { js: "/* Science Learning Lab simulation bundle. Includes three.js (MIT, (c) 2010-2024 three.js authors). */" },
  });
  console.log(`built ${b.out}`);
}

// Reports which simulation packages ship a bridge that differs from sdk/sll-bridge.js.
// Packages are immutable once published, so differences are expected for older versions;
// this script only informs. It never rewrites a package.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const sdk = readFileSync("sdk/sll-bridge.js", "utf8");
for (const sim of readdirSync("public/sims")) {
  for (const version of readdirSync(path.join("public/sims", sim))) {
    const file = path.join("public/sims", sim, version, "sll-bridge.js");
    const status = !existsSync(file) ? "no bridge (protocol spoken directly or level 0-1)" : readFileSync(file, "utf8") === sdk ? "current" : "older bridge";
    console.log(`${sim}@${version}: ${status}`);
  }
}

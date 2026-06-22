import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(cliRoot, "..", "..");
const assetsRoot = join(cliRoot, "assets");

if (existsSync(assetsRoot)) {
  rmSync(assetsRoot, { recursive: true, force: true });
}
mkdirSync(assetsRoot, { recursive: true });

cpSync(join(repoRoot, "templates"), join(assetsRoot, "templates"), { recursive: true });
cpSync(join(repoRoot, "integrations", "cursor"), join(assetsRoot, "integrations", "cursor"), {
  recursive: true,
});
cpSync(join(repoRoot, "integrations", "claude"), join(assetsRoot, "integrations", "claude"), {
  recursive: true,
});

console.log("✓ Copied templates and integrations to packages/cli/assets");

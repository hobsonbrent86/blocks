import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";
import { initTemplateDir } from "../paths.js";

export function initCommand(opts: { path: string; template: string }): void {
  const target = opts.path;
  const configPath = join(target, "blocks.config.yaml");

  if (existsSync(configPath)) {
    console.error("Already a blocks project (blocks.config.yaml exists)");
    process.exit(1);
  }

  const src = initTemplateDir();
  if (!existsSync(src)) {
    console.error(`Template not found: ${src}`);
    process.exit(1);
  }

  cpSync(src, target, { recursive: true });
  console.log(`✓ Initialized blocks project at ${target}`);
  console.log("");
  console.log("Next steps:");
  console.log("  1. cd into your project");
  console.log("  2. blocks cursor install   # or: blocks claude install");
  console.log("  3. blocks new validate my_payload --graph feature.main");
}

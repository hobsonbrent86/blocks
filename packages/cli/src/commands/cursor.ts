import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { absoluteProjectPath, cursorIntegrationDir } from "../paths.js";
import { mergeMcpFile } from "../mcp-config.js";

function writeMcpConfig(projectPath: string): void {
  mergeMcpFile(join(projectPath, ".cursor", "mcp.json"), absoluteProjectPath(projectPath));
}

export function cursorInstallCommand(opts: { path: string }): void {
  const src = cursorIntegrationDir();
  const projectPath = absoluteProjectPath(opts.path);
  const cursorDir = join(projectPath, ".cursor");
  const rulesDir = join(cursorDir, "rules");
  const skillsDir = join(cursorDir, "skills");

  if (!existsSync(src)) {
    console.error(`Cursor integration not found: ${src}`);
    console.error("Reinstall blocks-cli or run from a built monorepo.");
    process.exit(1);
  }

  mkdirSync(rulesDir, { recursive: true });
  mkdirSync(skillsDir, { recursive: true });

  cpSync(join(src, "rules"), rulesDir, { recursive: true });
  cpSync(join(src, "skills"), skillsDir, { recursive: true });
  writeMcpConfig(projectPath);

  console.log(`✓ Installed Cursor rules → ${rulesDir}`);
  console.log(`✓ Installed Cursor skills → ${skillsDir}`);
  console.log(`✓ Configured MCP server → ${join(cursorDir, "mcp.json")}`);
  console.log("");
  console.log("In Cursor:");
  console.log("  • Settings → Rules → enable project rules");
  console.log("  • Settings → MCP → enable the blocks server");
}

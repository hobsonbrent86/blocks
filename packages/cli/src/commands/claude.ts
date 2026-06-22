import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { absoluteProjectPath, claudeIntegrationDir, cursorIntegrationDir } from "../paths.js";
import { mergeMcpFile } from "../mcp-config.js";

const MARKER_START = "<!-- blocks:vibe-coding:start -->";
const MARKER_END = "<!-- blocks:vibe-coding:end -->";

function mergeClaudeMd(projectPath: string, template: string): void {
  const claudePath = join(projectPath, "CLAUDE.md");
  const wrapped = `${MARKER_START}\n${template.trim()}\n${MARKER_END}\n`;

  if (!existsSync(claudePath)) {
    writeFileSync(claudePath, wrapped, "utf8");
    return;
  }

  const existing = readFileSync(claudePath, "utf8");
  const pattern = new RegExp(
    `${MARKER_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${MARKER_END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
  );

  if (pattern.test(existing)) {
    writeFileSync(claudePath, existing.replace(pattern, wrapped.trimEnd()), "utf8");
    return;
  }

  writeFileSync(claudePath, `${existing.trimEnd()}\n\n${wrapped}`, "utf8");
}

export function claudeInstallCommand(opts: { path: string }): void {
  const src = claudeIntegrationDir();
  const skillsSrc = join(cursorIntegrationDir(), "skills");
  const projectPath = absoluteProjectPath(opts.path);
  const skillsDest = join(projectPath, ".claude", "skills");
  const templatePath = join(src, "CLAUDE.md");

  if (!existsSync(src) || !existsSync(templatePath)) {
    console.error(`Claude integration not found: ${src}`);
    console.error("Reinstall blocks-cli or run from a built monorepo.");
    process.exit(1);
  }

  if (!existsSync(skillsSrc)) {
    console.error(`Blocks skills not found: ${skillsSrc}`);
    console.error("Reinstall blocks-cli or run from a built monorepo.");
    process.exit(1);
  }

  mkdirSync(skillsDest, { recursive: true });
  cpSync(skillsSrc, skillsDest, { recursive: true });
  mergeClaudeMd(projectPath, readFileSync(templatePath, "utf8"));
  mergeMcpFile(join(projectPath, ".mcp.json"), projectPath);

  console.log(`✓ Installed Claude skills → ${skillsDest}`);
  console.log(`✓ Updated project instructions → ${join(projectPath, "CLAUDE.md")}`);
  console.log(`✓ Configured MCP server → ${join(projectPath, ".mcp.json")}`);
  console.log("");
  console.log("In Claude Code:");
  console.log("  • Open this project folder in Claude Code");
  console.log("  • Restart your session so .mcp.json and .claude/skills/ load");
  console.log("  • Run /mcp to confirm the blocks server is connected");
  console.log("  • CLAUDE.md loads automatically; use /block-next, /block-verify, etc.");
}

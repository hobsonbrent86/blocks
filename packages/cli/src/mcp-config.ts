import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { mcpServerEntry } from "./paths.js";

export function blocksMcpServerConfig(absProject: string): Record<string, unknown> {
  return {
    type: "stdio",
    command: "node",
    args: [mcpServerEntry()],
    env: { BLOCKS_PATH: absProject },
  };
}

export function mergeMcpFile(mcpPath: string, absProject: string): void {
  mkdirSync(dirname(mcpPath), { recursive: true });

  let existing: Record<string, unknown> = {};
  if (existsSync(mcpPath)) {
    existing = JSON.parse(readFileSync(mcpPath, "utf8")) as Record<string, unknown>;
  }

  const servers = (existing.mcpServers as Record<string, unknown>) ?? {};
  servers.blocks = blocksMcpServerConfig(absProject);

  writeFileSync(
    mcpPath,
    JSON.stringify({ ...existing, mcpServers: servers }, null, 2) + "\n",
    "utf8",
  );
}

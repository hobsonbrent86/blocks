import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { BlocksConfig } from "./types.js";

const DEFAULT_CONFIG: BlocksConfig = {
  version: 1,
  language: "typescript",
  paths: {
    blocks: "blocks",
    graphs: ".blocks/graphs",
    shared: "shared",
  },
  verify: {
    strict: false,
    allowed_heresies: [],
  },
};

export function loadConfigSync(root: string): BlocksConfig {
  const configPath = join(root, "blocks.config.yaml");
  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  const parsed = parse(readFileSync(configPath, "utf8")) as Partial<BlocksConfig>;
  return {
    ...DEFAULT_CONFIG,
    ...parsed,
    paths: { ...DEFAULT_CONFIG.paths, ...parsed.paths },
    verify: { ...DEFAULT_CONFIG.verify, ...parsed.verify },
  };
}

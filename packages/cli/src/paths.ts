import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** CLI package root (contains dist/ and assets/) */
export function cliPackageRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "..");
}

/** Monorepo root when developing from source */
export function monorepoRoot(): string {
  return join(cliPackageRoot(), "..", "..");
}

export function initTemplateDir(): string {
  const bundled = join(cliPackageRoot(), "assets", "templates", "init");
  if (existsSync(bundled)) return bundled;
  return join(monorepoRoot(), "templates", "init");
}

export function cursorIntegrationDir(): string {
  const bundled = join(cliPackageRoot(), "assets", "integrations", "cursor");
  if (existsSync(bundled)) return bundled;
  return join(monorepoRoot(), "integrations", "cursor");
}

export function claudeIntegrationDir(): string {
  const bundled = join(cliPackageRoot(), "assets", "integrations", "claude");
  if (existsSync(bundled)) return bundled;
  return join(monorepoRoot(), "integrations", "claude");
}

export function mcpServerEntry(): string {
  return require.resolve("@blocks/mcp/dist/index.js");
}

export function absoluteProjectPath(path: string): string {
  return resolve(path);
}

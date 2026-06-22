import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import type { BlockGraph, BlockSpecies } from "@blocks/verify";

const SPECIES: BlockSpecies[] = [
  "ingress",
  "transform",
  "validate",
  "persist",
  "emit",
  "gate",
  "query",
];

const VERBS: Record<BlockSpecies, string> = {
  ingress: "accept",
  transform: "map",
  validate: "assert",
  persist: "store",
  emit: "notify",
  gate: "decide",
  query: "read",
};

function toSnakeCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toLowerCase();
}

export function newCommand(
  speciesArg: string,
  nameArg: string,
  opts: { path: string; graph?: string },
): void {
  const species = speciesArg as BlockSpecies;
  if (!SPECIES.includes(species)) {
    console.error(`Invalid species. Use one of: ${SPECIES.join(", ")}`);
    process.exit(1);
  }

  const name = toSnakeCase(nameArg);
  const blockId = `${species}.${name}`;
  const blockDir = join(opts.path, "blocks", species, name);

  if (existsSync(blockDir)) {
    console.error(`Block already exists: ${blockDir}`);
    process.exit(1);
  }

  mkdirSync(join(blockDir, "layers"), { recursive: true });
  mkdirSync(join(blockDir, "fixtures"), { recursive: true });

  const contract = {
    id: blockId,
    species,
    version: "1.0.0",
    description: `TODO: describe ${blockId}`,
    core: {
      verb: VERBS[species],
      description: `TODO: one-sentence core for ${blockId}`,
    },
    inputs: {},
    outputs: {},
    failure_modes: {
      failed: { retry: "terminal", description: "TODO" },
    },
    idempotency: "pure",
    effects: ["read"],
    layers: {
      validation: { status: "implemented" },
      security: { status: "implemented" },
      observability: { status: "implemented" },
    },
  };

  writeFileSync(join(blockDir, "contract.yaml"), stringify(contract));
  writeFileSync(
    join(blockDir, "core.ts"),
    `export function run(input: unknown): unknown {\n  throw new Error("Not implemented");\n}\n`,
  );
  writeFileSync(
    join(blockDir, "layers", "validation.ts"),
    `export function validateInput(input: unknown): void {\n  if (!input) throw new Error("failed");\n}\n`,
  );
  writeFileSync(
    join(blockDir, "layers", "security.ts"),
    `export function applySecurityContext(input: unknown): unknown {\n  return input;\n}\n`,
  );
  writeFileSync(
    join(blockDir, "layers", "observability.ts"),
    `export function logBlockEvent(blockId: string, event: string): void {\n  console.log(JSON.stringify({ blockId, event, ts: new Date().toISOString() }));\n}\n`,
  );
  writeFileSync(
    join(blockDir, "fixtures", "test.yaml"),
    stringify({
      cases: [{ name: "TODO", in: {}, out: {} }],
    }),
  );

  if (opts.graph) {
    addBlockToGraph(opts.path, opts.graph, blockId);
  }

  console.log(`✓ Created block ${blockId}`);
  console.log(`  ${blockDir}`);
  console.log("  Edit contract.yaml before implementing core.ts");
}

function addBlockToGraph(root: string, graphId: string, blockId: string): void {
  const graphPath = join(root, ".blocks", "graph.yaml");
  if (!existsSync(graphPath)) return;

  const graph = parse(readFileSync(graphPath, "utf8")) as BlockGraph;
  if (graph.id !== graphId) return;
  if (!graph.blocks.includes(blockId)) {
    graph.blocks.push(blockId);
    writeFileSync(graphPath, stringify(graph));
  }
}

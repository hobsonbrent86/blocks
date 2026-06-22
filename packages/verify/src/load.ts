import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "yaml";
import type {
  BlockContract,
  BlockGraph,
  BlockRecord,
  BlockSpecies,
  RepoSnapshot,
} from "./types.js";
import { loadConfigSync } from "./config.js";

const SPECIES: BlockSpecies[] = [
  "ingress",
  "transform",
  "validate",
  "persist",
  "emit",
  "gate",
  "query",
];

function readYaml<T>(path: string): T {
  return parse(readFileSync(path, "utf8")) as T;
}

function listCoreFiles(blockDir: string): string[] {
  const entries = readdirSync(blockDir);
  return entries.filter((f) => f.startsWith("core.") && !f.endsWith(".map"));
}

function listLayerFiles(blockDir: string): string[] {
  const layersDir = join(blockDir, "layers");
  if (!existsSync(layersDir)) return [];
  return readdirSync(layersDir).filter((f) => !f.startsWith("."));
}

export function loadRepo(root: string): RepoSnapshot {
  const config = loadConfigSync(root);
  const blocksRoot = join(root, config.paths.blocks);
  const blocks: BlockRecord[] = [];

  for (const species of SPECIES) {
    const speciesDir = join(blocksRoot, species);
    if (!existsSync(speciesDir)) continue;

    for (const name of readdirSync(speciesDir)) {
      const dir = join(speciesDir, name);
      if (!statSync(dir).isDirectory()) continue;

      const contractPath = join(dir, "contract.yaml");
      if (!existsSync(contractPath)) continue;

      const contract = readYaml<BlockContract>(contractPath);
      blocks.push({
        id: contract.id,
        species,
        name,
        dir,
        contractPath,
        contract,
        coreFiles: listCoreFiles(dir),
        layerFiles: listLayerFiles(dir).map((f) => join(dir, "layers", f)),
      });
    }
  }

  const graphs = loadGraphs(root, config.paths.graphs);
  return { root, config, blocks, graphs };
}

function isBlockGraph(value: unknown): value is BlockGraph {
  if (!value || typeof value !== "object") return false;
  const graph = value as BlockGraph;
  return typeof graph.id === "string" && Array.isArray(graph.blocks);
}

function loadGraphs(root: string, graphsPath: string): BlockGraph[] {
  const graphs: BlockGraph[] = [];
  const singleGraph = join(root, ".blocks", "graph.yaml");
  if (existsSync(singleGraph)) {
    const parsed = readYaml<unknown>(singleGraph);
    if (isBlockGraph(parsed)) graphs.push(parsed);
  }

  const graphsDir = join(root, graphsPath);
  if (existsSync(graphsDir)) {
    for (const file of readdirSync(graphsDir)) {
      if (!file.endsWith(".yaml") && !file.endsWith(".yml")) continue;
      if (file.includes(".e2e.")) continue;
      const parsed = readYaml<unknown>(join(graphsDir, file));
      if (!isBlockGraph(parsed)) continue;
      graphs.push(parsed);
    }
  }

  return graphs;
}

export function blockRelativePath(root: string, block: BlockRecord): string {
  return relative(root, block.dir);
}

export function parsePortRef(ref: string): {
  blockId: string;
  direction: "inputs" | "outputs";
  port: string;
} | null {
  const match = ref.match(
    /^(ingress|transform|validate|persist|emit|gate|query)\.([a-z][a-z0-9_]*)\.(inputs|outputs)\.([a-z][a-z0-9_]*)$/,
  );
  if (!match) return null;
  return {
    blockId: `${match[1]}.${match[2]}`,
    direction: match[3] as "inputs" | "outputs",
    port: match[4]!,
  };
}

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import type {
  BlockGraph,
  BlockRecord,
  CheckResult,
  RepoSnapshot,
} from "./types.js";
import { blockRelativePath, parsePortRef } from "./load.js";
import { validateContract, validateGraph } from "./schema.js";

const CORE_VERBS = [
  "accept",
  "map",
  "assert",
  "store",
  "notify",
  "decide",
  "read",
  "write",
  "validate",
  "transform",
  "emit",
  "persist",
];

const STUB_PATTERNS = [
  /^export\s*\{\s*\}\s*;?\s*$/,
  /^\/\/\s*TODO/i,
  /^throw new Error\(['"]Not implemented/,
  /pass\s*;\s*$/,
];

function fail(
  id: string,
  severity: CheckResult["severity"],
  message: string,
  path?: string,
  blockId?: string,
): CheckResult {
  return { id, severity, status: "fail", message, path, blockId };
}

function pass(id: string, path?: string, blockId?: string): CheckResult {
  return { id, severity: "P0", status: "pass", message: "ok", path, blockId };
}

export function runStructuralChecks(repo: RepoSnapshot): CheckResult[] {
  const checks: CheckResult[] = [];

  for (const block of repo.blocks) {
    const rel = blockRelativePath(repo.root, block);

    if (block.coreFiles.length === 0) {
      checks.push(fail("S01", "P0", "Missing core file (core.*)", rel, block.id));
    } else {
      checks.push(pass("S01", rel, block.id));
    }

    const schemaErrors = validateContract(block.contract);
    if (schemaErrors.length > 0) {
      checks.push(
        fail("S02", "P0", `Contract schema invalid: ${schemaErrors[0]}`, block.contractPath, block.id),
      );
    } else {
      checks.push(pass("S02", block.contractPath, block.id));
    }

    const expectedId = `${block.species}.${block.name}`;
    if (block.contract.id !== expectedId) {
      checks.push(
        fail(
          "S03",
          "P0",
          `Contract id '${block.contract.id}' must match path '${expectedId}'`,
          block.contractPath,
          block.id,
        ),
      );
    } else {
      checks.push(pass("S03", block.contractPath, block.id));
    }
  }

  for (const graph of repo.graphs) {
    const graphPath = `.blocks/${graph.id}.yaml`;
    if (!Array.isArray(graph.blocks)) {
      checks.push(
        fail("S04", "P0", `Graph '${graph.id}' is missing a blocks[] list`, graphPath),
      );
      continue;
    }
    const schemaErrors = validateGraph(graph);
    if (schemaErrors.length > 0) {
      checks.push(fail("S04", "P0", `Graph schema invalid: ${schemaErrors[0]}`, graphPath));
    } else {
      checks.push(pass("S04", graphPath));
    }

    for (const blockId of graph.blocks) {
      const exists = repo.blocks.some((b) => b.id === blockId);
      if (!exists) {
        checks.push(
          fail("S05", "P2", `Planned block not built yet: '${blockId}'`, graphPath, blockId),
        );
      } else {
        checks.push(pass("S05", graphPath, blockId));
      }
    }

    for (const edge of graph.edges) {
      checks.push(...runEdgeChecks(repo, graph, edge));
    }
  }

  return checks;
}

function runEdgeChecks(
  repo: RepoSnapshot,
  graph: BlockGraph,
  edge: { from: string; to: string },
): CheckResult[] {
  const checks: CheckResult[] = [];
  const graphPath = `.blocks/${graph.id}.yaml`;
  const from = parsePortRef(edge.from);
  const to = parsePortRef(edge.to);

  if (!from || !to) {
    checks.push(fail("S06", "P0", `Invalid edge port reference`, graphPath));
    return checks;
  }

  const fromBlock = repo.blocks.find((b) => b.id === from.blockId);
  const toBlock = repo.blocks.find((b) => b.id === to.blockId);

  if (!fromBlock || !toBlock) {
    checks.push(
      pass("S06", graphPath, fromBlock ? to.blockId : from.blockId),
    );
    return checks;
  }

  if (!fromBlock.contract.outputs[from.port]) {
    checks.push(
      fail("S06", "P0", `Edge from references unknown output '${edge.from}'`, graphPath, from.blockId),
    );
    return checks;
  }

  if (!toBlock?.contract.inputs[to.port]) {
    checks.push(
      fail("S06", "P0", `Edge to references unknown input '${edge.to}'`, graphPath, to.blockId),
    );
    return checks;
  }

  checks.push(pass("S06", graphPath));
  return checks;
}

export function runCreedChecks(repo: RepoSnapshot): CheckResult[] {
  const checks: CheckResult[] = [];

  for (const block of repo.blocks) {
    checks.push(...runCoreVerbCheck(block));
    checks.push(...runNeighborImportCheck(repo, block));
    checks.push(...runLayerChecks(repo, block));
    checks.push(...runContractFieldChecks(block));
    checks.push(...runHumanSetupChecks(block));
  }

  return checks;
}

function commandAvailable(command: string): boolean {
  try {
    execFileSync("which", [command], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function runHumanSetupChecks(block: BlockRecord): CheckResult[] {
  const items = block.contract.human_setup ?? [];
  if (items.length === 0) return [];

  const checks: CheckResult[] = [];
  for (const item of items) {
    if (item.env) {
      const value = process.env[item.env];
      if (!value?.trim()) {
        checks.push(
          fail(
            "HUM01",
            "P1",
            `Set ${item.env} — ${item.description}`,
            block.contractPath,
            block.id,
          ),
        );
      } else {
        checks.push(pass("HUM01", block.contractPath, block.id));
      }
      continue;
    }
    if (item.command) {
      if (!commandAvailable(item.command)) {
        checks.push(
          fail(
            "HUM01",
            "P1",
            `Install ${item.command} — ${item.description}`,
            block.contractPath,
            block.id,
          ),
        );
      } else {
        checks.push(pass("HUM01", block.contractPath, block.id));
      }
    }
  }
  return checks;
}

function runCoreVerbCheck(block: BlockRecord): CheckResult[] {
  const desc = block.contract.core.description.toLowerCase();
  const verbCount = CORE_VERBS.filter((v) => desc.includes(v)).length;
  const hasAnd = desc.includes(" and ");

  if (hasAnd && verbCount > 1) {
    return [
      fail(
        "C01",
        "P0",
        "Core description appears to combine multiple verbs; split the block",
        block.contractPath,
        block.id,
      ),
    ];
  }
  return [pass("C01", block.contractPath, block.id)];
}

const SPECIES_PATTERN =
  "(ingress|transform|validate|persist|emit|gate|query)";

function importsNeighborBlock(content: string): string | null {
  const imports = [...content.matchAll(/from\s+['"]([^'"]+)['"]/g)];
  for (const match of imports) {
    const imp = match[1]!;
    if (imp.includes("/shared/") || imp.startsWith("shared/")) continue;
    if (new RegExp(`blocks/${SPECIES_PATTERN}/`).test(imp)) return imp;
    if (new RegExp(`^\\.\\./.*/${SPECIES_PATTERN}/`).test(imp)) return imp;
  }
  return null;
}

function runNeighborImportCheck(repo: RepoSnapshot, block: BlockRecord): CheckResult[] {
  const rel = blockRelativePath(repo.root, block);
  for (const coreFile of block.coreFiles) {
    const content = readFileSync(`${block.dir}/${coreFile}`, "utf8");
    const neighbor = importsNeighborBlock(content);
    if (neighbor) {
      return [
        fail(
          "C02",
          "P0",
          `Block imports neighbor path '${neighbor}'; use graph edges instead`,
          `${rel}/${coreFile}`,
          block.id,
        ),
      ];
    }
  }
  for (const layerFile of block.layerFiles) {
    const content = readFileSync(layerFile, "utf8");
    const neighbor = importsNeighborBlock(content);
    if (neighbor) {
      return [
        fail(
          "C02",
          "P0",
          "Layer imports another block; use shared/ instead",
          layerFile,
          block.id,
        ),
      ];
    }
  }
  return [pass("C02", rel, block.id)];
}

function runLayerChecks(repo: RepoSnapshot, block: BlockRecord): CheckResult[] {
  const checks: CheckResult[] = [];
  const rel = blockRelativePath(repo.root, block);

  for (const layerName of ["validation", "security", "observability"] as const) {
    const layer = block.contract.layers[layerName];
    if (!layer) {
      checks.push(
        fail("C03", "P0", `Missing required layer '${layerName}'`, block.contractPath, block.id),
      );
      continue;
    }

    if (layer.status === "na" && !layer.rationale) {
      checks.push(
        fail("C03", "P0", `Layer '${layerName}' is N/A but missing rationale`, block.contractPath, block.id),
      );
      continue;
    }

    if (layer.status === "inherited" && !layer.inherits_from) {
      checks.push(
        fail("C03", "P0", `Layer '${layerName}' inherited but missing inherits_from`, block.contractPath, block.id),
      );
      continue;
    }

    if (layer.status === "implemented") {
      const layerFile = block.layerFiles.find((f) => f.includes(`${layerName}.`));
      if (!layerFile) {
        checks.push(
          fail("C03", "P0", `Layer '${layerName}' marked implemented but file missing`, rel, block.id),
        );
        continue;
      }

      const content = readFileSync(layerFile, "utf8").trim();
      if (content.length < 20 || STUB_PATTERNS.some((p) => p.test(content))) {
        checks.push(
          fail("C04", "P0", `Layer '${layerName}' appears to be an empty stub`, layerFile, block.id),
        );
      } else {
        checks.push(pass("C04", layerFile, block.id));
      }
    } else {
      checks.push(pass("C03", block.contractPath, block.id));
    }
  }

  return checks;
}

function runContractFieldChecks(block: BlockRecord): CheckResult[] {
  const checks: CheckResult[] = [];

  if (Object.keys(block.contract.failure_modes).length === 0) {
    checks.push(fail("C05", "P0", "failure_modes must be non-empty", block.contractPath, block.id));
  } else {
    checks.push(pass("C05", block.contractPath, block.id));
  }

  if (!block.contract.effects || block.contract.effects.length === 0) {
    checks.push(fail("C06", "P0", "effects must be non-empty", block.contractPath, block.id));
  } else {
    checks.push(pass("C06", block.contractPath, block.id));
  }

  if (!block.contract.idempotency) {
    checks.push(fail("C07", "P0", "idempotency must be declared", block.contractPath, block.id));
  } else {
    checks.push(pass("C07", block.contractPath, block.id));
  }

  return checks;
}

export function runGraphChecks(repo: RepoSnapshot, graph: BlockGraph): CheckResult[] {
  const checks: CheckResult[] = [];
  const graphPath = `.blocks/${graph.id}.yaml`;
  if (!Array.isArray(graph.blocks)) {
    return [fail("S04", "P0", `Graph '${graph.id}' is missing a blocks[] list`, graphPath)];
  }
  const connected = new Set<string>();

  for (const edge of graph.edges) {
    const from = parsePortRef(edge.from);
    const to = parsePortRef(edge.to);
    if (from) connected.add(from.blockId);
    if (to) connected.add(to.blockId);
  }

  for (const entry of graph.entries ?? []) connected.add(entry);
  for (const exit of graph.exits ?? []) connected.add(exit);

  for (const blockId of graph.blocks) {
    const exists = repo.blocks.some((b) => b.id === blockId);
    if (!exists) continue;
    if (!connected.has(blockId)) {
      checks.push(
        fail("G01", "P1", `Orphan block '${blockId}' has no edges and is not entry/exit`, graphPath, blockId),
      );
    } else {
      checks.push(pass("G01", graphPath, blockId));
    }
  }

  for (const edge of graph.edges) {
    const from = parsePortRef(edge.from);
    const to = parsePortRef(edge.to);
    if (!from || !to) continue;

    const fromBlock = repo.blocks.find((b) => b.id === from.blockId);
    const toBlock = repo.blocks.find((b) => b.id === to.blockId);
    const outType = fromBlock?.contract.outputs[from.port]?.type;
    const inType = toBlock?.contract.inputs[to.port]?.type;

    if (outType && inType && outType !== inType) {
      checks.push(
        fail(
          "G02",
          "P1",
          `Port type mismatch: ${outType} → ${inType} on edge ${edge.from} → ${edge.to}`,
          graphPath,
        ),
      );
    } else {
      checks.push(pass("G02", graphPath));
    }
  }

  for (const entry of graph.entries ?? []) {
    const block = repo.blocks.find((b) => b.id === entry);
    if (block && block.species !== "ingress" && block.species !== "query") {
      checks.push(
        fail("G04", "P1", `Entry block '${entry}' must be ingress or query species`, graphPath, entry),
      );
    } else if (block) {
      checks.push(pass("G04", graphPath, entry));
    }
  }

  return checks;
}

export function runHygieneChecks(repo: RepoSnapshot, strict: boolean): CheckResult[] {
  if (!strict) return [];
  const checks: CheckResult[] = [];

  for (const block of repo.blocks) {
    if (!block.contract.description && !block.contract.core.description) {
      checks.push(
        fail("H01", "P2", "Missing block description", block.contractPath, block.id),
      );
    } else {
      checks.push(pass("H01", block.contractPath, block.id));
    }
  }

  return checks;
}

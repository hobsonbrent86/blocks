import type { InspectReport, VerifyOptions } from "./types.js";
import { loadRepo } from "./load.js";
import {
  runStructuralChecks,
  runCreedChecks,
  runGraphChecks,
  runHygieneChecks,
} from "./checks.js";
import { buildBlockInspectReport, buildRepoInspectReport } from "./report.js";

export function verifyRepo(options: VerifyOptions = {}): InspectReport {
  const root = options.path ?? process.cwd();
  const repo = loadRepo(root);
  const strict = options.strict ?? repo.config.verify?.strict ?? false;

  let checks = [
    ...runStructuralChecks(repo),
    ...runCreedChecks(repo),
    ...runHygieneChecks(repo, strict),
  ];

  const graphs = options.graph
    ? repo.graphs.filter((g) => g.id === options.graph)
    : repo.graphs;

  for (const graph of graphs) {
    checks = [...checks, ...runGraphChecks(repo, graph)];
  }

  if (options.block) {
    const block = repo.blocks.find((b) => b.id === options.block);
    if (!block) {
      return {
        ok: false,
        path: root,
        block: options.block,
        summary: { pass: 0, fail: 1, skip: 0, na: 0 },
        steps: [{ id: "block", label: "Block", status: "fail", message: "Block not found" }],
        checks: [
          {
            id: "BLOCK",
            severity: "P0",
            status: "fail",
            message: `Block '${options.block}' not found`,
          },
        ],
      };
    }
    return buildBlockInspectReport(repo, block, checks);
  }

  return buildRepoInspectReport(repo, checks, options.graph ?? graphs[0]?.id);
}

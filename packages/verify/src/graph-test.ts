import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { GraphTestResult, RepoSnapshot, TestFixture, TestOptions } from "./types.js";
import { loadRepo } from "./load.js";
import { runChainCase } from "./test.js";

export function resolveGraphE2ePath(repo: RepoSnapshot, graphId: string): string | undefined {
  const graphsDir = join(repo.root, repo.config.paths.graphs);
  const named = join(graphsDir, `${graphId}.e2e.yaml`);
  if (existsSync(named)) return named;

  const rootGraph = join(repo.root, ".blocks", "graph.yaml");
  const rootE2e = join(repo.root, ".blocks", "graph.e2e.yaml");
  if (existsSync(rootGraph) && existsSync(rootE2e)) {
    const graph = repo.graphs.find((g) => g.id === graphId);
    if (graph && parse(readFileSync(rootGraph, "utf8")).id === graphId) {
      return rootE2e;
    }
  }

  return undefined;
}

export function formatGraphTestReport(result: GraphTestResult): string {
  const icon = result.ok ? "✓" : "✗";
  const lines = [`${icon} ${result.graphId} (graph e2e)`];
  if (result.message && result.cases.length === 0) {
    lines.push(`  ${result.message}`);
  }
  for (const testCase of result.cases) {
    lines.push(
      `  ${testCase.status === "pass" ? "●" : "✗"} [e2e] ${testCase.name}${
        testCase.message ? `: ${testCase.message}` : ""
      }`,
    );
  }
  return lines.join("\n");
}

export async function runGraphTests(options: TestOptions = {}): Promise<GraphTestResult> {
  const prev = process.env.BLOCKS_VERBOSE;
  if (options.verbose) process.env.BLOCKS_VERBOSE = "1";
  try {
    return await runGraphTestsInner(options);
  } finally {
    if (options.verbose) process.env.BLOCKS_VERBOSE = prev;
    else delete process.env.BLOCKS_VERBOSE;
  }
}

async function runGraphTestsInner(options: TestOptions): Promise<GraphTestResult> {
  const root = options.path ?? process.cwd();
  const graphId = options.graph;
  if (!graphId) {
    return { graphId: "", ok: false, cases: [], message: "Missing graph id" };
  }

  const repo = loadRepo(root);
  if (!repo.graphs.some((g) => g.id === graphId)) {
    return { graphId, ok: false, cases: [], message: `Graph '${graphId}' not found` };
  }

  const fixturePath = resolveGraphE2ePath(repo, graphId);
  if (!fixturePath) {
    return {
      graphId,
      ok: false,
      cases: [],
      message: `No e2e fixture at .blocks/graphs/${graphId}.e2e.yaml`,
    };
  }

  let fixture: TestFixture;
  try {
    fixture = parse(readFileSync(fixturePath, "utf8")) as TestFixture;
  } catch (err) {
    return {
      graphId,
      ok: false,
      cases: [],
      message: err instanceof Error ? err.message : String(err),
    };
  }

  const cases = (fixture.cases ?? []).filter((testCase) => testCase.chain?.length);
  if (cases.length === 0) {
    return { graphId, ok: false, cases: [], message: "Graph e2e fixture has no chain cases" };
  }

  const prevTest = process.env.BLOCKS_TEST;
  process.env.BLOCKS_TEST = "1";

  try {
    const results = [];
    for (const testCase of cases) {
      const lastBlockId = testCase.chain!.at(-1)?.block;
      if (!lastBlockId) {
        results.push({ name: testCase.name, status: "fail" as const, message: "Last step missing block id" });
        continue;
      }
      const targetBlock = repo.blocks.find((b) => b.id === lastBlockId);
      if (!targetBlock) {
        results.push({
          name: testCase.name,
          status: "fail" as const,
          message: `Block not found: ${lastBlockId}`,
        });
        continue;
      }
      const result = await runChainCase(repo, targetBlock, testCase);
      results.push({ name: testCase.name, ...result });
    }

    return {
      graphId,
      ok: results.every((c) => c.status === "pass"),
      cases: results,
    };
  } finally {
    if (prevTest === undefined) delete process.env.BLOCKS_TEST;
    else process.env.BLOCKS_TEST = prevTest;
  }
}

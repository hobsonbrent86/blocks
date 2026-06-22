import type {
  BlockGraph,
  BlockRecord,
  CheckResult,
  GraphEdge,
  GraphTestResult,
  InspectBlockOptions,
  InspectReport,
  RepoSnapshot,
} from "./types.js";
import { loadRepo } from "./load.js";
import { inspectBlock } from "./inspect-block.js";
import { runGraphTests, resolveGraphE2ePath } from "./graph-test.js";
import {
  runStructuralChecks,
  runCreedChecks,
  runGraphChecks,
  runHygieneChecks,
} from "./checks.js";

export type GraphNodeStatus = "working" | "structure" | "fail" | "missing";
export type GraphStudioView = "graph" | "extended" | "all";

export interface GraphStudioNode {
  id: string;
  species: string;
  description?: string;
  status: GraphNodeStatus;
  message?: string;
  isEntry: boolean;
  isExit: boolean;
  wired: boolean;
}

export interface GraphStudioEdge {
  from: string;
  to: string;
  fromPort?: string;
  toPort?: string;
}

export interface GraphStudioReport {
  ok: boolean;
  path: string;
  graph: {
    id: string;
    description?: string;
    blocks: string[];
    entries: string[];
    exits: string[];
    edges: GraphStudioEdge[];
  };
  nodes: GraphStudioNode[];
  unwired: string[];
  summary: {
    total: number;
    working: number;
    structure: number;
    fail: number;
    missing: number;
    graphWorking?: boolean;
    finalize?: number;
  };
  graphTest?: GraphTestResult;
}

export interface InspectGraphOptions extends InspectBlockOptions {
  graph: string;
  view?: GraphStudioView;
}

function blockIdFromRef(ref: string): string {
  const parts = ref.split(".");
  return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : ref;
}

function normalizeEdges(edges: GraphEdge[]): GraphStudioEdge[] {
  return edges.map((edge) => {
    const fromParts = edge.from.split(".");
    const toParts = edge.to.split(".");
    return {
      from: blockIdFromRef(edge.from),
      to: blockIdFromRef(edge.to),
      fromPort: fromParts.length > 3 ? fromParts.slice(3).join(".") : undefined,
      toPort: toParts.length > 3 ? toParts.slice(3).join(".") : undefined,
    };
  });
}

function blockVerifyStatus(
  blockId: string,
  checks: CheckResult[],
  block?: BlockRecord,
): { status: GraphNodeStatus; message?: string } {
  if (!block) {
    return { status: "missing", message: "Block not created yet" };
  }

  const blockChecks = checks.filter((c) => !c.blockId || c.blockId === blockId);
  const fails = blockChecks.filter(
    (c) => c.status === "fail" && (c.severity === "P0" || c.severity === "P1"),
  );
  if (fails.length > 0) {
    return { status: "fail", message: fails[0]!.message };
  }

  return {
    status: "structure",
    message: block.coreFiles.length > 0 ? "Structure OK — run test" : "Contract only",
  };
}

function mergeNodeStatus(verify: GraphNodeStatus, tested: GraphNodeStatus): GraphNodeStatus {
  if (verify === "missing") return "missing";
  return tested;
}

function buildChecks(repo: RepoSnapshot, graph: BlockGraph, strict: boolean): CheckResult[] {
  let checks = [
    ...runStructuralChecks(repo),
    ...runCreedChecks(repo),
    ...runHygieneChecks(repo, strict),
    ...runGraphChecks(repo, graph),
  ];
  return checks;
}

function speciesFromId(blockId: string): string {
  return blockId.split(".")[0] ?? "unknown";
}

function makeNode(
  id: string,
  block: BlockRecord | undefined,
  checks: CheckResult[],
  entries: string[],
  exits: string[],
  wired: boolean,
): GraphStudioNode {
  const { status, message } = blockVerifyStatus(id, checks, block);
  return {
    id,
    species: block?.species ?? speciesFromId(id),
    description: block?.contract.description,
    status,
    message,
    isEntry: entries.includes(id),
    isExit: exits.includes(id),
    wired,
  };
}

export function inspectGraph(options: InspectGraphOptions): GraphStudioReport {
  const root = options.path ?? process.cwd();
  const repo = loadRepo(root);
  const graph = repo.graphs.find((g) => g.id === options.graph);
  if (!graph) {
    throw new Error(`Graph '${options.graph}' not found`);
  }

  const view = options.view ?? "extended";
  const strict = options.strict ?? repo.config.verify?.strict ?? false;
  const checks = buildChecks(repo, graph, strict);
  const entries = graph.entries ?? [];
  const exits = graph.exits ?? [];
  const blockMap = new Map(repo.blocks.map((b) => [b.id, b]));
  const graphIds = new Set(graph.blocks);

  const nodes: GraphStudioNode[] = [];

  if (view === "all") {
    for (const block of repo.blocks) {
      nodes.push(makeNode(block.id, block, checks, entries, exits, graphIds.has(block.id)));
    }
    for (const id of graph.blocks) {
      if (!blockMap.has(id)) {
        nodes.push(makeNode(id, undefined, checks, entries, exits, true));
      }
    }
  } else {
    for (const id of graph.blocks) {
      nodes.push(makeNode(id, blockMap.get(id), checks, entries, exits, true));
    }
    if (view === "extended") {
      for (const block of repo.blocks) {
        if (graphIds.has(block.id)) continue;
        nodes.push(makeNode(block.id, block, checks, entries, exits, false));
      }
    }
  }

  const unwired = repo.blocks.map((b) => b.id).filter((id) => !graphIds.has(id));

  const summary = {
    total: nodes.length,
    working: nodes.filter((n) => n.status === "working").length,
    structure: nodes.filter((n) => n.status === "structure").length,
    fail: nodes.filter((n) => n.status === "fail").length,
    missing: nodes.filter((n) => n.status === "missing").length,
  };

  const graphFails = checks.filter(
    (c) => c.status === "fail" && (c.severity === "P0" || c.severity === "P1") && !c.blockId,
  );

  return {
    ok: summary.fail === 0 && graphFails.length === 0,
    path: root,
    graph: {
      id: graph.id,
      description: graph.description,
      blocks: graph.blocks,
      entries,
      exits,
      edges: normalizeEdges(graph.edges),
    },
    nodes,
    unwired,
    summary,
  };
}

export interface GraphProgressReport extends GraphStudioReport {
  next_block?: string;
  next_finalize?: string;
  finalize: FinalizeItem[];
  built: number;
  planned: number;
}

export interface FinalizeItem {
  blockId: string;
  status: GraphNodeStatus;
  message?: string;
}

export function collectFinalizeQueue(nodes: GraphStudioNode[]): FinalizeItem[] {
  return nodes
    .filter((n) => n.wired !== false && n.status === "structure")
    .map((n) => ({ blockId: n.id, status: n.status, message: n.message }));
}

export function suggestNextFinalize(nodes: GraphStudioNode[]): string | undefined {
  return collectFinalizeQueue(nodes)[0]?.blockId;
}

export function suggestNextBlock(
  graph: BlockGraph,
  nodes: GraphStudioNode[],
): string | undefined {
  const statusMap = new Map(nodes.map((n) => [n.id, n.status]));
  const missing = new Set(nodes.filter((n) => n.status === "missing").map((n) => n.id));
  if (missing.size === 0) return undefined;

  const preds = new Map<string, Set<string>>();
  for (const id of graph.blocks) preds.set(id, new Set());
  for (const edge of graph.edges) {
    const from = blockIdFromRef(edge.from);
    const to = blockIdFromRef(edge.to);
    if (!preds.has(to)) continue;
    preds.get(to)!.add(from);
  }

  const ready = graph.blocks.filter((id) => {
    if (!missing.has(id)) return false;
    for (const pred of preds.get(id) ?? []) {
      if (statusMap.get(pred) !== "working") return false;
    }
    return true;
  });

  return ready[0] ?? [...missing].sort()[0];
}

export function formatGraphProgress(report: GraphProgressReport): string {
  const lines = [
    `Graph: ${report.graph.id}`,
    `  Working: ${report.summary.working}  Finalize: ${report.finalize.length}  Fail: ${report.summary.fail}  Planned: ${report.planned}`,
  ];
  if (report.graphTest?.cases.length) {
    lines.push(`  Graph e2e: ${report.summary.graphWorking ? "pass" : "fail"}`);
  }
  if (report.finalize.length > 0) {
    lines.push("", "Finalize queue — human setup still pending:");
    for (const item of report.finalize) {
      lines.push(`  ◌ ${item.blockId} — ${item.message ?? item.status}`);
    }
    if (report.next_finalize) lines.push("", `Next finalize: ${report.next_finalize}`);
  }
  if (report.next_block) {
    lines.push("", `Next block: ${report.next_block}`);
  } else if (report.finalize.length === 0 && report.planned === 0) {
    lines.push("", "All graph blocks Working.");
  }
  return lines.join("\n");
}

export async function graphProgress(options: InspectGraphOptions): Promise<GraphProgressReport> {
  const root = options.path ?? process.cwd();
  const repo = loadRepo(root);
  const graph = repo.graphs.find((g) => g.id === options.graph);
  if (!graph) {
    throw new Error(`Graph '${options.graph}' not found`);
  }

  const report =
    options.runTests === false
      ? inspectGraph({ ...options, view: "graph" })
      : await inspectGraphWithTests({ ...options, view: "graph" });

  const finalize = collectFinalizeQueue(report.nodes);

  return {
    ...report,
    next_block: suggestNextBlock(graph, report.nodes),
    next_finalize: suggestNextFinalize(report.nodes),
    finalize,
    built: report.nodes.filter((n) => n.status !== "missing").length,
    planned: report.nodes.filter((n) => n.status === "missing").length,
  };
}

export async function inspectGraphWithTests(
  options: InspectGraphOptions,
): Promise<GraphStudioReport> {
  const report = inspectGraph(options);
  if (options.runTests === false) return report;

  const repo = loadRepo(options.path ?? process.cwd());
  const blockMap = new Map(repo.blocks.map((b) => [b.id, b]));

  const nodes = await Promise.all(
    report.nodes.map(async (node) => {
      if (node.status === "missing" || node.wired === false) return node;
      const block = blockMap.get(node.id);
      if (!block) return node;

      try {
        const blockReport = await inspectBlock({
          path: options.path,
          block: node.id,
          graph: options.graph,
          runTests: true,
        });
        const testedStatus = blockStatusFromReport(blockReport);
        return {
          ...node,
          status: mergeNodeStatus(node.status, testedStatus),
          message: statusMessage(blockReport, testedStatus),
        };
      } catch (err) {
        return {
          ...node,
          status: mergeNodeStatus(node.status, "fail"),
          message: err instanceof Error ? err.message : String(err),
        };
      }
    }),
  );

  const summary: GraphStudioReport["summary"] = {
    total: nodes.length,
    working: nodes.filter((n) => n.status === "working").length,
    structure: nodes.filter((n) => n.status === "structure").length,
    fail: nodes.filter((n) => n.status === "fail").length,
    missing: nodes.filter((n) => n.status === "missing").length,
    finalize: collectFinalizeQueue(nodes).length,
  };

  let graphTest: GraphTestResult | undefined;
  if (resolveGraphE2ePath(repo, options.graph)) {
    graphTest = await runGraphTests({
      path: options.path,
      graph: options.graph,
    });
    summary.graphWorking = graphTest.ok;
  }

  const graphOk = graphTest ? graphTest.ok : true;

  return {
    ...report,
    ok: summary.fail === 0 && graphOk,
    nodes,
    summary,
    graphTest,
  };
}

function testsPassing(report: InspectReport): boolean {
  const core = report.steps.find((s) => s.id === "core");
  const chain = report.steps.find((s) => s.id === "chain");
  const coreOk = core?.status === "pass";
  const chainOk = !chain || chain.status === "na" || chain.status === "pass";
  return Boolean(coreOk && chainOk);
}

function blockStatusFromReport(report: InspectReport): GraphNodeStatus {
  if (report.ok) return "working";
  if (testsPassing(report)) return "structure";
  return "fail";
}

function statusMessage(report: InspectReport, status: GraphNodeStatus): string | undefined {
  if (status === "working") return "Working";
  if (status === "structure") {
    const human = report.steps.find((s) => s.id === "human");
    if (human?.status === "fail") return human.message ?? "Complete human setup for Working";
    return "Structure OK — complete human setup for Working";
  }
  if (status === "fail") {
    const fail = report.steps.find((s) => s.status === "fail");
    return fail?.message ?? "Needs fixes";
  }
  return undefined;
}

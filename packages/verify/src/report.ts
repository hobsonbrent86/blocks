import type {
  BlockRecord,
  BlockGuide,
  BlockGuideElement,
  CheckResult,
  InspectReport,
  InspectStep,
  InspectSummary,
  RepoSnapshot,
} from "./types.js";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { LAYER_LABELS } from "./types.js";

function summarize(checks: CheckResult[]): InspectSummary {
  const summary: InspectSummary = { pass: 0, fail: 0, skip: 0, na: 0 };
  for (const check of checks) {
    summary[check.status] += 1;
  }
  return summary;
}

function layerStatus(
  block: BlockRecord,
  layerName: string,
  checks: CheckResult[],
): InspectStep {
  const layer = block.contract.layers[layerName];
  const label = LAYER_LABELS[layerName] ?? layerName;

  if (!layer) {
    return { id: layerName, label, status: "fail", message: "Missing layer declaration" };
  }

  if (layer.status === "na") {
    return { id: layerName, label, status: "na", message: layer.rationale ?? "N/A" };
  }

  const layerCheck = checks.find(
    (c) => c.blockId === block.id && (c.id === "C03" || c.id === "C04") && c.path?.includes(layerName),
  );
  const fail = checks.find(
    (c) =>
      c.blockId === block.id &&
      c.status === "fail" &&
      (c.id === "C03" || c.id === "C04") &&
      c.message.toLowerCase().includes(layerName),
  );

  if (fail) {
    return { id: layerName, label, status: "fail", message: fail.message };
  }

  return { id: layerName, label, status: "pass" };
}

function humanSetupStatus(block: BlockRecord, checks: CheckResult[]): InspectStep {
  const label = LAYER_LABELS.human!;
  const items = block.contract.human_setup ?? [];
  if (items.length === 0) {
    return { id: "human", label, status: "na", message: "No human setup required" };
  }

  const fails = checks.filter(
    (c) => c.blockId === block.id && c.id === "HUM01" && c.status === "fail",
  );
  if (fails.length > 0) {
    return {
      id: "human",
      label,
      status: "fail",
      message: fails.map((f) => f.message).join("; "),
    };
  }

  return {
    id: "human",
    label,
    status: "pass",
    message: `${items.length} requirement(s) satisfied`,
  };
}

export function buildBlockGuide(block: BlockRecord): BlockGuide {
  const { contract } = block;
  const purposeParts: string[] = [];
  if (contract.description) purposeParts.push(contract.description);
  if (contract.core.description) {
    const coreLine = `${contract.core.verb}: ${contract.core.description}.`;
    if (!contract.description || !contract.description.includes(contract.core.description.slice(0, 24))) {
      purposeParts.push(coreLine);
    }
  }
  const purpose = purposeParts.join(" ") || contract.core.description;

  const elements: BlockGuideElement[] = [];
  for (const [name, port] of Object.entries(contract.inputs)) {
    elements.push({
      label: name,
      detail: `Input · ${port.type}${port.description ? ` — ${port.description}` : ""}`,
    });
  }
  for (const [name, port] of Object.entries(contract.outputs)) {
    elements.push({
      label: name,
      detail: `Output · ${port.type}${port.description ? ` — ${port.description}` : ""}`,
    });
  }
  for (const item of contract.human_setup ?? []) {
    const key = item.env ?? item.command ?? item.id;
    elements.push({ label: key, detail: `Human setup — ${item.description}` });
  }
  elements.push({ label: "idempotency", detail: contract.idempotency.replace(/_/g, " ") });
  if (contract.effects.length) {
    elements.push({ label: "effects", detail: contract.effects.join(", ") });
  }
  for (const [name, mode] of Object.entries(contract.failure_modes)) {
    elements.push({
      label: name,
      detail: `Failure · ${mode.retry}${mode.description ? ` — ${mode.description}` : ""}`,
    });
  }

  return { purpose, elements };
}

export function buildBlockInspectReport(
  repo: RepoSnapshot,
  block: BlockRecord,
  checks: CheckResult[],
): InspectReport {
  const blockChecks = checks.filter((c) => !c.blockId || c.blockId === block.id);
  const failedP0 = blockChecks.some((c) => c.status === "fail" && c.severity === "P0");

  const contractFail = blockChecks.find((c) => c.id === "S02" && c.status === "fail");
  const inputStep: InspectStep = {
    id: "input",
    label: LAYER_LABELS.input!,
    status: Object.keys(block.contract.inputs).length > 0 ? "pass" : "skip",
    message:
      Object.keys(block.contract.inputs).length > 0
        ? `${Object.keys(block.contract.inputs).length} input(s) declared`
        : "No inputs",
  };

  const outputStep: InspectStep = {
    id: "output",
    label: LAYER_LABELS.output!,
    status: "skip",
    message: "Run blocks test",
  };

  const steps: InspectStep[] = [
    inputStep,
    {
      id: "contract",
      label: LAYER_LABELS.contract!,
      status: contractFail ? "fail" : "pass",
      message: contractFail?.message,
    },
    layerStatus(block, "validation", blockChecks),
    layerStatus(block, "security", blockChecks),
    layerStatus(block, "observability", blockChecks),
    humanSetupStatus(block, blockChecks),
    {
      id: "core",
      label: LAYER_LABELS.core!,
      status: block.coreFiles.length > 0 && !failedP0 ? "skip" : failedP0 ? "fail" : "skip",
      message: failedP0 ? "Fix layer failures first" : "Run blocks test",
    },
    {
      id: "chain",
      label: LAYER_LABELS.chain!,
      status: existsSync(join(block.dir, "fixtures", "chain.yaml")) ? "skip" : "na",
      message: existsSync(join(block.dir, "fixtures", "chain.yaml"))
        ? "Run blocks test"
        : "No chain fixture",
    },
    outputStep,
  ];

  return {
    ok: !blockChecks.some((c) => c.status === "fail" && (c.severity === "P0" || c.severity === "P1")),
    path: repo.root,
    block: block.id,
    summary: summarize(blockChecks),
    steps,
    checks: blockChecks,
    guide: buildBlockGuide(block),
  };
}

export function buildRepoInspectReport(
  repo: RepoSnapshot,
  checks: CheckResult[],
  graphId?: string,
): InspectReport {
  const p0p1Fails = checks.filter((c) => c.status === "fail" && (c.severity === "P0" || c.severity === "P1"));

  const steps: InspectStep[] = [
    {
      id: "repo",
      label: "Repository",
      status: p0p1Fails.length === 0 ? "pass" : "fail",
      message: `${repo.blocks.length} blocks, ${repo.graphs.length} graph(s)`,
    },
  ];

  return {
    ok: p0p1Fails.length === 0,
    path: repo.root,
    graph: graphId ?? repo.graphs[0]?.id,
    summary: summarize(checks),
    steps,
    checks,
  };
}

export function formatHumanReport(report: InspectReport): string {
  const lines: string[] = [];
  lines.push(report.ok ? "✓ Blocks verify passed" : "✗ Blocks verify failed");
  if (report.block) lines.push(`Block: ${report.block}`);
  if (report.graph) lines.push(`Graph: ${report.graph}`);
  lines.push("");

  for (const step of report.steps) {
    const icon =
      step.status === "pass" ? "●" : step.status === "fail" ? "✗" : step.status === "na" ? "○" : "◌";
    lines.push(`  ${icon} ${step.label}${step.message ? `: ${step.message}` : ""}`);
  }

  const failures = report.checks.filter((c) => c.status === "fail");
  if (failures.length > 0) {
    lines.push("");
    lines.push("Failures:");
    for (const f of failures) {
      lines.push(`  [${f.id}] ${f.message}${f.path ? ` (${f.path})` : ""}`);
    }
  }

  return lines.join("\n");
}

export function formatGithubAnnotations(report: InspectReport): string {
  const lines: string[] = [];
  for (const check of report.checks.filter((c) => c.status === "fail")) {
    const file = check.path ?? "blocks.config.yaml";
    const message = `[${check.id}] ${check.message}`.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
    lines.push(`::error file=${file},title=Blocks ${check.id}::${message}`);
  }
  if (!report.ok && lines.length === 0) {
    lines.push(`::error title=Blocks verify::Verification failed`);
  }
  return lines.join("\n");
}

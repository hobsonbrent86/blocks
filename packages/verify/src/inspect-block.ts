import type { CheckResult, InspectReport, InspectBlockOptions, BlockTestResult } from "./types.js";
import { verifyRepo } from "./verify-core.js";
import { loadRepo } from "./load.js";
import { runBlockTests } from "./test.js";

function testChecks(result: BlockTestResult, prefix: "T01" | "T02"): CheckResult[] {
  if (result.message && result.cases.length === 0 && !result.chainCases?.length) {
    return [
      {
        id: prefix === "T01" ? "T00" : "T02",
        severity: "P0",
        status: "fail",
        message: result.message,
        blockId: result.blockId,
      },
    ];
  }

  const cases = prefix === "T01" ? result.cases : (result.chainCases ?? []);
  return cases.map((c) => ({
    id: prefix,
    severity: "P0" as const,
    status: c.status,
    message: c.status === "pass" ? c.name : `${c.name}: ${c.message ?? "failed"}`,
    blockId: result.blockId,
  }));
}

function applyTestSteps(report: InspectReport, testResult?: BlockTestResult): InspectReport {
  if (!testResult) return report;

  const unitOk = testResult.cases.every((c) => c.status === "pass");
  const chainOk =
    !testResult.chainCases?.length || testResult.chainCases.every((c) => c.status === "pass");
  const testOk = testResult.ok && unitOk && chainOk;
  const humanFail = report.steps.some((s) => s.id === "human" && s.status === "fail");

  const steps = report.steps.map((step) => {
    if (step.id === "core") {
      if (testResult.message && testResult.cases.length === 0) {
        return { ...step, status: "fail" as const, message: testResult.message };
      }
      return {
        ...step,
        status: unitOk ? ("pass" as const) : ("fail" as const),
        message: unitOk
          ? `${testResult.cases.length} unit case(s) passed`
          : testResult.cases.find((c) => c.status === "fail")?.message ?? "Test failed",
      };
    }
    if (step.id === "chain") {
      if (step.status === "na") return step;
      if (!testResult.chainCases?.length) {
        return { ...step, status: "fail" as const, message: "Add fixtures/chain.yaml" };
      }
      return {
        ...step,
        status: chainOk ? ("pass" as const) : ("fail" as const),
        message: chainOk
          ? `${testResult.chainCases.length} chain case(s) passed`
          : testResult.chainCases.find((c) => c.status === "fail")?.message ?? "Chain failed",
      };
    }
    if (step.id === "output") {
      const working = testOk && !humanFail;
      return {
        ...step,
        status: working ? ("pass" as const) : ("fail" as const),
        message: working
          ? "Unit + chain outputs matched"
          : humanFail
            ? "Complete human setup for Working"
            : "Fix failing tests first",
      };
    }
    return step;
  });

  const checks = [
    ...report.checks,
    ...testChecks(testResult, "T01"),
    ...testChecks(testResult, "T02"),
  ];
  const hasFail = checks.some(
    (c) => c.status === "fail" && (c.severity === "P0" || c.severity === "P1"),
  );

  return {
    ...report,
    ok: !hasFail && !humanFail && testOk,
    steps,
    checks,
    summary: {
      pass: checks.filter((c) => c.status === "pass").length,
      fail: checks.filter((c) => c.status === "fail").length,
      skip: checks.filter((c) => c.status === "skip").length,
      na: checks.filter((c) => c.status === "na").length,
    },
  };
}

export async function inspectBlock(options: InspectBlockOptions = {}): Promise<InspectReport> {
  const runTests = options.runTests !== false;
  const verifyReport = verifyRepo(options);

  if (!options.block || !runTests) {
    return verifyReport;
  }

  const snapshot = loadRepo(options.path ?? process.cwd());
  const block = snapshot.blocks.find((b) => b.id === options.block);
  if (!block) return verifyReport;

  const testResult = await runBlockTests(snapshot, block);
  return applyTestSteps(verifyReport, testResult);
}

export function formatTestReport(results: BlockTestResult[]): string {
  const lines: string[] = [];
  for (const result of results) {
    const icon = result.ok ? "✓" : "✗";
    lines.push(`${icon} ${result.blockId}`);
    if (result.message && result.cases.length === 0 && !result.chainCases?.length) {
      lines.push(`  ${result.message}`);
    }
    for (const c of result.cases) {
      lines.push(`  ${c.status === "pass" ? "●" : "✗"} ${c.name}${c.message ? `: ${c.message}` : ""}`);
    }
    for (const c of result.chainCases ?? []) {
      lines.push(
        `  ${c.status === "pass" ? "●" : "✗"} [chain] ${c.name}${c.message ? `: ${c.message}` : ""}`,
      );
    }
  }
  return lines.join("\n");
}

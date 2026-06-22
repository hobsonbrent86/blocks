import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { verifyRepo, testRepo, inspectBlock, runGraphTests, loadRepo } from "./index.js";

const signupRoot = join(import.meta.dirname, "../../../examples/signup");

describe("verifyRepo", () => {
  it("passes on signup reference example", () => {
    const report = verifyRepo({ path: signupRoot, graph: "feature.signup" });
    expect(report.ok).toBe(true);
    expect(report.checks.filter((c) => c.status === "fail")).toHaveLength(0);
  });

  it("does not load graph e2e fixtures as graphs", () => {
    const repo = loadRepo(signupRoot);
    expect(repo.graphs.some((g) => g.id === "feature.signup")).toBe(true);
    expect(repo.graphs.every((g) => Array.isArray(g.blocks))).toBe(true);
  });

  it("returns block inspect report for single block", () => {
    const report = verifyRepo({
      path: signupRoot,
      block: "validate.signup_payload",
    });
    expect(report.block).toBe("validate.signup_payload");
    expect(report.steps.some((s) => s.id === "validation")).toBe(true);
  });
});

describe("testRepo", () => {
  it("passes validate.signup_payload fixtures", async () => {
    const results = await testRepo({
      path: signupRoot,
      block: "validate.signup_payload",
    });
    expect(results).toHaveLength(1);
    expect(results[0]!.ok).toBe(true);
  });
});

describe("runGraphTests", () => {
  it("passes signup graph e2e fixture", async () => {
    const result = await runGraphTests({
      path: signupRoot,
      graph: "feature.signup",
    });
    expect(result.ok).toBe(true);
    expect(result.cases.every((c) => c.status === "pass")).toBe(true);
  });
});

describe("inspectBlock", () => {
  it("marks core and output pass when tests pass", async () => {
    const report = await inspectBlock({
      path: signupRoot,
      block: "validate.signup_payload",
      runTests: true,
    });
    expect(report.ok).toBe(true);
    expect(report.steps.find((s) => s.id === "core")?.status).toBe("pass");
    expect(report.steps.find((s) => s.id === "output")?.status).toBe("pass");
  });
});

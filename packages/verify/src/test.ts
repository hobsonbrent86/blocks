import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parse } from "yaml";
import { register } from "tsx/esm/api";
import type {
  BlockRecord,
  ChainStep,
  RepoSnapshot,
  TestCase,
  TestFixture,
  TestOptions,
  BlockTestResult,
} from "./types.js";
import { loadRepo } from "./load.js";

register();

function runQuiet<T>(fn: () => T): T {
  if (process.env.BLOCKS_VERBOSE === "1") return fn();
  const log = console.log;
  console.log = () => {};
  try {
    return fn();
  } finally {
    console.log = log;
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function partialMatch(actual: unknown, expected: unknown): boolean {
  if (expected && typeof expected === "object" && !Array.isArray(expected)) {
    const act = (actual ?? {}) as Record<string, unknown>;
    for (const [key, value] of Object.entries(expected as Record<string, unknown>)) {
      if (!partialMatch(act[key], value)) return false;
    }
    return true;
  }
  return deepEqual(actual, expected);
}

function loadFixture(block: BlockRecord, fixturePath?: string): TestFixture {
  const dir = fixturePath
    ? join(block.dir, fixturePath)
    : join(block.dir, "fixtures", "test.yaml");

  if (!existsSync(dir)) {
    throw new Error(`Fixture not found: ${dir}`);
  }

  return parse(readFileSync(dir, "utf8")) as TestFixture;
}

function listFixtureFiles(block: BlockRecord): string[] {
  const fixturesDir = join(block.dir, "fixtures");
  if (!existsSync(fixturesDir)) return [];
  return readdirSync(fixturesDir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .filter((f) => f !== "e2e.yaml" && f !== "e2e.yml")
    .map((f) => join(fixturesDir, f));
}

function getCoreFunction(mod: Record<string, unknown>): (...args: unknown[]) => unknown {
  for (const [key, val] of Object.entries(mod)) {
    if (key.startsWith("_")) continue;
    if (typeof val === "function") return val as (...args: unknown[]) => unknown;
  }
  throw new Error("No exported core function found");
}

async function loadCoreModule(block: BlockRecord): Promise<Record<string, unknown>> {
  const coreFile = block.coreFiles[0];
  if (!coreFile) throw new Error("Block has no core file");
  const corePath = join(block.dir, coreFile);
  return (await import(pathToFileURL(corePath).href)) as Record<string, unknown>;
}

function invokeCore(
  block: BlockRecord,
  fn: (...args: unknown[]) => unknown,
  inputs: Record<string, unknown>,
): unknown {
  const inputPorts = Object.keys(block.contract.inputs);

  if (inputPorts.length === 0) {
    return fn(inputs._raw ?? inputs.raw);
  }
  if (inputPorts.length === 1) {
    return fn(inputs[inputPorts[0]!]);
  }
  return fn(...inputPorts.map((port) => inputs[port]));
}

function normalizeOutput(
  block: BlockRecord,
  result: unknown,
): Record<string, unknown> {
  const outputPorts = Object.keys(block.contract.outputs);
  if (outputPorts.length === 1) {
    return { [outputPorts[0]!]: result };
  }
  if (result && typeof result === "object" && !Array.isArray(result)) {
    return result as Record<string, unknown>;
  }
  throw new Error("Core return value does not match declared output ports");
}

function resolveChainInputs(
  inputs: Record<string, unknown>,
  context: Record<string, unknown>,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(inputs)) {
    if (typeof value === "string" && value.startsWith("$")) {
      const ref = value.slice(1);
      resolved[key] = context[ref];
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      resolved[key] = resolveChainInputs(value as Record<string, unknown>, context);
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
}

function runCase(block: BlockRecord, fn: (...args: unknown[]) => unknown, testCase: TestCase) {
  if (!testCase.in) {
    return { status: "fail" as const, message: "Fixture missing in" };
  }

  if (testCase.throws) {
    try {
      runQuiet(() => invokeCore(block, fn, testCase.in!));
      return { status: "fail" as const, message: `Expected throw '${testCase.throws}'` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes(testCase.throws)) {
        return { status: "pass" as const };
      }
      return {
        status: "fail" as const,
        message: `Expected '${testCase.throws}' but got '${msg}'`,
      };
    }
  }

  const result = runQuiet(() => normalizeOutput(block, invokeCore(block, fn, testCase.in!)));
  if (!testCase.out) {
    return { status: "fail" as const, message: "Fixture missing expected out" };
  }

  for (const [port, expected] of Object.entries(testCase.out)) {
    if (!partialMatch(result[port], expected)) {
      return {
        status: "fail" as const,
        message: `Output port '${port}' mismatch`,
      };
    }
  }

  return { status: "pass" as const };
}

export async function runChainCase(
  repo: RepoSnapshot,
  targetBlock: BlockRecord,
  testCase: TestCase,
): Promise<{ status: "pass" | "fail"; message?: string }> {
  const steps = testCase.chain;
  if (!steps?.length) {
    return { status: "fail", message: "Chain fixture has no steps" };
  }

  const context: Record<string, unknown> = {};

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    const isLast = i === steps.length - 1;
    const blockId = step.block ?? (isLast ? targetBlock.id : undefined);
    if (!blockId) {
      return { status: "fail", message: `Chain step ${i + 1} missing block id` };
    }

    const block = repo.blocks.find((b) => b.id === blockId);
    if (!block) {
      return { status: "fail", message: `Chain block not found: ${blockId}` };
    }

    let fn: (...args: unknown[]) => unknown;
    try {
      const mod = await loadCoreModule(block);
      fn = getCoreFunction(mod);
    } catch (err) {
      return {
        status: "fail",
        message: err instanceof Error ? err.message : String(err),
      };
    }

    const inputs = resolveChainInputs(step.in, context);

    if (step.throws) {
      try {
        runQuiet(() => invokeCore(block, fn, inputs));
        return { status: "fail", message: `Expected throw '${step.throws}'` };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes(step.throws)) {
          return { status: "fail", message: `Expected '${step.throws}' but got '${msg}'` };
        }
        return { status: "pass" };
      }
    }

    let result: Record<string, unknown>;
    try {
      result = runQuiet(() => normalizeOutput(block, invokeCore(block, fn, inputs)));
    } catch (err) {
      return {
        status: "fail",
        message: err instanceof Error ? err.message : String(err),
      };
    }

    if (step.save) {
      context[step.save] = result[step.save];
    }

    if (isLast && step.out) {
      for (const [port, expected] of Object.entries(step.out)) {
        if (!partialMatch(result[port], expected)) {
          return { status: "fail", message: `Chain output port '${port}' mismatch` };
        }
      }
    }
  }

  return { status: "pass" };
}

export async function runBlockTests(
  repo: RepoSnapshot,
  block: BlockRecord,
  fixturePath?: string,
): Promise<BlockTestResult> {
  if (block.coreFiles.length === 0) {
    return { blockId: block.id, ok: false, cases: [], message: "No core file" };
  }

  const prevTest = process.env.BLOCKS_TEST;
  process.env.BLOCKS_TEST = "1";

  try {
    return await runBlockTestsInner(repo, block, fixturePath);
  } finally {
    if (prevTest === undefined) delete process.env.BLOCKS_TEST;
    else process.env.BLOCKS_TEST = prevTest;
  }
}

async function runBlockTestsInner(
  repo: RepoSnapshot,
  block: BlockRecord,
  fixturePath?: string,
): Promise<BlockTestResult> {
  let fixtures: TestFixture[];
  try {
    if (fixturePath) {
      fixtures = [loadFixture(block, fixturePath)];
    } else {
      const files = listFixtureFiles(block);
      if (files.length === 0) {
        return {
          blockId: block.id,
          ok: false,
          cases: [],
          message: `No fixtures in ${join(block.dir, "fixtures")}`,
        };
      }
      fixtures = files.map((f) => parse(readFileSync(f, "utf8")) as TestFixture);
    }
  } catch (err) {
    return {
      blockId: block.id,
      ok: false,
      cases: [],
      message: err instanceof Error ? err.message : String(err),
    };
  }

  const unitCases: TestCase[] = [];
  const chainCases: TestCase[] = [];
  for (const fixture of fixtures) {
    for (const testCase of fixture.cases ?? []) {
      if (testCase.chain?.length) chainCases.push(testCase);
      else unitCases.push(testCase);
    }
  }

  let fn: (...args: unknown[]) => unknown;
  try {
    const mod = await loadCoreModule(block);
    fn = getCoreFunction(mod);
  } catch (err) {
    return {
      blockId: block.id,
      ok: false,
      cases: [],
      message: err instanceof Error ? err.message : String(err),
    };
  }

  const cases = unitCases.map((testCase) => {
    const result = runCase(block, fn, testCase);
    return { name: testCase.name, ...result };
  });

  const chainResults = [];
  for (const testCase of chainCases) {
    const result = await runChainCase(repo, block, testCase);
    chainResults.push({ name: testCase.name, ...result });
  }

  if (cases.length === 0 && chainResults.length === 0) {
    return { blockId: block.id, ok: false, cases: [], message: "Fixture has no cases" };
  }

  const unitOk = cases.length === 0 || cases.every((c) => c.status === "pass");
  const chainOk = chainResults.length === 0 || chainResults.every((c) => c.status === "pass");
  const chainRequired = existsSync(join(block.dir, "fixtures", "chain.yaml"));

  return {
    blockId: block.id,
    ok: unitOk && chainOk && (!chainRequired || chainResults.length > 0),
    cases,
    chainCases: chainResults.length > 0 ? chainResults : undefined,
    message:
      chainRequired && chainResults.length === 0
        ? "Missing fixtures/chain.yaml cases"
        : undefined,
  };
}

export async function testRepo(options: TestOptions = {}): Promise<BlockTestResult[]> {
  const prev = process.env.BLOCKS_VERBOSE;
  if (options.verbose) process.env.BLOCKS_VERBOSE = "1";
  try {
    return await testRepoInner(options);
  } finally {
    if (options.verbose) process.env.BLOCKS_VERBOSE = prev;
    else delete process.env.BLOCKS_VERBOSE;
  }
}

async function testRepoInner(options: TestOptions): Promise<BlockTestResult[]> {
  const root = options.path ?? process.cwd();
  const repo = loadRepo(root);
  const blocks = options.block
    ? repo.blocks.filter((b) => b.id === options.block)
    : repo.blocks;

  const results: BlockTestResult[] = [];
  for (const block of blocks) {
    results.push(await runBlockTests(repo, block, options.fixture));
  }
  return results;
}

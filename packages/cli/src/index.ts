#!/usr/bin/env node
import { Command } from "commander";
import {
  verifyRepo,
  formatHumanReport,
  formatGithubAnnotations,
  testRepo,
  formatTestReport,
  runGraphTests,
  formatGraphTestReport,
  graphProgress,
  formatGraphProgress,
} from "@blocks/verify";
import { inspectCommand } from "./commands/inspect.js";
import { studioCommand } from "./commands/studio.js";
import { initCommand } from "./commands/init.js";
import { newCommand } from "./commands/new.js";
import { doctorCommand } from "./commands/doctor.js";
import { cursorInstallCommand } from "./commands/cursor.js";
import { claudeInstallCommand } from "./commands/claude.js";

const program = new Command();

program.name("blocks").description("Block Vibe Coding CLI").version("0.1.0");

function runVerify(opts: {
  path: string;
  graph?: string;
  block?: string;
  strict?: boolean;
  format: string;
}): void {
  const report = verifyRepo({
    path: opts.path,
    graph: opts.graph,
    block: opts.block,
    strict: opts.strict,
  });
  if (opts.format === "json") {
    console.log(JSON.stringify(report, null, 2));
  } else if (opts.format === "github") {
    const annotations = formatGithubAnnotations(report);
    if (annotations) console.log(annotations);
    console.log(formatHumanReport(report));
  } else {
    console.log(formatHumanReport(report));
  }
  process.exit(report.ok ? 0 : 1);
}

program
  .command("verify")
  .description("Verify blocks and graphs against the creed")
  .option("-p, --path <path>", "Repository root", process.cwd())
  .option("-g, --graph <id>", "Graph id to verify")
  .option("-b, --block <id>", "Single block inspect report")
  .option("--strict", "Enable P2 hygiene checks")
  .option("-f, --format <format>", "Output format: human | json | github", "human")
  .action((opts) => runVerify(opts));

program
  .command("lint")
  .description("Alias for blocks verify")
  .option("-p, --path <path>", "Repository root", process.cwd())
  .option("-g, --graph <id>", "Graph id to verify")
  .option("-b, --block <id>", "Single block inspect report")
  .option("--strict", "Enable P2 hygiene checks")
  .option("-f, --format <format>", "Output format: human | json | github", "human")
  .action((opts) => runVerify(opts));

program
  .command("test")
  .description("Run block fixture tests")
  .option("-p, --path <path>", "Repository root", process.cwd())
  .option("-b, --block <id>", "Block id to test")
  .option("-g, --graph <id>", "Run graph e2e fixture (.blocks/graphs/<id>.e2e.yaml)")
  .option("--fixture <path>", "Fixture path relative to block dir")
  .option("-f, --format <format>", "Output format: human | json", "human")
  .option("-v, --verbose", "Show block observability logs during tests")
  .action(async (opts) => {
    const lines: string[] = [];
    let ok = true;

    if (opts.graph) {
      const graphResult = await runGraphTests({
        path: opts.path,
        graph: opts.graph,
        verbose: opts.verbose,
      });
      ok = ok && graphResult.ok;
      if (opts.format === "json") {
        lines.push(JSON.stringify({ graph: graphResult }));
      } else {
        lines.push(formatGraphTestReport(graphResult));
      }
    }

    if (!opts.graph || opts.block) {
      const results = await testRepo({
        path: opts.path,
        block: opts.block,
        fixture: opts.fixture,
        verbose: opts.verbose,
      });
      ok = ok && results.every((r) => r.ok);
      if (opts.format === "json") {
        lines.push(JSON.stringify({ blocks: results }));
      } else if (results.length > 0) {
        if (lines.length > 0) lines.push("");
        lines.push(formatTestReport(results));
      }
    }

    if (opts.format === "json") {
      console.log(lines.length === 1 ? lines[0] : `[${lines.join(",")}]`);
    } else if (lines.length > 0) {
      console.log(lines.join("\n"));
    } else {
      console.log("Nothing to test — use --block or --graph");
      ok = false;
    }
    process.exit(ok ? 0 : 1);
  });

program
  .command("progress")
  .description("Graph build progress — Working, finalize queue, next block")
  .option("-p, --path <path>", "Repository root", process.cwd())
  .requiredOption("-g, --graph <id>", "Graph id (e.g. feature.marketing_analytics)")
  .option("-f, --format <format>", "Output format: human | json", "human")
  .option("--no-test", "Structural status only (skip fixture tests)")
  .action(async (opts) => {
    const report = await graphProgress({
      path: opts.path,
      graph: opts.graph,
      runTests: opts.test !== false,
    });
    if (opts.format === "json") {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatGraphProgress(report));
    }
    process.exit(report.finalize.length === 0 && report.summary.fail === 0 ? 0 : 1);
  });

program
  .command("inspect")
  .description("Launch Block Inspector UI in browser")
  .option("-p, --path <path>", "Repository root", process.cwd())
  .option("-b, --block <id>", "Block id to inspect")
  .option("--port <port>", "HTTP port", "3847")
  .option("--no-test", "Skip fixture tests in inspector")
  .option("--no-open", "Do not open browser automatically")
  .option("--watch", "Re-verify on file changes")
  .action(inspectCommand);

program
  .command("studio")
  .description("Launch Block Studio — graph canvas + block inspector in your browser")
  .option("-p, --path <path>", "Repository root", process.cwd())
  .option("-g, --graph <id>", "Graph id to visualize")
  .option("--port <port>", "HTTP port", "3848")
  .option("--no-test", "Skip fixture tests when inspecting a block")
  .option("--no-open", "Do not open browser automatically")
  .option("--watch", "Watch repo for changes")
  .action((opts) => {
    if (!opts.graph) {
      console.error("Error: --graph <id> is required (e.g. feature.signup)");
      process.exit(1);
    }
    studioCommand(opts);
  });

program
  .command("init")
  .description("Initialize a blocks project in the current directory")
  .option("-p, --path <path>", "Target directory", process.cwd())
  .option("--template <template>", "Template: minimal | full", "full")
  .action(initCommand);

program
  .command("new")
  .description("Create a new block skeleton")
  .argument("<species>", "Block species")
  .argument("<name>", "Block name (snake_case)")
  .option("-p, --path <path>", "Repository root", process.cwd())
  .option("-g, --graph <id>", "Add block id to graph (unwired)")
  .action(newCommand);

program
  .command("doctor")
  .description("Check environment and project setup")
  .option("-p, --path <path>", "Repository root", process.cwd())
  .action(doctorCommand);

const cursor = program.command("cursor").description("Cursor integration");

cursor
  .command("install")
  .description("Install Cursor rules and skills into .cursor/")
  .option("-p, --path <path>", "Repository root", process.cwd())
  .action(cursorInstallCommand);

const claude = program.command("claude").description("Claude Code integration");

claude
  .command("install")
  .description("Install CLAUDE.md, guides, and .mcp.json for Claude Code")
  .option("-p, --path <path>", "Repository root", process.cwd())
  .action(claudeInstallCommand);

program.parse();

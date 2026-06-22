import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadRepo, verifyRepo } from "@blocks/verify";

export function doctorCommand(opts: { path: string }): void {
  const issues: string[] = [];
  const root = opts.path;

  const nodeMajor = Number(process.version.slice(1).split(".")[0]);
  if (nodeMajor < 20) {
    issues.push(`Node.js 20+ required (current: ${process.version})`);
  } else {
    console.log(`✓ Node.js ${process.version}`);
  }

  if (!existsSync(join(root, "blocks.config.yaml"))) {
    issues.push("Missing blocks.config.yaml — run blocks init");
  } else {
    console.log("✓ blocks.config.yaml");
  }

  try {
    const repo = loadRepo(root);
    console.log(`✓ ${repo.blocks.length} block(s), ${repo.graphs.length} graph(s)`);
  } catch (err) {
    issues.push(err instanceof Error ? err.message : String(err));
  }

  const report = verifyRepo({ path: root });
  if (!report.ok) {
    issues.push("blocks verify failed — run blocks verify for details");
  } else {
    console.log("✓ blocks verify passed");
  }

  if (issues.length > 0) {
    console.log("");
    console.log("Issues:");
    for (const issue of issues) {
      console.log(`  ✗ ${issue}`);
    }
    process.exit(1);
  }

  console.log("");
  console.log("All checks passed.");
}

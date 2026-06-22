import { createServer } from "node:http";
import { readFileSync, watch } from "node:fs";
import { join, dirname } from "node:path";
import { createRequire } from "node:module";
import { inspectBlock } from "@blocks/verify";
import { openStudioUrl, writeStudioUrlFile } from "../open-browser.js";

const require = createRequire(import.meta.url);

function getInspectHtml(): string {
  const inspectRoot = dirname(require.resolve("@blocks/inspect/package.json"));
  return readFileSync(join(inspectRoot, "public", "index.html"), "utf8");
}

export function inspectCommand(opts: {
  path: string;
  block?: string;
  port: string;
  watch?: boolean;
  test?: boolean;
  open?: boolean;
}): void {
  const port = Number(opts.port);
  const html = getInspectHtml();
  const runTests = opts.test !== false;

  async function getReport() {
    return inspectBlock({
      path: opts.path,
      block: opts.block,
      runTests,
    });
  }

  const server = createServer(async (req, res) => {
    if (req.url?.startsWith("/api/report")) {
      try {
        const report = await getReport();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(report));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
      }
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    writeStudioUrlFile(opts.path, url);
    console.log(`Block Inspector running at ${url}`);
    console.log(`  repo: ${opts.path}`);
    if (opts.block) console.log(`  block: ${opts.block}`);
    console.log(`  tests: ${runTests ? "on" : "off"}`);
    if (opts.open !== false) {
      openStudioUrl(url);
    } else {
      console.log("");
      console.log("  Open: Cmd+Shift+P → Simple Browser: Show → paste URL above");
    }
  });

  if (opts.watch) {
    watch(opts.path, { recursive: true }, () => {
      // Clients poll every 5s; watch is a hint for future SSE
    });
    console.log(`  watching: ${opts.path}`);
  }
}

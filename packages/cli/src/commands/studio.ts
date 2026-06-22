import { createServer } from "node:http";
import { readFileSync, watch } from "node:fs";
import { join, dirname } from "node:path";
import { createRequire } from "node:module";
import { URL } from "node:url";
import { inspectBlock, inspectGraph, inspectGraphWithTests, type GraphStudioView } from "@blocks/verify";
import { openStudioUrl, writeStudioUrlFile } from "../open-browser.js";

const require = createRequire(import.meta.url);

function getStudioHtml(): string {
  const inspectRoot = dirname(require.resolve("@blocks/inspect/package.json"));
  return readFileSync(join(inspectRoot, "public", "studio.html"), "utf8");
}

const VIEWS = new Set<GraphStudioView>(["graph", "extended", "all"]);

export function studioCommand(opts: {
  path: string;
  graph: string;
  port: string;
  watch?: boolean;
  test?: boolean;
  open?: boolean;
}): void {
  const port = Number(opts.port);
  const html = getStudioHtml();
  const runTests = opts.test !== false;
  const shouldOpen = opts.open !== false;

  async function getGraphReport(view: GraphStudioView) {
    const base = { path: opts.path, graph: opts.graph, view };
    if (runTests) {
      return inspectGraphWithTests({ ...base, runTests: true });
    }
    return inspectGraph(base);
  }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);

    if (url.pathname === "/api/graph") {
      const viewParam = url.searchParams.get("view") ?? "extended";
      const view = VIEWS.has(viewParam as GraphStudioView)
        ? (viewParam as GraphStudioView)
        : "extended";
      try {
        const report = await getGraphReport(view);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(report));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
      }
      return;
    }

    if (url.pathname === "/api/report") {
      const block = url.searchParams.get("block");
      if (!block) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing block query parameter" }));
        return;
      }
      try {
        const report = await inspectBlock({
          path: opts.path,
          block,
          graph: opts.graph,
          runTests,
        });
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
    console.log(`Block Studio running at ${url}`);
    console.log(`  repo: ${opts.path}`);
    console.log(`  graph: ${opts.graph}`);
    console.log(`  tests: ${runTests ? "on" : "off"}`);
    if (shouldOpen) {
      openStudioUrl(url);
    } else {
      console.log("");
      console.log("  Open: Cmd+Shift+P → Simple Browser: Show → paste URL above");
    }
  });

  if (opts.watch) {
    watch(opts.path, { recursive: true }, () => {});
    console.log(`  watching: ${opts.path}`);
  }
}

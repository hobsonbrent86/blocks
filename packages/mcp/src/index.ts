#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { loadRepo, verifyRepo, testRepo, graphProgress } from "@blocks/verify";

const BLOCKS_PATH = process.env.BLOCKS_PATH ?? process.cwd();

function repo() {
  return loadRepo(BLOCKS_PATH);
}

function scoreSimilarity(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q) || q.includes(t)) return 1;
  const qTokens = q.split(/[._\s-]+/);
  const tTokens = t.split(/[._\s-]+/);
  let hits = 0;
  for (const token of qTokens) {
    if (token.length > 2 && tTokens.some((tt) => tt.includes(token))) hits += 1;
  }
  return hits / Math.max(qTokens.length, 1);
}

const server = new Server(
  { name: "blocks-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_blocks",
      description: "List all blocks in the repo with species and version",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "get_contract",
      description: "Get full contract YAML for a block id",
      inputSchema: {
        type: "object",
        properties: {
          block_id: { type: "string", description: "e.g. validate.signup_payload" },
        },
        required: ["block_id"],
      },
    },
    {
      name: "get_graph",
      description: "Get graph topology and edges",
      inputSchema: {
        type: "object",
        properties: {
          graph_id: { type: "string", description: "e.g. feature.signup" },
        },
      },
    },
    {
      name: "validate_repo",
      description: "Run blocks verify and return InspectReport JSON",
      inputSchema: {
        type: "object",
        properties: {
          block_id: { type: "string" },
          graph_id: { type: "string" },
          strict: { type: "boolean" },
        },
      },
    },
    {
      name: "suggest_similar",
      description: "Find block ids similar to a query string",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" },
        },
        required: ["query"],
      },
    },
    {
      name: "graph_progress",
      description:
        "Get graph build progress: Working vs finalize-pending vs planned blocks, finalize queue, and suggested next block (only when nothing needs finalizing)",
      inputSchema: {
        type: "object",
        properties: {
          graph_id: { type: "string", description: "e.g. feature.marketing_analytics" },
        },
        required: ["graph_id"],
      },
    },
    {
      name: "run_block_tests",
      description: "Run fixture tests for a block or entire repo",
      inputSchema: {
        type: "object",
        properties: {
          block_id: { type: "string" },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = (request.params.arguments ?? {}) as Record<string, unknown>;

  try {
    if (name === "list_blocks") {
      const snapshot = repo();
      const blocks = snapshot.blocks.map((b) => ({
        id: b.id,
        species: b.species,
        version: b.contract.version,
        description: b.contract.description ?? b.contract.core.description,
      }));
      return { content: [{ type: "text", text: JSON.stringify(blocks, null, 2) }] };
    }

    if (name === "get_contract") {
      const blockId = String(args.block_id);
      const block = repo().blocks.find((b) => b.id === blockId);
      if (!block) {
        return { content: [{ type: "text", text: `Block not found: ${blockId}` }], isError: true };
      }
      const yaml = readFileSync(block.contractPath, "utf8");
      return { content: [{ type: "text", text: yaml }] };
    }

    if (name === "get_graph") {
      const snapshot = repo();
      const graphId = args.graph_id ? String(args.graph_id) : undefined;
      const graphs = graphId
        ? snapshot.graphs.filter((g) => g.id === graphId)
        : snapshot.graphs;
      if (graphs.length === 0) {
        return { content: [{ type: "text", text: "No graph found" }], isError: true };
      }
      return { content: [{ type: "text", text: JSON.stringify(graphs, null, 2) }] };
    }

    if (name === "validate_repo") {
      const report = verifyRepo({
        path: BLOCKS_PATH,
        block: args.block_id ? String(args.block_id) : undefined,
        graph: args.graph_id ? String(args.graph_id) : undefined,
        strict: Boolean(args.strict),
      });
      return { content: [{ type: "text", text: JSON.stringify(report, null, 2) }] };
    }

    if (name === "suggest_similar") {
      const query = String(args.query);
      const limit = typeof args.limit === "number" ? args.limit : 5;
      const scored = repo()
        .blocks.map((b) => ({
          id: b.id,
          score: Math.max(
            scoreSimilarity(query, b.id),
            scoreSimilarity(query, b.contract.core.description),
            scoreSimilarity(query, b.contract.description ?? ""),
          ),
        }))
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      return { content: [{ type: "text", text: JSON.stringify(scored, null, 2) }] };
    }

    if (name === "graph_progress") {
      const graphId = String(args.graph_id);
      const report = await graphProgress({ path: BLOCKS_PATH, graph: graphId });
      return { content: [{ type: "text", text: JSON.stringify(report, null, 2) }] };
    }

    if (name === "run_block_tests") {
      const results = await testRepo({
        path: BLOCKS_PATH,
        block: args.block_id ? String(args.block_id) : undefined,
      });
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    }

    return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  } catch (err) {
    return {
      content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

# Block graph plan

**Source of truth:** `.blocks/graph.yaml` or `.blocks/graphs/<feature-id>.yaml`

After a `block-explode` session, the full approved graph must be written to disk before ending the chat. Chat is not the plan.

## One block per session

1. `blocks progress --graph <id>` or MCP `graph_progress` — Working vs **finalize** queue vs planned.
2. If `finalize` is non-empty, complete `next_finalize` before building a new block.
3. Implement **one** block per session; end only when it is **Working** (green in Studio).
4. Run `blocks verify --block <id>`, `blocks test --block <id>`, and complete `human_setup` before moving on.

Status in `.blocks/PLAN.md`: **Working** · **finalize: …** · **planned** — never use vague "built".

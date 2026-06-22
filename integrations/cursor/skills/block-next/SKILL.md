---
name: block-next
description: Pick the next block to build from the graph plan. Use at the start of an implementation session.
---

# Build the next block

1. Read `.blocks/PLAN.md` if present — canonical graph is `.blocks/graphs/<id>.yaml`.
2. Run `blocks progress --graph <id>` or MCP `graph_progress` (or `blocks studio --graph <id>`).
3. **If `finalize` queue is non-empty** — do **not** start a new block. Complete `next_finalize` first (human setup, failing tests). A block is not done until Studio shows **Working** (green).
4. Otherwise tell the user: **Working N / built**, **next_block** from the report.
5. This session implements **only** `next_block` — no other blocks.
6. Use `block-new` / contract / layers / core / test flow for that block id.
7. Before ending the session: run `blocks test --block <id>`, `blocks inspect --block <id>`, complete all `human_setup` items, update `.blocks/PLAN.md` status to **Working** or **finalize: …**.

If `next_block` and `next_finalize` are both empty and nothing is planned, the graph is fully Working on disk.

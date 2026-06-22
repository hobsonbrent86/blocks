---
name: block-new
description: Create a new block skeleton with contract, core, layers, and fixture. Use when the user asks to create a block or start a new block.
---

# Create a new block

1. If unsure which block to build, run **`block-next`** or MCP `graph_progress` first.
2. Ask for **species** and **name** if not provided — must match the graph plan.
3. Run: `blocks new <species> <name> --graph <graph-id>` (block id must already be listed in graph YAML).
3. Edit `contract.yaml` — fill inputs, outputs, failure_modes, effects, idempotency, core description.
4. Implement layers before core.
5. Add `fixtures/test.yaml` with at least one happy-path case.
6. Run `blocks verify --block <id>` then `blocks test --block <id>`.
7. Open inspector: `blocks inspect --block <id>`.

Do not wire edges until contract ports are final.

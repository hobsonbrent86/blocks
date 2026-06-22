---
name: block-verify
description: Verify blocks and interpret failures. Use when the user asks to verify, check block health, or fix block structure.
---

# Verify blocks

1. Run `blocks verify --path .` for the full repo, or `blocks verify --block <id>` for one block.
2. Run `blocks test --block <id>` — includes **unit** (`test.yaml`) and **chain** (`chain.yaml`) fixtures.
3. At phase boundaries, run `blocks test --graph <graph-id>` — full mocked pipeline via `.blocks/graphs/<graph-id>.e2e.yaml`.
4. For visual status: `blocks inspect --block <id>` or `blocks studio --graph <id>`.

## Working vs Structure OK

| Banner | Meaning |
|--------|---------|
| **Working** | Unit + chain tests pass **and** all `human_setup` items in the contract are satisfied (env vars, tools like `curl`) |
| **Structure OK** | Unit tests pass but human setup or chain tests still pending |
| **Needs fixes** | Verify or tests failed |

| **Graph Working** | Graph e2e fixture passes (mocked full pipeline) |

## Built vs Working vs Finalize

| Status | Meaning |
|--------|---------|
| **Working** | Green in Studio — tests + human setup complete |
| **finalize** | Code exists, tests may pass, but `human_setup` or fixes still pending (yellow/red) |
| **planned** | Block id in graph YAML but not on disk |

`blocks progress --graph <id>` returns `finalize[]` and `next_finalize`. **Do not build the next block while finalize is non-empty.**

Human setup is part of the block — do not defer secrets or tool installs to "later blocks". Document requirements in `contract.yaml` under `human_setup`.

5. Fix one failing row at a time (Human setup → Core → Chain → Output).
6. Check IDs: S=structure, C=creed, G=graph, T=test, HUM=human setup.

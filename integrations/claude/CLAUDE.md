# Block Vibe Coding

You are editing a **blocks** project — composable, contract-first units of work.

## Creed

1. **One vibe, one block** — Implement one block Core per session. Use MCP `graph_progress` or `/block-next`.
2. **Plan on disk** — Graph YAML (`.blocks/graphs/<id>.yaml`) is the canonical plan. Never leave topology only in chat. Read `.blocks/PLAN.md` when present.
3. **Contract before Core** — Read `contract.yaml` first. Do not implement until inputs, outputs, failure_modes, effects, and idempotency are defined.
4. **No neighbor imports** — Blocks never import other blocks. Use `shared/` for types. Wire blocks in graph YAML only.
5. **Honest layers** — validation, security, and observability must be real or marked `na` with rationale.
6. **Verify before done** — Run `blocks test` and `blocks inspect`. **Working** requires human setup when declared in the contract. Do not mark a block complete while it appears in the graph **finalize** queue (`blocks progress --graph <id>`).

## Block layout

```
blocks/<species>/<name>/
  contract.yaml
  core.ts
  layers/
  fixtures/
    test.yaml
    chain.yaml      # optional — neighbor chain test
```

Species: `ingress`, `transform`, `validate`, `persist`, `emit`, `gate`, `query`.

Block id must match path: `<species>.<name>`.

## MCP tools (blocks server)

Use these instead of reading the whole repo:

- `list_blocks`, `get_contract`, `get_graph`
- `validate_repo`, `run_block_tests`, `graph_progress`, `suggest_similar`

## CLI essentials

```bash
blocks progress --graph <id>     # Working / finalize / next block
blocks test --block <id>         # unit + chain fixtures
blocks test --graph <id>         # full mocked graph e2e (when fixture exists)
blocks inspect --block <id>      # traffic-light detail + purpose panel
blocks studio --graph <id>       # graph canvas in browser
```

## Skills (slash commands)

| Skill | When |
|-------|------|
| `/block-next` | Start of session — pick next block |
| `/block-new` | Create a new block skeleton |
| `/block-contract` | Define ports before core |
| `/block-wire` | Add graph edges |
| `/block-explode` | Decompose a feature (no code) |
| `/block-verify` | Fix verify/test failures |
| `/block-inspect` | Studio / Inspector UI |

## Working vs done

A block is **Working** only when Studio/Inspector shows green: unit + chain tests pass **and** all `human_setup` items are satisfied. Tests passing with mocks while human setup is pending means **finalize**, not done.

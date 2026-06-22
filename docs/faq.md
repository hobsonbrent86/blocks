# FAQ

## What is a block?

One bounded job with a contract (inputs, outputs, failures) and layers (validation, security, observability).

## What is the graph?

The map of how blocks connect. Lives in `.blocks/graph.yaml`. Blocks never import each other — only the graph wires them.

## Why is my inspector banner "Structure OK" not "Working"?

Tests haven't passed yet. Run `blocks test --block <id>` and refresh the inspector.

## Why does `blocks test` print JSON lines?

Those are observability logs from blocks during tests. They're hidden by default in v0.1.0. Use `--verbose` to see them.

## Can I skip a layer?

Yes — mark it `na` in `contract.yaml` with a one-line `rationale`. Empty stubs fail verify.

## What species should I use?

| Job | Species |
|-----|---------|
| Accept HTTP/webhook | ingress |
| Validate input | validate |
| Business rule gate | gate |
| Save to DB | persist |
| Send email/webhook out | emit |
| Transform shape | transform |
| Read-only fetch | query |

## Does this work without Cursor?

Yes. The CLI (`verify`, `test`, `inspect`) and GitHub Action work standalone. Cursor rules/skills/MCP are optional but recommended.

## How do I publish to npm?

From the monorepo after build: publish `@blocks/verify`, `@blocks/mcp`, `@blocks/inspect`, `@blocks/schemas`, then `blocks-cli`. See CONTRIBUTING.md.

## What's intentionally not included?

- Graph visual editor
- Cloud registry (see paid-followup.md)
- Runtime orchestrator (use your app code + graph as map)

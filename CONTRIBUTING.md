# Contributing

Thanks for helping build Block Vibe Coding.

## Development setup

```bash
git clone https://github.com/hobsonbrent86/blocks.git
cd blocks
npx pnpm@9.15.0 install
npx pnpm@9.15.0 -r run build
npx pnpm@9.15.0 run ci
```

Link CLI globally for local testing:

```bash
./scripts/link-cli.sh
# or: cd packages/cli && npm link
```

## Project layout

| Path | Purpose |
|------|---------|
| `packages/verify` | Verification engine |
| `packages/cli` | `blocks` CLI + bundled assets |
| `packages/mcp` | MCP server |
| `packages/inspect` | Inspector + Studio UI |
| `packages/schemas` | JSON Schema |
| `integrations/cursor` | Cursor rules + skills source |
| `integrations/claude` | CLAUDE.md template for Claude Code |
| `integrations/github-action` | CI composite action |
| `templates/init` | `blocks init` template |
| `examples/signup` | Reference feature |

## Adding a verify check

1. Implement in `packages/verify/src/checks.ts`
2. Add tests in `packages/verify/src/verify.test.ts`
3. Update [ontology](docs/spec/ontology-v0.1.md) if definitions change

## Changing agent integrations

- **Cursor:** edit `integrations/cursor/` — rules (`.mdc`) and skills (`SKILL.md`)
- **Claude:** edit `integrations/claude/CLAUDE.md`; skills are shared from `integrations/cursor/skills/`
- Rebuild CLI (`pnpm -r run build`) so `copy-assets.mjs` refreshes bundled assets

## Changing the spec

Spec changes require:

1. RFC in a GitHub issue
2. Bump spec semver in `docs/spec/`
3. Update JSON Schema in `packages/schemas/`

## Publishing (maintainers)

```bash
pnpm -r run build
npm publish --workspace @blocks/schemas --access public
npm publish --workspace @blocks/verify --access public
npm publish --workspace @blocks/inspect --access public
npm publish --workspace @blocks/mcp --access public
npm publish --workspace blocks-cli --access public
```

## Code style

- Minimal diffs
- Match existing TypeScript patterns
- No fallbacks unless explicitly requested

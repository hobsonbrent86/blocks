# Contributing

Thanks for helping build Block Vibe Coding.

## Development setup

```bash
npx pnpm@9.15.0 install
npx pnpm@9.15.0 -r run build
npx pnpm@9.15.0 run ci
```

Link CLI globally for local testing:

```bash
cd packages/cli && npm link
```

## Project layout

| Path | Purpose |
|------|---------|
| `packages/verify` | Verification engine |
| `packages/cli` | `blocks` CLI + bundled assets |
| `packages/mcp` | MCP server |
| `packages/inspect` | Inspector UI |
| `packages/schemas` | JSON Schema |
| `integrations/cursor` | Rules + skills source |
| `integrations/github-action` | CI composite action |
| `templates/init` | `blocks init` template |
| `examples/signup` | Reference feature |

## Adding a verify check

1. Add check ID to `docs/oss-build-plan.md`
2. Implement in `packages/verify/src/checks.ts`
3. Add fixture case in `packages/verify/fixtures/` if needed
4. Update tests

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

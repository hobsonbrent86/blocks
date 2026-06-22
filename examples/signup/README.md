# Signup example

Reference feature: webhook → validate → gate → persist → welcome email.

Five blocks wired in `.blocks/graph.yaml` as `feature.signup`.

## Try it

From the **monorepo root** (after `./scripts/link-cli.sh`):

```bash
blocks verify --path examples/signup
blocks test --path examples/signup
blocks progress --graph feature.signup --path examples/signup
blocks studio --graph feature.signup --path examples/signup
blocks inspect --block validate.signup_payload --path examples/signup
```

## Agent setup

From this directory:

```bash
blocks cursor install    # Cursor rules + skills + MCP
# or
blocks claude install    # CLAUDE.md + skills + MCP
```

Then open this folder in Cursor or Claude Code. See [Cursor setup](../../docs/cursor-setup.md) and [Claude setup](../../docs/claude-setup.md).

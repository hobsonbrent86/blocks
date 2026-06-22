# Cursor setup

## Install

From your blocks project root:

```bash
blocks cursor install
```

This copies:

- `.cursor/rules/` — always-on block discipline
- `.cursor/skills/` — on-demand rituals
- `.cursor/mcp.json` — local blocks MCP server

## Enable in Cursor

1. **Rules** — Settings → Rules → enable project rules
2. **MCP** — Settings → MCP → enable `blocks` server
3. Restart Cursor if MCP does not appear

## Skills

| Skill | Say something like… |
|-------|---------------------|
| `block-new` | "Create a new validate block" |
| `block-contract` | "Define the contract for this block" |
| `block-wire` | "Wire validate to persist in the graph" |
| `block-explode` | "Break signup into blocks" |
| `block-verify` | "Verify this block" |
| `block-inspect` | "Open the block inspector" |

## Session discipline

Tell Cursor at the start of work:

> "This session is only for block `validate.signup_payload`. Do not edit other blocks."

The rules enforce one-vibe-one-block and contract-before-core.

## Block Inspector & Studio

```bash
blocks inspect --block validate.signup_payload
blocks studio --graph feature.signup
```

**Simple Browser does not open automatically.** With the CLI still running:

1. **Cmd+Shift+P** (Command Palette)
2. Type **Simple Browser: Show** and press Enter
3. Paste the URL (e.g. `http://localhost:3848`)

The panel docks inside Cursor beside your editor. You can also open the same URL in Chrome or Safari.

Use row colors to guide fixes:

- **Red row** → ask AI to fix that layer
- **Gray Core/Output** → run `blocks test` and refresh

## MCP tools

The blocks MCP server exposes:

- `list_blocks`, `get_contract`, `get_graph`
- `validate_repo`, `run_block_tests`, `graph_progress`, `suggest_similar`

Agents use these instead of reading the whole repo.

## Claude Code users

Use `blocks claude install` instead — see [claude-setup.md](./claude-setup.md).

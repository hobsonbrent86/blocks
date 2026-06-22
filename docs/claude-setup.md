# Claude Code setup

## Install (in your blocks project)

There is no separate blocks plugin in Claude. You install **into the project**, then open that folder in Claude Code:

```bash
cd my-app          # your blocks project root
blocks claude install
```

This writes:

- **`CLAUDE.md`** — always-on project rules (Claude reads this every session)
- **`.claude/skills/`** — slash commands: `/block-next`, `/block-verify`, etc.
- **`.mcp.json`** — blocks MCP server

Same skill content as Cursor; Claude uses `.claude/skills/<name>/SKILL.md`, Cursor uses `.cursor/skills/<name>/SKILL.md`.

## Enable in Claude Code

1. **Open the project folder** in Claude Code (not just a parent directory).
2. **Restart** the session if `.claude/skills/` or `.mcp.json` did not exist when you started.
3. Run **`/mcp`** — confirm the **blocks** server is connected.
4. Type **`/`** — you should see `/block-next`, `/block-verify`, and the other block skills.

`CLAUDE.md` loads automatically. No Settings toggle like Cursor rules.

## Session discipline

Start work with:

> `/block-next` — this session is only for that one block.

Or invoke a specific skill:

> `/block-verify` for validate.signup_payload

## Block Studio & Inspector

```bash
blocks inspect --block validate.signup_payload
blocks studio --graph feature.signup
```

Open the printed URL in your browser. Studio shows graph status, finalize queue, and per-block Purpose / Important elements.

## MCP tools

The blocks MCP server exposes:

- `list_blocks`, `get_contract`, `get_graph`
- `validate_repo`, `run_block_tests`, `graph_progress`, `suggest_similar`

Agents should prefer these over scanning the whole repo.

## Re-install / update

Running `blocks claude install` again refreshes skills, updates the marked section in `CLAUDE.md`, and merges MCP config without removing other servers.

## Cursor users

Use `blocks cursor install` instead — see [cursor-setup.md](./cursor-setup.md). Both agents share the same CLI, verify engine, Studio, and MCP server.

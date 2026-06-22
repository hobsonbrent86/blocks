# CLI reference

## Global

```bash
blocks --version
blocks doctor [--path .]
```

## Project

```bash
blocks init [--path .]
blocks cursor install [--path .]
blocks claude install [--path .]
```

## Blocks

```bash
blocks new <species> <name> [--graph <graph-id>] [--path .]
```

Species: `ingress`, `transform`, `validate`, `persist`, `emit`, `gate`, `query`

## Verify

```bash
blocks verify [--path .] [--graph <id>] [--block <id>] [--strict] [--format human|json|github]
blocks lint    # alias for verify
```

Exit code `1` on failure.

## Test

```bash
blocks test [--path .] [--block <id>] [--fixture <path>] [--format human|json] [--verbose]
```

Fixtures: `blocks/<species>/<name>/fixtures/test.yaml`

## Inspector

```bash
blocks inspect [--path .] [--block <id>] [--port 3847] [--no-test]
```

Open the printed URL in Cursor Simple Browser.

## Studio

```bash
blocks studio --graph <id> [--path .] [--port 3848] [--no-test] [--no-open]
```

Graph view with click-through block detail. Opens your default browser automatically; **Cmd+click** the terminal link for Cursor Simple Browser.

**View modes** (toggle in UI): Graph only · + Unwired · All blocks in repo.

## Environment

| Variable | Purpose |
|----------|---------|
| `BLOCKS_VERBOSE=1` | Show observability logs during tests |
| `BLOCKS_PATH` | Repo root for MCP server (set automatically) |

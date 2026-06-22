# Blocks

**Block Vibe Coding** — composable, contract-first units of work for AI-assisted development.

Give vibe coders **traffic-light feedback** on small, testable blocks instead of monolithic AI output.

## Install

```bash
# Clone and link (testing before npm publish)
git clone https://github.com/hobsonbrent86/blocks blocks && cd blocks
./scripts/link-cli.sh
```

After npm publish:

```bash
npm install -g blocks-cli
```

## New project in 3 commands

```bash
mkdir my-app && cd my-app
blocks init
blocks cursor install   # or: blocks claude install
```

Open in **Cursor** or **Claude Code**, enable MCP, then:

```bash
blocks new validate signup_payload --graph feature.main
```

**Full walkthrough:** [docs/quickstart.md](docs/quickstart.md)

## Core commands

```bash
blocks verify --path .          # structure + creed
blocks test --block <id>        # fixture tests
blocks progress --graph <id>    # Working / finalize / next block
blocks studio --graph <id>      # graph canvas in browser
blocks inspect --block <id>     # traffic-light block detail
blocks doctor --path .          # sanity check
```

## Reference example

```bash
blocks verify --path examples/signup   # from repo root after clone
blocks test --path examples/signup
blocks inspect --path examples/signup --block validate.signup_payload
```

## Docs

| Doc | Description |
|-----|-------------|
| [Quickstart](docs/quickstart.md) | 15-minute path for new users |
| [CLI reference](docs/cli-reference.md) | All commands |
| [Cursor setup](docs/cursor-setup.md) | Rules, skills, MCP |
| [Claude setup](docs/claude-setup.md) | CLAUDE.md, guides, MCP |
| [FAQ](docs/faq.md) | Common questions |
| [Creed](docs/spec/creed-v0.1.md) | Commandments |
| [Ontology](docs/spec/ontology-v0.1.md) | Definitions |

## Architecture

```
Ingress → Validate → Gate → Persist → Emit
         (each block = contract + layers + core + fixtures)
```

Graph in `.blocks/graph.yaml`. Blocks never import neighbors.

## Packages

| Package | npm name |
|---------|----------|
| CLI | `blocks-cli` |
| Verify | `@blocks/verify` |
| MCP | `@blocks/mcp` |
| Inspector | `@blocks/inspect` |
| Schemas | `@blocks/schemas` |

## Status

**v0.1.0** — OSS complete. Ready for test projects. npm publish optional next step.

## License

Apache 2.0 — see [LICENSE](LICENSE)

## Security

See [SECURITY.md](SECURITY.md) to report vulnerabilities privately.

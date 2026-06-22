# Quickstart — Block Vibe Coding

Get from zero to a working block in ~15 minutes.

## Prerequisites

- **Node.js 20+**
- **Cursor** or **Claude Code** (recommended) or any editor + terminal

## 1. Install the CLI

### Option A — From this repo (for testing now)

```bash
git clone https://github.com/hobsonbrent86/blocks blocks
cd blocks
npx pnpm@9.15.0 install
npx pnpm@9.15.0 -r run build
cd packages/cli && npm link
```

Verify: `blocks --version`

### Option B — From npm (after publish)

```bash
npm install -g blocks-cli
```

## 2. Create a project

```bash
mkdir my-app && cd my-app
blocks init
blocks cursor install   # or: blocks claude install
```

Open `my-app` in Cursor or Claude Code. Enable the **blocks** MCP server (Cursor: Settings → MCP; Claude: restart session, then `/mcp`).

## 3. Create your first block

```bash
blocks new validate signup_payload --graph feature.main
```

Edit `blocks/validate/signup_payload/contract.yaml` — fill inputs, outputs, failure modes.

In Cursor, say:

> "Complete the contract for validate.signup_payload, then implement layers and core. One block only."

## 4. Add a test fixture

Edit `blocks/validate/signup_payload/fixtures/test.yaml`:

```yaml
cases:
  - name: happy path
    in:
      payload:
        email: user@example.com
    out:
      result:
        email: user@example.com
```

Adjust ports to match your contract.

## 5. Check your block

```bash
blocks verify --block validate.signup_payload
blocks test --block validate.signup_payload
blocks inspect --block validate.signup_payload
```

Open the inspector URL in **Cursor → Simple Browser**.

For the whole graph (plan + progress):

```bash
blocks studio --graph feature.signup
```

Click any block in the canvas for the same traffic-light detail panel.

| Banner | Meaning |
|--------|---------|
| **Working** | Structure + tests pass |
| **Structure OK** | Verify passed, tests not run |
| **Needs fixes** | Something failed — fix the first red row |

## 6. Daily loop

1. Pick **one block** for this session
2. Contract → layers → core → fixture
3. `blocks test --block <id>`
4. `blocks inspect --block <id>` until **Working**
5. Wire blocks in `.blocks/graph.yaml` when ready (`block-wire` skill)

## 7. CI

Your project includes `.github/workflows/blocks.yml`. After publishing to npm, pushes run verify + test automatically.

## Reference example

Explore the full signup flow:

```bash
cd examples/signup   # inside the blocks repo
blocks verify --path .
blocks test --path .
blocks inspect --block validate.signup_payload --path .
```

## Help

- [CLI reference](./cli-reference.md)
- [Cursor setup](./cursor-setup.md)
- [Claude setup](./claude-setup.md)
- [FAQ](./faq.md)
- [Creed](./spec/creed-v0.1.md)

# Blocks GitHub Action

Composite action for CI merge gates.

## Monorepo / local CLI

```yaml
- uses: ./integrations/github-action
  with:
    path: examples/signup
    cli-bin: packages/cli/dist/index.js
```

## Published CLI (consumer repos)

```yaml
- uses: ./integrations/github-action
  with:
    path: .
    cli-version: "0.1.0"
    strict: "true"
    run-tests: "true"
```

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `path` | `.` | Repo root |
| `strict` | `false` | P2 hygiene checks |
| `graph` | `` | Optional graph id |
| `run-tests` | `true` | Run fixture tests |
| `cli-bin` | `` | Path to built CLI (monorepos) |
| `cli-version` | `latest` | npm version when cli-bin empty |

Verify emits GitHub workflow annotations with `--format github`.

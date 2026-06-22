# Block Vibe Coding — Ontology v0.1

Machine-checkable definitions for OSS tooling.

## Core entities

### Block

A bounded unit of work with a **Contract**, a **Core**, and **Layers**.

```
blocks/<species>/<name>/
  contract.yaml      # required
  core.*             # required (language-specific)
  layers/            # required directory; may contain N/A markers
  README.md          # optional
```

### Contract

Typed boundary for a block. Required fields:

| Field | Description |
|-------|-------------|
| `id` | Unique block id: `<species>.<name>` |
| `species` | One of: ingress, transform, validate, persist, emit, gate, query |
| `version` | Semver |
| `inputs` | Named typed ports |
| `outputs` | Named typed ports |
| `failure_modes` | Named outcomes with retry class |
| `idempotency` | `pure` \| `idempotent_write` \| `append_only` \| `dangerous` |
| `effects` | Subset of: `read`, `write`, `external_call`, `human_gate` |
| `human_setup` | Optional human prerequisites (env vars, tools) checked before **Working** |
| `layers` | Layer declarations with status |

### Core

The single verb the block exists to perform. One sentence in `contract.yaml`:

```yaml
core:
  verb: assert
  description: Assert signup payload matches schema and business rules
```

Split rule: if `description` needs "and" between two unrelated verbs, split the block.

### Layer

Cross-cutting obligation. Standard layers:

| Layer | Purpose |
|-------|---------|
| `validation` | Input/output schema and business rules |
| `security` | Authn/authz, PII handling, tenant isolation |
| `observability` | Structured logs, metrics hooks, trace propagation |
| `resilience` | Timeouts, retries, circuit breaking (when applicable) |

Layer status: `implemented` \| `inherited` \| `na`

`inherited` requires `inherits_from` pointing to a shared primitive.

### Edge

Connection between block output port and block input port.

```yaml
from: validate.signup_payload.outputs.validated
to: persist.create_user.inputs.user
```

Edges live in `graph.yaml`, not in block code.

### Graph

Named composition of blocks and edges. **This file is the canonical feature plan** — include all planned block ids even before implementation. Unbuilt blocks appear as "planned" in Studio and MCP `graph_progress`.

```yaml
id: feature.signup
version: 1.0.0
blocks:
  - ingress.signup_webhook
  - validate.signup_payload
  - gate.email_not_taken
  - persist.create_user
  - emit.welcome_email
edges:
  - from: ingress.signup_webhook.outputs.payload
    to: validate.signup_payload.inputs.payload
  # ...
```

### Run (dev-time)

A verified execution context: `block_id` + fixture inputs + expected outputs. Used by `blocks test`.

**Unit fixtures:** `blocks/<species>/<name>/fixtures/test.yaml`

**Chain fixtures:** `fixtures/chain.yaml` on a block runs upstream wired blocks in sequence (e.g. persist → gate). Required for **Working** when present.

**Graph e2e fixtures:** `.blocks/graphs/<graph-id>.e2e.yaml` runs the full mocked pipeline for a feature graph. Same `chain:` step format as chain fixtures; every step declares `block`. Run with `blocks test --graph <id>`. Required for **Graph Working** in Studio when present.

Inspector and Studio derive **Purpose** and **Important elements** from `contract.yaml` (description, ports, human_setup, failure modes).

**Working** (Inspector green banner) requires: unit tests pass, chain tests pass (if `chain.yaml` exists), and all `human_setup` items satisfied in your shell environment.

**Graph Working** (Studio graph e2e) requires: graph e2e fixture passes under `BLOCKS_TEST=1` (mocked, no live external calls).

**Finalize** — a block with code on disk but not **Working** (human setup pending, failing tests). The graph `finalize` queue blocks `next_block` until cleared. Track via `blocks progress --graph <id>` or MCP `graph_progress`.

### Context (vs payload)

- **Payload** — Block contract inputs/outputs; crosses edges.
- **Context** — Trace id, actor, tenant, feature flags; side channel; never implicit globals.

## Block species

| Species | Core verbs | Typical effects |
|---------|------------|-----------------|
| ingress | accept | read |
| transform | map | read |
| validate | assert | read |
| persist | store | write |
| emit | notify | external_call |
| gate | decide | read, human_gate |
| query | read | read |

## Sizing law

A block is correctly sized when:

1. Core is one sentence, one primary verb.
2. Unit test needs ≤2 external mocks.
3. Replacing the block does not require editing non-adjacent blocks.

## Composition patterns

| Pattern | Notation |
|---------|----------|
| Sequential | A → B → C |
| Parallel | A → (B, C) → D |
| Conditional | A → Gate → B \| C |
| Fan-in | (A, B) → Merge → C |

Merge/transform adapter blocks are preferred over implicit fan-in in orchestrator code.

## File layout (repo convention)

```
.blocks/
  graph.yaml                 # root feature graph or index of graphs
  graphs/                    # optional: multiple feature graphs
    signup.yaml
  schemas/
    contract.schema.json
    graph.schema.json
blocks/
  validate/
    signup_payload/
      contract.yaml
      core.ts
      layers/
        validation.ts
        security.ts
        observability.ts
shared/
  layers/                    # inherited layer primitives
  types/                     # shared payload types
.cursor/
  rules/
  skills/
```

## Versioning

- Block contract semver: breaking input/output change = major bump.
- Graph references block contracts by id + compatible version range.
- `blocks verify` fails on incompatible edge contracts.

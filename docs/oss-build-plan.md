# OSS Build Plan — Block Vibe Coding

Full plan to ship open-source functionality. Paid/cloud features are explicitly out of scope; see [paid-followup.md](./paid-followup.md).

---

## Goal

Ship a **vendor-neutral, locally enforced** Block Vibe Coding stack that:

1. Makes the religion **machine-checkable** (not aspirational markdown)
2. Integrates with **Cursor** (rules, skills, hooks, MCP) as the primary agent surface
3. Gates **GitHub** merges via Actions (optional but recommended)
4. Includes **one reference implementation** that proves the model works

**Success criteria for OSS v1.0:**

- `npx blocks init` scaffolds a repo in under 30 seconds
- `blocks verify` catches all anti-patterns listed in [creed-v0.1.md](../spec/creed-v0.1.md)
- `blocks inspect` shows block anatomy with green/red/gray status for laity-friendly feedback
- A developer can build a 5-block feature using only Cursor skills without reading source code
- Reference repo passes CI with zero manual exceptions

---

## Non-goals (OSS v1)

- Hosted registry / cloud sync
- Visual **graph** editor (block inspector is in scope; graph editor is not)
- Custom runtime orchestrator (Temporal, queues, etc.)
- Language runtime beyond TypeScript reference (schemas and CLI are language-agnostic)
- Paid templates or SSO
- Live-updating Cursor Canvas as primary inspector (CLI-served HTML first)

---

## Repository structure (this monorepo)

```
blocks/
├── packages/
│   ├── cli/                 # blocks init | verify | lint | test | graph
│   ├── schemas/             # JSON Schema for contract + graph
│   ├── verify/              # Core verification engine (pure TS)
│   ├── inspect/             # Block Inspector static UI (Phase 3.5)
│   └── mcp/                 # Local MCP server (registry + validate)
├── integrations/
│   ├── cursor/              # rules, skills, hooks templates
│   └── github-action/       # Composite action for CI
├── examples/
│   └── signup/              # Reference feature graph (5–6 blocks)
├── docs/
│   ├── spec/                # creed, ontology (source of truth)
│   ├── oss-build-plan.md    # this file
│   └── paid-followup.md     # saved for later
└── templates/
    └── init/                # Files copied by `blocks init`
```

**Package manager:** pnpm workspaces  
**CLI language:** TypeScript (Node 20+)  
**License:** Apache 2.0

---

## Phase 0 — Spec freeze (Week 1)

**Objective:** Ontology stable enough to write schemas and tests against.

### Deliverables

| Item | Path | Done when |
|------|------|-----------|
| Creed v0.1 | `docs/spec/creed-v0.1.md` | ✓ drafted |
| Ontology v0.1 | `docs/spec/ontology-v0.1.md` | ✓ drafted |
| Contract JSON Schema | `packages/schemas/contract.schema.json` | Validates example contracts |
| Graph JSON Schema | `packages/schemas/graph.schema.json` | Validates example graph |
| Example contract | `examples/signup/blocks/.../contract.yaml` | One per species minimum |
| Example graph | `examples/signup/.blocks/graph.yaml` | Signup feature wired |

### Tasks

1. Finalize species list and required contract fields
2. Write JSON Schema with `$ref` for ports, failure_modes, layers
3. Define `N/A` layer format:

   ```yaml
   layers:
     security:
       status: na
       rationale: Operates on pre-authenticated internal payload only
   ```

4. Document context vs payload convention in ontology
5. Tag spec as `spec-v0.1.0`

### Exit criteria

- Signup example fully modeled and schema-valid
- Second example (webhook ingest) deferred to post-v1 — do not block build on it

### Plan review note (pre-build)

| Item | Decision |
|------|----------|
| Graph location | `.blocks/graph.yaml` (single graph) or `.blocks/graphs/<id>.yaml` (multi); CLI supports both |
| Verify JSON shape | Canonical `InspectReport` — shared by verify, test, inspect, MCP, GitHub Action |
| Phase 0 second feature | Deferred; signup is the reference |
| Inspector colors | v1: green / red / gray only; yellow added when warning checks exist |
| YAML parsing | Contracts and graphs are YAML; validated via JSON Schema after parse |

---

## Shared output: InspectReport

All commands emit the same structure for UI and CI:

```json
{
  "ok": false,
  "block": "validate.signup_payload",
  "summary": { "pass": 4, "fail": 1, "skip": 2 },
  "steps": [
    { "id": "contract", "label": "Contract", "status": "pass" },
    { "id": "validation", "label": "Validation", "status": "fail", "message": "Empty stub detected" },
    { "id": "core", "label": "Core", "status": "skip", "message": "Run blocks test" }
  ],
  "checks": [{ "id": "C04", "status": "fail", "message": "...", "path": "blocks/..." }]
}
```

`status`: `pass` | `fail` | `skip` | `na`

---

## Phase 1 — Verify engine (Weeks 2–3)

**Objective:** `blocks verify` is the core product. Everything else wraps this.

### Package: `@blocks/verify`

Pure functions, no I/O except reading files. Test-heavy.

### Checks (implement in order)

#### P0 — Structural

| Check ID | Rule |
|----------|------|
| `S01` | Every block dir has `contract.yaml`, core file, `layers/` |
| `S02` | Contract validates against JSON Schema |
| `S03` | `contract.id` matches path `<species>.<name>` |
| `S04` | Graph validates against JSON Schema |
| `S05` | Every graph block reference resolves to existing block |
| `S06` | Every edge `from`/`to` references declared ports |

#### P0 — Creed

| Check ID | Rule |
|----------|------|
| `C01` | Core description fails if multiple primary verbs detected (heuristic) |
| `C02` | No block imports another block's core (static import analysis for TS) |
| `C03` | Required layers present or marked `na` with rationale |
| `C04` | Layer theater: `implemented` layer file must not be empty/trivial stub |
| `C05` | `failure_modes` non-empty |
| `C06` | `effects` non-empty |
| `C07` | `idempotency` declared |

#### P1 — Graph integrity

| Check ID | Rule |
|----------|------|
| `G01` | No orphan blocks in graph (every block has ≥1 edge or marked `entry`/`exit`) |
| `G02` | Port type compatibility on edges (structural typing v0: exact type string match) |
| `G03` | No cycles unless block marked `allows_cycle` |
| `G04` | Entry blocks are ingress or query species |

#### P2 — Hygiene

| Check ID | Rule |
|----------|------|
| `H01` | README or contract description present |
| `H02` | Observability layer emits structured log shape (AST grep for TS) |
| `H03` | Heresy annotations include required fields when present |

### CLI commands (Phase 1 scope)

```bash
blocks verify [--path .] [--graph feature.signup] [--strict]
blocks lint     # alias for verify with style-only rules
```

Output: JSON (`InspectReport`) for CI/inspector, human-readable for local. Exit code non-zero on any P0 failure.

### Tests

- Fixture repo in `packages/verify/fixtures/` with good + bad cases per check
- 100% coverage on check functions

### Exit criteria

- `examples/signup` passes all P0 + P1 checks
- At least 3 intentional failing fixtures per check category

---

## Phase 2 — CLI + init scaffold (Week 4)

**Objective:** Zero-to-blocks repo in one command.

### Package: `@blocks/cli`

```bash
blocks init [--template minimal|full] [--lang ts]
blocks new <species> <name> [--graph <graph-id>]
blocks graph add <graph-id>
blocks graph wire <from-port> <to-port>
blocks test [--block <id>] [--fixture <path>]
blocks doctor      # env + cursor + schema sanity
```

### `blocks init` copies

From `templates/init/`:

```
.blocks/graph.yaml
.blocks/schemas/          # pinned schema refs
blocks/.gitkeep
shared/layers/
.cursor/rules/blocks.mdc
.cursor/skills/           # symlinks or copies (see Phase 3)
.github/workflows/blocks.yml
blocks.config.yaml        # paths, language, strict mode
```

### `blocks new validate SignupPayload`

- Creates directory structure per ontology
- Generates contract.yaml skeleton with TODO markers
- Generates core + layer stubs
- Optionally adds block id to specified graph (unwired)

### `blocks.config.yaml`

```yaml
version: 1
language: typescript
paths:
  blocks: blocks
  graphs: .blocks/graphs
  shared: shared
verify:
  strict: false          # true = P2 checks fail CI
  allowed_heresies: []
```

### Exit criteria

- Fresh `blocks init && blocks verify` passes on empty scaffold ( vacuous pass or minimal seed block)
- `blocks new` + `blocks verify` passes for manually completed contract

---

## Phase 3 — Cursor integration (Weeks 5–6)

**Objective:** Agent-native enforcement. This is how users actually live in the religion daily.

### Package: `integrations/cursor/`

#### Rules (always-on)

| File | Purpose |
|------|---------|
| `blocks.mdc` | Creed summary, one-vibe-one-block, contract-first |
| `blocks-structure.mdc` | File layout, import boundaries |
| `blocks-session.mdc` | How to scope context to current block id |

Install via `blocks cursor install` → copies to `.cursor/rules/`

#### Skills (on-demand rituals)

| Skill | Triggers | Steps |
|-------|----------|-------|
| `block-new` | "create block", "new block" | species → name → contract → stubs → graph register |
| `block-contract` | "define contract" | ports, failures, effects, idempotency before code |
| `block-wire` | "wire", "connect blocks" | edge in graph.yaml only, verify port types |
| `block-explode` | "break into blocks", "decompose feature" | propose graph, no implementation |
| `block-verify` | "verify blocks" | run CLI, interpret failures |
| `block-session` | start of feature work | lock session to one block id, load contract only |

Each skill references ontology paths; no duplicated spec text (DRY via `@docs/spec/`).

#### Hooks (optional, opt-in)

`blocks cursor hooks install` adds `.cursor/hooks/` or documents hook.json entries:

| Hook | Trigger | Action |
|------|---------|--------|
| pre-commit | git commit | run `blocks verify` |
| pre-prompt | large prompt detected | warn if >1 block verb detected |
| post-edit | save in `blocks/` | run quick lint on touched block |

Hooks are best-effort locally; CI remains source of truth.

#### MCP server (local)

Package: `@blocks/mcp`

Tools:

| Tool | Description |
|------|-------------|
| `list_blocks` | Blocks in repo with species + version |
| `get_contract` | Full contract for block id |
| `get_graph` | Graph topology + edges |
| `validate_repo` | Run verify, return structured errors |
| `suggest_similar` | Fuzzy match block ids/descriptions (local string match v0) |

No cloud. Reads filesystem only.

Config snippet for `.cursor/mcp.json` generated by `blocks cursor install`.

### Exit criteria

- Documented walkthrough: build signup feature using skills only
- MCP tools return correct data on `examples/signup`
- Rules prevent neighbor imports in agent test sessions (manual QA checklist)

---

## Phase 3.5 — Block Inspector (Week 6, parallel with Phase 3 tail)

**Objective:** Laity-friendly traffic-light view of one block. Read-only face on verify + test — not a separate truth source.

### Package: `@blocks/inspect`

Serves a single-page HTML app via CLI:

```bash
blocks inspect [--block <id>] [--port 3847] [--watch]
# Open http://localhost:3847 in Cursor Simple Browser
```

### UI anatomy (fixed shape, every block)

```
┌─────────────────────────────────────────┐
│  validate.signup_payload                │
│  "Assert signup payload is valid"       │
├─────────────────────────────────────────┤
│  INPUT       ● pass                     │
│  VALIDATION  ● fail   "email not checked"│
│  CORE        ○ skip   "Run block test"  │
│  SECURITY    ● pass                     │
│  OBSERVE     ● pass                     │
│  OUTPUT      ○ skip                     │
├─────────────────────────────────────────┤
│  [ Run block test ]                     │
└─────────────────────────────────────────┘
```

### Color mapping (v1)

| Status | Color | Label |
|--------|-------|-------|
| `pass` | Green | Working |
| `fail` | Red | Broken |
| `skip` | Gray | Not tested |
| `na` | Muted outline | Intentionally N/A |

No yellow in v1. Add when P2 warning checks exist.

### Architecture

```
blocks verify --format json ──┐
blocks test --format json ────┼──► InspectReport ──► inspect UI (poll/SSE)
file watcher ( --watch ) ─────┘
```

- Static HTML + inline JS in `packages/inspect/public/`
- No npm deps in browser bundle
- `blocks inspect` runs local HTTP server; optional `--watch` re-runs verify on save

### Cursor integration

- Skill `block-inspect`: run `blocks inspect --block <id>`, prompt user to open Simple Browser
- Optional: agent-generated canvas **snapshot** after test (not live dashboard)

### Explicit non-goals

- Graph visualization / node editor
- Drag-and-drop wiring
- Cloud sync

### Exit criteria

- Non-engineer can identify broken layer from UI alone in paper-test walkthrough
- Inspector updates within 2s of save when `--watch` enabled
- `examples/signup` block shows correct colors after verify + test

---

## Phase 4 — GitHub Action + CI (Week 7)

**Objective:** Free distribution via merge gates.

### Package: `integrations/github-action/`

```yaml
# .github/workflows/blocks.yml (generated)
- uses: blocks-dev/blocks-action@v1
  with:
    strict: true
    graph: feature.signup   # optional; default all graphs
```

Action steps:

1. Install `blocks` CLI from npm
2. Run `blocks verify --strict --format github`
3. Annotate PR with failures (GitHub annotation API)
4. Optional: post graph diff comment on PR (markdown summary)

### Graph diff comment (P1 for Action)

Compare base branch `.blocks/` vs PR:

- Added/removed blocks
- Added/removed edges
- Contract version bumps

No cloud required; pure git diff + parse.

### Exit criteria

- Action runs on `examples/signup` repo fork
- Failing PR produces annotations on exact file/line where possible

---

## Phase 5 — Reference example + docs (Week 8)

**Objective:** The miracle — proof the religion produces real software.

### `examples/signup/`

Standalone mini-repo (or subdirectory runnable via workspace):

```
Ingress: signup_webhook
  → Validate: signup_payload
  → Gate: email_not_taken
  → Persist: create_user
  → Emit: welcome_email
```

Each block:

- Full contract
- Implemented layers (not theater)
- Unit test with fixtures in `blocks/<species>/<name>/fixtures/`
- `blocks test` passes

### Docs site (minimal)

GitHub Pages from `/docs` or VitePress:

- Quickstart (5 min)
- Creed + ontology (published from spec)
- Walkthrough: signup example
- CLI reference
- Cursor setup
- FAQ / heresies

No custom domain required for v1.

### Exit criteria

- New user doc: clone example → run tests → modify one block → verify → pass
- All OSS packages published to npm under `@blocks/*` or `blocks-cli`

---

## Phase 6 — OSS launch (Week 9)

### Publish

| Package | npm name |
|---------|----------|
| CLI | `blocks-cli` or `@blocks/cli` |
| Verify | `@blocks/verify` |
| Schemas | `@blocks/schemas` |
| MCP | `@blocks/mcp` |
| GitHub Action | `blocks-dev/blocks-action` |

### Community

- GitHub org: `blocks-dev` (or similar)
- CONTRIBUTING.md: how to add species, checks, skills
- Issue templates: bug, new check, block template
- RFC process for ontology changes (spec semver)

### Launch checklist

- [ ] README with badges (verify passing on main)
- [ ] Apache 2.0 LICENSE
- [ ] Code of Conduct
- [ ] Changelog
- [ ] npm publish CI
- [ ] Example repo template on GitHub ("Use this template")
- [ ] Announcement post draft (problem → blocks → quickstart)

---

## Technical decisions (locked for v1)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Config format | YAML | Human + AI readable |
| Schema | JSON Schema draft 2020-12 | Ecosystem tooling |
| Reference language | TypeScript | Cursor default; import analysis feasible |
| Static analysis | ts-morph or simple regex v0 | No neighbor imports |
| Orchestration | None in OSS | Graph is declarative; user wires in app code |
| Test runner | vitest in examples | Fast, familiar |
| Monorepo | pnpm | Standard for CLI + packages |

---

## Implementation order (single developer)

```
Week 1   Phase 0  — schemas + signup example
Week 2   Phase 1  — verify checks S01–C07
Week 3   Phase 1  — verify checks G01–H03 + fixtures
Week 4   Phase 2  — CLI init/new/verify/test
Week 5   Phase 3  — cursor rules + 3 core skills
Week 6   Phase 3  — MCP + remaining skills + hooks
         Phase 3.5 — Block Inspector (blocks inspect)
Week 7   Phase 4  — GitHub Action
Week 8   Phase 5  — signup reference + docs site
Week 9   Phase 6  — npm publish + launch
```

Parallelizable if two devs: Phase 1 + Phase 0 example implementation in parallel.

---

## Future OSS (post v1.0, still free)

Track in GitHub milestones; not blocking launch:

| Feature | Priority |
|---------|----------|
| Python / Go core templates | P1 |
| `blocks explode` — suggest graph from mega-file | P1 |
| Second example (webhook ingest) | P1 |
| VS Code extension (thin wrapper on CLI) | P2 |
| Contract codegen (types from YAML) | P2 |
| Graph Mermaid export | P2 |
| Pre-commit hook package | P2 |
| Community block template repo | P2 |

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Layer theater detection too noisy | Start heuristic + allow `verify.ignore` with ticket ref |
| Import analysis language-specific | TS only v1; other langs manual C02 until analyzer exists |
| Cursor API changes | Skills are markdown; rules portable; MCP is stable interface |
| Spec churn breaks users | Spec semver; schemas pinned in `blocks.config.yaml` |
| Too many files / bloat | Sizing law in verify; `blocks graph merge` post-v1 |
| Adoption without Cursor | CLI + Action still valuable standalone |

---

## Definition of done — OSS v1.0

1. npm install → init → new block → verify → test works on clean machine
2. `blocks inspect` gives laity-readable block status in Simple Browser
3. Cursor install → skills → complete signup example
4. GitHub Action blocks PR that violates creed
5. Docs quickstart completable in 15 minutes
6. Spec frozen at v0.1 with RFC path for v0.2

---

## Readiness checklist (pre-build gate)

| Gate | Status |
|------|--------|
| Creed + ontology drafted | ✓ |
| InspectReport shape defined | ✓ |
| Phase 3.5 scoped (inspector, not graph editor) | ✓ |
| Repo structure decided | ✓ |
| Tech stack locked (pnpm, TS, AJV, vitest) | ✓ |
| Reference example chosen (signup) | ✓ |
| Paid scope explicitly deferred | ✓ |
| Second example deferred (not blocking) | ✓ |

**Verdict: ready to build.**

---

## Build status

| Phase | Status |
|-------|--------|
| 0 — Spec + schemas + signup | ✓ Done |
| 1 — Verify engine (P0/P1) | ✓ Done |
| 2 — CLI init/new/test/doctor | ✓ Done |
| 3 — Cursor integration | ✓ Done (rules, 6 skills, MCP, install) |
| 3.5 — Block Inspector | ✓ Done |
| 4 — GitHub Action | ✓ Done |
| 5 — Docs + polish | ✓ Done |
| 6 — Launch | ✓ Done (v0.1.0 — npm publish optional) |

See [paid-followup.md](./paid-followup.md) when ready to layer monetization on top.

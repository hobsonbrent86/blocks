# Block Vibe Coding — Creed v0.1

The executable religion. Tooling enforces these; humans interpret edge cases.

## Problem

Vibe coding fails when context is unbounded. One prompt becomes a feature, a feature becomes a monolith, and reuse, testing, and review collapse.

## Thesis

**Blocks are context boundaries.** Each AI session edits one block. Blocks compose into graphs. Contracts — not files — are the unit of review.

## Commandments

1. **One vibe, one block** — Never implement more than one block Core in a single session.
2. **Contract before Core** — Inputs, outputs, failure modes, and effects exist before implementation.
3. **Layers are honest** — Required layers must be implemented or explicitly marked `N/A` with rationale. Empty stubs fail verification.
4. **No neighbor knowledge** — A block never imports another block's implementation. Only the graph orchestrator wires edges.
5. **Graph in human words, blocks in machine words** — Humans maintain topology; agents fill nodes.
6. **Replaceability** — Any block must be swappable given its contract without editing neighbors.
7. **Effects are declared** — Read, write, external call, and human gate effects are explicit in the contract.

## Anti-patterns

| Anti-pattern | Description |
|--------------|-------------|
| **Block cosplay** | Normal functions renamed "blocks" with no contract or graph |
| **Layer theater** | Validation/security layers that always pass |
| **Mega-block** | Multiple verbs in one Core without a graph split |
| **Clone block** | Copy-paste block for a variant that should be parameterized |
| **Graph spaghetti** | Edges that bypass contracts or encode business logic |
| **Inline neighbor** | Block A imports Block B's code directly |
| **Happy-path only** | No declared failure modes or idempotency class |

## Permitted heresies

Document in contract or graph with `heresy:` field:

- **Mega-block** — Prototype only; must have `explode_by` date or ticket
- **Skip layer** — Layer marked `N/A` with one-line rationale
- **Inline edge** — Hot path optimization; contract must still be tested at boundary

## Maturity levels

| Level | Title | Capability |
|-------|-------|------------|
| 1 | Blocksmith | Writes valid, verified blocks |
| 2 | Blockwright | Composes and reviews graphs |
| 3 | Block architect | Designs reusable contracts others adopt |

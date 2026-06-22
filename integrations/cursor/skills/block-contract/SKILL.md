---
name: block-contract
description: Define or update a block contract before writing core code. Use when defining ports, failure modes, effects, or idempotency.
---

# Define block contract

1. Open or create `blocks/<species>/<name>/contract.yaml`.
2. Fill required fields: id, species, version, core verb + one-sentence description.
3. Declare **inputs** and **outputs** with typed ports.
4. Declare **failure_modes** (each with retry class).
5. Declare **effects** and **idempotency**.
6. Declare **layers** (implemented, inherited, or na with rationale).
7. Run `blocks verify --block <id>` — fix schema errors before implementing core.
8. Add `fixtures/test.yaml` with expected inputs/outputs matching ports.

Do not write `core.ts` until contract validates.

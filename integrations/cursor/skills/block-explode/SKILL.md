---
name: block-explode
description: Decompose a feature into a block graph without implementing code. Use when breaking a mega-feature into blocks.
---

# Explode feature into graph

1. **Do not implement code** in this session — topology only.
2. Name the feature graph: `feature.<name>`.
3. Propose blocks as one verb each (species + name).
4. List edges with port names and types (contracts can be stubs).
5. Identify entry (ingress/query) and exit blocks.
6. **Write the approved graph to disk** before ending the session:
   - `.blocks/graphs/<id>.yaml` — all planned block ids and edges (unbuilt blocks stay in the list)
   - `.blocks/PLAN.md` — human build order and phase notes (optional but recommended)
7. **Chat is not the plan.** If it is not in the graph YAML, it does not exist.
8. After the graph is saved, build one block at a time with `block-next` → `block-new`.

Sizing test: each block Core is one sentence, one primary verb.

Anti-pattern: mega-block with multiple verbs — split it.

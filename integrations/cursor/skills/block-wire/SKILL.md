---
name: block-wire
description: Wire blocks together in the graph. Use when connecting block ports or adding edges.
---

# Wire blocks in graph

1. Read `.blocks/graph.yaml` (or `.blocks/graphs/<id>.yaml`).
2. Add block id to `blocks:` if not present.
3. Add edge with full port refs:
   ```yaml
   - from: validate.signup_payload.outputs.validated
     to: persist.create_user.inputs.user
   ```
4. Port **types must match exactly** on edges.
5. Mark **entries** (ingress/query) and **exits** on the graph.
6. Run `blocks verify --graph <graph-id>`.
7. Never import neighbor blocks in code — edges only.

If types differ, add a transform block adapter instead of forcing an edge.

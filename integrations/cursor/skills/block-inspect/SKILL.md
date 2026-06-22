---
name: block-inspect
description: Launch Block Inspector or Block Studio traffic-light UI. Use when the user wants to see block or graph status visually.
---

# Block Inspector & Studio

**Single block:** `blocks inspect --path . --block <block-id>` → open URL in **Cursor Simple Browser**.

**Whole graph:** `blocks studio --path . --graph <graph-id>` → graph canvas + click block for detail panel.

1. Tell the user to open the printed URL in **Cursor Simple Browser** (dock beside editor).
2. Green = working, yellow = structure OK, red = broken, dashed = not built yet.
3. In Studio, click a block to run tests on that block; graph refresh is verify-only (fast).
4. Scope the session to fixing the first red row only.
